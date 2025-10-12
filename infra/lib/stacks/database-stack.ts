import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
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
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
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
    });

    // Allow Lambda functions to connect
    this.clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow VPC internal traffic'
    );

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
