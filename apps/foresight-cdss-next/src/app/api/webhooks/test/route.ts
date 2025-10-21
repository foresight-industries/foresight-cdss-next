import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, webhookConfigs, webhookDeliveries } from '@foresight-cdss-next/db';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

// POST - Test webhook by sending a test event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { webhook_id } = await request.json();

    if (!webhook_id) {
      return NextResponse.json({
        error: 'webhook_id is required'
      }, { status: 400 });
    }

    // Validate permissions and get member
    const { data: member } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!member || !['admin', 'owner'].includes(member.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    const memberData = member as { organizationId: string; role: string };

    // Get webhook configuration
    const { data: webhook } = await safeSingle(async () =>
      db.select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, webhook_id),
        eq(webhookConfigs.organizationId, memberData.organizationId)
      ))
    );

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhookData = webhook as {
      id: string;
      organizationId: string;
      url: string;
      name: string;
      environment: 'staging' | 'production';
    };

    // Create test payload
    const testPayload = {
      event_type: 'webhook.test',
      organization_id: webhookData.organizationId,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'foresight_cdss',
      test: true,
      data: {
        message: 'This is a test webhook event',
        webhook_id: webhookData.id,
        webhook_url: webhookData.url,
        webhook_name: webhookData.name,
        triggered_by: userId,
        triggered_at: new Date().toISOString()
      }
    };

    // Send EventBridge event to trigger webhook processing pipeline
    const eventBridgeClient = new EventBridgeClient({});

    const eventDetail = {
      eventType: 'webhook.test',
      organizationId: webhookData.organizationId,
      environment: webhookData.environment,
      entityId: webhookData.id,
      entityType: 'webhook',
      data: testPayload,
      userId: userId,
      timestamp: new Date().toISOString(),
      metadata: {
        triggeredBy: userId,
        triggerSource: 'manual_test',
        webhookId: webhookData.id
      }
    };

    // Get the correct EventBridge bus name based on webhook environment
    const stageName = process.env.VERCEL_ENV === 'production' ? 'prod' : 'staging';
    const eventBusName = `foresight-webhooks-${stageName}`;

    const putEventsCommand = new PutEventsCommand({
      Entries: [
        {
          Source: 'foresight.webhooks',
          DetailType: 'Webhook Test Event',
          Detail: JSON.stringify(eventDetail),
          EventBusName: eventBusName, // Use custom webhook event bus
          Resources: [`arn:aws:webhook:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:webhook/${webhookData.id}`]
        }
      ]
    });

    try {
      const eventResult = await eventBridgeClient.send(putEventsCommand);
      console.log('EventBridge result:', eventResult);

      return NextResponse.json({
        message: 'Test webhook event sent successfully',
        webhook_id: webhookData.id,
        event_detail: eventDetail,
        eventbridge_result: {
          entries: eventResult.Entries,
          failed_entries: eventResult.FailedEntryCount
        }
      });

    } catch (eventError) {
      console.error('Error sending EventBridge event:', eventError);

      // Fallback: Create delivery record manually if EventBridge fails
      const { data: deliveryItem, error: deliveryError } = await safeInsert(async () =>
        db.insert(webhookDeliveries)
          .values({
            webhookConfigId: webhookData.id,
            eventType: 'webhook.test',
            eventData: testPayload,
            attemptCount: 1,
            status: 'pending'
          })
          .returning({ id: webhookDeliveries.id })
      );

      if (deliveryError || !deliveryItem || deliveryItem.length === 0) {
        return NextResponse.json({
          error: 'Failed to send test webhook - both EventBridge and fallback failed'
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Test webhook created (fallback mode - EventBridge unavailable)',
        delivery_id: (deliveryItem[0] as { id: string }).id,
        webhook_id: webhookData.id,
        test_payload: testPayload,
        warning: 'Used fallback delivery method'
      });
    }

  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get webhook testing information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhook_id');

    if (!webhookId) {
      return NextResponse.json({
        testing_guide: {
          description: 'Test your webhooks by sending sample events',
          steps: [
            '1. Create a webhook endpoint that accepts POST requests',
            '2. Configure your webhook URL in the settings',
            '3. Use the test button to send a sample event',
            '4. Check your endpoint logs for the received payload'
          ],
          sample_payload: {
            event_type: 'webhook.test',
            organization_id: 'uuid',
            timestamp: Math.floor(Date.now() / 1000),
            source: 'foresight_cdss',
            test: true,
            data: {
              message: 'This is a test webhook event',
              webhook_id: 'uuid',
              webhook_name: 'Test Webhook'
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Foresight-CDSS-Webhook/1.0',
            'X-Foresight-Event': 'webhook.test',
            'X-Foresight-Signature': 'sha256=<hmac-signature>',
            'X-Foresight-Organization-ID': '<organization-uuid>',
            'X-Foresight-Delivery': '<delivery-uuid>'
          }
        }
      });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Validate user has access to this webhook
    const { data: member } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberData = member as { organizationId: string; role: string };

    // Verify webhook belongs to user's organization
    const { data: webhook } = await safeSingle(async () =>
      db.select({ organizationId: webhookConfigs.organizationId })
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, webhookId),
        eq(webhookConfigs.organizationId, memberData.organizationId)
      ))
    );

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get recent test deliveries for this webhook
    const { data: deliveries } = await safeSelect(async () =>
      db.select()
      .from(webhookDeliveries)
      .where(and(
        eq(webhookDeliveries.webhookConfigId, webhookId),
        eq(webhookDeliveries.eventType, 'webhook.test')
      ))
      .orderBy(webhookDeliveries.createdAt)
      .limit(5)
    );

    return NextResponse.json({
      webhook_id: webhookId,
      recent_tests: deliveries || [],
      testing_info: {
        description: 'Recent test webhook deliveries',
        note: 'Test events help verify your webhook endpoint is working correctly'
      }
    });

  } catch (error) {
    console.error('Webhook test GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
