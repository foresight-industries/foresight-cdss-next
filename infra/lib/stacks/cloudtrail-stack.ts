import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CloudTrailStackProps extends cdk.StackProps {
  stageName: string;
}

export class CloudTrailStack extends cdk.Stack {
  public readonly cloudTrail: cloudtrail.Trail;
  public readonly logsBucket: s3.Bucket;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: CloudTrailStackProps) {
    super(scope, id, props);

    // Create KMS key for CloudTrail encryption
    this.kmsKey = new kms.Key(this, 'CloudTrailKMSKey', {
      description: `CloudTrail KMS Key for ${props.stageName}`,
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Create S3 bucket for CloudTrail logs
    this.logsBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `foresight-cloudtrail-logs-${props.stageName}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogsLifecycle',
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
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          // Keep logs for 7 years for HIPAA compliance
          expiration: cdk.Duration.days(2555),
        },
      ],
    });

    // Create CloudWatch Log Group for CloudTrail
    const cloudWatchLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/foresight-${props.stageName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
    });

    // Create IAM role for CloudTrail to write to CloudWatch
    const cloudTrailLogRole = new iam.Role(this, 'CloudTrailLogRole', {
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
              ],
              resources: [cloudWatchLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Create CloudTrail
    this.cloudTrail = new cloudtrail.Trail(this, 'HealthcareRCMCloudTrail', {
      trailName: `foresight-healthcare-rcm-${props.stageName}`,
      bucket: this.logsBucket,
      encryptionKey: this.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: cloudWatchLogGroup,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
    });

    // Add data events for critical resources after trail creation
    this.cloudTrail.addS3EventSelector([
      {
        bucket: this.logsBucket,
        objectPrefix: '',
      },
    ], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: true,
    });

    // Note: Lambda event selector requires specific function references
    // For comprehensive Lambda logging, we rely on CloudTrail management events
    // which capture Lambda API calls (CreateFunction, UpdateFunction, etc.)

    // Create CloudWatch alarms for critical security events
    const rootUserActivityAlarm = new logs.MetricFilter(this, 'RootUserActivityFilter', {
      logGroup: cloudWatchLogGroup,
      metricNamespace: 'HealthcareRCM/Security',
      metricName: 'RootUserActivity',
      filterPattern: logs.FilterPattern.literal('{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'),
      metricValue: '1',
    });

    const unauthorizedApiCallsAlarm = new logs.MetricFilter(this, 'UnauthorizedApiCallsFilter', {
      logGroup: cloudWatchLogGroup,
      metricNamespace: 'HealthcareRCM/Security',
      metricName: 'UnauthorizedApiCalls',
      filterPattern: logs.FilterPattern.literal('{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'),
      metricValue: '1',
    });

    const consoleSignInFailuresAlarm = new logs.MetricFilter(this, 'ConsoleSignInFailuresFilter', {
      logGroup: cloudWatchLogGroup,
      metricNamespace: 'HealthcareRCM/Security',
      metricName: 'ConsoleSignInFailures',
      filterPattern: logs.FilterPattern.literal('{ ($.eventName = ConsoleLogin) && ($.responseElements.ConsoleLogin = "Failure") }'),
      metricValue: '1',
    });

    // Add KMS key alias
    new kms.Alias(this, 'CloudTrailKMSKeyAlias', {
      aliasName: `alias/foresight-cloudtrail-${props.stageName}`,
      targetKey: this.kmsKey,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: this.cloudTrail.trailArn,
      description: 'CloudTrail ARN for audit logging',
      exportName: `Foresight-CloudTrail-Arn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailLogsBucketName', {
      value: this.logsBucket.bucketName,
      description: 'S3 bucket storing CloudTrail logs',
      exportName: `Foresight-CloudTrail-Bucket-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailKMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for CloudTrail encryption',
      exportName: `Foresight-CloudTrail-KMS-${props.stageName}`,
    });
  }
}
