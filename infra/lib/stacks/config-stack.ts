import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface ConfigStackProps extends cdk.StackProps {
  stageName: string;
  complianceEmail?: string;
  codeSigningConfigArn?: string;
}

export class ConfigStack extends cdk.Stack {
  public readonly configBucket: s3.Bucket;
  public readonly configTopic: sns.Topic;
  public readonly codeSigningConfigArn?: string;

  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);

    // KMS key for Config encryption
    const configKmsKey = new kms.Key(this, 'ConfigKmsKey', {
      description: 'KMS key for AWS Config encryption (HIPAA compliance)',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable Root Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow Config Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('config.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey*',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow SNS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // S3 bucket for Config snapshots and history
    this.configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `rcm-config-${props.stageName}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: configKmsKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'config-lifecycle',
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
          expiration: props.stageName === 'prod'
            ? cdk.Duration.days(2555) // 7 years for HIPAA compliance
            : cdk.Duration.days(365),  // 1 year for staging
        },
      ],
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // SNS topic for Config notifications
    this.configTopic = new sns.Topic(this, 'ConfigTopic', {
      topicName: `rcm-config-compliance-${props.stageName}`,
      displayName: 'AWS Config Compliance Notifications',
      enforceSSL: true,
      masterKey: configKmsKey,
    });

    this.codeSigningConfigArn = props.codeSigningConfigArn;

    // Add email subscription if provided
    if (props.complianceEmail) {
      this.configTopic.addSubscription(
        new subscriptions.EmailSubscription(props.complianceEmail)
      );
    }

    // Config delivery channel
    const configDeliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: `rcm-config-delivery-${props.stageName}`,
      s3BucketName: this.configBucket.bucketName,
      s3KeyPrefix: `config/${props.stageName}/`,
      s3KmsKeyArn: configKmsKey.keyArn,
      snsTopicArn: this.configTopic.topicArn,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    });

    // Config configuration recorder
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `rcm-config-recorder-${props.stageName}`,
      roleArn: this.createConfigRole().roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
        resourceTypes: [],
      },
    });

    // HIPAA-relevant Config rules
    this.createHIPAAComplianceRules();

    // Healthcare-specific Config rules
    this.createHealthcareComplianceRules();

    // Dependencies
    configDeliveryChannel.addDependency(configRecorder);

    // Outputs
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: this.configBucket.bucketName,
      exportName: `RCM-ConfigBucket-${props.stageName}`,
      description: 'S3 bucket for AWS Config snapshots',
    });

    new cdk.CfnOutput(this, 'ConfigTopicArn', {
      value: this.configTopic.topicArn,
      exportName: `RCM-ConfigTopic-${props.stageName}`,
      description: 'SNS topic for Config compliance notifications',
    });

    // Tag all resources for compliance tracking
    cdk.Tags.of(this).add('Purpose', 'ComplianceMonitoring');
    cdk.Tags.of(this).add('HealthcareCompliance', 'HIPAA');
    cdk.Tags.of(this).add('Environment', props.stageName);
  }

  private createConfigRole(): iam.Role {
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      description: 'Service role for AWS Config',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // Grant permissions to write to S3 bucket
    this.configBucket.grantReadWrite(configRole);

    // Grant permissions to publish to SNS topic
    this.configTopic.grantPublish(configRole);

    return configRole;
  }

  private createHIPAAComplianceRules(): void {
    // Ensure S3 buckets have encryption enabled
    new config.ManagedRule(this, 'S3BucketServerSideEncryptionEnabled', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that S3 buckets have encryption enabled for HIPAA compliance',
    });

    // Ensure S3 buckets are not publicly accessible
    new config.ManagedRule(this, 'S3BucketPublicAccessProhibited', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public access',
    });

    // Ensure RDS instances have encryption enabled
    new config.ManagedRule(this, 'RDSStorageEncrypted', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances have encryption at rest enabled',
    });

    // Ensure EBS volumes are encrypted
    new config.ManagedRule(this, 'EncryptedVolumes', {
      identifier: config.ManagedRuleIdentifiers.EBS_ENCRYPTED_VOLUMES,
      description: 'Checks that EBS volumes are encrypted',
    });

    // Ensure CloudTrail is enabled
    new config.ManagedRule(this, 'CloudTrailEnabled', {
      identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
      description: 'Checks that CloudTrail is enabled for audit trail',
    });

    // Ensure VPC flow logs are enabled
    new config.ManagedRule(this, 'VPCFlowLogsEnabled', {
      identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
      description: 'Checks that VPC Flow Logs are enabled for network monitoring',
    });
  }

  private createHealthcareComplianceRules(): void {
    // Ensure Lambda functions have dead letter queues configured
    new config.ManagedRule(this, 'LambdaDlqCheck', {
      identifier: config.ManagedRuleIdentifiers.LAMBDA_DLQ_CHECK,
      description: 'Checks that Lambda functions have DLQ configured for error handling',
    });

    // Ensure EC2 instances are managed by Systems Manager
    new config.ManagedRule(this, 'EC2ManagedBySSM', {
      identifier: config.ManagedRuleIdentifiers.EC2_MANAGED_INSTANCE_ASSOCIATION_COMPLIANCE_STATUS_CHECK,
      description: 'Checks that EC2 instances are managed by Systems Manager for compliance',
    });

    // Ensure IAM users have MFA enabled
    new config.ManagedRule(this, 'IAMUserMFAEnabled', {
      identifier: config.ManagedRuleIdentifiers.IAM_USER_MFA_ENABLED,
      description: 'Checks that IAM users have MFA enabled for additional security',
    });

    // Ensure root access key check
    new config.ManagedRule(this, 'RootAccessKeyCheck', {
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
      description: 'Checks that root account does not have access keys',
    });

    // Ensure SNS topics are encrypted
    new config.ManagedRule(this, 'SNSEncryptedKMS', {
      identifier: config.ManagedRuleIdentifiers.SNS_ENCRYPTED_KMS,
      description: 'Checks that SNS topics are encrypted with KMS',
    });

    // Ensure RDS instances have backup enabled
    new config.ManagedRule(this, 'DBInstanceBackupEnabled', {
      identifier: config.ManagedRuleIdentifiers.RDS_DB_INSTANCE_BACKUP_ENABLED,
      description: 'Checks that RDS instances have automated backups enabled',
    });

    // Custom rule for Lambda code signing
    new config.CustomRule(this, 'LambdaCodeSigningEnabled', {
      description: 'Checks that Lambda functions have code signing enabled for healthcare compliance',
      lambdaFunction: this.createCodeSigningCheckFunction(),
      configurationChanges: true,
      periodic: true,
      maximumExecutionFrequency: config.MaximumExecutionFrequency.TWENTY_FOUR_HOURS,
    });
  }

  private createCodeSigningCheckFunction(): cdk.aws_lambda.Function {
    // Import code signing configuration if provided
    let codeSigningConfig: cdk.aws_lambda.ICodeSigningConfig | undefined;
    if (this.codeSigningConfigArn) {
      codeSigningConfig = cdk.aws_lambda.CodeSigningConfig.fromCodeSigningConfigArn(
        this,
        'ImportedCodeSigningConfig',
        this.codeSigningConfigArn
      );
    }

    return new cdk.aws_lambda.Function(this, 'CodeSigningCheckFunction', {
      functionName: `rcm-config-code-signing-check-${this.stackName}`,
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_12,
      handler: 'config-code-signing-check.lambda_handler',
      code: cdk.aws_lambda.Code.fromAsset('./lib/functions', {
        exclude: ['*.ts', '*.js', '*.d.ts', '*.map'],
      }),
      timeout: cdk.Duration.minutes(1),
      description: 'AWS Config rule to check Lambda code signing compliance for healthcare',
      environment: {
        LOG_LEVEL: 'INFO',
      },
      codeSigningConfig, // Set during function creation
    });
  }
}
