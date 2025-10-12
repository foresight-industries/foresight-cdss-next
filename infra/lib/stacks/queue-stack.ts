import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

interface QueueStackProps extends cdk.StackProps {
  stageName: string;
  database: any;
  documentsBucket: any;
}

export class QueueStack extends cdk.Stack {
  public readonly claimsQueue: sqs.Queue;
  public readonly webhookQueue: sqs.Queue;
  public readonly eligibilityQueue: sqs.Queue;
  public readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: QueueStackProps) {
    super(scope, id, props);

    // Shared DLQ
    this.dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `rcm-dlq-${props.stageName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Claims Processing Queue (FIFO for ordering)
    this.claimsQueue = new sqs.Queue(this, 'ClaimsQueue', {
      queueName: `rcm-claims-${props.stageName}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.minutes(15),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Webhook Delivery Queue (high throughput)
    this.webhookQueue = new sqs.Queue(this, 'WebhookQueue', {
      queueName: `rcm-webhooks-${props.stageName}`,
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 5,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Eligibility Check Queue
    this.eligibilityQueue = new sqs.Queue(this, 'EligibilityQueue', {
      queueName: `rcm-eligibility-${props.stageName}`,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Lambda for Claims Processing
    const claimsProcessor = new lambda.Function(this, 'ClaimsProcessor', {
      functionName: `rcm-claims-processor-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'claims-processor.handler',
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      code: lambda.Code.fromAsset('../packages/functions/workers'),
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        DOCUMENTS_BUCKET: props.documentsBucket.bucketName,
      },
      reservedConcurrentExecutions: props.stageName === 'prod' ? 10 : 2,
    });

    // Grant permissions
    props.database.grantDataApiAccess(claimsProcessor);
    props.documentsBucket.grantReadWrite(claimsProcessor);

    // Add SQS trigger (FIFO queues don't support maxBatchingWindow)
    claimsProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(this.claimsQueue, {
        batchSize: 5,
        reportBatchItemFailures: true,
      })
    );

    // Lambda for Webhook Delivery
    const webhookDelivery = new lambda.Function(this, 'WebhookDelivery', {
      functionName: `rcm-webhook-delivery-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'webhook-delivery.handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      code: lambda.Code.fromAsset('../packages/functions/workers'),
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
      },
      reservedConcurrentExecutions: props.stageName === 'prod' ? 50 : 10,
    });

    props.database.grantDataApiAccess(webhookDelivery);

    webhookDelivery.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookQueue, {
        batchSize: 10,
        maxConcurrency: 20,
        reportBatchItemFailures: true,
      })
    );

    // Lambda for Eligibility Checks
    const eligibilityChecker = new lambda.Function(this, 'EligibilityChecker', {
      functionName: `rcm-eligibility-checker-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'eligibility-checker.handler',
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      code: lambda.Code.fromAsset('../packages/functions/workers'),
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        PAYER_API_KEY: process.env.PAYER_API_KEY || '',
      },
      reservedConcurrentExecutions: props.stageName === 'prod' ? 20 : 5,
    });

    props.database.grantDataApiAccess(eligibilityChecker);

    eligibilityChecker.addEventSource(
      new lambdaEventSources.SqsEventSource(this.eligibilityQueue, {
        batchSize: 5,
        maxConcurrency: 10,
        reportBatchItemFailures: true,
      })
    );

    // DLQ Processor (sends alerts and logs failed messages)
    const dlqProcessor = new lambda.Function(this, 'DLQProcessor', {
      functionName: `rcm-dlq-processor-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dlq-processor.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        const cloudwatch = new AWS.CloudWatch();

        exports.handler = async (event) => {
          console.error('DLQ Messages:', JSON.stringify(event.Records, null, 2));

          // Send SNS alert
          await sns.publish({
            TopicArn: process.env.ALERT_TOPIC_ARN,
            Subject: 'RCM DLQ Alert',
            Message: \`Failed messages in DLQ: \${event.Records.length}\`,
          }).promise();

          // Publish custom metric
          await cloudwatch.putMetricData({
            Namespace: 'RCM/DLQ',
            MetricData: [{
              MetricName: 'FailedMessages',
              Value: event.Records.length,
              Unit: 'Count',
            }],
          }).promise();

          return { batchItemFailures: [] };
        };
      `),
      environment: {
        ALERT_TOPIC_ARN: process.env.ALERT_TOPIC_ARN || '',
      },
    });

    dlqProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(this.dlq, {
        batchSize: 10,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ClaimsQueueUrl', {
      value: this.claimsQueue.queueUrl,
      exportName: `RCM-ClaimsQueueUrl-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'WebhookQueueUrl', {
      value: this.webhookQueue.queueUrl,
      exportName: `RCM-WebhookQueueUrl-${props.stageName}`,
    });
  }
}
