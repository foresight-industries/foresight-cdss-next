import { EventBridgeEvent, Context } from 'aws-lambda';
import { HipaaWebhookEventRouter } from '@foresight-cdss-next/webhooks';
import { createAuthenticatedDatabaseClient } from '@foresight-cdss-next/web/src/lib/aws/database';
import {
  webhookConfigs,
  webhookDeliveries,
  webhookSecrets,
  webhookHipaaAuditLog,
  webhookDeliveryAttempts
} from '@foresight-cdss-next/db';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

/**
 * AWS Lambda function that processes webhook events from EventBridge
 * and determines which webhooks should receive deliveries based on HIPAA compliance
 */

interface WebhookEventDetail {
  organizationId: string;
  eventType: string;
  environment: 'staging' | 'production';
  entityId?: string;
  entityType?: string;
  data: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Initialize AWS clients
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

// Environment variables
const WEBHOOK_QUEUE_URL = process.env.WEBHOOK_QUEUE_URL!;
const HIPAA_ALERTS_TOPIC_ARN = process.env.HIPAA_ALERTS_TOPIC_ARN!;
const PHI_ENCRYPTION_KEY_ID = process.env.PHI_ENCRYPTION_KEY_ID!;
const AUDIT_LOG_GROUP_NAME = process.env.AUDIT_LOG_GROUP_NAME!;

/**
 * Database wrapper implementation for AWS RDS Data API
 */
class AwsDatabaseWrapper {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createAuthenticatedDatabaseClient() {
    return createAuthenticatedDatabaseClient();
  }

  async safeSelect(callback: () => any) {
    try {
      const result = await callback();
      return { data: result, error: null };
    } catch (error) {
      console.error('Database select error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async safeInsert(callback: () => any) {
    try {
      const result = await callback();
      return { data: result, error: null };
    } catch (error) {
      console.error('Database insert error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async safeUpdate(callback: () => any) {
    try {
      const result = await callback();
      return { data: result, error: null };
    } catch (error) {
      console.error('Database update error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async safeDelete(callback: () => any) {
    try {
      const result = await callback();
      return { data: result, error: null };
    } catch (error) {
      console.error('Database delete error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async safeSingle(callback: () => any) {
    try {
      const result = await callback();
      return { data: result?.[0] || null, error: null };
    } catch (error) {
      console.error('Database single select error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  get schemas() {
    return {
      webhookConfigs,
      webhookDeliveries,
      webhookSecrets,
      webhookHipaaAuditLog,
      webhookDeliveryAttempts,
    };
  }
}

/**
 * Send webhook delivery job to SQS queue
 */
async function queueWebhookDelivery(
  webhookConfigId: string,
  eventData: WebhookEventDetail,
  deliveryId: string
): Promise<void> {
  const messageBody = {
    webhookConfigId,
    eventData,
    deliveryId,
    timestamp: new Date().toISOString(),
  };

  const command = new SendMessageCommand({
    QueueUrl: WEBHOOK_QUEUE_URL,
    MessageBody: JSON.stringify(messageBody),
    MessageAttributes: {
      EventType: {
        DataType: 'String',
        StringValue: eventData.eventType,
      },
      OrganizationId: {
        DataType: 'String',
        StringValue: eventData.organizationId,
      },
      Environment: {
        DataType: 'String',
        StringValue: eventData.environment,
      },
    },
  });

  await sqsClient.send(command);
}

/**
 * Send CloudWatch metrics for monitoring
 */
async function putMetric(
  metricName: string,
  value: number,
  unit: StandardUnit = StandardUnit.Count,
  dimensions: Record<string, string> = {}
): Promise<void> {
  const command = new PutMetricDataCommand({
    Namespace: 'Foresight/Webhooks',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
        Timestamp: new Date(),
      },
    ],
  });

  await cloudWatchClient.send(command);
}

/**
 * Send HIPAA compliance alert
 */
async function sendComplianceAlert(
  subject: string,
  message: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'WARNING'
): Promise<void> {
  const alertMessage = {
    severity,
    subject,
    message,
    timestamp: new Date().toISOString(),
    service: 'webhook-processor',
    environment: process.env.NODE_ENV,
  };

  const command = new PublishCommand({
    TopicArn: HIPAA_ALERTS_TOPIC_ARN,
    Subject: `[${severity}] Webhook HIPAA Alert: ${subject}`,
    Message: JSON.stringify(alertMessage, null, 2),
  });

  await snsClient.send(command);
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: EventBridgeEvent<string, WebhookEventDetail>,
  context: Context
): Promise<LambdaResponse> => {
  const startTime = Date.now();

  try {
    console.log('Processing webhook event:', JSON.stringify(event, null, 2));

    // Extract event details
    const eventDetail = event.detail;
    const { organizationId, eventType, environment, data, userId } = eventDetail;

    // Validate required fields
    if (!organizationId || !eventType || !environment) {
      console.error('Missing required event fields:', { organizationId, eventType, environment });
      await putMetric('ProcessingErrors', 1, 'Count', {
        ErrorType: 'MissingFields',
        Environment: environment || 'unknown'
      });

      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required event fields' }),
      };
    }

    // Create database wrapper
    const { db } = await createAuthenticatedDatabaseClient();
    const databaseWrapper = new AwsDatabaseWrapper(db);

    // Initialize webhook event router
    const eventRouter = new HipaaWebhookEventRouter(organizationId, databaseWrapper);

    // Transform EventBridge event to webhook event data format
    const webhookEventData = {
      organizationId,
      environment: environment as 'staging' | 'production',
      eventType,
      data,
      userId,
      metadata: {
        source: event.source,
        eventBridgeId: event.id,
        lambdaRequestId: context.awsRequestId,
        ...eventDetail.metadata,
      },
    };

    console.log('Processing webhook event data:', {
      organizationId,
      eventType,
      environment,
      dataKeys: Object.keys(data || {}),
    });

    // Process the event and determine webhook deliveries
    const result = await eventRouter.routeEvent({
      eventType,
      environment,
      payload: webhookEventData,
      sourceUserId: userId,
    });

    console.log('Webhook processing result:', {
      success: result.success,
      routedWebhooks: result.routedWebhooks,
      results: result.results.length,
    });

    // Queue webhook deliveries
    let queuedDeliveries = 0;
    let failedQueues = 0;

    for (const webhookResult of result.results) {
      if (webhookResult.success) {
        try {
          const deliveryId = crypto.randomUUID();
          await queueWebhookDelivery(
            webhookResult.webhookId,
            eventDetail,
            deliveryId
          );
          queuedDeliveries++;

          console.log(`Queued delivery for webhook ${webhookResult.webhookName}:`, {
            webhookId: webhookResult.webhookId,
          });
        } catch (error) {
          console.error(`Failed to queue delivery for webhook ${webhookResult.webhookId}:`, error);
          failedQueues++;
        }
      } else if (!webhookResult.success) {
        console.warn(`Webhook ${webhookResult.webhookName} failed processing:`, {
          issues: webhookResult.issues,
          complianceStatus: webhookResult.complianceStatus,
        });

        // Send compliance alert for blocked webhooks
        if (webhookResult.complianceStatus === 'blocked') {
          await sendComplianceAlert(
            'Webhook Blocked Due to Compliance Issues',
            `Webhook "${webhookResult.webhookName}" was blocked due to HIPAA compliance issues: ${webhookResult.issues.join(', ')}`,
            'WARNING'
          );
        }
      }
    }

    // Send metrics to CloudWatch
    await putMetric('EventsProcessed', 1, 'Count', {
      EventType: eventType,
      Environment: environment,
      OrganizationId: organizationId,
    });

    await putMetric('WebhooksProcessed', result.routedWebhooks, 'Count', {
      Environment: environment,
      OrganizationId: organizationId,
    });

    await putMetric('DeliveriesQueued', queuedDeliveries, 'Count', {
      Environment: environment,
      OrganizationId: organizationId,
    });

    if (failedQueues > 0) {
      await putMetric('QueueFailures', failedQueues, 'Count', {
        Environment: environment,
        OrganizationId: organizationId,
      });
    }

    const complianceIssues = result.results.filter(r => r.complianceStatus === 'blocked').length;
    if (complianceIssues > 0) {
      await putMetric('ComplianceIssues', complianceIssues, 'Count', {
        Environment: environment,
        OrganizationId: organizationId,
      });
    }

    // Processing time metric
    const processingTime = Date.now() - startTime;
    await putMetric('ProcessingTime', processingTime, 'Milliseconds', {
      Environment: environment,
    });

    console.log(`Webhook processing completed in ${processingTime}ms:`, {
      routedWebhooks: result.routedWebhooks,
      queuedDeliveries,
      failedQueues,
      complianceIssues,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        routedWebhooks: result.routedWebhooks,
        queuedDeliveries,
        failedQueues,
        complianceIssues,
        processingTimeMs: processingTime,
      }),
    };

  } catch (error) {
    console.error('Webhook processor error:', error);

    // Send error metrics
    await putMetric('ProcessingErrors', 1, 'Count', {
      ErrorType: 'UnexpectedError',
      Environment: event.detail?.environment || 'unknown',
    });

    // Send critical alert for unexpected errors
    await sendComplianceAlert(
      'Webhook Processor Critical Error',
      `Unexpected error in webhook processor: ${error instanceof Error ? error.message : 'Unknown error'}. Event ID: ${event.id}`,
      'CRITICAL'
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
