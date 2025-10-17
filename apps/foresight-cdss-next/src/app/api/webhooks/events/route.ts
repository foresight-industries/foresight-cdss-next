import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, desc, gte, ilike, or } from 'drizzle-orm';
import { teamMembers, organizations, webhookConfigs, webhookDeliveries } from '@foresight-cdss-next/db';

// GET - Fetch webhook events for a specific webhook
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);

    const webhookId = searchParams.get('webhook_id');
    const teamSlug = searchParams.get('team_slug');
    const status = searchParams.get('status');
    const eventType = searchParams.get('event_type');
    const dateRange = searchParams.get('date_range');
    const search = searchParams.get('search');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    if (!webhookId) {
      return NextResponse.json({ error: 'webhook_id is required' }, { status: 400 });
    }

    // Verify user has access to the webhook through team membership
    let membershipData: { organizationId: string; role: string };

    if (teamSlug) {
      const { data: orgMembership } = await safeSingle(async () =>
        db.select({
          organizationId: teamMembers.organizationId,
          role: teamMembers.role
        })
        .from(teamMembers)
        .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
        .where(and(
          eq(organizations.slug, teamSlug),
          eq(teamMembers.clerkUserId, userId),
          eq(teamMembers.isActive, true)
        ))
      );

      if (!orgMembership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      membershipData = orgMembership as { organizationId: string; role: string };
    } else {
      return NextResponse.json({ error: 'team_slug is required' }, { status: 400 });
    }

    // Verify the webhook belongs to the user's organization
    const { data: webhook } = await safeSingle(async () =>
      db.select({
        id: webhookConfigs.id,
        organizationId: webhookConfigs.organizationId,
        name: webhookConfigs.name
      })
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.id, webhookId),
        eq(webhookConfigs.organizationId, membershipData.organizationId)
      ))
    );

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Build date filter
    let dateFilter;
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
      }

      dateFilter = gte(webhookDeliveries.createdAt, startDate);
    }

    // Build the where conditions
    const whereConditions = [
      eq(webhookDeliveries.webhookConfigId, webhookId)
    ];

    if (status && status !== 'all') {
      whereConditions.push(eq(webhookDeliveries.status, status));
    }

    if (eventType && eventType !== 'all') {
      whereConditions.push(eq(webhookDeliveries.eventType, eventType));
    }

    if (dateFilter) {
      whereConditions.push(dateFilter);
    }

    if (search) {
      const searchCondition = or(
        ilike(webhookDeliveries.eventType, `%${search}%`),
        ilike(webhookDeliveries.id, `%${search}%`), 
        ilike(webhookDeliveries.status, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Fetch webhook deliveries with details
    const { data: deliveries } = await safeSelect(async () =>
      db.select({
        id: webhookDeliveries.id,
        eventType: webhookDeliveries.eventType,
        eventData: webhookDeliveries.eventData,
        status: webhookDeliveries.status,
        createdAt: webhookDeliveries.createdAt,
        updatedAt: webhookDeliveries.updatedAt,
        attemptCount: webhookDeliveries.attemptCount,
        nextRetryAt: webhookDeliveries.nextRetryAt,
        httpStatus: webhookDeliveries.httpStatus,
        deliveryLatencyMs: webhookDeliveries.deliveryLatencyMs,
        responseBody: webhookDeliveries.responseBody,
        responseHeaders: webhookDeliveries.responseHeaders,
        requestHeaders: webhookDeliveries.requestHeaders,
        webhookConfigId: webhookDeliveries.webhookConfigId,
        correlationId: webhookDeliveries.correlationId
      })
      .from(webhookDeliveries)
      .where(and(...whereConditions))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit)
      .offset(offset)
    );

    // Transform the data to match the frontend interface
    const events = (deliveries || []).map((delivery: any) => {
      // Parse JSON fields safely
      let payload, responseHeaders, requestHeaders;

      try {
        payload = delivery.eventData || {};
      } catch {
        payload = { raw: delivery.eventData };
      }

      try {
        responseHeaders = delivery.responseHeaders ? JSON.parse(delivery.responseHeaders) : {};
      } catch {
        responseHeaders = {};
      }

      try {
        requestHeaders = delivery.requestHeaders ? JSON.parse(delivery.requestHeaders) : {};
      } catch {
        requestHeaders = {};
      }

      return {
        id: delivery.id,
        event_type: delivery.eventType,
        status: delivery.status,
        created_at: delivery.createdAt.toISOString(),
        updated_at: delivery.updatedAt.toISOString(),
        attempt_count: delivery.attemptCount || 1,
        max_attempts: 3, // Default max retries since not available in delivery record
        next_retry_at: delivery.nextRetryAt?.toISOString(),
        last_http_status: delivery.httpStatus,
        last_response_time_ms: delivery.deliveryLatencyMs,
        payload,
        response: delivery.responseBody ? {
          status: delivery.httpStatus || 0,
          headers: responseHeaders,
          body: delivery.responseBody,
          timestamp: delivery.updatedAt.toISOString()
        } : undefined,
        request: {
          url: '', // URL is in webhook config, not delivery record
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(payload),
          timestamp: delivery.createdAt.toISOString()
        },
        error_message: null, // Error messages are in delivery attempts table
        delivery_attempts: [
          {
            id: delivery.id,
            attempt_number: delivery.attemptCount || 1,
            timestamp: delivery.updatedAt.toISOString(),
            http_status: delivery.httpStatus,
            response_time_ms: delivery.deliveryLatencyMs,
            error_message: null, // Would need to join with delivery attempts table
            request_headers: requestHeaders,
            response_headers: responseHeaders,
            response_body: delivery.responseBody
          }
        ]
      };
    });

    // Get total count for pagination
    const { data: countResult } = await safeSelect(async () =>
      db.select({
        count: webhookDeliveries.id
      })
      .from(webhookDeliveries)
      .where(and(...whereConditions))
    );

    const totalCount = countResult?.length || 0;

    const webhookData = webhook as { id: string; name: string; organizationId: string };

    return NextResponse.json({
      events,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: totalCount > offset + limit
      },
      webhook: {
        id: webhookData.id,
        name: webhookData.name
      }
    });

  } catch (error) {
    console.error('Webhook events GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
