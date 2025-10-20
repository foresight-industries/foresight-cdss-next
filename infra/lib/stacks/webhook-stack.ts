import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface WebhookStackProps extends cdk.StackProps {
  stageName: 'staging' | 'prod';
  database: rds.DatabaseCluster;
  eventBus?: events.EventBus;
  hipaaComplianceEmail?: string; // Email for HIPAA compliance alerts
}

/**
 * Enhanced HIPAA-compliant webhook system with EventBridge integration for near-instant delivery
 */
export class WebhookStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly webhookProcessorFunction: lambda.Function;
  public readonly webhookDeliveryFunction: lambda.Function;
  public readonly webhookQueue: sqs.Queue;
  public readonly webhookDlq: sqs.Queue;

  // HIPAA Compliance components
  public phiEncryptionKey: kms.Key;
  public hipaaComplianceAlertsTopic: sns.Topic;
  public dataRetentionFunction: lambda.Function;
  public hipaaAuditLogGroup: logs.LogGroup;
  public webhookSigningKeySecret: secretsManager.Secret;

  private readonly stageName: string;

  constructor(scope: Construct, id: string, props: WebhookStackProps) {
    super(scope, id, props);

    this.stageName = props.stageName;

    // Create custom EventBridge bus or use provided one
    this.eventBus = props.eventBus ?? new events.EventBus(this, 'WebhookEventBus', {
      eventBusName: `foresight-webhooks-${props.stageName}`,
    });

    // Create DLQ for failed webhook deliveries
    this.webhookDlq = new sqs.Queue(this, 'WebhookDeadLetterQueue', {
      queueName: `foresight-webhook-dlq-${props.stageName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create webhook delivery queue with retry mechanism
    this.webhookQueue = new sqs.Queue(this, 'WebhookDeliveryQueue', {
      queueName: `foresight-webhook-delivery-${props.stageName}`,
      visibilityTimeout: cdk.Duration.seconds(90), // 3x Lambda timeout
      deadLetterQueue: {
        queue: this.webhookDlq,
        maxReceiveCount: 5, // Try 5 times before DLQ
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create webhook processor Lambda (processes events and determines deliveries)
    this.webhookProcessorFunction = new lambdaNodejs.NodejsFunction(this, 'WebhookProcessor', {
      functionName: `foresight-webhook-processor-${props.stageName}`,
      entry: '../packages/functions/webhooks/webhook-processor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        WEBHOOK_QUEUE_URL: this.webhookQueue.queueUrl,
        EVENT_BUS_NAME: this.eventBus.eventBusName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create webhook delivery Lambda (handles actual HTTP deliveries)
    this.webhookDeliveryFunction = new lambdaNodejs.NodejsFunction(this, 'WebhookDelivery', {
      functionName: `foresight-webhook-delivery-${props.stageName}`,
      entry: '../packages/functions/webhooks/webhook-delivery.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions to webhook processor
    this.grantWebhookProcessorPermissions();

    // Grant permissions to webhook delivery function
    this.grantWebhookDeliveryPermissions();

    // Create HIPAA compliance infrastructure
    this.createHipaaComplianceInfrastructure(props);

    // Connect SQS to webhook delivery Lambda
    this.webhookDeliveryFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    // Create EventBridge rules for different event types
    this.createEventBridgeRules();

    // Create DLQ monitoring
    this.createDlqMonitoring();

    // Apply tags
    this.applyTags(props.stageName);

    // Create outputs
    this.createOutputs();
  }

  private grantWebhookProcessorPermissions(): void {
    // Database access
    this.webhookProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:ExecuteStatement',
          'rds-data:RollbackTransaction',
        ],
        resources: [this.node.tryGetContext('database')?.clusterArn || '*'],
      })
    );

    // Secrets access
    this.webhookProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.node.tryGetContext('database')?.secretArn || '*'],
      })
    );

    // SQS send permissions
    this.webhookQueue.grantSendMessages(this.webhookProcessorFunction);

    // EventBridge access
    this.webhookProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [this.eventBus.eventBusArn],
      })
    );
  }

  private grantWebhookDeliveryPermissions(): void {
    // Database access for delivery tracking
    this.webhookDeliveryFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:ExecuteStatement',
          'rds-data:RollbackTransaction',
        ],
        resources: [this.node.tryGetContext('database')?.clusterArn || '*'],
      })
    );

    // Secrets access
    this.webhookDeliveryFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.node.tryGetContext('database')?.secretArn || '*'],
      })
    );

    // SQS receive permissions (automatically granted by event source)
    // CloudWatch Logs for delivery tracking
    this.webhookDeliveryFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );
  }

  private createEventBridgeRules(): void {
    // Organization events rule
    const organizationRule = new events.Rule(this, 'OrganizationEventsRule', {
      ruleName: `foresight-organization-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.organizations'],
        detailType: [
          'Organization Created',
          'Organization Updated',
          'Organization Deleted',
          'Organization Settings Changed',
        ],
      },
    });

    organizationRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));

    // User events rule
    const userRule = new events.Rule(this, 'UserEventsRule', {
      ruleName: `foresight-user-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.users'],
        detailType: [
          'User Created',
          'User Updated',
          'User Deleted',
          'User Role Changed',
        ],
      },
    });

    userRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));

    // Patient events rule
    const patientRule = new events.Rule(this, 'PatientEventsRule', {
      ruleName: `foresight-patient-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.patients'],
        detailType: [
          'Patient Created',
          'Patient Updated',
          'Patient Deleted',
        ],
      },
    });

    patientRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));

    // Claims events rule
    const claimsRule = new events.Rule(this, 'ClaimsEventsRule', {
      ruleName: `foresight-claims-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.claims'],
        detailType: [
          'Claim Created',
          'Claim Updated',
          'Claim Submitted',
          'Claim Approved',
          'Claim Denied',
          'Claim Processing Started',
          'Claim Processing Completed',
        ],
      },
    });

    claimsRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));

    // Document events rule
    const documentRule = new events.Rule(this, 'DocumentEventsRule', {
      ruleName: `foresight-document-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.documents'],
        detailType: [
          'Document Uploaded',
          'Document Processed',
          'Document Analysis Completed',
          'Document Deleted',
        ],
      },
    });

    documentRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));

    // Webhook test events rule
    const webhookTestRule = new events.Rule(this, 'WebhookTestEventsRule', {
      ruleName: `foresight-webhook-test-events-${this.stageName}`,
      eventBus: this.eventBus,
      eventPattern: {
        source: ['foresight.webhooks'],
        detailType: [
          'Webhook Test Event',
        ],
      },
    });

    webhookTestRule.addTarget(new targets.LambdaFunction(this.webhookProcessorFunction));
  }

  private createDlqMonitoring(): void {
    // Create Lambda for DLQ processing and alerting
    const dlqProcessor = new lambdaNodejs.NodejsFunction(this, 'WebhookDlqProcessor', {
      functionName: `foresight-webhook-dlq-processor-${this.stageName}`,
      entry: '../packages/functions/webhooks/webhook-dlq-processor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: this.stageName,
        DATABASE_SECRET_ARN: this.node.tryGetContext('database')?.secretArn || '',
        DATABASE_CLUSTER_ARN: this.node.tryGetContext('database')?.clusterArn || '',
        DATABASE_NAME: 'rcm',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant DLQ processor permissions
    dlqProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:ExecuteStatement',
          'rds-data:RollbackTransaction',
        ],
        resources: [this.node.tryGetContext('database')?.clusterArn || '*'],
      })
    );

    dlqProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.node.tryGetContext('database')?.secretArn || '*'],
      })
    );

    dlqProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'sns:Publish',
        ],
        resources: ['*'],
      })
    );

    // Connect DLQ to processor
    dlqProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookDlq, {
        batchSize: 10,
      })
    );
  }

  private createHipaaComplianceInfrastructure(props: WebhookStackProps): void {
    // Create KMS key for PHI encryption
    this.phiEncryptionKey = new kms.Key(this, 'PhiEncryptionKey', {
      description: `PHI encryption key for webhooks - ${props.stageName}`,
      enableKeyRotation: true, // Automatic annual rotation for HIPAA compliance
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create alias for easier reference
    new kms.Alias(this, 'PhiEncryptionKeyAlias', {
      aliasName: `alias/foresight-webhook-phi-${props.stageName}`,
      targetKey: this.phiEncryptionKey,
    });

    // Create SNS topic for HIPAA compliance alerts
    this.hipaaComplianceAlertsTopic = new sns.Topic(this, 'HipaaComplianceAlerts', {
      topicName: `foresight-webhook-hipaa-alerts-${props.stageName}`,
      displayName: 'HIPAA Compliance Alerts',
      fifo: false,
    });

    // Subscribe email to alerts if provided
    if (props.hipaaComplianceEmail) {
      this.hipaaComplianceAlertsTopic.addSubscription(
        new subscriptions.EmailSubscription(props.hipaaComplianceEmail)
      );
    }

    // Create CloudWatch Log Group for HIPAA audit logs
    this.hipaaAuditLogGroup = new logs.LogGroup(this, 'HipaaAuditLogGroup', {
      logGroupName: `/aws/lambda/foresight-webhook-hipaa-audit-${props.stageName}`,
      retention: props.stageName === 'prod' ? logs.RetentionDays.SEVEN_YEARS : logs.RetentionDays.ONE_YEAR,
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create webhook signing secret template for organizations
    this.webhookSigningKeySecret = new secretsManager.Secret(this, 'WebhookSigningKeySecret', {
      secretName: `rcm-webhook-signing-keys-${props.stageName}`,
      description: 'Template webhook signing secret for HMAC verification - organizations will create specific secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          description: 'Webhook signing keys for Foresight CDSS',
          template: true,
        }),
        generateStringKey: 'example_signing_key',
        excludeCharacters: '"\\/',
        includeSpace: false,
        passwordLength: 64,
      },
      removalPolicy: props.stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create data retention Lambda function
    this.dataRetentionFunction = new lambdaNodejs.NodejsFunction(this, 'DataRetentionFunction', {
      functionName: `foresight-webhook-data-retention-${props.stageName}`,
      entry: '../packages/functions/webhooks/data-retention-scheduler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(15), // Longer timeout for batch operations
      memorySize: 1024,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        PHI_ENCRYPTION_KEY_ID: this.phiEncryptionKey.keyId,
        HIPAA_ALERTS_TOPIC_ARN: this.hipaaComplianceAlertsTopic.topicArn,
        AUDIT_LOG_GROUP_NAME: this.hipaaAuditLogGroup.logGroupName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Schedule data retention to run daily at 2 AM UTC
    const retentionScheduleRule = new events.Rule(this, 'DataRetentionSchedule', {
      ruleName: `foresight-webhook-retention-schedule-${props.stageName}`,
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
      description: 'Daily execution of HIPAA data retention policies',
    });

    retentionScheduleRule.addTarget(new targets.LambdaFunction(this.dataRetentionFunction));

    // Grant permissions for HIPAA compliance functions
    this.grantHipaaCompliancePermissions();

    // Update Lambda function environment variables with HIPAA keys
    this.updateLambdaEnvironmentForHipaa();

    // Create CloudWatch alarms for HIPAA compliance monitoring
    this.createHipaaComplianceAlarms();
  }

  private grantHipaaCompliancePermissions(): void {
    // Grant KMS permissions to all Lambda functions
    const lambdaFunctions = [
      this.webhookProcessorFunction,
      this.webhookDeliveryFunction,
      this.dataRetentionFunction,
    ];

    lambdaFunctions.forEach(func => {
      this.phiEncryptionKey.grantEncryptDecrypt(func);

      // Grant database access
      func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds-data:BeginTransaction',
            'rds-data:CommitTransaction',
            'rds-data:ExecuteStatement',
            'rds-data:RollbackTransaction',
          ],
          resources: [this.node.tryGetContext('database')?.clusterArn || '*'],
        })
      );

      // Grant Secrets Manager access
      func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue', 'secretsmanager:CreateSecret', 'secretsmanager:UpdateSecret'],
          resources: ['*'], // Webhook secrets can be created dynamically
        })
      );

      // Grant CloudWatch Logs access for audit logging
      func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resources: [this.hipaaAuditLogGroup.logGroupArn + ':*'],
        })
      );

      // Grant SNS publish for compliance alerts
      this.hipaaComplianceAlertsTopic.grantPublish(func);

      // Grant CloudWatch metrics for monitoring
      func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['cloudwatch:PutMetricData'],
          resources: ['*'],
        })
      );
    });
  }

  private updateLambdaEnvironmentForHipaa(): void {
    const hipaaEnvironmentVars = {
      PHI_ENCRYPTION_KEY_ID: this.phiEncryptionKey.keyId,
      HIPAA_ALERTS_TOPIC_ARN: this.hipaaComplianceAlertsTopic.topicArn,
      AUDIT_LOG_GROUP_NAME: this.hipaaAuditLogGroup.logGroupName,
    };

    // Add environment variables to processor function
    Object.entries(hipaaEnvironmentVars).forEach(([key, value]) => {
      this.webhookProcessorFunction.addEnvironment(key, value);
    });

    // Add environment variables to delivery function
    Object.entries(hipaaEnvironmentVars).forEach(([key, value]) => {
      this.webhookDeliveryFunction.addEnvironment(key, value);
    });
  }

  private createHipaaComplianceAlarms(): void {
    // Alarm for failed webhook deliveries (potential compliance issue)
    new cloudwatch.Alarm(this, 'FailedWebhookDeliveriesAlarm', {
      alarmName: `foresight-webhook-failed-deliveries-${this.stageName}`,
      alarmDescription: 'High number of failed webhook deliveries - potential HIPAA compliance issue',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfMessagesVisible',
        dimensionsMap: {
          QueueName: this.webhookDlq.queueName,
        },
        statistic: 'Average',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.hipaaComplianceAlertsTopic));

    // Alarm for PHI encryption failures
    new cloudwatch.Alarm(this, 'PhiEncryptionFailuresAlarm', {
      alarmName: `foresight-webhook-phi-encryption-failures-${this.stageName}`,
      alarmDescription: 'PHI encryption failures detected - immediate attention required',
      metric: new cloudwatch.Metric({
        namespace: 'Foresight/Webhooks',
        metricName: 'PHIEncryptionFailures',
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.hipaaComplianceAlertsTopic));

    // Alarm for BAA violations
    new cloudwatch.Alarm(this, 'BaaViolationsAlarm', {
      alarmName: `foresight-webhook-baa-violations-${this.stageName}`,
      alarmDescription: 'BAA violations detected - immediate compliance review required',
      metric: new cloudwatch.Metric({
        namespace: 'Foresight/Webhooks',
        metricName: 'BAAViolations',
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.hipaaComplianceAlertsTopic));

    // Alarm for data retention policy violations
    new cloudwatch.Alarm(this, 'DataRetentionViolationsAlarm', {
      alarmName: `foresight-webhook-retention-violations-${this.stageName}`,
      alarmDescription: 'Data retention policy violations detected',
      metric: new cloudwatch.Metric({
        namespace: 'Foresight/Webhooks',
        metricName: 'DataRetentionViolations',
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.hipaaComplianceAlertsTopic));
  }

  private applyTags(environment: string): void {
    cdk.Tags.of(this).add('Project', 'Foresight-CDSS');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Component', 'Webhook-System');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    if (environment === 'prod') {
      cdk.Tags.of(this).add('BackupRequired', 'true');
      cdk.Tags.of(this).add('MonitoringLevel', 'enhanced');
    }
  }

  private createOutputs(): void {
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Name of the webhook EventBridge bus',
      exportName: `${this.stackName}-event-bus-name`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the webhook EventBridge bus',
      exportName: `${this.stackName}-event-bus-arn`,
    });

    new cdk.CfnOutput(this, 'WebhookQueueUrl', {
      value: this.webhookQueue.queueUrl,
      description: 'URL of the webhook delivery queue',
      exportName: `${this.stackName}-webhook-queue-url`,
    });

    new cdk.CfnOutput(this, 'WebhookProcessorFunctionName', {
      value: this.webhookProcessorFunction.functionName,
      description: 'Name of the webhook processor function',
      exportName: `${this.stackName}-processor-function-name`,
    });

    new cdk.CfnOutput(this, 'WebhookDeliveryFunctionName', {
      value: this.webhookDeliveryFunction.functionName,
      description: 'Name of the webhook delivery function',
      exportName: `${this.stackName}-delivery-function-name`,
    });

    // HIPAA Compliance outputs
    new cdk.CfnOutput(this, 'PhiEncryptionKeyId', {
      value: this.phiEncryptionKey.keyId,
      description: 'KMS Key ID for PHI encryption',
      exportName: `${this.stackName}-phi-encryption-key-id`,
    });

    new cdk.CfnOutput(this, 'PhiEncryptionKeyArn', {
      value: this.phiEncryptionKey.keyArn,
      description: 'KMS Key ARN for PHI encryption',
      exportName: `${this.stackName}-phi-encryption-key-arn`,
    });

    new cdk.CfnOutput(this, 'HipaaComplianceAlertsTopicArn', {
      value: this.hipaaComplianceAlertsTopic.topicArn,
      description: 'SNS Topic ARN for HIPAA compliance alerts',
      exportName: `${this.stackName}-hipaa-alerts-topic-arn`,
    });

    new cdk.CfnOutput(this, 'DataRetentionFunctionName', {
      value: this.dataRetentionFunction.functionName,
      description: 'Name of the data retention function',
      exportName: `${this.stackName}-data-retention-function-name`,
    });

    new cdk.CfnOutput(this, 'HipaaAuditLogGroupName', {
      value: this.hipaaAuditLogGroup.logGroupName,
      description: 'CloudWatch Log Group for HIPAA audit logs',
      exportName: `${this.stackName}-hipaa-audit-log-group-name`,
    });

    new cdk.CfnOutput(this, 'WebhookSigningKeySecretArn', {
      value: this.webhookSigningKeySecret.secretArn,
      description: 'ARN of the webhook signing secret template',
      exportName: `${this.stackName}-webhook-signing-secret-arn`,
    });
  }

  /**
   * Get environment variables for other services that need to publish events
   */
  public getEventPublishingEnvironmentVariables(): Record<string, string> {
    return {
      WEBHOOK_EVENT_BUS_NAME: this.eventBus.eventBusName,
      WEBHOOK_EVENT_BUS_ARN: this.eventBus.eventBusArn,
    };
  }

  /**
   * Get policy statements for services that need to publish webhook events
   */
  public getEventPublishingPolicyStatements(): iam.PolicyStatement[] {
    return [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [this.eventBus.eventBusArn],
      }),
    ];
  }
}
