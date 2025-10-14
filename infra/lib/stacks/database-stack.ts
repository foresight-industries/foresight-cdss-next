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
      natGateways: props.stageName === 'prod' ? 2 : 1,
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

    // Security group for database
    this.clusterSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RCM Aurora cluster',
      allowAllOutbound: false,
    });

    // Database credentials
    const credentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `rcm-db-credentials-${props.stageName}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'rcmadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Aurora Serverless v2 cluster
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_4,
      }),
      credentials: rds.Credentials.fromSecret(credentials),
      clusterIdentifier: `rcm-cluster-${props.stageName}`,
      defaultDatabaseName: 'rcm',
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
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      cloudwatchLogsExports: ['postgresql'],
      parameters: {
        // Enable comprehensive query logging (Aurora Serverless v2 compatible)
        'log_statement': 'all',
        'log_duration': '1',
        'log_min_duration_statement': '1000', // Log queries slower than 1 second
        'log_connections': '1',
        'log_disconnections': '1',
        'log_lock_waits': '1',
        'log_min_error_statement': 'error',
        'log_min_messages': 'warning',
        'shared_preload_libraries': 'pg_stat_statements',
        'pg_stat_statements.track': 'all',
        'pg_stat_statements.track_utility': '1',
        'pg_stat_statements.save': '1',
      },
    });

    // Allow Lambda functions to connect
    this.clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow VPC internal traffic'
    );

    // Database Log Processor Lambda
    const dbLogProcessor = new lambdaNodejs.NodejsFunction(this, 'DbLogProcessor', {
      entry: './lib/functions/db-log-processor.ts',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-cloudwatch'],
      },
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

    // Outputs for other stacks and .env files
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      exportName: `RCM-ClusterArn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.cluster.secret?.secretArn || '',
      exportName: `RCM-SecretArn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: 'rcm',
      exportName: `RCM-DatabaseName-${props.stageName}`,
    });
  }
}
