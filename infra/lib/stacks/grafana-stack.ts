import * as cdk from 'aws-cdk-lib';
import * as grafana from 'aws-cdk-lib/aws-grafana';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface GrafanaStackProps extends cdk.StackProps {
  stageName: string;
}

export class GrafanaStack extends cdk.Stack {
  public readonly workspace: grafana.CfnWorkspace;
  public readonly serviceRole: iam.Role;

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

    // Create AWS Managed Grafana workspace
    this.workspace = new grafana.CfnWorkspace(this, 'ForesightRCMGrafanaWorkspace', {
      name: `foresight-rcm-grafana-${props.stageName}`,
      description: `Foresight RCM monitoring and observability workspace for ${props.stageName}`,

      // Account access type - use AWS SSO if available, otherwise IAM
      accountAccessType: 'CURRENT_ACCOUNT',

      // Authentication providers - use SAML for standard AWS account access
      authenticationProviders: ['SAML'],

      pluginAdminEnabled: true,

      // Permission type - use CUSTOMER_MANAGED for more control
      permissionType: 'CUSTOMER_MANAGED',
      roleArn: this.serviceRole.roleArn,

      // Data sources to enable
      dataSources: [
        'CLOUDWATCH',
        'XRAY',
        'AMAZON_OPENSEARCH_SERVICE', // If you add OpenSearch later
      ],

      // Notification destinations (optional)
      notificationDestinations: [
        'SNS', // For alerting via SNS
      ],

      // Network access configuration for VPC (optional but recommended for HIPAA)
      // vpcConfiguration: undefined, // Can be configured later with specific security groups and subnets

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
}
