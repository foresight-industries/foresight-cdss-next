import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  stageName: string;
  config: {
    dbMinCapacity: number;
    dbMaxCapacity: number;
    logRetention: number;
    enableDeletionProtection: boolean;
  };
  codeSigningConfigArn?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly vpc: ec2.Vpc;
  public readonly clusterSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1, // 1 NAT Gateway
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoints for AWS services (avoid NAT costs)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // Note: The actual VPC peering connection is created manually in Redis.io console
    // This creates the route table entries for the Redis VPC CIDR
    const redisCidr = '172.31.0.0/24'; // Redis.io VPC CIDR

    // VPC Peering for Redis.io (production only)
    if (props.stageName === 'prod') {
      // Add routes to private subnets for Redis traffic
      // Note: You'll need to update the route table ID after VPC peering is established
      const privateSubnets = this.vpc.privateSubnets;
      privateSubnets.forEach((subnet, index) => {
        // Placeholder for VPC peering route - will be updated manually
        // or through separate script after peering connection is created
        new cdk.CfnOutput(this, `PrivateSubnetRouteTable${index}`, {
          value: subnet.routeTable.routeTableId,
          description: `Private subnet ${index} route table ID for Redis VPC peering setup`,
          exportName: `RCM-PrivateRouteTable${index}-${props.stageName}`,
        });
      });

      // Output VPC information needed for Redis.io VPC peering setup
      new cdk.CfnOutput(this, 'VpcInfo', {
        value: JSON.stringify({
          vpcId: this.vpc.vpcId,
          cidr: this.vpc.vpcCidrBlock,
          region: this.region,
          accountId: this.account,
        }),
        description: 'VPC information for Redis.io peering configuration',
        exportName: `RCM-VpcInfo-${props.stageName}`,
      });
    }

    // Security group for database
    this.clusterSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RCM Aurora cluster',
      allowAllOutbound: false,
    });

    // Import existing database credentials to avoid secret recreation
    const credentials = secretsmanager.Secret.fromSecretNameV2(
      this,
      'DBCredentials',
      `rcm-db-rds-credential-${props.stageName}`
    );

    // PostgreSQL 17.5 parameter group optimized for medical code queries
    const parameterGroup = new rds.ParameterGroup(this, 'ClusterParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_5,
      }),
      parameters: {
        // Performance and monitoring settings for medical code workloads
        'shared_preload_libraries': 'pg_stat_statements',
        'pg_stat_statements.max': '10000', // Higher limit for medical code queries
        'pg_stat_statements.track': 'all',
        'pg_stat_statements.track_utility': '1',
        'pg_stat_statements.save': '1',
        'track_io_timing': 'on', // Essential for I/O performance monitoring

        // Query logging for medical code compliance and debugging
        'log_statement': 'all',
        'log_duration': '1',
        'log_min_duration_statement': '1000', // Log queries slower than 1 second
        'log_connections': '1',
        'log_disconnections': '1',
        'log_lock_waits': '1',
        'log_min_error_statement': 'error',
        'log_min_messages': 'warning',

        // Medical code query optimization (Aurora Serverless v2 compatible)
        'random_page_cost': '1.1' // Optimized for SSD storage
      },
    });

    // Aurora Serverless v2 cluster with comprehensive deletion protection
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_5,
      }),
      credentials: rds.Credentials.fromSecret(credentials),
      clusterIdentifier: `rcm-cluster-${props.stageName}`,
      defaultDatabaseName: 'rcm',
      parameterGroup,
      serverlessV2MinCapacity: props.config.dbMinCapacity,
      serverlessV2MaxCapacity: props.config.dbMaxCapacity,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: props.stageName === 'prod' ? [
        rds.ClusterInstance.serverlessV2('reader1', { scaleWithWriter: true })
      ] : [],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.clusterSecurityGroup],
      enableDataApi: true, // Critical for Lambda/Vercel access!
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(props.stageName === 'prod' ? 30 : 7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: props.config.enableDeletionProtection,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect cluster from stack deletion
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      cloudwatchLogsExports: ['postgresql'],
    });

    // Additional deletion protection measures
    if (props.config.enableDeletionProtection) {
      // Add protection tags for visibility and compliance
      cdk.Tags.of(this.cluster).add('DeletionProtection', 'Enabled');
      cdk.Tags.of(this.cluster).add('Environment', props.stageName);
      cdk.Tags.of(this.cluster).add('Critical', 'true');
      cdk.Tags.of(this.cluster).add('BackupRequired', 'true');

      // Apply stack termination protection
      cdk.Tags.of(this).add('TerminationProtection', 'Required');
    }

    // Ensure parameter group is also protected
    parameterGroup.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // Allow Lambda functions to connect
    this.clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow VPC internal traffic'
    );

    // Security group for Redis.io VPC peering (production only)
    if (props.stageName === 'prod') {
      const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
        vpc: this.vpc,
        description: 'Security group for Redis.io VPC peering',
        allowAllOutbound: true,
      });

      // Allow outbound Redis traffic to Redis.io VPC
      redisSecurityGroup.addEgressRule(
        ec2.Peer.ipv4(redisCidr),
        ec2.Port.tcp(6379),
        'Allow Redis traffic to Redis.io VPC'
      );

      // Allow HTTPS traffic for Redis.io management
      redisSecurityGroup.addEgressRule(
        ec2.Peer.ipv4(redisCidr),
        ec2.Port.tcp(443),
        'Allow HTTPS to Redis.io management'
      );

      // Output security group for Lambda functions
      new cdk.CfnOutput(this, 'RedisSecurityGroupId', {
        value: redisSecurityGroup.securityGroupId,
        description: 'Security group ID for Redis.io access',
        exportName: `RCM-RedisSecurityGroup-${props.stageName}`,
      });
    }

    // Import code signing configuration if provided
    const codeSigningConfig = props.codeSigningConfigArn
      ? lambda.CodeSigningConfig.fromCodeSigningConfigArn(
          this,
          'ImportedCodeSigningConfig',
          props.codeSigningConfigArn
        )
      : undefined;

    // Database Log Processor Lambda
    const dbLogProcessor = new lambdaNodejs.NodejsFunction(this, 'DbLogProcessor', {
      entry: './lib/functions/db-log-processor.ts',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-cloudwatch'],
      },
      codeSigningConfig,
    });

    // Grant CloudWatch permissions to the log processor
    dbLogProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
      })
    );

    // Create CloudWatch Log Group for database logs
    const dbLogGroup = new logs.LogGroup(this, 'DatabaseLogGroup', {
      logGroupName: `/aws/rds/cluster/${this.cluster.clusterIdentifier}/postgresql`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Subscribe the Lambda to the database log group
    new logs.SubscriptionFilter(this, 'DbLogSubscription', {
      logGroup: dbLogGroup,
      destination: new logsDestinations.LambdaDestination(dbLogProcessor),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Grant permission for CloudWatch Logs to invoke the Lambda
    dbLogProcessor.addPermission('CloudWatchLogsInvoke', {
      principal: new iam.ServicePrincipal('logs.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: dbLogGroup.logGroupArn,
    });

    // Add compliance tags to signed functions
    if (codeSigningConfig) {
      cdk.Tags.of(dbLogProcessor).add('CodeSigningEnabled', 'true');
      cdk.Tags.of(dbLogProcessor).add('ComplianceLevel', 'HIPAA-SOC2');
    }

    // Outputs for other stacks and .env files
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      exportName: `RCM-ClusterArn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.cluster.secret?.secretArn ?? '',
      exportName: `RCM-SecretArn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: 'rcm',
      exportName: `RCM-DatabaseName-${props.stageName}`,
    });
  }
}
