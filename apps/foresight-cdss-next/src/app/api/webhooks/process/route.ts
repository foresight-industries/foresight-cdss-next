import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeUpdate, safeInsert } from '@/lib/aws/database';
import { eq, and, isNull } from 'drizzle-orm';
import { webhookConfigs, webhookDeliveries, webhookSecrets } from '@foresight-cdss-next/db';
import crypto from 'node:crypto';

// This endpoint processes webhook deliveries that failed and need retry
// In a production AWS environment, this would typically be handled by SQS/EventBridge
export async function POST(request: NextRequest) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Get authorization header for simple API protection
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WEBHOOK_PROCESSOR_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get failed webhook deliveries that need retry (status = 'failed' and attemptCount < max retry)
    const { data: failedDeliveries, error: deliveryError } = await safeSelect(async () =>
      db.select({
        id: webhookDeliveries.id,
        webhookConfigId: webhookDeliveries.webhookConfigId,
        eventType: webhookDeliveries.eventType,
        eventData: webhookDeliveries.eventData,
        attemptCount: webhookDeliveries.attemptCount,
        webhookUrl: webhookConfigs.url,
        secretId: (webhookSecrets as any).secretId,
        timeoutSeconds: webhookConfigs.timeoutSeconds,
        organizationId: webhookConfigs.organizationId,
        isActive: webhookConfigs.isActive
      })
      .from(webhookDeliveries)
      .leftJoin(webhookConfigs, eq(webhookDeliveries.webhookConfigId, webhookConfigs.id))
      .leftJoin(webhookSecrets, and(
        eq(webhookSecrets.webhookConfigId, webhookConfigs.id),
        eq(webhookSecrets.isActive, true)
      ))
      .where(and(
        eq(webhookDeliveries.status, 'failed'),
        isNull(webhookDeliveries.deliveredAt),
        eq(webhookConfigs.isActive, true)
      ))
      .limit(50)
    );

    if (deliveryError) {
      console.error('Error fetching failed deliveries:', deliveryError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Filter deliveries that haven't exceeded max retry attempts (default 3)
    const retriableDeliveries = (failedDeliveries || []).filter(
      (delivery: any) => delivery.attemptCount < 3
    );

    if (!retriableDeliveries || retriableDeliveries.length === 0) {
      return NextResponse.json({
        message: 'No webhook deliveries to retry',
        processed: 0
      });
    }

    let processedCount = 0;
    const results = [];

    for (const delivery of retriableDeliveries) {
      try {
        const deliveryData = delivery as {
          id: string;
          webhookConfigId: string;
          eventType: string;
          eventData: any;
          attemptCount: number;
          webhookUrl: string;
          secretId: string | null;
          timeoutSeconds: number;
          organizationId: string;
        };

        const result = await processWebhookDelivery(deliveryData);
        results.push(result);
        processedCount++;

        // Update delivery record with new attempt
        await safeUpdate(async () =>
          db.update(webhookDeliveries)
            .set({
              attemptCount: deliveryData.attemptCount + 1,
              httpStatus: result.status_code || null,
              responseBody: result.response_body || null,
              deliveredAt: result.success ? new Date() : null,
              status: result.success ? 'delivered' : 'failed',
              updatedAt: new Date()
            })
            .where(eq(webhookDeliveries.id, deliveryData.id))
        );

        // Update webhook config last delivery time if successful
        if (result.success) {
          await safeUpdate(async () =>
            db.update(webhookConfigs)
              .set({
                lastDelivery: new Date(),
                updatedAt: new Date()
              })
              .where(eq(webhookConfigs.id, deliveryData.webhookConfigId))
          );
        }

      } catch (error) {
        console.error(`Error processing webhook delivery ${(delivery as any).id}:`, error);

        // Update attempt count even on processing error
        await safeUpdate(async () =>
          db.update(webhookDeliveries)
            .set({
              attemptCount: (delivery as any).attemptCount + 1,
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(webhookDeliveries.id, (delivery as any).id))
        );

        results.push({
          delivery_id: (delivery as any).id,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedCount} webhook deliveries`,
      processed: processedCount,
      total_failed: retriableDeliveries.length,
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

interface WebhookDeliveryItem {
  id: string;
  webhookConfigId: string;
  eventType: string;
  eventData: any;
  attemptCount: number;
  webhookUrl: string;
  secretId: string | null;
  timeoutSeconds: number;
  organizationId: string;
}

interface WebhookResult {
  delivery_id: string;
  success: boolean;
  status_code?: number;
  response_body?: string;
  response_time_ms?: number;
  error_message?: string;
}

async function processWebhookDelivery(
  delivery: WebhookDeliveryItem
): Promise<WebhookResult> {
  const startTime = Date.now();

  try {
    const webhookUrl = delivery.webhookUrl;
    if (!webhookUrl) {
      throw new Error('No webhook URL configured');
    }

    // Create HMAC signature for security (skip if no secret)
    // TODO: Fetch actual secret from AWS Secrets Manager using delivery.secretId
    const signature = delivery.secretId
      ? '' // Skip signature for now since we need to fetch from AWS Secrets Manager
      : '';

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Foresight-CDSS-Webhook/1.0',
      'X-Foresight-Event': delivery.eventType,
      'X-Foresight-Organization-ID': delivery.organizationId,
      'X-Foresight-Delivery': crypto.randomUUID(),
      'X-Foresight-Attempt': (delivery.attemptCount + 1).toString()
    };

    // Only add signature header if we have a secret
    if (signature) {
      headers['X-Foresight-Signature'] = signature;
    }

    // Send HTTP request
    const controller = new AbortController();
    const timeoutSeconds = delivery.timeoutSeconds || 30;
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutSeconds * 1000
    );

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.eventData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      return {
        delivery_id: delivery.id,
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
      delivery_id: delivery.id,
      success: false,
      response_time_ms: responseTime,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// function createHmacSignature(payload: any, secret: string): string {
//   const body = JSON.stringify(payload);
//   return crypto
//     .createHmac('sha256', secret)
//     .update(body)
//     .digest('hex');
// }

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'webhook-processor',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    note: 'Processes failed webhook deliveries for retry'
  });
}

// Trigger webhook manually (for testing)
export async function PUT(request: NextRequest) {
  try {
    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();

    const { webhook_config_id, event_type, payload } = body;

    if (!webhook_config_id || !event_type || !payload) {
      return NextResponse.json({
        error: 'Missing required fields: webhook_config_id, event_type, payload'
      }, { status: 400 });
    }

    // Get webhook configuration with secret
    const { data: webhook } = await safeSelect(async () =>
      db.select({
        id: webhookConfigs.id,
        url: webhookConfigs.url,
        secretId: (webhookSecrets as any).secretId,
        timeoutSeconds: webhookConfigs.timeoutSeconds,
        organizationId: webhookConfigs.organizationId,
        isActive: webhookConfigs.isActive
      })
      .from(webhookConfigs)
      .leftJoin(webhookSecrets, and(
        eq(webhookSecrets.webhookConfigId, webhookConfigs.id),
        eq(webhookSecrets.isActive, true)
      ))
      .where(eq(webhookConfigs.id, webhook_config_id))
    );

    if (!webhook || webhook.length === 0) {
      return NextResponse.json({ error: 'Webhook configuration not found' }, { status: 404 });
    }

    const webhookConfig = webhook[0] as {
      id: string;
      url: string;
      secretId: string | null;
      timeoutSeconds: number;
      organizationId: string;
      isActive: boolean;
    };

    if (!webhookConfig.isActive) {
      return NextResponse.json({ error: 'Webhook is not active' }, { status: 400 });
    }

    // Create delivery record
    const { data: delivery } = await safeInsert(async () =>
      db.insert(webhookDeliveries)
        .values({
          webhookConfigId: webhook_config_id,
          eventType: event_type,
          eventData: payload,
          attemptCount: 1,
          status: 'pending'
        })
        .returning({ id: webhookDeliveries.id })
    );

    if (!delivery || delivery.length === 0) {
      return NextResponse.json({ error: 'Failed to create delivery record' }, { status: 500 });
    }

    const deliveryId = (delivery[0] as { id: string }).id;

    // Process the webhook immediately
    const deliveryData: WebhookDeliveryItem = {
      id: deliveryId,
      webhookConfigId: webhook_config_id,
      eventType: event_type,
      eventData: payload,
      attemptCount: 0,
      webhookUrl: webhookConfig.url,
      secretId: webhookConfig.secretId,
      timeoutSeconds: webhookConfig.timeoutSeconds,
      organizationId: webhookConfig.organizationId
    };

    const result = await processWebhookDelivery(deliveryData);

    // Update delivery record with result
    await safeUpdate(async () =>
      db.update(webhookDeliveries)
        .set({
          httpStatus: result.status_code || null,
          responseBody: result.response_body || null,
          deliveredAt: result.success ? new Date() : null,
          status: result.success ? 'delivered' : 'failed',
          updatedAt: new Date()
        })
        .where(eq(webhookDeliveries.id, deliveryId))
    );

    return NextResponse.json({
      delivery_id: deliveryId,
      result
    });

  } catch (error) {
    console.error('Manual webhook trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
