/**
 * Webhook processor utility for triggering webhook processing
 * This can be called from cron jobs, API routes, or other triggers
 */

import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { webhookDeliveries } from '@foresight-cdss-next/db';
import { eq, and, lt, sql } from 'drizzle-orm';

export interface WebhookProcessorConfig {
  processorUrl?: string;
  authToken?: string;
  batchSize?: number;
  retryDelayMs?: number;
}

export class WebhookProcessor {
  private readonly config: Required<WebhookProcessorConfig>;

  constructor(config: WebhookProcessorConfig = {}) {
    this.config = {
      processorUrl: config.processorUrl || '/api/webhooks/process',
      authToken: config.authToken || process.env.WEBHOOK_PROCESSOR_TOKEN || '',
      batchSize: config.batchSize || Number.parseInt(process.env.WEBHOOK_PROCESSOR_BATCH_SIZE || '50'),
      retryDelayMs: config.retryDelayMs || Number.parseInt(process.env.WEBHOOK_PROCESSOR_RETRY_DELAY_MS || '5000')
    };
  }

  /**
   * Process pending webhooks
   */
  async processPendingWebhooks(): Promise<{
    success: boolean;
    processed: number;
    errors: string[];
  }> {
    try {
      if (!this.config.authToken) {
        throw new Error('WEBHOOK_PROCESSOR_TOKEN not configured');
      }

      const response = await fetch(this.config.processorUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Webhook processor error: ${data.error || response.statusText}`);
      }

      return {
        success: true,
        processed: data.processed || 0,
        errors: []
      };

    } catch (error) {
      console.error('Webhook processor error:', error);
      return {
        success: false,
        processed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get webhook queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    total: number;
  }> {
    try {
      const { db } = await createAuthenticatedDatabaseClient();

      // Get all webhook deliveries and calculate stats
      const deliveries = await db
        .select({
          status: webhookDeliveries.status
        })
        .from(webhookDeliveries);

      const stats = {
        pending: deliveries.filter((item: { status: string }) => item.status === 'pending').length,
        processing: deliveries.filter((item: { status: string }) => item.status === 'processing').length,
        failed: deliveries.filter((item: { status: string }) => item.status === 'failed').length,
        total: deliveries.length
      };

      return stats;

    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { pending: 0, processing: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Retry failed webhooks that haven't exceeded max attempts
   */
  async retryFailedWebhooks(): Promise<number> {
    try {
      const { db } = await createAuthenticatedDatabaseClient();

      // Reset failed webhooks that haven't exceeded max attempts
      // First, get webhooks that can be retried (using attemptCount field from schema)
      const retriableWebhooks = await db
        .select({
          id: webhookDeliveries.id,
          attemptCount: webhookDeliveries.attemptCount
        })
        .from(webhookDeliveries)
        .where(
          and(
            eq(webhookDeliveries.status, 'failed'),
            sql`${webhookDeliveries.attemptCount} < 3`
          )
        );

      if (!retriableWebhooks || retriableWebhooks.length === 0) {
        return 0;
      }

      // Update the retriable webhooks
      const updatedDeliveries = await db
        .update(webhookDeliveries)
        .set({
          status: 'pending',
          nextRetryAt: new Date()
        })
        .where(
          sql`${webhookDeliveries.id} = ANY(${retriableWebhooks.map((w: { id: string }) => w.id)})`
        )
        .returning({ id: webhookDeliveries.id });

      return updatedDeliveries.length;

    } catch (error) {
      console.error('Error retrying failed webhooks:', error);
      return 0;
    }
  }

  /**
   * Clean up old webhook delivery logs
   */
  async cleanupOldDeliveries(olderThanDays = 30): Promise<number> {
    try {
      const { db } = await createAuthenticatedDatabaseClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedDeliveries = await db
        .delete(webhookDeliveries)
        .where(lt(webhookDeliveries.createdAt, cutoffDate))
        .returning({ id: webhookDeliveries.id });

      return deletedDeliveries.length;

    } catch (error) {
      console.error('Error cleaning up old deliveries:', error);
      return 0;
    }
  }

  /**
   * Manually trigger webhook for specific event
   */
  async triggerWebhook(
    organizationId: string,
    eventType: string,
    payload: Record<string, unknown>,
    environment: 'staging' | 'production' = 'production'
  ): Promise<boolean> {
    try {
      const { db } = await createAuthenticatedDatabaseClient();

      // Create a new webhook delivery entry
      // Note: Missing webhookConfigId - this would need to be provided or looked up
      await db.insert(webhookDeliveries).values({
        webhookConfigId: '', // This would need to be passed in or looked up
        eventType,
        eventData: payload,
        status: 'pending',
        attemptCount: 0
      });

      return true;

    } catch (error) {
      console.error('Error triggering webhook:', error);
      return false;
    }
  }
}

// Export singleton instance
export const webhookProcessor = new WebhookProcessor();

// Environment detection utility
export function getCurrentEnvironment(): 'staging' | 'production' {
  return process.env.NODE_ENV === 'development' ? 'staging' : 'production';
}

// Utility to set environment context for database operations
export async function setEnvironmentContext(environment: 'development' | 'production') {
  try {
    // With AWS RDS, we can use environment variables or connection parameters
    // This is more of a placeholder since AWS RDS doesn't use the same session config pattern
    process.env.DATABASE_ENVIRONMENT = environment;
  } catch (error) {
    console.warn('Could not set environment context:', error);
  }
}
