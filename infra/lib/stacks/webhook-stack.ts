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
import { Construct } from 'constructs';

interface WebhookStackProps extends cdk.StackProps {
  environment: 'staging' | 'prod';
  database: rds.DatabaseCluster;
  eventBus?: events.EventBus;
}

/**
 * Enhanced webhook system with EventBridge integration for near-instant delivery
 */
export class WebhookStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly webhookProcessorFunction: lambda.Function;
  public readonly webhookDeliveryFunction: lambda.Function;
  public readonly webhookQueue: sqs.Queue;
  public readonly webhookDlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: WebhookStackProps) {
    super(scope, id, props);

    // Create custom EventBridge bus or use provided one
    this.eventBus = props.eventBus ?? new events.EventBus(this, 'WebhookEventBus', {
      eventBusName: `foresight-webhooks-${props.environment}`,
    });

    // Create DLQ for failed webhook deliveries
    this.webhookDlq = new sqs.Queue(this, 'WebhookDeadLetterQueue', {
      queueName: `foresight-webhook-dlq-${props.environment}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create webhook delivery queue with retry mechanism
    this.webhookQueue = new sqs.Queue(this, 'WebhookDeliveryQueue', {
      queueName: `foresight-webhook-delivery-${props.environment}`,
      visibilityTimeout: cdk.Duration.seconds(90), // 3x Lambda timeout
      deadLetterQueue: {
        queue: this.webhookDlq,
        maxReceiveCount: 5, // Try 5 times before DLQ
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Create webhook processor Lambda (processes events and determines deliveries)
    this.webhookProcessorFunction = new lambdaNodejs.NodejsFunction(this, 'WebhookProcessor', {
      functionName: `foresight-webhook-processor-${props.environment}`,
      entry: '../packages/functions/webhooks/webhook-processor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.environment,
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
      functionName: `foresight-webhook-delivery-${props.environment}`,
      entry: '../packages/functions/webhooks/webhook-delivery.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.environment,
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
    this.applyTags(props.environment);

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
      ruleName: `foresight-organization-events-${this.node.tryGetContext('environment') || 'dev'}`,
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
      ruleName: `foresight-user-events-${this.node.tryGetContext('environment') || 'dev'}`,
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
      ruleName: `foresight-patient-events-${this.node.tryGetContext('environment') || 'dev'}`,
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
      ruleName: `foresight-claims-events-${this.node.tryGetContext('environment') || 'dev'}`,
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
      ruleName: `foresight-document-events-${this.node.tryGetContext('environment') || 'dev'}`,
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
  }

  private createDlqMonitoring(): void {
    // Create Lambda for DLQ processing and alerting
    const dlqProcessor = new lambdaNodejs.NodejsFunction(this, 'WebhookDlqProcessor', {
      functionName: `foresight-webhook-dlq-processor-${this.node.tryGetContext('environment') || 'dev'}`,
      entry: '../packages/functions/webhooks/webhook-dlq-processor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: this.node.tryGetContext('environment') || 'dev',
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