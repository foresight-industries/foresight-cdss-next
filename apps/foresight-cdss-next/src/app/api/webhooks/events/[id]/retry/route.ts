import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations, webhookConfigs, webhookDeliveries } from '@foresight-cdss-next/db';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// POST - Retry a failed webhook event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();
    const { team_slug } = body;
    const eventId = params.id;

    if (!team_slug) {
      return NextResponse.json({ error: 'team_slug is required' }, { status: 400 });
    }

    // Verify user has access through team membership
    const { data: orgMembership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(and(
        eq(organizations.slug, team_slug),
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!orgMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membershipData = orgMembership as { organizationId: string; role: string };

    // Get the webhook delivery and verify ownership
    const { data: delivery } = await safeSingle(async () =>
      db.select({
        id: webhookDeliveries.id,
        webhookConfigId: webhookDeliveries.webhookConfigId,
        status: webhookDeliveries.status,
        attemptCount: webhookDeliveries.attemptCount,
        eventType: webhookDeliveries.eventType,
        eventData: webhookDeliveries.eventData,
        maxRetries: webhookConfigs.maxRetries,
        url: webhookConfigs.url,
        organizationId: webhookConfigs.organizationId
      })
      .from(webhookDeliveries)
      .innerJoin(webhookConfigs, eq(webhookDeliveries.webhookConfigId, webhookConfigs.id))
      .where(and(
        eq(webhookDeliveries.id, eventId),
        eq(webhookConfigs.organizationId, membershipData.organizationId)
      ))
    );

    if (!delivery) {
      return NextResponse.json({ error: 'Webhook event not found' }, { status: 404 });
    }

    const deliveryData = delivery as {
      id: string;
      webhookConfigId: string;
      status: string;
      attemptCount: number;
      maxRetries: number;
      eventType: string;
      eventData: any;
      url: string;
      organizationId: string;
    };

    // Check if the event can be retried
    if (deliveryData.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot retry completed events' 
      }, { status: 400 });
    }

    if (deliveryData.attemptCount >= deliveryData.maxRetries) {
      return NextResponse.json({ 
        error: 'Maximum retry attempts reached' 
      }, { status: 400 });
    }

    // Update the delivery status to pending and increment attempt count
    const { error: updateError } = await safeUpdate(async () =>
      db.update(webhookDeliveries)
        .set({
          status: 'pending',
          attemptCount: deliveryData.attemptCount + 1,
          updatedAt: new Date(),
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
        })
        .where(eq(webhookDeliveries.id, eventId))
        .returning({ id: webhookDeliveries.id })
    );

    if (updateError) {
      console.error('Error updating webhook delivery for retry:', updateError);
      return NextResponse.json({ error: 'Failed to schedule retry' }, { status: 500 });
    }

    // Queue the webhook delivery for processing by a background worker
    try {
      const sqsClient = new SQSClient({ 
        region: process.env.AWS_REGION || 'us-east-1' 
      });

      // Create webhook delivery message for SQS
      const webhookMessage = {
        deliveryId: deliveryData.id,
        webhookConfigId: deliveryData.webhookConfigId,
        url: deliveryData.url,
        eventType: deliveryData.eventType,
        eventData: deliveryData.eventData,
        attemptNumber: deliveryData.attemptCount,
        maxRetries: deliveryData.maxRetries,
        organizationId: deliveryData.organizationId,
        retryTimestamp: new Date().toISOString(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Foresight-Webhook/1.0',
          'X-Webhook-Event': deliveryData.eventType,
          'X-Webhook-Delivery': deliveryData.id
        }
      };

      // Calculate delay for exponential backoff (SQS supports up to 15 minutes delay)
      const delaySeconds = Math.min(900, Math.pow(2, deliveryData.attemptCount) * 60);

      const sqsCommand = new SendMessageCommand({
        QueueUrl: process.env.WEBHOOK_DELIVERY_QUEUE_URL || process.env.SQS_WEBHOOK_QUEUE_URL,
        MessageBody: JSON.stringify(webhookMessage),
        DelaySeconds: delaySeconds,
        MessageAttributes: {
          'deliveryId': {
            DataType: 'String',
            StringValue: deliveryData.id
          },
          'eventType': {
            DataType: 'String',
            StringValue: deliveryData.eventType
          },
          'attemptNumber': {
            DataType: 'Number',
            StringValue: deliveryData.attemptCount.toString()
          },
          'organizationId': {
            DataType: 'String',
            StringValue: deliveryData.organizationId
          }
        }
      });

      const sqsResult = await sqsClient.send(sqsCommand);

      return NextResponse.json({
        success: true,
        message: 'Webhook retry queued for delivery',
        queue_message_id: sqsResult.MessageId,
        delay_seconds: delaySeconds,
        attempt_count: deliveryData.attemptCount + 1
      });

    } catch (queueError) {
      console.error('Failed to queue webhook delivery:', queueError);
      
      // If queueing fails, revert the status update
      await safeUpdate(async () =>
        db.update(webhookDeliveries)
          .set({
            status: 'failed',
            updatedAt: new Date(),
            nextRetryAt: null
          })
          .where(eq(webhookDeliveries.id, eventId))
          .returning({ id: webhookDeliveries.id })
      );

      return NextResponse.json({
        success: false,
        message: 'Failed to queue webhook for retry',
        error: queueError instanceof Error ? queueError.message : 'Unknown queue error',
        attempt_count: deliveryData.attemptCount
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook retry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}