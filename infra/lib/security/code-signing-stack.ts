import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as signer from 'aws-cdk-lib/aws-signer';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as kms from 'aws-cdk-lib/aws-kms';
import type { Construct } from 'constructs';

interface CodeSigningStackProps extends cdk.StackProps {
  stageName: string;
  securityAlertEmail?: string;
}

export class CodeSigningStack extends cdk.Stack {
  public readonly codeSigningConfig: lambda.CodeSigningConfig;
  public readonly signingProfile: signer.SigningProfile;

  constructor(scope: Construct, id: string, props: CodeSigningStackProps) {
    super(scope, id, props);

    // Create signing profile for Lambda functions
    this.signingProfile = new signer.SigningProfile(this, 'LambdaSigningProfile', {
      platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
      signatureValidity: cdk.Duration.days(365), // Valid for 1 year
    });

    // Create code signing configuration
    this.codeSigningConfig = new lambda.CodeSigningConfig(this, 'CodeSigningConfig', {
      signingProfiles: [this.signingProfile],
      untrustedArtifactOnDeployment: lambda.UntrustedArtifactOnDeployment.ENFORCE,
      description: `Code signing configuration for ${props.stageName} environment - Healthcare RCM Platform`,
    });

    // KMS key for CloudTrail + SNS topic + Lambda logs encryption
    const codeSigningKmsKey = new kms.Key(this, 'CodeSigningKmsKey', {
      description: `KMS key for code signing infrastructure encryption - ${props.stageName}`,
      enableKeyRotation: true,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Log Group for code signing events
    const codeSigningLogGroup = new logs.LogGroup(this, 'CodeSigningLogGroup', {
      logGroupName: `/aws/lambda/code-signing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: codeSigningKmsKey,
    });

    // IAM role for automated signing (for CI/CD)
    const signingRole = new iam.Role(this, 'AutomatedSigningRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for automated code signing in CI/CD pipeline',
    });

    // Grant permissions for signing
    signingRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'signer:SignPayload',
        'signer:GetSigningProfile',
        'signer:ListSigningProfiles',
        'signer:DescribeSigningJob',
        'signer:ListSigningJobs',
      ],
      resources: [this.signingProfile.signingProfileArn],
    }));

    // Custom resource to validate signing configuration
    // Note: This validator function cannot use code signing itself to avoid circular dependency
    const validateSigningFunction = new lambdaNodejs.NodejsFunction(this, 'ValidateSigningFunction', {
      functionName: `rcm-code-signing-validator-${props.stageName}`,
      entry: './lib/functions/code-signing-validator.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      logGroup: codeSigningLogGroup,
      // No codeSigningConfig here to avoid circular dependency
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        NODE_ENV: props.stageName,
        SIGNING_PROFILE_ARN: this.signingProfile.signingProfileArn,
      },
    });

    // Grant permissions to validate signing profile
    validateSigningFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'signer:GetSigningProfile',
        'signer:ListSigningProfiles',
      ],
      resources: [this.signingProfile.signingProfileArn],
    }));

    // Custom resource to trigger validation
    new cdk.CustomResource(this, 'SigningValidationResource', {
      serviceToken: validateSigningFunction.functionArn,
      properties: {
        SigningProfileArn: this.signingProfile.signingProfileArn,
        Timestamp: Date.now(), // Force update on each deployment
      },
    });

    // S3 bucket for CloudTrail logs (code signing audit trail)
    const codeSigningAuditBucket = new s3.Bucket(this, 'CodeSigningAuditBucket', {
      bucketName: `rcm-code-signing-audit-${props.stageName}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'code-signing-audit-lifecycle',
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
          expiration: props.stageName === 'prod'
            ? cdk.Duration.days(2555) // 7 years for HIPAA compliance
            : cdk.Duration.days(730),  // 2 years for staging (must be > 365 days transition)
        },
      ],
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // CloudTrail log group for real-time monitoring
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CodeSigningCloudTrailLogs', {
      logGroupName: `/aws/cloudtrail/code-signing-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.THREE_MONTHS,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      encryptionKey: codeSigningKmsKey,
    });

    // CloudTrail for code signing audit trail
    const codeSigningTrail = new cloudtrail.Trail(this, 'CodeSigningAuditTrail', {
      trailName: `rcm-code-signing-audit-${props.stageName}`,
      bucket: codeSigningAuditBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: cloudTrailLogGroup, // Use dedicated CloudTrail log group
      managementEvents: cloudtrail.ReadWriteType.ALL,
      encryptionKey: codeSigningKmsKey,
    });

    // Add specific event selectors for AWS Signer events
    codeSigningTrail.addEventSelector(cloudtrail.DataResourceType.S3_OBJECT, [
      codeSigningAuditBucket.arnForObjects('*'),
    ]);

    // Allow SNS service to use the key
    codeSigningKmsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: ['*'],
    }));

    // Allow CloudWatch Logs service to use the key
    codeSigningKmsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal(`logs.${cdk.Stack.of(this).region}.amazonaws.com`)],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:DescribeKey',
      ],
      resources: ['*'],
    }));

    // Allow CloudTrail service to use the key
    codeSigningKmsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:DescribeKey',
      ],
      resources: ['*'],
    }));

    // SNS Topic for code signing alerts
    const codeSigningAlertsTopic = new sns.Topic(this, 'CodeSigningAlertsTopic', {
      topicName: `rcm-code-signing-alerts-${props.stageName}`,
      displayName: 'Code Signing Security Alerts',
      enforceSSL: true,
      masterKey: codeSigningKmsKey,
    });

    // Add email subscription if provided
    if (props.securityAlertEmail) {
      codeSigningAlertsTopic.addSubscription(
        new subscriptions.EmailSubscription(props.securityAlertEmail)
      );
    }

    // CloudWatch Alarms for code signing monitoring
    new cloudwatch.Alarm(this, 'CodeSigningFailureAlarm', {
      alarmName: `rcm-code-signing-failures-${props.stageName}`,
      alarmDescription: 'Lambda code signing failure detected - immediate security attention required',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Signer',
        metricName: 'SigningJobFailed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(codeSigningAlertsTopic));

    // Alarm for code signing configuration violations
    new cloudwatch.Alarm(this, 'UntrustedArtifactAlarm', {
      alarmName: `rcm-untrusted-artifact-${props.stageName}`,
      alarmDescription: 'Unsigned Lambda deployment attempt blocked - potential security breach',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'CodeSigningConfigurationViolations',
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(codeSigningAlertsTopic));

    // Alarm for signing profile health
    new cloudwatch.Alarm(this, 'SigningProfileHealthAlarm', {
      alarmName: `rcm-signing-profile-health-${props.stageName}`,
      alarmDescription: 'Signing profile validation failures detected',
      metric: validateSigningFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(codeSigningAlertsTopic));

    // Outputs for other stacks to reference
    new cdk.CfnOutput(this, 'CodeSigningConfigArn', {
      value: this.codeSigningConfig.codeSigningConfigArn,
      exportName: `RCM-CodeSigningConfig-${props.stageName}`,
      description: 'ARN of the Lambda code signing configuration',
    });

    new cdk.CfnOutput(this, 'SigningProfileArn', {
      value: this.signingProfile.signingProfileArn,
      exportName: `RCM-SigningProfile-${props.stageName}`,
      description: 'ARN of the AWS Signer signing profile',
    });

    new cdk.CfnOutput(this, 'SigningRoleArn', {
      value: signingRole.roleArn,
      exportName: `RCM-SigningRole-${props.stageName}`,
      description: 'ARN of the automated signing role for CI/CD',
    });

    new cdk.CfnOutput(this, 'CodeSigningAuditBucketName', {
      value: codeSigningAuditBucket.bucketName,
      exportName: `RCM-CodeSigningAuditBucket-${props.stageName}`,
      description: 'S3 bucket for code signing CloudTrail audit logs',
    });

    new cdk.CfnOutput(this, 'CodeSigningTrailArn', {
      value: codeSigningTrail.trailArn,
      exportName: `RCM-CodeSigningTrail-${props.stageName}`,
      description: 'ARN of the code signing CloudTrail audit trail',
    });

    new cdk.CfnOutput(this, 'CodeSigningAlertsTopicArn', {
      value: codeSigningAlertsTopic.topicArn,
      exportName: `RCM-CodeSigningAlerts-${props.stageName}`,
      description: 'SNS topic for code signing security alerts',
    });

    new cdk.CfnOutput(this, 'CodeSigningKmsKeyArn', {
      value: codeSigningKmsKey.keyArn,
      exportName: `RCM-CodeSigningKmsKey-${props.stageName}`,
      description: 'KMS key for SNS topic encryption',
    });

    // Tag all resources for compliance tracking
    cdk.Tags.of(this).add('SecurityCompliance', 'CodeSigning');
    cdk.Tags.of(this).add('HealthcareCompliance', 'HIPAA');
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Purpose', 'InfrastructureCodeSigning');
  }
}
