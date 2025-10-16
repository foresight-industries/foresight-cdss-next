import { SQSEvent, SQSRecord, Handler } from 'aws-lambda';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

interface FailedWebhookDelivery {
  webhookConfigId: string;
  organizationId: string;
  environment: 'staging' | 'production';
  eventType: string;
  failureReason: string;
  originalPayload: string;
  attempts: number;
}

const cloudWatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});
const rdsClient = new RDSDataClient({});

const DB_SECRET_ARN = process.env.DATABASE_SECRET_ARN!;
const DB_CLUSTER_ARN = process.env.DATABASE_CLUSTER_ARN!;
const DB_NAME = process.env.DATABASE_NAME!;

/**
 * Webhook Dead Letter Queue Processor
 * 
 * Handles permanently failed webhook deliveries:
 * 1. Logs failure details for debugging
 * 2. Publishes CloudWatch metrics
 * 3. Updates webhook configuration health status
 * 4. Sends alerts for critical failures
 */
export const handler: Handler<SQSEvent> = async (event) => {
  console.log(`Processing ${event.Records.length} failed webhook delivery messages`);

  for (const record of event.Records) {
    try {
      await processFailedWebhookDelivery(record);
    } catch (error) {
      console.error('Error processing failed webhook delivery:', error);
      // Continue processing other records even if one fails
    }
  }

  return { processedFailures: event.Records.length };
};

async function processFailedWebhookDelivery(record: SQSRecord): Promise<void> {
  try {
    const failedDelivery = parseFailedDelivery(record);
    
    console.log(`Processing failed webhook delivery for config ${failedDelivery.webhookConfigId}`);

    // Update webhook configuration health metrics
    await updateWebhookHealthMetrics(failedDelivery);

    // Publish CloudWatch metrics
    await publishCloudWatchMetrics(failedDelivery);

    // Check if webhook should be disabled due to repeated failures
    await checkAndDisableUnhealthyWebhook(failedDelivery);

    // Send alert for critical failures
    await sendFailureAlert(failedDelivery);

    console.log(`Processed failed webhook delivery for config ${failedDelivery.webhookConfigId}`);

  } catch (error) {
    console.error('Error processing failed webhook delivery:', error);
    throw error;
  }
}

function parseFailedDelivery(record: SQSRecord): FailedWebhookDelivery {
  try {
    const originalMessage = JSON.parse(record.body);
    
    return {
      webhookConfigId: originalMessage.webhookConfigId || 'unknown',
      organizationId: originalMessage.organizationId || 'unknown',
      environment: originalMessage.environment || 'staging',
      eventType: originalMessage.eventType || 'unknown',
      failureReason: getFailureReason(record),
      originalPayload: record.body,
      attempts: originalMessage.attempt || 0,
    };
  } catch (error) {
    console.error('Error parsing failed delivery:', error);
    
    return {
      webhookConfigId: 'unknown',
      organizationId: 'unknown',
      environment: 'staging',
      eventType: 'unknown',
      failureReason: 'Failed to parse message',
      originalPayload: record.body,
      attempts: 0,
    };
  }
}

function getFailureReason(record: SQSRecord): string {
  // Extract failure reason from SQS message attributes or body
  const attributes = record.messageAttributes;
  
  if (attributes?.ErrorMessage?.stringValue) {
    return attributes.ErrorMessage.stringValue;
  }

  // Try to extract from receipt handle or other metadata
  return 'Exceeded maximum retry attempts';
}

async function updateWebhookHealthMetrics(failedDelivery: FailedWebhookDelivery): Promise<void> {
  const sql = `
    UPDATE webhook_configs 
    SET 
      last_failure_at = NOW(),
      failure_count = failure_count + 1,
      health_status = CASE 
        WHEN failure_count >= 10 THEN 'unhealthy'
        WHEN failure_count >= 5 THEN 'degraded'
        ELSE health_status
      END,
      updated_at = NOW()
    WHERE id = :webhookConfigId
  `;

  try {
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters: [
        { name: 'webhookConfigId', value: { stringValue: failedDelivery.webhookConfigId } },
      ],
    }));

    console.log(`Updated health metrics for webhook config ${failedDelivery.webhookConfigId}`);
  } catch (error) {
    console.error('Error updating webhook health metrics:', error);
  }
}

async function publishCloudWatchMetrics(failedDelivery: FailedWebhookDelivery): Promise<void> {
  const metrics = [
    {
      MetricName: 'WebhookDeliveryFailures',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Environment', Value: failedDelivery.environment },
        { Name: 'EventType', Value: failedDelivery.eventType },
        { Name: 'OrganizationId', Value: failedDelivery.organizationId },
      ],
    },
    {
      MetricName: 'WebhookConfigFailureCount',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'WebhookConfigId', Value: failedDelivery.webhookConfigId },
        { Name: 'Environment', Value: failedDelivery.environment },
      ],
    },
  ];

  try {
    await cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: 'Foresight/Webhooks',
      MetricData: metrics,
    }));

    console.log('Published CloudWatch metrics for webhook failure');
  } catch (error) {
    console.error('Error publishing CloudWatch metrics:', error);
  }
}

async function checkAndDisableUnhealthyWebhook(failedDelivery: FailedWebhookDelivery): Promise<void> {
  // Check if webhook has failed too many times and should be disabled
  const sql = `
    SELECT failure_count, health_status
    FROM webhook_configs
    WHERE id = :webhookConfigId
  `;

  try {
    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters: [
        { name: 'webhookConfigId', value: { stringValue: failedDelivery.webhookConfigId } },
      ],
    }));

    if (result.records && result.records.length > 0) {
      const failureCount = result.records[0][0]?.longValue || 0;
      const healthStatus = result.records[0][1]?.stringValue || 'healthy';

      // Disable webhook if it has failed more than 20 times
      if (failureCount >= 20 && healthStatus !== 'disabled') {
        await disableWebhookConfig(failedDelivery.webhookConfigId);
        
        console.log(`Disabled webhook config ${failedDelivery.webhookConfigId} due to excessive failures`);
      }
    }
  } catch (error) {
    console.error('Error checking webhook health status:', error);
  }
}

async function disableWebhookConfig(webhookConfigId: string): Promise<void> {
  const sql = `
    UPDATE webhook_configs
    SET 
      is_active = false,
      health_status = 'disabled',
      disabled_at = NOW(),
      disabled_reason = 'Automatically disabled due to excessive failures',
      updated_at = NOW()
    WHERE id = :webhookConfigId
  `;

  try {
    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: DB_CLUSTER_ARN,
      secretArn: DB_SECRET_ARN,
      database: DB_NAME,
      sql,
      parameters: [
        { name: 'webhookConfigId', value: { stringValue: webhookConfigId } },
      ],
    }));
  } catch (error) {
    console.error('Error disabling webhook config:', error);
    throw error;
  }
}

async function sendFailureAlert(failedDelivery: FailedWebhookDelivery): Promise<void> {
  // Only send alerts for production environment or after multiple failures
  if (failedDelivery.environment !== 'production' && failedDelivery.attempts < 3) {
    return;
  }

  const alertMessage = {
    alert: 'Webhook Delivery Failure',
    environment: failedDelivery.environment,
    webhookConfigId: failedDelivery.webhookConfigId,
    organizationId: failedDelivery.organizationId,
    eventType: failedDelivery.eventType,
    failureReason: failedDelivery.failureReason,
    attempts: failedDelivery.attempts,
    timestamp: new Date().toISOString(),
    severity: failedDelivery.environment === 'production' ? 'high' : 'medium',
  };

  try {
    // In a real implementation, you would send this to SNS topic for alerts
    // For now, just log the alert
    console.log('WEBHOOK FAILURE ALERT:', JSON.stringify(alertMessage, null, 2));

    // Uncomment when SNS topic is configured:
    // await snsClient.send(new PublishCommand({
    //   TopicArn: process.env.ALERT_TOPIC_ARN,
    //   Subject: `Webhook Failure - ${failedDelivery.environment}`,
    //   Message: JSON.stringify(alertMessage, null, 2),
    // }));

  } catch (error) {
    console.error('Error sending failure alert:', error);
  }
}