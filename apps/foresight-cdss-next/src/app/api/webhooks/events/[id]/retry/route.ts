import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations, webhookConfigs, webhookDeliveries } from '@foresight-cdss-next/db';

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
        maxRetries: webhookDeliveries.maxRetries,
        eventType: webhookDeliveries.eventType,
        requestPayload: webhookDeliveries.requestPayload,
        requestUrl: webhookDeliveries.requestUrl,
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
      requestPayload: string;
      requestUrl: string;
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
          errorMessage: null // Clear previous error
        })
        .where(eq(webhookDeliveries.id, eventId))
    );

    if (updateError) {
      console.error('Error updating webhook delivery for retry:', updateError);
      return NextResponse.json({ error: 'Failed to schedule retry' }, { status: 500 });
    }

    // In a real implementation, you would also queue the webhook for actual delivery
    // This could be done through AWS SQS, Redis Queue, or your preferred queuing system
    // For now, we'll just update the database status

    // Simulate immediate retry attempt (in production, this would be handled by a background worker)
    try {
      // Parse the original payload
      let payload;
      try {
        payload = JSON.parse(deliveryData.requestPayload);
      } catch {
        payload = deliveryData.requestPayload;
      }

      // Make the HTTP request to the webhook endpoint
      const webhookResponse = await fetch(deliveryData.requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Foresight-Webhook/1.0',
          'X-Webhook-Event': deliveryData.eventType,
          'X-Webhook-Delivery': deliveryData.id
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseText = await webhookResponse.text();
      const deliveryLatencyMs = Date.now() - new Date().getTime();

      // Update with the retry result
      await safeUpdate(async () =>
        db.update(webhookDeliveries)
          .set({
            status: webhookResponse.ok ? 'completed' : 'failed',
            httpStatus: webhookResponse.status,
            responseBody: responseText,
            responseHeaders: JSON.stringify(Object.fromEntries(webhookResponse.headers.entries())),
            deliveryLatencyMs,
            updatedAt: new Date(),
            errorMessage: webhookResponse.ok ? null : `HTTP ${webhookResponse.status}: ${responseText}`,
            nextRetryAt: webhookResponse.ok ? null : 
              (deliveryData.attemptCount + 1 < deliveryData.maxRetries ? 
                new Date(Date.now() + Math.pow(2, deliveryData.attemptCount + 1) * 60 * 1000) : // Exponential backoff
                null)
          })
          .where(eq(webhookDeliveries.id, eventId))
      );

      return NextResponse.json({
        success: true,
        message: webhookResponse.ok ? 'Webhook retry successful' : 'Webhook retry failed',
        status: webhookResponse.status,
        attempt_count: deliveryData.attemptCount + 1
      });

    } catch (retryError) {
      console.error('Webhook retry failed:', retryError);
      
      // Update with the retry error
      await safeUpdate(async () =>
        db.update(webhookDeliveries)
          .set({
            status: 'failed',
            errorMessage: retryError instanceof Error ? retryError.message : 'Network error during retry',
            updatedAt: new Date(),
            nextRetryAt: deliveryData.attemptCount + 1 < deliveryData.maxRetries ? 
              new Date(Date.now() + Math.pow(2, deliveryData.attemptCount + 1) * 60 * 1000) : // Exponential backoff
              null
          })
          .where(eq(webhookDeliveries.id, eventId))
      );

      return NextResponse.json({
        success: false,
        message: 'Webhook retry failed due to network error',
        error: retryError instanceof Error ? retryError.message : 'Unknown error',
        attempt_count: deliveryData.attemptCount + 1
      });
    }

  } catch (error) {
    console.error('Webhook retry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}