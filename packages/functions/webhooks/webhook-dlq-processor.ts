import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { createAuthenticatedDatabaseClient } from '@foresight-cdss-next/web/src/lib/aws/database';
import {
  webhookConfigs,
  webhookDeliveries,
  webhookSecrets,
  webhookHipaaAuditLog,
  webhookDeliveryAttempts
} from '@foresight-cdss-next/db';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { eq, and, gte, count } from 'drizzle-orm';

interface WebhookDeliveryMessage {
  webhookConfigId: string;
  eventData: {
    organizationId: string;
    eventType: string;
    environment: 'staging' | 'production';
    data: Record<string, any>;
    userId?: string;
    metadata?: Record<string, any>;
  };
  deliveryId: string;
  timestamp: string;
  attemptNumber?: number;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

const HIPAA_ALERTS_TOPIC_ARN = process.env.HIPAA_ALERTS_TOPIC_ARN!;
const MAX_RETRY_ATTEMPTS = Number.parseInt(process.env.MAX_RETRY_ATTEMPTS ?? '3');
const DLQ_ALERT_THRESHOLD = Number.parseInt(process.env.DLQ_ALERT_THRESHOLD ?? '5');

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

async function sendAlert(
  subject: string,
  message: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'WARNING'
): Promise<void> {
  const alertMessage = {
    severity,
    subject,
    message,
    timestamp: new Date().toISOString(),
    service: 'webhook-dlq-processor',
    environment: process.env.NODE_ENV,
  };

  const command = new PublishCommand({
    TopicArn: HIPAA_ALERTS_TOPIC_ARN,
    Subject: `[${severity}] Webhook DLQ Alert: ${subject}`,
    Message: JSON.stringify(alertMessage, null, 2),
  });

  await snsClient.send(command);
}

async function putMetric(
  metricName: string,
  value: number,
  unit: StandardUnit = StandardUnit.Count,
  dimensions: Record<string, string> = {}
): Promise<void> {
  const command = new PutMetricDataCommand({
    Namespace: 'Foresight/Webhooks/DLQ',
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

async function markDeliveryAsFailed(
  databaseWrapper: AwsDatabaseWrapper,
  deliveryId: string,
  failureReason: string
): Promise<void> {
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();
  
  const { error } = await databaseWrapper.safeUpdate(() =>
    db
      .update(webhookDeliveries)
      .set({
        status: 'failed',
        failureReason,
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, deliveryId))
  );

  if (error) {
    console.error(`Failed to mark delivery ${deliveryId} as failed:`, error);
  }
}

async function getWebhookConfig(
  databaseWrapper: AwsDatabaseWrapper,
  webhookConfigId: string
): Promise<any> {
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();
  
  const { data } = await databaseWrapper.safeSingle(() =>
    db
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.id, webhookConfigId))
  );

  return data;
}

async function logHipaaAuditEvent(
  databaseWrapper: AwsDatabaseWrapper,
  organizationId: string,
  eventType: string,
  details: string,
  userId?: string
): Promise<void> {
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();
  
  await databaseWrapper.safeInsert(() =>
    db.insert(webhookHipaaAuditLog).values({
      id: crypto.randomUUID(),
      organizationId,
      eventType,
      userId,
      ipAddress: null,
      userAgent: 'webhook-dlq-processor',
      details,
      timestamp: new Date(),
      environment: process.env.NODE_ENV ?? 'production',
    })
  );
}

async function getRecentDlqCount(
  databaseWrapper: AwsDatabaseWrapper,
  organizationId: string,
  timeWindow = 3600000
): Promise<number> {
  const sinceTime = new Date(Date.now() - timeWindow);
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();

  const { data } = await databaseWrapper.safeSelect(() =>
    db
      .select({ count: count() })
      .from(webhookDeliveries)
      .innerJoin(webhookConfigs, eq(webhookDeliveries.webhookConfigId, webhookConfigs.id))
      .where(
        and(
          eq(webhookConfigs.organizationId, organizationId),
          eq(webhookDeliveries.status, 'failed'),
          gte(webhookDeliveries.updatedAt, sinceTime)
        )
      )
  );

  return data?.[0]?.count ?? 0;
}

async function processDlqMessage(
  message: WebhookDeliveryMessage,
  databaseWrapper: AwsDatabaseWrapper
): Promise<{ success: boolean; error?: string }> {
  const { webhookConfigId, eventData, deliveryId } = message;

  try {
    console.log(`Processing DLQ message:`, {
      webhookConfigId,
      deliveryId,
      eventType: eventData.eventType,
      organizationId: eventData.organizationId,
    });

    const webhookConfig = await getWebhookConfig(databaseWrapper, webhookConfigId);

    if (!webhookConfig) {
      console.error(`Webhook config not found: ${webhookConfigId}`);
      return { success: false, error: 'Webhook config not found' };
    }

    const failureReason = `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded. Message sent to DLQ.`;

    await markDeliveryAsFailed(databaseWrapper, deliveryId, failureReason);

    await logHipaaAuditEvent(
      databaseWrapper,
      eventData.organizationId,
      'webhook_delivery_failed',
      `Webhook delivery failed after maximum retries. Webhook: ${webhookConfig.name}, Event: ${eventData.eventType}, Delivery ID: ${deliveryId}`,
      eventData.userId
    );

    const recentFailures = await getRecentDlqCount(databaseWrapper, eventData.organizationId);

    if (recentFailures >= DLQ_ALERT_THRESHOLD) {
      await sendAlert(
        'High Webhook Failure Rate Detected',
        `Organization ${eventData.organizationId} has ${recentFailures} failed webhook deliveries in the last hour. This may indicate a systemic issue requiring investigation.`,
        'CRITICAL'
      );

      await putMetric('HighFailureRateAlert', 1, StandardUnit.Count, {
        OrganizationId: eventData.organizationId,
        Environment: eventData.environment,
      });
    }

    await sendAlert(
      'Webhook Delivery Failed After Max Retries',
      `Webhook "${webhookConfig.name}" failed delivery after ${MAX_RETRY_ATTEMPTS} attempts.\n\nDetails:\n- Organization: ${eventData.organizationId}\n- Event Type: ${eventData.eventType}\n- Delivery ID: ${deliveryId}\n- Webhook URL: ${webhookConfig.url}\n- Environment: ${eventData.environment}\n\nThis webhook endpoint may be down or misconfigured.`,
      'WARNING'
    );

    await putMetric('DlqMessagesProcessed', 1, StandardUnit.Count, {
      OrganizationId: eventData.organizationId,
      Environment: eventData.environment,
      EventType: eventData.eventType,
    });

    console.log(`Successfully processed DLQ message for delivery ${deliveryId}`);
    return { success: true };

  } catch (error) {
    console.error(`Error processing DLQ message ${deliveryId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function parseMessage(record: SQSRecord): WebhookDeliveryMessage | null {
  try {
    const message = JSON.parse(record.body) as WebhookDeliveryMessage;

    if (!message.webhookConfigId || !message.eventData || !message.deliveryId) {
      console.error('Invalid DLQ message format:', {
        hasWebhookConfigId: !!message.webhookConfigId,
        hasEventData: !!message.eventData,
        hasDeliveryId: !!message.deliveryId,
      });
      return null;
    }

    return message;
  } catch (error) {
    console.error('Failed to parse DLQ SQS message:', error);
    return null;
  }
}

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<LambdaResponse> => {
  const startTime = Date.now();
  let processedMessages = 0;
  let failedMessages = 0;

  try {
    console.log(`Processing ${event.Records.length} DLQ messages`);

    const { db } = await createAuthenticatedDatabaseClient();
    const databaseWrapper = new AwsDatabaseWrapper(db);

    for (const record of event.Records) {
      try {
        const message = parseMessage(record);

        if (!message) {
          console.error(`Invalid DLQ message format for messageId: ${record.messageId}`);
          failedMessages++;
          continue;
        }

        const result = await processDlqMessage(message, databaseWrapper);

        if (result.success) {
          processedMessages++;
          console.log(`Successfully processed DLQ message: ${record.messageId}`);
        } else {
          failedMessages++;
          console.error(`Failed to process DLQ message: ${record.messageId}:`, result.error);
        }

      } catch (error) {
        console.error(`Error processing DLQ message ${record.messageId}:`, error);
        failedMessages++;
      }
    }

    const processingTime = Date.now() - startTime;

    await putMetric('ProcessingTime', processingTime, StandardUnit.Milliseconds);
    await putMetric('TotalMessages', event.Records.length, StandardUnit.Count);
    await putMetric('ProcessedMessages', processedMessages, StandardUnit.Count);

    if (failedMessages > 0) {
      await putMetric('FailedMessages', failedMessages, StandardUnit.Count);
    }

    console.log(`DLQ processing completed in ${processingTime}ms:`, {
      totalMessages: event.Records.length,
      processedMessages,
      failedMessages,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        totalMessages: event.Records.length,
        processedMessages,
        failedMessages,
        processingTimeMs: processingTime,
      }),
    };

  } catch (error) {
    console.error('Critical error in DLQ processor:', error);

    await sendAlert(
      'DLQ Processor Critical Error',
      `Critical error in webhook DLQ processor: ${error instanceof Error ? error.message : 'Unknown error'}. Request ID: ${context.awsRequestId}`,
      'CRITICAL'
    );

    await putMetric('CriticalErrors', 1, StandardUnit.Count);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
