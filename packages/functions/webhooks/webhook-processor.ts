import { EventBridgeEvent, Handler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand } from '@aws-sdk/client-rds-data';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

interface WebhookEventDetail {
  organizationId: string;
  environment: 'staging' | 'production';
  eventType: string;
  data: Record<string, any>;
  timestamp: string;
  userId?: string;
}

interface WebhookConfig {
  id: string;
  organizationId: string;
  environment: 'staging' | 'production';
  url: string;
  isActive: boolean;
  secretId: string;
}

interface WebhookEventSubscription {
  webhookConfigId: string;
  eventType: string;
  isActive: boolean;
}

const sqsClient = new SQSClient({});
const rdsClient = new RDSDataClient({});
const secretsClient = new SecretsManagerClient({});

const DB_SECRET_ARN = process.env.DATABASE_SECRET_ARN!;
const DB_CLUSTER_ARN = process.env.DATABASE_CLUSTER_ARN!;
const DB_NAME = process.env.DATABASE_NAME!;
const WEBHOOK_QUEUE_URL = process.env.WEBHOOK_QUEUE_URL!;

/**
 * Webhook Processor Lambda
 * 
 * Receives events from EventBridge and:
 * 1. Queries database for active webhook configurations
 * 2. Filters by event subscriptions
 * 3. Queues webhook deliveries for processing
 */
export const handler: Handler<EventBridgeEvent<string, WebhookEventDetail>> = async (event) => {
  console.log('Processing webhook event:', JSON.stringify(event, null, 2));

  try {
    const { detail } = event;
    const { organizationId, environment, eventType } = detail;

    // Get active webhook configurations for the organization and environment
    const webhookConfigs = await getActiveWebhookConfigs(organizationId, environment);
    
    if (webhookConfigs.length === 0) {
      console.log(`No active webhook configurations found for org ${organizationId} in ${environment}`);
      return { processedWebhooks: 0 };
    }

    // Get event subscriptions for these webhook configs
    const subscribedConfigs = await getSubscribedWebhookConfigs(webhookConfigs, eventType);
    
    if (subscribedConfigs.length === 0) {
      console.log(`No webhook configurations subscribed to event type ${eventType}`);
      return { processedWebhooks: 0 };
    }

    // Queue webhook deliveries
    const deliveryPromises = subscribedConfigs.map(config => 
      queueWebhookDelivery(config, detail)
    );

    await Promise.all(deliveryPromises);

    console.log(`Queued ${subscribedConfigs.length} webhook deliveries for event ${eventType}`);
    
    return {
      processedWebhooks: subscribedConfigs.length,
      eventType,
      organizationId,
      environment,
    };

  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
};

async function getActiveWebhookConfigs(
  organizationId: string, 
  environment: 'staging' | 'production'
): Promise<WebhookConfig[]> {
  const sql = `
    SELECT 
      id,
      organization_id,
      environment,
      url,
      is_active,
      secret_id
    FROM webhook_configs
    WHERE organization_id = :organizationId
      AND environment = :environment
      AND is_active = true
      AND deleted_at IS NULL
  `;

  try {
    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters: [
        { name: 'organizationId', value: { stringValue: organizationId } },
        { name: 'environment', value: { stringValue: environment } },
      ],
    }));

    return (result.records || []).map(record => ({
      id: record[0]?.stringValue || '',
      organizationId: record[1]?.stringValue || '',
      environment: record[2]?.stringValue as 'staging' | 'production',
      url: record[3]?.stringValue || '',
      isActive: record[4]?.booleanValue || false,
      secretId: record[5]?.stringValue || '',
    }));
  } catch (error) {
    console.error('Error fetching webhook configs:', error);
    throw error;
  }
}

async function getSubscribedWebhookConfigs(
  webhookConfigs: WebhookConfig[],
  eventType: string
): Promise<WebhookConfig[]> {
  if (webhookConfigs.length === 0) return [];

  const configIds = webhookConfigs.map(config => config.id);
  const placeholders = configIds.map((_, index) => `:configId${index}`).join(',');
  
  const sql = `
    SELECT DISTINCT webhook_config_id
    FROM webhook_event_subscriptions
    WHERE webhook_config_id IN (${placeholders})
      AND event_type = :eventType
      AND is_active = true
  `;

  const parameters = [
    { name: 'eventType', value: { stringValue: eventType } },
    ...configIds.map((id, index) => ({
      name: `configId${index}`,
      value: { stringValue: id },
    })),
  ];

  try {
    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters,
    }));

    const subscribedConfigIds = new Set(
      (result.records || []).map(record => record[0]?.stringValue || '')
    );

    return webhookConfigs.filter(config => subscribedConfigIds.has(config.id));
  } catch (error) {
    console.error('Error fetching event subscriptions:', error);
    throw error;
  }
}

async function queueWebhookDelivery(
  webhookConfig: WebhookConfig,
  eventDetail: WebhookEventDetail
): Promise<void> {
  const deliveryPayload = {
    webhookConfigId: webhookConfig.id,
    organizationId: webhookConfig.organizationId,
    environment: webhookConfig.environment,
    url: webhookConfig.url,
    secretId: webhookConfig.secretId,
    eventType: eventDetail.eventType,
    eventData: eventDetail.data,
    timestamp: eventDetail.timestamp,
    userId: eventDetail.userId,
    attempt: 1,
    maxAttempts: 5,
  };

  try {
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: WEBHOOK_QUEUE_URL,
      MessageBody: JSON.stringify(deliveryPayload),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventDetail.eventType,
        },
        organizationId: {
          DataType: 'String',
          StringValue: webhookConfig.organizationId,
        },
        environment: {
          DataType: 'String',
          StringValue: webhookConfig.environment,
        },
      },
    }));

    console.log(`Queued webhook delivery for config ${webhookConfig.id}`);
  } catch (error) {
    console.error(`Error queueing webhook delivery for config ${webhookConfig.id}:`, error);
    throw error;
  }
}