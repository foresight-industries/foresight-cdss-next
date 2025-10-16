import { SQSEvent, SQSRecord, Handler } from 'aws-lambda';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand } from '@aws-sdk/client-rds-data';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { createHmac } from 'crypto';

interface WebhookDeliveryPayload {
  webhookConfigId: string;
  organizationId: string;
  environment: 'staging' | 'production';
  url: string;
  secretId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
  userId?: string;
  attempt: number;
  maxAttempts: number;
}

interface WebhookSecret {
  key: string;
  algorithm: string;
}

const rdsClient = new RDSDataClient({});
const secretsClient = new SecretsManagerClient({});

const DB_SECRET_ARN = process.env.DATABASE_SECRET_ARN!;
const DB_CLUSTER_ARN = process.env.DATABASE_CLUSTER_ARN!;
const DB_NAME = process.env.DATABASE_NAME!;

/**
 * Webhook Delivery Lambda
 * 
 * Processes queued webhook deliveries:
 * 1. Retrieves webhook signing secret
 * 2. Constructs and signs webhook payload
 * 3. Attempts HTTP delivery with retries
 * 4. Records delivery attempt in database
 */
export const handler: Handler<SQSEvent> = async (event) => {
  console.log(`Processing ${event.Records.length} webhook delivery messages`);

  const results = await Promise.allSettled(
    event.Records.map(record => processWebhookDelivery(record))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Webhook delivery results: ${successful} successful, ${failed} failed`);

  // Return information about failed messages for SQS batch item failure reporting
  const failedMessageIds = event.Records
    .filter((_, index) => results[index].status === 'rejected')
    .map(record => ({ itemIdentifier: record.messageId }));

  return {
    batchItemFailures: failedMessageIds,
  };
};

async function processWebhookDelivery(record: SQSRecord): Promise<void> {
  const deliveryId = generateDeliveryId();
  
  try {
    const payload: WebhookDeliveryPayload = JSON.parse(record.body);
    console.log(`Processing webhook delivery ${deliveryId} for config ${payload.webhookConfigId}`);

    // Record delivery attempt start
    await recordDeliveryAttempt(deliveryId, payload, 'pending');

    // Get webhook secret
    const webhookSecret = await getWebhookSecret(payload.secretId);

    // Construct webhook payload
    const webhookPayload = constructWebhookPayload(payload);
    const signature = signWebhookPayload(webhookPayload, webhookSecret);

    // Attempt delivery
    const deliveryResult = await attemptWebhookDelivery(
      payload.url,
      webhookPayload,
      signature,
      webhookSecret.algorithm
    );

    // Record delivery result
    await recordDeliveryAttempt(deliveryId, payload, 'completed', deliveryResult);

    console.log(`Webhook delivery ${deliveryId} completed successfully`);

  } catch (error) {
    console.error(`Webhook delivery ${deliveryId} failed:`, error);
    
    try {
      const payload: WebhookDeliveryPayload = JSON.parse(record.body);
      await recordDeliveryAttempt(deliveryId, payload, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 0,
      });
    } catch (recordError) {
      console.error('Failed to record delivery failure:', recordError);
    }

    throw error;
  }
}

async function getWebhookSecret(secretId: string): Promise<WebhookSecret> {
  try {
    const result = await secretsClient.send(new GetSecretValueCommand({
      SecretId: secretId,
    }));

    if (!result.SecretString) {
      throw new Error('Secret value is empty');
    }

    return JSON.parse(result.SecretString);
  } catch (error) {
    console.error(`Error retrieving webhook secret ${secretId}:`, error);
    throw error;
  }
}

function constructWebhookPayload(delivery: WebhookDeliveryPayload): string {
  const payload = {
    id: generateEventId(),
    event: delivery.eventType,
    created_at: delivery.timestamp,
    data: delivery.eventData,
    organization_id: delivery.organizationId,
    environment: delivery.environment,
    ...(delivery.userId && { user_id: delivery.userId }),
  };

  return JSON.stringify(payload);
}

function signWebhookPayload(payload: string, secret: WebhookSecret): string {
  const hmac = createHmac(secret.algorithm, secret.key);
  hmac.update(payload);
  return hmac.digest('hex');
}

async function attemptWebhookDelivery(
  url: string,
  payload: string,
  signature: string,
  algorithm: string
): Promise<{ statusCode: number; responseBody?: string; duration: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Foresight-Webhooks/1.0',
        'X-Foresight-Signature': `${algorithm}=${signature}`,
        'X-Foresight-Delivery': generateDeliveryId(),
        'X-Foresight-Event': 'webhook',
      },
      body: payload,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }

    return {
      statusCode: response.status,
      responseBody: responseBody.slice(0, 1000), // Limit response body length
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof Error) {
      throw new Error(`Delivery failed after ${duration}ms: ${error.message}`);
    }
    
    throw new Error(`Delivery failed after ${duration}ms: Unknown error`);
  }
}

async function recordDeliveryAttempt(
  deliveryId: string,
  payload: WebhookDeliveryPayload,
  status: 'pending' | 'completed' | 'failed',
  result?: { statusCode?: number; responseBody?: string; duration?: number; error?: string }
): Promise<void> {
  const sql = `
    INSERT INTO webhook_deliveries (
      id,
      webhook_config_id,
      event_type,
      payload,
      status,
      attempt_number,
      http_status_code,
      response_body,
      error_message,
      duration_ms,
      created_at,
      updated_at
    ) VALUES (
      :deliveryId,
      :webhookConfigId,
      :eventType,
      :payload,
      :status,
      :attemptNumber,
      :httpStatusCode,
      :responseBody,
      :errorMessage,
      :durationMs,
      NOW(),
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      http_status_code = VALUES(http_status_code),
      response_body = VALUES(response_body),
      error_message = VALUES(error_message),
      duration_ms = VALUES(duration_ms),
      updated_at = NOW()
  `;

  const parameters = [
    { name: 'deliveryId', value: { stringValue: deliveryId } },
    { name: 'webhookConfigId', value: { stringValue: payload.webhookConfigId } },
    { name: 'eventType', value: { stringValue: payload.eventType } },
    { name: 'payload', value: { stringValue: JSON.stringify(payload.eventData) } },
    { name: 'status', value: { stringValue: status } },
    { name: 'attemptNumber', value: { longValue: payload.attempt } },
    { name: 'httpStatusCode', value: result?.statusCode ? { longValue: result.statusCode } : { isNull: true } },
    { name: 'responseBody', value: result?.responseBody ? { stringValue: result.responseBody } : { isNull: true } },
    { name: 'errorMessage', value: result?.error ? { stringValue: result.error } : { isNull: true } },
    { name: 'durationMs', value: result?.duration ? { longValue: result.duration } : { isNull: true } },
  ];

  try {
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters,
    }));

    console.log(`Recorded delivery attempt ${deliveryId} with status ${status}`);
  } catch (error) {
    console.error(`Error recording delivery attempt ${deliveryId}:`, error);
    // Don't throw here to avoid failing the webhook delivery
  }
}

function generateDeliveryId(): string {
  return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}