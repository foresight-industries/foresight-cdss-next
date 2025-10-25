import * as cdk from 'aws-cdk-lib';
import * as grafana from 'aws-cdk-lib/aws-grafana';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

interface GrafanaStackProps extends cdk.StackProps {
  stageName: string;
  vpc?: ec2.IVpc;
}

export class GrafanaStack extends cdk.Stack {
  public readonly workspace: grafana.CfnWorkspace;
  public readonly serviceRole: iam.Role;
  public readonly grafanaSecurityGroup?: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: GrafanaStackProps) {
    super(scope, id, props);

    // IAM role for Grafana to access AWS services
    this.serviceRole = new iam.Role(this, 'GrafanaServiceRole', {
      assumedBy: new iam.ServicePrincipal('grafana.amazonaws.com'),
      description: 'Service role for AWS Managed Grafana workspace',
      managedPolicies: [
        // CloudWatch data source permissions
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess'),
        // X-Ray for distributed tracing
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayReadOnlyAccess'),
      ],
      inlinePolicies: {
        GrafanaCustomPolicy: new iam.PolicyDocument({
          statements: [
            // Enhanced CloudWatch permissions for custom metrics
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:DescribeAlarmsForMetric',
                'cloudwatch:ListMetrics',
                'cloudwatch:GetMetricData',
                'cloudwatch:GetMetricStatistics',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                'logs:GetLogEvents',
                'logs:StartQuery',
                'logs:StopQuery',
                'logs:GetQueryResults',
              ],
              resources: ['*'],
            }),
            // RDS Enhanced Monitoring access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds:DescribeDBInstances',
                'rds:DescribeDBClusters',
                'rds:DescribeDBClusterSnapshots',
                'rds:DescribeDBSnapshots',
                'rds:DescribeEvents',
                'rds:ListTagsForResource',
              ],
              resources: ['*'],
            }),
            // ElastiCache monitoring
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'elasticache:DescribeCacheClusters',
                'elasticache:DescribeReplicationGroups',
                'elasticache:DescribeCacheSubnetGroups',
                'elasticache:ListTagsForResource',
              ],
              resources: ['*'],
            }),
            // Lambda insights
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:ListFunctions',
                'lambda:GetFunction',
                'lambda:ListTags',
              ],
              resources: ['*'],
            }),
            // S3 metrics
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ListAllMyBuckets',
                's3:GetBucketLocation',
                's3:GetBucketTagging',
              ],
              resources: ['*'],
            }),
            // Batch job monitoring
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'batch:DescribeJobQueues',
                'batch:DescribeJobs',
                'batch:DescribeComputeEnvironments',
                'batch:ListJobs',
              ],
              resources: ['*'],
            }),
            // AppSync monitoring
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'appsync:ListGraphqlApis',
                'appsync:GetGraphqlApi',
                'appsync:ListDataSources',
                'appsync:ListResolvers',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Configure VPC networking if VPC is provided (recommended for HIPAA compliance)
    let vpcConfiguration: any = undefined;

    if (props.vpc) {
      // Create security group for Grafana workspace
      this.grafanaSecurityGroup = new ec2.SecurityGroup(this, 'GrafanaSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for AWS Managed Grafana workspace - HIPAA compliant',
        allowAllOutbound: false, // Explicit outbound rules for compliance
      });

      // Allow HTTPS outbound for AWS API calls and Grafana operations
      this.grafanaSecurityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'HTTPS outbound for AWS APIs and external data sources'
      );

      // Allow HTTP outbound for non-sensitive operations (if needed)
      this.grafanaSecurityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'HTTP outbound for non-sensitive operations'
      );

      // Allow DNS resolution
      this.grafanaSecurityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.udp(53),
        'DNS resolution'
      );

      this.grafanaSecurityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(53),
        'DNS over TCP'
      );

      // Allow NTP for time synchronization (important for compliance)
      this.grafanaSecurityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.udp(123),
        'NTP for time synchronization'
      );

      // Create VPC endpoints for enhanced security (avoid internet routing)
      this.createVpcEndpoints(props.vpc);

      // Use private subnets for Grafana deployment
      const privateSubnets = props.vpc.privateSubnets.slice(0, 2); // Use first 2 AZs for redundancy

      vpcConfiguration = {
        securityGroupIds: [this.grafanaSecurityGroup.securityGroupId],
        subnetIds: privateSubnets.map(subnet => subnet.subnetId),
      };

      // Store VPC configuration in Parameter Store for reference
      new ssm.StringParameter(this, 'GrafanaVpcConfig', {
        parameterName: `/foresight/grafana/${props.stageName}/vpc-config`,
        stringValue: JSON.stringify({
          vpcId: props.vpc.vpcId,
          securityGroupId: this.grafanaSecurityGroup.securityGroupId,
          subnetIds: privateSubnets.map(subnet => subnet.subnetId),
        }),
        description: 'Grafana VPC configuration for HIPAA compliance',
      });
    }

    // Create AWS Managed Grafana workspace
    this.workspace = new grafana.CfnWorkspace(this, 'ForesightRCMGrafanaWorkspace', {
      name: `foresight-rcm-grafana-${props.stageName}`,
      description: `Foresight RCM monitoring and observability workspace for ${props.stageName}`,

      // Account access type - use current account access
      accountAccessType: 'CURRENT_ACCOUNT',

      // Authentication providers - simplified approach
      authenticationProviders: ['AWS_SSO'],

      pluginAdminEnabled: true,

      // Permission type - use SERVICE_MANAGED for simpler setup
      permissionType: 'SERVICE_MANAGED',

      // Workspace role ARN - required for CURRENT_ACCOUNT access type
      roleArn: this.serviceRole.roleArn,

      // Data sources to enable
      dataSources: [
        'CLOUDWATCH',
        'XRAY',
      ],

      // Notification destinations (optional)
      notificationDestinations: [
        'SNS', // For alerting via SNS
      ],

      // Network access configuration for VPC (configured for HIPAA compliance)
      vpcConfiguration,

      // Grafana version
      grafanaVersion: '10.4', // Latest supported version

      // Stack set name for multi-account (if needed)
      stackSetName: props.stageName === 'prod' ? `foresight-grafana-stackset-${props.stageName}` : undefined,
    });

    // Store workspace URL in Parameter Store for easy access
    new ssm.StringParameter(this, 'GrafanaWorkspaceUrl', {
      parameterName: `/foresight/grafana/${props.stageName}/workspace-url`,
      stringValue: `https://${this.workspace.attrEndpoint}`,
      description: 'Foresight RCM Grafana workspace URL',
    });

    // Store workspace ID for programmatic access
    new ssm.StringParameter(this, 'GrafanaWorkspaceId', {
      parameterName: `/foresight/grafana/${props.stageName}/workspace-id`,
      stringValue: this.workspace.attrId,
      description: 'Foresight RCM Grafana workspace ID',
    });

    // Outputs
    new cdk.CfnOutput(this, 'GrafanaWorkspaceIdOutput', {
      value: this.workspace.attrId,
      description: 'Grafana Workspace ID',
      exportName: `Foresight-Grafana-WorkspaceId-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'GrafanaWorkspaceUrlOutput', {
      value: `https://${this.workspace.attrEndpoint}`,
      description: 'Grafana Workspace URL',
      exportName: `Foresight-Grafana-Url-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'GrafanaServiceRoleArn', {
      value: this.serviceRole.roleArn,
      description: 'Grafana Service Role ARN',
      exportName: `Foresight-Grafana-ServiceRole-${props.stageName}`,
    });

    // Output security group if VPC is configured
    if (this.grafanaSecurityGroup) {
      new cdk.CfnOutput(this, 'GrafanaSecurityGroupId', {
        value: this.grafanaSecurityGroup.securityGroupId,
        description: 'Grafana Security Group ID',
        exportName: `Foresight-Grafana-SecurityGroup-${props.stageName}`,
      });
    }

    // Add tags for cost tracking and compliance
    cdk.Tags.of(this).add('Project', 'ForesightRCM');
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Component', 'monitoring');
    cdk.Tags.of(this).add('Service', 'grafana');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }

  /**
   * Get pre-configured dashboard templates for healthcare RCM
   */
  public static getHealthcareRCMDashboards() {
    return {
      // Database performance dashboard
      database: {
        name: 'RCM Database Performance',
        description: 'Aurora PostgreSQL cluster metrics for claim processing',
        panels: [
          'Aurora CPU Utilization',
          'Database Connections',
          'Query Performance',
          'Storage Usage',
          'Read/Write IOPS',
          'Replication Lag',
        ],
      },

      // Application performance dashboard
      application: {
        name: 'RCM Application Performance',
        description: 'End-to-end application metrics',
        panels: [
          'API Response Times',
          'Lambda Duration & Errors',
          'AppSync Request Volume',
          'Cache Hit Rates',
          'Error Rates by Service',
          'User Session Metrics',
        ],
      },

      // Batch processing dashboard
      batch: {
        name: 'RCM Batch Processing',
        description: 'Claim processing and EDI batch job monitoring',
        panels: [
          'Job Queue Depths',
          'Job Success/Failure Rates',
          'Processing Time Distributions',
          'Resource Utilization',
          'Cost per Job',
          'SLA Compliance',
        ],
      },

      // Business metrics dashboard
      business: {
        name: 'RCM Business Metrics',
        description: 'Healthcare business KPIs and operational metrics',
        panels: [
          'Claims Processed per Hour',
          'Prior Auth Approval Rates',
          'Revenue Cycle Time',
          'Denial Rates by Payer',
          'Patient Portal Usage',
          'Compliance Audit Metrics',
        ],
      },

      // Security and compliance dashboard
      security: {
        name: 'RCM Security & Compliance',
        description: 'HIPAA compliance and security monitoring',
        panels: [
          'Failed Login Attempts',
          'Data Access Patterns',
          'Encryption Status',
          'Audit Log Volume',
          'Suspicious Activity Alerts',
          'Backup Success Rates',
        ],
      },
    };
  }

  /**
   * Create VPC endpoints for enhanced security and reduced internet traffic
   */
  private createVpcEndpoints(vpc: ec2.IVpc): { [key: string]: ec2.InterfaceVpcEndpoint } {
    const endpoints: { [key: string]: ec2.InterfaceVpcEndpoint } = {};

    // CloudWatch Logs endpoint for log ingestion
    endpoints.cloudWatchLogs = vpc.addInterfaceEndpoint('GrafanaCloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // CloudWatch endpoint for metrics
    endpoints.cloudWatch = vpc.addInterfaceEndpoint('GrafanaCloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // X-Ray endpoint for distributed tracing
    endpoints.xray = vpc.addInterfaceEndpoint('GrafanaXRayEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.XRAY,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // SNS endpoint for alerting
    endpoints.sns = vpc.addInterfaceEndpoint('GrafanaSNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // STS endpoint for AWS authentication
    endpoints.sts = vpc.addInterfaceEndpoint('GrafanaSTSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.STS,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // EC2 endpoint for instance metadata
    endpoints.ec2 = vpc.addInterfaceEndpoint('GrafanaEC2Endpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    // SSM endpoint for parameter store access
    endpoints.ssm = vpc.addInterfaceEndpoint('GrafanaSSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: this.grafanaSecurityGroup ? [this.grafanaSecurityGroup] : undefined,
    });

    return endpoints;
  }
}
