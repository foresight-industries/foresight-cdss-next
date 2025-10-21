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
 * Convert EventBridge DetailType to webhook event_type format
 */
function convertEventTypeToWebhookFormat(eventType: string): string {
  // Map EventBridge DetailTypes to webhook event_type format
  const eventTypeMap: Record<string, string> = {
    // Organization events
    'Organization Created': 'organization.created',
    'Organization Updated': 'organization.updated',
    'Organization Deleted': 'organization.deleted',
    'Organization Settings Changed': 'organization.settings.changed',
    
    // User and team events
    'User Created': 'user.created',
    'User Updated': 'user.updated',
    'User Deleted': 'user.deleted',
    'User Role Changed': 'user.role.changed',
    'Team Member Added': 'team_member.added',
    'Team Member Updated': 'team_member.updated',
    'Team Member Removed': 'team_member.removed',
    
    // Patient events
    'Patient Created': 'patient.created',
    'Patient Updated': 'patient.updated',
    'Patient Deleted': 'patient.deleted',
    
    // Clinician events
    'Clinician Created': 'clinician.created',
    'Clinician Updated': 'clinician.updated',
    'Clinician Deleted': 'clinician.deleted',
    'Clinician License Added': 'clinician.license.added',
    'Clinician License Updated': 'clinician.license.updated',
    'Clinician License Expired': 'clinician.license.expired',
    'Clinician Credentials Verified': 'clinician.credentials.verified',
    'Clinician Status Changed': 'clinician.status.changed',
    'Clinician Specialty Updated': 'clinician.specialty.updated',
    'Clinician NPI Updated': 'clinician.npi.updated',
    
    // Claims events
    'Claim Created': 'claim.created',
    'Claim Updated': 'claim.updated',
    'Claim Submitted': 'claim.submitted',
    'Claim Approved': 'claim.approved',
    'Claim Denied': 'claim.denied',
    'Claim Processing Started': 'claim.processing.started',
    'Claim Processing Completed': 'claim.processing.completed',
    
    // Prior authorization events
    'Prior Auth Created': 'prior_auth.created',
    'Prior Auth Updated': 'prior_auth.updated',
    'Prior Auth Submitted': 'prior_auth.submitted',
    'Prior Auth Approved': 'prior_auth.approved',
    'Prior Auth Denied': 'prior_auth.denied',
    'Prior Auth Pending': 'prior_auth.pending',
    'Prior Auth Expired': 'prior_auth.expired',
    'Prior Auth Cancelled': 'prior_auth.cancelled',
    
    // Document events
    'Document Uploaded': 'document.uploaded',
    'Document Processed': 'document.processed',
    'Document Analysis Completed': 'document.analysis.completed',
    'Document Deleted': 'document.deleted',
    
    // Encounter events
    'Encounter Created': 'encounter.created',
    'Encounter Updated': 'encounter.updated',
    'Encounter Deleted': 'encounter.deleted',
    'Encounter Status Changed': 'encounter.status.changed',
    'Encounter Diagnosis Added': 'encounter.diagnosis.added',
    'Encounter Diagnosis Updated': 'encounter.diagnosis.updated',
    'Encounter Procedure Added': 'encounter.procedure.added',
    'Encounter Procedure Updated': 'encounter.procedure.updated',
    'Encounter Finalized': 'encounter.finalized',
    'Encounter Billed': 'encounter.billed',
    
    // Webhook test events
    'Webhook Test Event': 'webhook.test',
  };
  
  return eventTypeMap[eventType] || eventType.toLowerCase().replace(/\s+/g, '.');
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

    // Transform EventBridge format to webhook payload format
    const webhookPayload = {
      event_type: convertEventTypeToWebhookFormat(eventData.eventType),
      organization_id: eventData.organizationId,
      timestamp: Math.floor(Date.now() / 1000), // Use current timestamp since eventData doesn't have timestamp
      source: eventData.metadata?.source || 'foresight_cdss',
      data: eventData.data,
      metadata: {
        ...eventData.metadata,
        environment: eventData.environment,
        user_id: eventData.userId,
      },
    };

    // Perform the webhook delivery with HIPAA compliance
    const result = await processor.processWebhookDelivery(
      webhookConfigId,
      webhookPayload
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