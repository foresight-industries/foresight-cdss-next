import * as cdk from 'aws-cdk-lib';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface BatchStackProps extends cdk.StackProps {
  stageName: string;
  vpc: ec2.IVpc;
  databaseCluster: rds.DatabaseCluster;
  databaseSecret: secretsmanager.ISecret;
}

export class BatchStack extends cdk.Stack {
  public readonly batchComputeEnvironment: batch.CfnComputeEnvironment;
  public readonly claimProcessingQueue: batch.CfnJobQueue;
  public readonly ediProcessingQueue: batch.CfnJobQueue;
  public readonly reportingQueue: batch.CfnJobQueue;
  public readonly processingBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BatchStackProps) {
    super(scope, id, props);

    // Create S3 bucket for batch job inputs/outputs
    this.processingBucket = new s3.Bucket(this, 'BatchProcessingBucket', {
      bucketName: `foresight-batch-processing-${props.stageName}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'BatchJobDataLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
    });

    // Create CloudWatch Log Group for batch jobs
    const batchLogGroup = new logs.LogGroup(this, 'BatchLogGroup', {
      logGroupName: `/aws/batch/foresight-${props.stageName}`,
      retention: logs.RetentionDays.THREE_MONTHS,
    });

    // Create security group for batch compute environment
    const batchSecurityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Foresight Batch compute environment',
      allowAllOutbound: true,
    });

    // Allow access to RDS from batch jobs
    batchSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access for batch jobs'
    );

    // Create IAM role for batch instances
    const batchInstanceRole = new iam.Role(this, 'BatchInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
      ],
      inlinePolicies: {
        BatchInstancePolicy: new iam.PolicyDocument({
          statements: [
            // S3 access for processing files
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.processingBucket.bucketArn,
                `${this.processingBucket.bucketArn}/*`,
              ],
            }),
            // CloudWatch Logs
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [batchLogGroup.logGroupArn],
            }),
            // RDS Data API access
            new iam.PolicyStatement({
              actions: [
                'rds-data:BatchExecuteStatement',
                'rds-data:BeginTransaction',
                'rds-data:CommitTransaction',
                'rds-data:ExecuteStatement',
                'rds-data:RollbackTransaction',
              ],
              resources: [props.databaseCluster.clusterArn],
            }),
            // Secrets Manager access for database credentials
            new iam.PolicyStatement({
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [props.databaseSecret.secretArn],
            }),
          ],
        }),
      },
    });

    // Create instance profile
    const batchInstanceProfile = new iam.CfnInstanceProfile(this, 'BatchInstanceProfile', {
      roles: [batchInstanceRole.roleName],
    });

    // Create IAM role for batch service
    const batchServiceRole = new iam.Role(this, 'BatchServiceRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
      ],
    });

    // Create launch template for batch instances
    const batchLaunchTemplate = new ec2.CfnLaunchTemplate(this, 'BatchLaunchTemplate', {
      launchTemplateName: `foresight-batch-template-${props.stageName}`,
      launchTemplateData: {
        imageId: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }).getImage(this).imageId,
        instanceType: 'm5.large',
        iamInstanceProfile: {
          name: batchInstanceProfile.ref,
        },
        securityGroupIds: [batchSecurityGroup.securityGroupId],
        userData: cdk.Fn.base64(
          [
            '#!/bin/bash',
            'yum update -y',
            'yum install -y aws-cli',
            'echo ECS_CLUSTER=foresight-batch-cluster-' + props.stageName + ' >> /etc/ecs/ecs.config',
          ].join('\n')
        ),
      },
    });

    // Create compute environment
    this.batchComputeEnvironment = new batch.CfnComputeEnvironment(this, 'BatchComputeEnvironment', {
      type: 'MANAGED',
      state: 'ENABLED',
      computeEnvironmentName: `foresight-compute-env-${props.stageName}`,
      serviceRole: batchServiceRole.roleArn,
      computeResources: {
        type: 'EC2',
        minvCpus: 0,
        maxvCpus: 100,
        desiredvCpus: 0,
        allocationStrategy: 'SPOT_CAPACITY_OPTIMIZED', // Use Spot instances for 70% savings
        bidPercentage: 80, // Bid up to 80% of On-Demand price
        instanceTypes: ['m5.large', 'm5.xlarge', 'c5.large', 'c5.xlarge', 'm5a.large', 'c5a.large'], // Add more instance types
        subnets: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [batchSecurityGroup.securityGroupId],
        instanceRole: batchInstanceProfile.attrArn,
        launchTemplate: {
          launchTemplateId: batchLaunchTemplate.ref,
          version: '$Latest',
        },
        tags: {
          Name: `foresight-batch-instance-${props.stageName}`,
          Environment: props.stageName,
          Project: 'ForesightRCM',
        },
      },
    });

    // Create job queues for different types of processing
    this.claimProcessingQueue = new batch.CfnJobQueue(this, 'ClaimProcessingQueue', {
      jobQueueName: `foresight-claim-processing-${props.stageName}`,
      state: 'ENABLED',
      priority: 100,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: this.batchComputeEnvironment.ref,
        },
      ],
    });

    this.ediProcessingQueue = new batch.CfnJobQueue(this, 'EdiProcessingQueue', {
      jobQueueName: `foresight-edi-processing-${props.stageName}`,
      state: 'ENABLED',
      priority: 80,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: this.batchComputeEnvironment.ref,
        },
      ],
    });

    this.reportingQueue = new batch.CfnJobQueue(this, 'ReportingQueue', {
      jobQueueName: `foresight-reporting-${props.stageName}`,
      state: 'ENABLED',
      priority: 60,
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: this.batchComputeEnvironment.ref,
        },
      ],
    });

    // Create IAM role for batch job execution
    const batchJobExecutionRole = new iam.Role(this, 'BatchJobExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
      inlinePolicies: {
        BatchJobExecutionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [batchLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Create sample job definitions for common RCM tasks
    new batch.CfnJobDefinition(this, 'ClaimProcessingJobDefinition', {
      jobDefinitionName: `foresight-claim-processing-${props.stageName}`,
      type: 'container',
      platformCapabilities: ['EC2'],
      containerProperties: {
        image: 'public.ecr.aws/amazonlinux/amazonlinux:latest',
        vcpus: 2,
        memory: 4096,
        jobRoleArn: batchInstanceRole.roleArn,
        executionRoleArn: batchJobExecutionRole.roleArn,
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': batchLogGroup.logGroupName,
            'awslogs-region': cdk.Aws.REGION,
            'awslogs-stream-prefix': 'claim-processing',
          },
        },
        environment: [
          {
            name: 'STAGE_NAME',
            value: props.stageName,
          },
          {
            name: 'DB_CLUSTER_ARN',
            value: props.databaseCluster.clusterArn,
          },
          {
            name: 'DB_SECRET_ARN',
            value: props.databaseSecret.secretArn,
          },
          {
            name: 'PROCESSING_BUCKET',
            value: this.processingBucket.bucketName,
          },
        ],
      },
      retryStrategy: {
        attempts: 3,
      },
      timeout: {
        attemptDurationSeconds: 3600, // 1 hour timeout
      },
    });

    new batch.CfnJobDefinition(this, 'EdiProcessingJobDefinition', {
      jobDefinitionName: `foresight-edi-processing-${props.stageName}`,
      type: 'container',
      platformCapabilities: ['EC2'],
      containerProperties: {
        image: 'public.ecr.aws/amazonlinux/amazonlinux:latest',
        vcpus: 1,
        memory: 2048,
        jobRoleArn: batchInstanceRole.roleArn,
        executionRoleArn: batchJobExecutionRole.roleArn,
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': batchLogGroup.logGroupName,
            'awslogs-region': cdk.Aws.REGION,
            'awslogs-stream-prefix': 'edi-processing',
          },
        },
        environment: [
          {
            name: 'STAGE_NAME',
            value: props.stageName,
          },
          {
            name: 'DB_CLUSTER_ARN',
            value: props.databaseCluster.clusterArn,
          },
          {
            name: 'DB_SECRET_ARN',
            value: props.databaseSecret.secretArn,
          },
          {
            name: 'PROCESSING_BUCKET',
            value: this.processingBucket.bucketName,
          },
        ],
      },
      retryStrategy: {
        attempts: 2,
      },
      timeout: {
        attemptDurationSeconds: 1800, // 30 minutes timeout
      },
    });

    new batch.CfnJobDefinition(this, 'ReportingJobDefinition', {
      jobDefinitionName: `foresight-reporting-${props.stageName}`,
      type: 'container',
      platformCapabilities: ['EC2'],
      containerProperties: {
        image: 'public.ecr.aws/amazonlinux/amazonlinux:latest',
        vcpus: 4,
        memory: 8192,
        jobRoleArn: batchInstanceRole.roleArn,
        executionRoleArn: batchJobExecutionRole.roleArn,
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': batchLogGroup.logGroupName,
            'awslogs-region': cdk.Aws.REGION,
            'awslogs-stream-prefix': 'reporting',
          },
        },
        environment: [
          {
            name: 'STAGE_NAME',
            value: props.stageName,
          },
          {
            name: 'DB_CLUSTER_ARN',
            value: props.databaseCluster.clusterArn,
          },
          {
            name: 'DB_SECRET_ARN',
            value: props.databaseSecret.secretArn,
          },
          {
            name: 'PROCESSING_BUCKET',
            value: this.processingBucket.bucketName,
          },
        ],
      },
      retryStrategy: {
        attempts: 1,
      },
      timeout: {
        attemptDurationSeconds: 7200, // 2 hours timeout
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'BatchComputeEnvironmentArn', {
      value: this.batchComputeEnvironment.ref,
      description: 'Batch Compute Environment ARN',
      exportName: `Foresight-Batch-ComputeEnv-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'ClaimProcessingQueueArn', {
      value: this.claimProcessingQueue.ref,
      description: 'Claim Processing Job Queue ARN',
      exportName: `Foresight-Batch-ClaimQueue-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'EdiProcessingQueueArn', {
      value: this.ediProcessingQueue.ref,
      description: 'EDI Processing Job Queue ARN',
      exportName: `Foresight-Batch-EdiQueue-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'ReportingQueueArn', {
      value: this.reportingQueue.ref,
      description: 'Reporting Job Queue ARN',
      exportName: `Foresight-Batch-ReportingQueue-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'ProcessingBucketName', {
      value: this.processingBucket.bucketName,
      description: 'S3 bucket for batch processing inputs/outputs',
      exportName: `Foresight-Batch-ProcessingBucket-${props.stageName}`,
    });
  }
}