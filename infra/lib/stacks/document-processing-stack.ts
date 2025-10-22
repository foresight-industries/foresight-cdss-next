import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DocumentProcessingStackProps extends cdk.StackProps {
  stageName: string;
  documentsBucketName: string;
  database: rds.DatabaseCluster;
}

export class DocumentProcessingStack extends cdk.Stack {
  public readonly textractRole: iam.Role;
  public readonly processingTopic: sns.Topic;
  public readonly processingQueue: sqs.Queue;
  public readonly documentProcessorFunction: lambda.Function;
  public readonly textractCompletionFunction: lambda.Function;
  public readonly insuranceCardProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: DocumentProcessingStackProps) {
    super(scope, id, props);

    // SNS Topic for Textract notifications (must be prefixed with AmazonTextract)
    this.processingTopic = new sns.Topic(this, 'TextractTopic', {
      topicName: `AmazonTextract-DocumentProcessing-${props.stageName}`,
      displayName: `Document Processing Notifications - ${props.stageName}`,
    });

    // Dead Letter Queue for failed processing
    const dlq = new sqs.Queue(this, 'ProcessingDLQ', {
      queueName: `rcm-document-processing-dlq-${props.stageName}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue for processing notifications
    this.processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `rcm-document-processing-${props.stageName}`,
      visibilityTimeout: cdk.Duration.minutes(15), // Should be >= Lambda timeout
      receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Subscribe queue to topic
    this.processingTopic.addSubscription(
      new cdk.aws_sns_subscriptions.SqsSubscription(this.processingQueue)
    );

    // IAM Role for Textract to access SNS with confused deputy prevention
    this.textractRole = new iam.Role(this, 'TextractServiceRole', {
      roleName: `rcm-textract-role-${props.stageName}`,
      assumedBy: new iam.ServicePrincipal('textract.amazonaws.com', {
        conditions: {
          ArnLike: {
            'aws:SourceArn': `arn:aws:textract:*:${this.account}:*`,
          },
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
        },
      }),
      // Note: AmazonTextractServiceRole doesn't exist, using basic service permissions
      inlinePolicies: {
        TextractSNSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [this.processingTopic.topicArn],
            }),
          ],
        }),
      },
    });

    // Function props for both Lambda functions
    const functionProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        NODE_ENV: props.stageName,
        DATABASE_SECRET_ARN: props.database.secret?.secretArn ?? '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        DOCUMENTS_BUCKET: props.documentsBucketName,
        TEXTRACT_ROLE_ARN: this.textractRole.roleArn,
        TEXTRACT_SNS_TOPIC_ARN: this.processingTopic.topicArn,
      },
      tracing: lambda.Tracing.ACTIVE,
    };

    // Document upload processor (triggered by S3 upload)
    const documentProcessorRole = new iam.Role(this, 'DocumentProcessorRole', {
      roleName: `rcm-document-processor-role-${props.stageName}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.documentProcessorFunction = new lambdaNodejs.NodejsFunction(this, 'DocumentProcessor', {
      ...functionProps,
      functionName: `rcm-document-processor-${props.stageName}`,
      entry: '../packages/functions/document-processor/index.ts',
      handler: 'handler',
      role: documentProcessorRole,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
    });

    // Textract completion processor (triggered by SQS messages)
    const textractCompletionRole = new iam.Role(this, 'TextractCompletionRole', {
      roleName: `rcm-textract-completion-role-${props.stageName}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.textractCompletionFunction = new lambdaNodejs.NodejsFunction(this, 'TextractCompletion', {
      ...functionProps,
      functionName: `rcm-textract-completion-${props.stageName}`,
      entry: '../packages/functions/document-processor/completion.ts',
      handler: 'handler',
      role: textractCompletionRole,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
    });

    // Insurance card processor (triggered by S3 upload)
    const insuranceCardProcessorRole = new iam.Role(this, 'InsuranceCardProcessorRole', {
      roleName: `rcm-insurance-card-processor-role-${props.stageName}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.insuranceCardProcessorFunction = new lambdaNodejs.NodejsFunction(this, 'InsuranceCardProcessor', {
      ...functionProps,
      functionName: `rcm-insurance-card-processor-${props.stageName}`,
      entry: '../packages/functions/insurance-card-processor/index.ts',
      handler: 'handler',
      role: insuranceCardProcessorRole,
      timeout: cdk.Duration.minutes(5), // Shorter timeout for synchronous processing
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // Keep aws-sdk v2 in bundle for compatibility
      },
    });

    // Grant permissions to document processor
    documentProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'textract:StartDocumentAnalysis',
        'textract:StartDocumentTextDetection',
        'textract:GetDocumentAnalysis',
        'textract:GetDocumentTextDetection',
      ],
      resources: ['*'],
    }));

    documentProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rekognition:DetectText',
        'rekognition:DetectModerationLabels',
        'rekognition:DetectFaces',
        'rekognition:DetectDocumentText',
      ],
      resources: ['*'],
    }));

    documentProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [this.textractRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'textract.amazonaws.com',
        },
      },
    }));

    documentProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::${props.documentsBucketName}/*`],
    }));

    // Grant permissions to textract completion processor
    textractCompletionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'textract:GetDocumentAnalysis',
        'textract:GetDocumentTextDetection',
      ],
      resources: ['*'],
    }));

    textractCompletionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::${props.documentsBucketName}/*`],
    }));

    // Grant permissions to insurance card processor
    insuranceCardProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['textract:AnalyzeDocument'],
      resources: ['*'],
    }));

    insuranceCardProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rekognition:DetectText',
        'rekognition:DetectModerationLabels',
        'rekognition:DetectFaces',
        'rekognition:DetectDocumentText',
      ],
      resources: ['*'],
    }));

    insuranceCardProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`arn:aws:s3:::${props.documentsBucketName}/*`],
    }));

    // Grant database access to all functions
    [documentProcessorRole, textractCompletionRole, insuranceCardProcessorRole].forEach(role => {
      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:ExecuteStatement',
          'rds-data:RollbackTransaction',
        ],
        resources: [props.database.clusterArn],
      }));

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.database.secret?.secretArn ?? ''],
      }));

      // Grant CloudWatch metrics permissions for monitoring
      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'RCM/DocumentProcessing',
          },
        },
      }));
    });

    // Grant SQS access to completion function
    this.processingQueue.grantConsumeMessages(textractCompletionRole);

    // Add SQS event source to completion function
    this.textractCompletionFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(this.processingQueue, {
        batchSize: 1,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    // NOTE: S3 event notifications are configured in the main infra file
    // to avoid cyclic dependencies between storage and document processing stacks

    // CloudWatch alarms for monitoring
    const processingFailures = new cdk.aws_cloudwatch.Alarm(this, 'ProcessingFailures', {
      metric: this.documentProcessorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Document processing failures',
    });

    const queueDepth = new cdk.aws_cloudwatch.Alarm(this, 'QueueDepth', {
      metric: this.processingQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 50,
      evaluationPeriods: 2,
      alarmDescription: 'High number of pending documents',
    });

    const dlqMessages = new cdk.aws_cloudwatch.Alarm(this, 'DLQMessages', {
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Messages in document processing DLQ',
    });

    // Insurance card processing alarms
    const insuranceCardFailures = new cdk.aws_cloudwatch.Alarm(this, 'InsuranceCardFailures', {
      metric: this.insuranceCardProcessorFunction.metricErrors(),
      threshold: 3,
      evaluationPeriods: 2,
      alarmDescription: 'Insurance card processing failures',
    });

    // Custom metric for validation failures (logged by Lambda functions)
    const validationFailuresMetric = new cdk.aws_cloudwatch.Metric({
      metricName: 'ValidationFailures',
      namespace: 'RCM/DocumentProcessing',
      statistic: cdk.aws_cloudwatch.Statistic.SUM,
      period: cdk.Duration.minutes(5),
    });

    const validationFailures = new cdk.aws_cloudwatch.Alarm(this, 'ValidationFailures', {
      metric: validationFailuresMetric,
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'High number of document validation failures - possible fraud attempt or quality issues',
    });

    // Custom metric for low confidence extractions
    const lowConfidenceMetric = new cdk.aws_cloudwatch.Metric({
      metricName: 'LowConfidenceExtractions', 
      namespace: 'RCM/DocumentProcessing',
      statistic: cdk.aws_cloudwatch.Statistic.SUM,
      period: cdk.Duration.minutes(5),
    });

    const lowConfidenceAlarm = new cdk.aws_cloudwatch.Alarm(this, 'LowConfidenceExtractions', {
      metric: lowConfidenceMetric,
      threshold: 5,
      evaluationPeriods: 3,
      alarmDescription: 'High number of low confidence document extractions - may indicate quality issues',
    });

    // Outputs
    new cdk.CfnOutput(this, 'TextractRoleArn', {
      value: this.textractRole.roleArn,
      description: 'ARN of the Textract service role',
      exportName: `${this.stackName}-textract-role-arn`,
    });

    new cdk.CfnOutput(this, 'ProcessingTopicArn', {
      value: this.processingTopic.topicArn,
      description: 'ARN of the document processing SNS topic',
      exportName: `${this.stackName}-processing-topic-arn`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: this.processingQueue.queueUrl,
      description: 'URL of the document processing SQS queue',
      exportName: `${this.stackName}-processing-queue-url`,
    });
  }
}
