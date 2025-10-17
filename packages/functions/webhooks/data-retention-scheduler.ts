import { ScheduledEvent, Context } from 'aws-lambda';
import { WebhookDataRetentionManager } from '@foresight-cdss-next/webhooks';
import { createAuthenticatedDatabaseClient } from '@foresight-cdss-next/web/src/lib/aws/database';
import {
  webhookConfigs,
  webhookDeliveries,
  webhookSecrets,
  webhookHipaaAuditLog,
  webhookDeliveryAttempts
} from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface LambdaResponse {
  statusCode: number;
  body: string;
}

const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const HIPAA_ALERTS_TOPIC_ARN = process.env.HIPAA_ALERTS_TOPIC_ARN!;
const EXECUTION_TIME_LIMIT = parseInt(process.env.EXECUTION_TIME_LIMIT || '840000');

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
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
): Promise<void> {
  const alertMessage = {
    severity,
    subject,
    message,
    timestamp: new Date().toISOString(),
    service: 'data-retention-scheduler',
    environment: process.env.NODE_ENV,
  };

  const command = new PublishCommand({
    TopicArn: HIPAA_ALERTS_TOPIC_ARN,
    Subject: `[${severity}] Data Retention Alert: ${subject}`,
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
    Namespace: 'Foresight/Webhooks/DataRetention',
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

async function logRetentionAuditEvent(
  databaseWrapper: AwsDatabaseWrapper,
  organizationId: string,
  eventType: string,
  details: string
): Promise<void> {
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();
  
  await databaseWrapper.safeInsert(() =>
    db.insert(webhookHipaaAuditLog).values({
      id: crypto.randomUUID(),
      organizationId,
      eventType,
      userId: null,
      ipAddress: null,
      userAgent: 'data-retention-scheduler',
      details,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'production',
    })
  );
}

async function runDataRetentionForOrganization(
  databaseWrapper: AwsDatabaseWrapper,
  organizationId: string,
  startTime: number
): Promise<{
  success: boolean;
  deletedRecords: number;
  error?: string;
  shouldContinue: boolean;
}> {
  try {
    console.log(`Running data retention for organization: ${organizationId}`);

    const retentionManager = new WebhookDataRetentionManager(databaseWrapper, organizationId);

    console.log(`Executing retention policies for organization: ${organizationId}`);

    if (Date.now() - startTime > EXECUTION_TIME_LIMIT - 60000) {
      console.log('Approaching execution time limit, stopping retention process');
      return {
        success: true,
        deletedRecords: 0,
        shouldContinue: false,
      };
    }

    const result = await retentionManager.executeRetentionPolicies();

    if (result.success) {
      const totalDeletedRecords = result.purgedDeliveries + result.purgedAttempts + result.purgedAuditLogs;

      console.log(`Retention policies completed:`, {
        processedWebhooks: result.processedWebhooks,
        purgedDeliveries: result.purgedDeliveries,
        purgedAttempts: result.purgedAttempts,
        purgedAuditLogs: result.purgedAuditLogs,
        totalDeletedRecords,
      });

      await logRetentionAuditEvent(
        databaseWrapper,
        organizationId,
        'data_retention_applied',
        `Applied retention policies: processed ${result.processedWebhooks} webhooks, deleted ${totalDeletedRecords} total records (${result.purgedDeliveries} deliveries, ${result.purgedAttempts} attempts, ${result.purgedAuditLogs} audit logs)`
      );

      return {
        success: true,
        deletedRecords: totalDeletedRecords,
        shouldContinue: true,
      };
    } else {
      const errorMessage = result.errors ? result.errors.join(', ') : 'Unknown error';
      console.error(`Retention policies failed:`, errorMessage);

      await sendAlert(
        'Data Retention Policy Failed',
        `Failed to apply retention policies for organization ${organizationId}: ${errorMessage}`,
        'WARNING'
      );

      await putMetric('RetentionPolicyFailures', 1, 'Count', {
        OrganizationId: organizationId,
      });

      return {
        success: false,
        deletedRecords: 0,
        error: errorMessage,
        shouldContinue: true,
      };
    }

  } catch (error) {
    console.error(`Error running data retention for organization ${organizationId}:`, error);

    await sendAlert(
      'Data Retention Error',
      `Error running data retention for organization ${organizationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CRITICAL'
    );

    await putMetric('RetentionErrors', 1, 'Count', {
      OrganizationId: organizationId,
    });

    return {
      success: false,
      deletedRecords: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      shouldContinue: true,
    };
  }
}

async function getOrganizationsWithWebhooks(
  databaseWrapper: AwsDatabaseWrapper
): Promise<string[]> {
  const { db } = await databaseWrapper.createAuthenticatedDatabaseClient();

  const { data, error } = await databaseWrapper.safeSelect(() =>
    db
      .selectDistinct({ organizationId: webhookConfigs.organizationId })
      .from(webhookConfigs)
      .where(eq(webhookConfigs.isActive, true))
  );

  if (error) {
    console.error('Error fetching organizations with webhooks:', error);
    return [];
  }

  return data?.map((row: any) => row.organizationId) || [];
}

export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<LambdaResponse> => {
  const startTime = Date.now();
  let processedOrganizations = 0;
  let totalDeletedRecords = 0;
  let failedOrganizations = 0;

  try {
    console.log('Starting scheduled data retention process');
    console.log('Event details:', JSON.stringify(event, null, 2));

    const { db } = await createAuthenticatedDatabaseClient();
    const databaseWrapper = new AwsDatabaseWrapper(db);

    const organizations = await getOrganizationsWithWebhooks(databaseWrapper);

    if (organizations.length === 0) {
      console.log('No organizations with active webhooks found');

      await putMetric('ProcessedOrganizations', 0, 'Count');

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No organizations with active webhooks found',
          processedOrganizations: 0,
        }),
      };
    }

    console.log(`Found ${organizations.length} organizations with active webhooks`);

    await putMetric('OrganizationsToProcess', organizations.length, 'Count');

    for (const organizationId of organizations) {
      if (Date.now() - startTime > EXECUTION_TIME_LIMIT) {
        console.log('Approaching Lambda execution time limit, stopping processing');
        break;
      }

      const result = await runDataRetentionForOrganization(
        databaseWrapper,
        organizationId,
        startTime
      );

      if (result.success) {
        processedOrganizations++;
        totalDeletedRecords += result.deletedRecords;
      } else {
        failedOrganizations++;
      }

      if (!result.shouldContinue) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const processingTime = Date.now() - startTime;

    await putMetric('ProcessingTime', processingTime, 'Milliseconds');
    await putMetric('ProcessedOrganizations', processedOrganizations, 'Count');
    await putMetric('TotalDeletedRecords', totalDeletedRecords, 'Count');

    if (failedOrganizations > 0) {
      await putMetric('FailedOrganizations', failedOrganizations, 'Count');
    }

    const summary = {
      totalOrganizations: organizations.length,
      processedOrganizations,
      failedOrganizations,
      totalDeletedRecords,
      processingTimeMs: processingTime,
    };

    console.log('Data retention process completed:', summary);

    await sendAlert(
      'Data Retention Process Completed',
      `Data retention process completed successfully. Processed ${processedOrganizations}/${organizations.length} organizations, deleted ${totalDeletedRecords} total records in ${processingTime}ms.`,
      'INFO'
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...summary,
      }),
    };

  } catch (error) {
    console.error('Critical error in data retention scheduler:', error);

    const processingTime = Date.now() - startTime;

    await sendAlert(
      'Data Retention Scheduler Critical Error',
      `Critical error in data retention scheduler: ${error instanceof Error ? error.message : 'Unknown error'}. Request ID: ${context.awsRequestId}`,
      'CRITICAL'
    );

    await putMetric('CriticalErrors', 1, 'Count');
    await putMetric('ProcessingTime', processingTime, 'Milliseconds');

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId,
        processedOrganizations,
        totalDeletedRecords,
        processingTimeMs: processingTime,
      }),
    };
  }
};
