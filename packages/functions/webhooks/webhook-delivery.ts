import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { HipaaWebhookProcessor } from '@foresight-cdss-next/webhooks';
import { createAuthenticatedDatabaseClient } from '@foresight-cdss-next/web/src/lib/aws/database';
import { 
  webhookConfigs, 
  webhookDeliveries, 
  webhookSecrets, 
  webhookHipaaAuditLog,
  webhookDeliveryAttempts 
} from '@foresight-cdss-next/db';

/**
 * AWS Lambda function that processes webhook delivery messages from SQS
 * and performs the actual HTTP delivery with HIPAA compliance checks
 */

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
  batchItemFailures: Array<{ itemIdentifier: string }>;
}

// Environment variables
const PHI_ENCRYPTION_KEY_ID = process.env.PHI_ENCRYPTION_KEY_ID!;
const HIPAA_ALERTS_TOPIC_ARN = process.env.HIPAA_ALERTS_TOPIC_ARN!;
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
 * Process a single webhook delivery message
 */
async function processWebhookDelivery(
  message: WebhookDeliveryMessage,
  databaseWrapper: AwsDatabaseWrapper
): Promise<{ success: boolean; error?: string }> {
  const { webhookConfigId, eventData, deliveryId } = message;
  
  try {
    console.log(`Processing webhook delivery:`, {
      webhookConfigId,
      deliveryId,
      eventType: eventData.eventType,
      organizationId: eventData.organizationId,
    });

    // Initialize HIPAA webhook processor
    const processor = new HipaaWebhookProcessor(
      eventData.organizationId,
      databaseWrapper,
      eventData.userId
    );

    // Perform the webhook delivery with HIPAA compliance
    const result = await processor.processWebhookDelivery(
      webhookConfigId,
      eventData
    );

    if (result.success) {
      console.log(`Webhook delivery successful:`, {
        webhookConfigId,
        deliveryId,
        complianceStatus: result.complianceStatus,
      });
      return { success: true };
    } else {
      console.error(`Webhook delivery failed:`, {
        webhookConfigId,
        deliveryId,
        issues: result.issues,
      });
      return { 
        success: false, 
        error: `Delivery failed: ${result.issues.join(', ')}` 
      };
    }

  } catch (error) {
    console.error(`Error processing webhook delivery ${deliveryId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Parse SQS message body
 */
function parseMessage(record: SQSRecord): WebhookDeliveryMessage | null {
  try {
    const message = JSON.parse(record.body) as WebhookDeliveryMessage;
    
    // Validate required fields
    if (!message.webhookConfigId || !message.eventData || !message.deliveryId) {
      console.error('Invalid message format:', { 
        hasWebhookConfigId: !!message.webhookConfigId,
        hasEventData: !!message.eventData,
        hasDeliveryId: !!message.deliveryId,
      });
      return null;
    }

    return message;
  } catch (error) {
    console.error('Failed to parse SQS message:', error);
    return null;
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<LambdaResponse> => {
  const startTime = Date.now();
  const batchItemFailures: Array<{ itemIdentifier: string }> = [];
  
  try {
    console.log(`Processing ${event.Records.length} webhook delivery messages`);

    // Create database wrapper
    const { db } = await createAuthenticatedDatabaseClient();
    const databaseWrapper = new AwsDatabaseWrapper(db);

    // Process each message
    for (const record of event.Records) {
      try {
        const message = parseMessage(record);
        
        if (!message) {
          console.error(`Invalid message format for messageId: ${record.messageId}`);
          batchItemFailures.push({ itemIdentifier: record.messageId });
          continue;
        }

        // Process the webhook delivery
        const result = await processWebhookDelivery(message, databaseWrapper);
        
        if (!result.success) {
          console.error(`Failed to process delivery for messageId: ${record.messageId}:`, result.error);
          batchItemFailures.push({ itemIdentifier: record.messageId });
        } else {
          console.log(`Successfully processed delivery for messageId: ${record.messageId}`);
        }

      } catch (error) {
        console.error(`Error processing message ${record.messageId}:`, error);
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    const processingTime = Date.now() - startTime;
    const successfulDeliveries = event.Records.length - batchItemFailures.length;

    console.log(`Webhook delivery processing completed:`, {
      totalMessages: event.Records.length,
      successfulDeliveries,
      failedDeliveries: batchItemFailures.length,
      processingTimeMs: processingTime,
    });

    return { batchItemFailures };

  } catch (error) {
    console.error('Critical error in webhook delivery processor:', error);
    
    // If there's a critical error, mark all messages as failed
    // so they can be retried or sent to DLQ
    return {
      batchItemFailures: event.Records.map(record => ({
        itemIdentifier: record.messageId
      }))
    };
  }
};