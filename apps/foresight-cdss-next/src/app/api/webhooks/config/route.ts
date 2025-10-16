import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeSelect, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { webhookConfigs, webhookDeliveries, teamMembers } from '@foresight-cdss-next/db';
import crypto from 'node:crypto';

// Available webhook events
const AVAILABLE_EVENTS = [
  'all',
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'team_member.added',
  'team_member.updated',
  'team_member.removed'
] as const;

// GET - List webhook configurations for current organization
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({ 
        organizationId: teamMembers.organizationId,
        role: teamMembers.role 
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true),
        ...(organizationId ? [eq(teamMembers.organizationId, organizationId)] : [])
      ))
    );

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membershipData = membership as { organizationId: string; role: string };

    // Get webhook configurations for the organization
    const { data: webhooks } = await safeSelect(async () =>
      db.select({
        id: webhookConfigs.id,
        name: webhookConfigs.name,
        url: webhookConfigs.url,
        events: webhookConfigs.events,
        isActive: webhookConfigs.isActive,
        retryCount: webhookConfigs.retryCount,
        timeoutSeconds: webhookConfigs.timeoutSeconds,
        lastDelivery: webhookConfigs.lastDelivery,
        organizationId: webhookConfigs.organizationId,
        createdAt: webhookConfigs.createdAt,
        updatedAt: webhookConfigs.updatedAt
      })
      .from(webhookConfigs)
      .where(eq(webhookConfigs.organizationId, membershipData.organizationId))
      .orderBy(webhookConfigs.createdAt)
    );

    // Get delivery statistics for each webhook
    const webhooksWithStats = await Promise.all(
      (webhooks || []).map(async (webhook) => {
        const webhookData = webhook as {
          id: string;
          name: string;
          url: string;
          events: string;
          isActive: boolean;
          retryCount: number;
          timeoutSeconds: number;
          lastDelivery: Date | null;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
        };

        const { data: deliveries } = await safeSelect(async () =>
          db.select({
            id: webhookDeliveries.id,
            deliveredAt: webhookDeliveries.deliveredAt,
            status: webhookDeliveries.status,
            httpStatus: webhookDeliveries.httpStatus,
            createdAt: webhookDeliveries.createdAt
          })
          .from(webhookDeliveries)
          .where(eq(webhookDeliveries.webhookConfigId, webhookData.id))
          .orderBy(webhookDeliveries.createdAt)
          .limit(10)
        );

        const deliveryList = (deliveries || []) as Array<{
          id: string;
          deliveredAt: Date | null;
          status: string;
          httpStatus: number;
          createdAt: Date;
        }>;

        const stats = {
          total_deliveries: deliveryList.length,
          successful_deliveries: deliveryList.filter(d => d.deliveredAt).length,
          failed_deliveries: deliveryList.filter(d => d.status === 'failed').length,
          recent_deliveries: deliveryList
        };

        return {
          ...webhookData,
          stats
        };
      })
    );

    return NextResponse.json({
      webhooks: webhooksWithStats,
      available_events: AVAILABLE_EVENTS
    });

  } catch (error) {
    console.error('Webhook config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new webhook configuration
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();

    // Validate request body
    const {
      name,
      url,
      events,
      organization_id,
      retry_count = 3,
      timeout_seconds = 30
    } = body;

    if (!name || !url || !events || !Array.isArray(events) || !organization_id) {
      return NextResponse.json({
        error: 'Missing required fields: name, url, events, organization_id'
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate events
    const availableEventsSet = new Set(AVAILABLE_EVENTS as readonly string[]);
    const invalidEvents = events.filter((event: string) => !availableEventsSet.has(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json({
        error: `Invalid events: ${invalidEvents.join(', ')}`
      }, { status: 400 });
    }

    // Verify user has admin permissions for the organization
    const { data: member } = await safeSingle(async () =>
      db.select({ 
        organizationId: teamMembers.organizationId,
        role: teamMembers.role 
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.organizationId, organization_id),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberData = member as { organizationId: string; role: string };
    
    if (!['admin', 'owner'].includes(memberData.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook configuration
    const { data: webhook, error } = await safeInsert(async () =>
      db.insert(webhookConfigs)
        .values({
          organizationId: organization_id,
          name,
          url,
          secret,
          events: JSON.stringify(events),
          retryCount: Math.min(Math.max(retry_count || 3, 1), 10),
          timeoutSeconds: Math.min(Math.max(timeout_seconds || 30, 5), 300),
          isActive: true
        })
        .returning()
    );

    if (error || !webhook || webhook.length === 0) {
      console.error('Error creating webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    const createdWebhook = webhook[0] as {
      id: string;
      name: string;
      url: string;
      events: string;
      isActive: boolean;
      retryCount: number;
      timeoutSeconds: number;
      secret: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
    };

    // Return webhook config without the secret for security
    const { secret: _, ...webhookResponse } = createdWebhook;

    return NextResponse.json({
      webhook: webhookResponse,
      secret_hint: `${secret.substring(0, 8)}...`
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}