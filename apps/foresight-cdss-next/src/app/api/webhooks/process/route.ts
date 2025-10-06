import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// This endpoint processes the webhook queue and sends HTTP requests
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authorization header for simple API protection
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WEBHOOK_PROCESSOR_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending webhook events from queue
    const { data: allItems, error: queueError } = await supabase
      .from('webhook_queue')
      .select(`
        *,
        webhook_config (
          id,
          url,
          target_url,
          secret,
          timeout_seconds,
          team_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(100); // Get more items, then filter in JS

    // Filter items where attempts < max_attempts in JavaScript
    const queueItems = allItems?.filter(item => item.attempts < item.max_attempts).slice(0, 50) || [];

    if (queueError) {
      console.error('Error fetching webhook queue:', queueError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ message: 'No webhooks to process', processed: 0 });
    }

    let processedCount = 0;
    const results = [];

    for (const item of queueItems) {
      try {
        // Update status to processing
        await supabase
          .from('webhook_queue')
          .update({
            status: 'processing',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        const result = await processWebhook(item);
        results.push(result);
        processedCount++;

        // Update final status
        const finalStatus = result.success ? 'completed' :
          (item.attempts + 1 >= item.max_attempts ? 'failed' : 'pending');

        await supabase
          .from('webhook_queue')
          .update({
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Log the delivery attempt
        await supabase
          .from('webhook_delivery')
          .insert({
            webhook_config_id: item.webhook_config_id,
            event_type: item.event_type,
            payload: item.payload,
            response_status: result.status_code,
            response_body: result.response_body,
            response_time_ms: result.response_time_ms,
            attempt_number: item.attempts + 1,
            delivered_at: result.success ? new Date().toISOString() : null,
            failed_at: result.success ? null : new Date().toISOString(),
            error_message: result.error_message
          });

        // Update webhook config last triggered time
        await supabase
          .from('webhook_config')
          .update({
            last_triggered_at: new Date().toISOString(),
            last_success_at: result.success ? new Date().toISOString() : undefined,
            last_error: result.success ? null : result.error_message
          })
          .eq('id', item.webhook_config.id);

      } catch (error) {
        console.error(`Error processing webhook ${item.id}:`, error);

        // Mark as failed if max attempts reached
        const finalStatus = item.attempts + 1 >= item.max_attempts ? 'failed' : 'pending';
        await supabase
          .from('webhook_queue')
          .update({
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        results.push({
          webhook_id: item.id,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedCount} webhooks`,
      processed: processedCount,
      total_queued: queueItems.length,
      results
    });

  } catch (error) {
    console.error('Webhook processor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface WebhookQueueItem {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  attempts: number;
  max_attempts: number;
  webhook_config: {
    id: string;
    url: string | null;
    target_url: string;
    secret: string | null;
    timeout_seconds: number | null;
    team_id: string;
  };
}

interface WebhookResult {
  webhook_id: string;
  success: boolean;
  status_code?: number;
  response_body?: string;
  response_time_ms?: number;
  error_message?: string;
}

async function processWebhook(
  item: WebhookQueueItem
): Promise<WebhookResult> {
  const startTime = Date.now();

  try {
    const { webhook_config } = item;

    // Use target_url as primary, fallback to url
    const webhookUrl = webhook_config.target_url || webhook_config.url;
    if (!webhookUrl) {
      throw new Error('No webhook URL configured');
    }

    // Create HMAC signature for security (skip if no secret)
    const signature = webhook_config.secret 
      ? createHmacSignature(item.payload, webhook_config.secret)
      : '';

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Foresight-CDSS-Webhook/1.0',
      'X-Foresight-Event': item.event_type,
      'X-Foresight-Team-ID': webhook_config.team_id,
      'X-Foresight-Delivery': crypto.randomUUID()
    };

    // Only add signature header if we have a secret
    if (signature) {
      headers['X-Foresight-Signature'] = signature;
    }

    // Send HTTP request
    const controller = new AbortController();
    const timeoutSeconds = webhook_config.timeout_seconds || 30;
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutSeconds * 1000
    );

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      return {
        webhook_id: item.id,
        success: response.ok,
        status_code: response.status,
        response_body: responseBody.substring(0, 2000), // Limit response body size
        response_time_ms: responseTime,
        error_message: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      webhook_id: item.id,
      success: false,
      response_time_ms: responseTime,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function createHmacSignature(payload: any, secret: string): string {
  const body = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'webhook-processor',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
