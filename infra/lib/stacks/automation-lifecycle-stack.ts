import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';

export interface AutomationLifecycleStackProps extends cdk.StackProps {
  bucketName: string;
  environment: 'staging' | 'production';
}

export class AutomationLifecycleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AutomationLifecycleStackProps) {
    super(scope, id, props);

    // Helper method to map CDK storage classes to AWS API format
    const mapStorageClass = (storageClass: s3.StorageClass): string => {
      switch (storageClass) {
        case s3.StorageClass.INFREQUENT_ACCESS:
          return 'STANDARD_IA';
        case s3.StorageClass.GLACIER:
          return 'GLACIER';
        case s3.StorageClass.DEEP_ARCHIVE:
          return 'DEEP_ARCHIVE';
        case s3.StorageClass.GLACIER_INSTANT_RETRIEVAL:
          return 'GLACIER_IR';
        default:
          return 'STANDARD';
      }
    };

    // Define lifecycle configuration for automation assets
    const lifecycleRules: s3.LifecycleRule[] = [
      {
        id: 'AutomationScreenshotsLifecycle',
        enabled: true,
        prefix: 'automation/screenshots/',

        // Cost optimization through storage class transitions
        transitions: [
          {
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(30), // Move to IA after 30 days ($0.0125/GB)
          },
          {
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: cdk.Duration.days(90), // Move to Glacier after 90 days ($0.004/GB)
          },
          {
            storageClass: s3.StorageClass.DEEP_ARCHIVE,
            transitionAfter: cdk.Duration.days(365), // Deep archive after 1 year ($0.00099/GB)
          },
        ],

        // Automatic cleanup - must be greater than last transition (365 days)
        expiration: cdk.Duration.days(props.environment === 'production' ? 2555 : 730), // 7 years prod, 2 years staging
      },

      {
        id: 'AutomationLogsLifecycle',
        enabled: true,
        prefix: 'automation/logs/',

        transitions: [
          {
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(30),
          },
          {
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: cdk.Duration.days(180), // Logs transition slower
          },
        ],

        expiration: cdk.Duration.days(props.environment === 'production' ? 2555 : 365), // Must be greater than last transition (180 days)
      },

      {
        id: 'AutomationTempFilesLifecycle',
        enabled: true,
        prefix: 'automation/temp/',

        // Clean up temp files quickly
        expiration: cdk.Duration.days(7),
      },

      {
        id: 'IncompleteMultipartUploadsCleanup',
        enabled: true,
        prefix: 'automation/',

        // Clean up failed uploads
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      },
    ];

    // Create IAM role for the Custom Resource
    const customResourceRole = new iam.Role(this, 'AutomationLifecycleRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3BucketLifecyclePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketLifecycleConfiguration',
                's3:PutBucketLifecycleConfiguration',
                's3:DeleteBucketLifecycleConfiguration',
                's3:DeleteBucketLifecycle',
                's3:PutLifecycleConfiguration',
              ],
              resources: [`arn:aws:s3:::${props.bucketName}`],
            }),
          ],
        }),
      },
    });

    // Use Custom Resource to apply lifecycle rules to existing bucket
    const applyLifecycleRules = new cr.AwsCustomResource(this, 'ApplyAutomationLifecycleRules', {
      onCreate: {
        service: 'S3',
        action: 'putBucketLifecycleConfiguration',
        parameters: {
          Bucket: props.bucketName,
          LifecycleConfiguration: {
            Rules: lifecycleRules.map(rule => {
              const ruleConfig: any = {
                ID: rule.id,
                Status: rule.enabled ? 'Enabled' : 'Disabled',
              };

              // Handle filter - use proper AWS API format
              if (rule.prefix) {
                ruleConfig.Filter = { Prefix: rule.prefix };
              } else {
                ruleConfig.Filter = {}; // Empty filter for all objects
              }

              // Handle transitions
              if (rule.transitions && rule.transitions.length > 0) {
                const validTransitions = rule.transitions
                  .filter(t => t.transitionAfter && t.storageClass) // Ensure both fields exist
                  .map(t => ({
                    Days: t.transitionAfter!.toDays(),
                    StorageClass: mapStorageClass(t.storageClass),
                  }))
                  .filter(t => t.Days > 0); // Ensure positive days

                if (validTransitions.length > 0) {
                  ruleConfig.Transitions = validTransitions;
                }
              }

              // Handle expiration
              if (rule.expiration) {
                const expirationDays = rule.expiration.toDays();
                if (expirationDays > 0) {
                  ruleConfig.Expiration = { Days: expirationDays };
                }
              }

              // Handle incomplete multipart uploads
              if (rule.abortIncompleteMultipartUploadAfter) {
                const abortDays = rule.abortIncompleteMultipartUploadAfter.toDays();
                if (abortDays > 0) {
                  ruleConfig.AbortIncompleteMultipartUpload = {
                    DaysAfterInitiation: abortDays,
                  };
                }
              }

              return ruleConfig;
            }).filter(rule =>
              // Only include rules that have at least one action
              rule.Transitions || rule.Expiration || rule.AbortIncompleteMultipartUpload
            ),
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`${props.bucketName}-lifecycle-rules`),
      },
      onUpdate: {
        service: 'S3',
        action: 'putBucketLifecycleConfiguration',
        parameters: {
          Bucket: props.bucketName,
          LifecycleConfiguration: {
            Rules: lifecycleRules.map(rule => {
              const ruleConfig: any = {
                ID: rule.id,
                Status: rule.enabled ? 'Enabled' : 'Disabled',
              };

              // Handle filter - use proper AWS API format
              if (rule.prefix) {
                ruleConfig.Filter = { Prefix: rule.prefix };
              } else {
                ruleConfig.Filter = {}; // Empty filter for all objects
              }

              // Handle transitions
              if (rule.transitions && rule.transitions.length > 0) {
                const validTransitions = rule.transitions
                  .filter(t => t.transitionAfter && t.storageClass) // Ensure both fields exist
                  .map(t => ({
                    Days: t.transitionAfter!.toDays(),
                    StorageClass: mapStorageClass(t.storageClass),
                  }))
                  .filter(t => t.Days > 0); // Ensure positive days

                if (validTransitions.length > 0) {
                  ruleConfig.Transitions = validTransitions;
                }
              }

              // Handle expiration
              if (rule.expiration) {
                const expirationDays = rule.expiration.toDays();
                if (expirationDays > 0) {
                  ruleConfig.Expiration = { Days: expirationDays };
                }
              }

              // Handle incomplete multipart uploads
              if (rule.abortIncompleteMultipartUploadAfter) {
                const abortDays = rule.abortIncompleteMultipartUploadAfter.toDays();
                if (abortDays > 0) {
                  ruleConfig.AbortIncompleteMultipartUpload = {
                    DaysAfterInitiation: abortDays,
                  };
                }
              }

              return ruleConfig;
            }).filter(rule =>
              // Only include rules that have at least one action
              rule.Transitions || rule.Expiration || rule.AbortIncompleteMultipartUpload
            ),
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(`${props.bucketName}-lifecycle-rules`),
      },
      onDelete: {
        service: 'S3',
        action: 'deleteBucketLifecycle',
        parameters: {
          Bucket: props.bucketName,
        },
      },
      role: customResourceRole,
    });

    // Create CloudWatch dashboard for automation storage monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'AutomationStorageDashboard', {
      dashboardName: `AutomationStorage-${props.environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'S3 Storage Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.bucketName,
                  StorageType: 'StandardStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.days(1),
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'NumberOfObjects',
                dimensionsMap: {
                  BucketName: props.bucketName,
                  StorageType: 'AllStorageTypes',
                },
                statistic: 'Average',
                period: cdk.Duration.days(1),
              }),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Automation Storage by Class',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.bucketName,
                  StorageType: 'StandardStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.days(1),
                label: 'Standard',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.bucketName,
                  StorageType: 'StandardIAStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.days(1),
                label: 'Standard-IA',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.bucketName,
                  StorageType: 'GlacierStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.days(1),
                label: 'Glacier',
              }),
            ],
          }),
        ],
      ],
    });

    // Cost alarm for automation storage
    const costAlarm = new cloudwatch.Alarm(this, 'AutomationStorageCostAlarm', {
      alarmName: `AutomationStorageCost-${props.environment}`,
      alarmDescription: 'Alert when automation storage costs exceed threshold',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
          ServiceName: 'AmazonS3',
        },
        statistic: 'Maximum',
        period: cdk.Duration.days(1),
      }),
      threshold: props.environment === 'production' ? 100 : 25, // $100 prod, $25 staging
      evaluationPeriods: 2,
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: props.bucketName,
      description: 'S3 bucket with automation lifecycle rules applied',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard for monitoring automation storage',
    });

    new cdk.CfnOutput(this, 'CostOptimization', {
      value: JSON.stringify({
        'Standard (0-30 days)': '$0.023/GB/month',
        'Standard-IA (30-90 days)': '$0.0125/GB/month',
        'Glacier (90-365 days)': '$0.004/GB/month',
        'Deep Archive (1+ years)': '$0.00099/GB/month',
        'Estimated savings': '90% reduction for long-term storage',
      }, null, 2),
      description: 'Storage cost optimization through lifecycle transitions',
    });
  }
}
