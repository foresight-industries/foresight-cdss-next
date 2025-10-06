/**
 * Webhook processor utility for triggering webhook processing
 * This can be called from cron jobs, API routes, or other triggers
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface WebhookProcessorConfig {
  processorUrl?: string;
  authToken?: string;
  batchSize?: number;
  retryDelayMs?: number;
}

export class WebhookProcessor {
  private config: Required<WebhookProcessorConfig>;

  constructor(config: WebhookProcessorConfig = {}) {
    this.config = {
      processorUrl: config.processorUrl || '/api/webhooks/process',
      authToken: config.authToken || process.env.WEBHOOK_PROCESSOR_TOKEN || '',
      batchSize: config.batchSize || parseInt(process.env.WEBHOOK_PROCESSOR_BATCH_SIZE || '50'),
      retryDelayMs: config.retryDelayMs || parseInt(process.env.WEBHOOK_PROCESSOR_RETRY_DELAY_MS || '5000')
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
      const supabase = await createSupabaseServerClient();

      const { data: stats, error } = await supabase
        .from('webhook_queue')
        .select('status')
        .then(async (result) => {
          if (result.error) throw result.error;

          const items = result.data || [];
          const stats = {
            pending: items.filter(item => item.status === 'pending').length,
            processing: items.filter(item => item.status === 'processing').length,
            failed: items.filter(item => item.status === 'failed').length,
            total: items.length
          };

          return { data: stats, error: null };
        });

      if (error) throw error;

      return stats || { pending: 0, processing: 0, failed: 0, total: 0 };

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
      const supabase = await createSupabaseServerClient();

      // Reset failed webhooks that haven't exceeded max attempts
      // First, get webhooks that can be retried
      const { data: retriableWebhooks } = await supabase
        .from('webhook_queue')
        .select('id, attempts, max_attempts')
        .eq('status', 'failed')
        .lt('attempts', 'max_attempts');

      if (!retriableWebhooks || retriableWebhooks.length === 0) {
        return 0;
      }

      // Update the retriable webhooks
      const { data, error } = await supabase
        .from('webhook_queue')
        .update({
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', retriableWebhooks.map(w => w.id))
        .select('id');

      if (error) throw error;
      return data?.length || 0;

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
      const supabase = await createSupabaseServerClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('webhook_delivery')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;

    } catch (error) {
      console.error('Error cleaning up old deliveries:', error);
      return 0;
    }
  }

  /**
   * Manually trigger webhook for specific event
   */
  async triggerWebhook(
    teamId: string,
    eventType: string,
    payload: any,
    environment: 'development' | 'production' = 'production'
  ): Promise<boolean> {
    try {
      const supabase = await createSupabaseServerClient();

      // Use the database function to enqueue the webhook
      const { error } = await supabase.rpc('enqueue_webhook_event', {
        p_team_id: teamId,
        p_event_type: eventType,
        p_payload: payload,
        p_environment: environment
      });

      if (error) {
        console.error('Error triggering webhook:', error);
        return false;
      }

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
export function getCurrentEnvironment(): 'development' | 'production' {
  return process.env.NODE_ENV === 'development' ? 'development' : 'production';
}

// Utility to set environment context for database operations
export async function setEnvironmentContext(environment: 'development' | 'production') {
  const supabase = await createSupabaseServerClient();

  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.environment',
      new_value: environment,
      is_local: true
    });
  } catch (error) {
    console.warn('Could not set environment context:', error);
  }
}
