import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface QueueStackProps extends cdk.StackProps {
  stageName: string;
  database: any;
  documentsBucket: any;
  alertTopicArn: string;
}

export class QueueStack extends cdk.Stack {
  public readonly claimsQueue: sqs.Queue;
  public readonly webhookQueue: sqs.Queue;
  public readonly eligibilityQueue: sqs.Queue;
  public readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: QueueStackProps) {
    super(scope, id, props);

    // Standard DLQ for non-FIFO queues
    this.dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `rcm-dlq-${props.stageName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // FIFO DLQ for FIFO queues
    const fifoDlq = new sqs.Queue(this, 'FifoDeadLetterQueue', {
      queueName: `rcm-dlq-fifo-${props.stageName}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
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
        queue: fifoDlq,
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

    // Lambda for Claims Processing - Using NodejsFunction for better bundling
    const claimsProcessor = new lambdaNodejs.NodejsFunction(this, 'ClaimsProcessor', {
      functionName: `rcm-claims-processor-${props.stageName}`,
      entry: '../packages/functions/workers/claims-processor.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        DOCUMENTS_BUCKET: props.documentsBucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
      // ...(props.stageName === 'prod' ? { reservedConcurrentExecutions: 10 } : {}),
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

    // Lambda for Webhook Delivery - Using NodejsFunction for better bundling
    const webhookDelivery = new lambdaNodejs.NodejsFunction(this, 'WebhookDelivery', {
      functionName: `rcm-webhook-delivery-${props.stageName}`,
      entry: '../packages/functions/workers/webhook-delivery.ts',
      handler: 'handler',
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
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
      // ...(props.stageName === 'prod' ? { reservedConcurrentExecutions: 50 } : {}),
    });

    props.database.grantDataApiAccess(webhookDelivery);

    webhookDelivery.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookQueue, {
        batchSize: 10,
        // maxConcurrency: 20,
        reportBatchItemFailures: true,
      })
    );

    // Lambda for Eligibility Checks - Using NodejsFunction for better bundling
    const eligibilityChecker = new lambdaNodejs.NodejsFunction(this, 'EligibilityChecker', {
      functionName: `rcm-eligibility-checker-${props.stageName}`,
      entry: '../packages/functions/workers/eligibility-checker.ts',
      handler: 'handler',
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        PAYER_API_KEY: process.env.PAYER_API_KEY || '',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
      // ...(props.stageName === 'prod' ? { reservedConcurrentExecutions: 20 } : {}),
    });

    props.database.grantDataApiAccess(eligibilityChecker);

    eligibilityChecker.addEventSource(
      new lambdaEventSources.SqsEventSource(this.eligibilityQueue, {
        batchSize: 5,
        // maxConcurrency: 10,
        reportBatchItemFailures: true,
      })
    );

    // DLQ Processor (sends alerts and logs failed messages)
    const dlqProcessor = new lambdaNodejs.NodejsFunction(this, 'DLQProcessor', {
      functionName: `rcm-dlq-processor-${props.stageName}`,
      entry: '../packages/functions/workers/dlq-processor.ts',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: props.stageName,
        ALERT_TOPIC_ARN: props.alertTopicArn,
      },
      bundling: {
        externalModules: ['@aws-sdk/client-sns', '@aws-sdk/client-cloudwatch'],
      },
    });

    // Grant SNS and CloudWatch permissions to DLQ processor
    dlqProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sns:Publish',
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
      })
    );

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
