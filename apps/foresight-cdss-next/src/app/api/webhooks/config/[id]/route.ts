import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeSelect, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { webhookConfigs, webhookDeliveries, teamMembers, organizations } from '@foresight-cdss-next/db';

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

// GET - Get specific webhook configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const webhookId = params.id;

    // Verify user has access to the webhook's organization
    const { data: membership } = await safeSingle(async () =>
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

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membershipData = membership as { organizationId: string; role: string };

    // Get webhook with organization verification
    const { data: webhook } = await safeSingle(async () =>
      db.select({
        id: webhookConfigs.id,
        name: webhookConfigs.name,
        url: webhookConfigs.url,
        events: webhookConfigs.events,
        isActive: webhookConfigs.isActive,
        retryCount: webhookConfigs.retryCount,
        timeoutSeconds: webhookConfigs.timeoutSeconds,
        secret: webhookConfigs.secret,
        organizationId: webhookConfigs.organizationId,
        createdAt: webhookConfigs.createdAt,
        updatedAt: webhookConfigs.updatedAt,
        organizationName: organizations.name,
        organizationSlug: organizations.slug
      })
      .from(webhookConfigs)
      .leftJoin(organizations, eq(webhookConfigs.organizationId, organizations.id))
      .where(and(
        eq(webhookConfigs.id, webhookId),
        eq(webhookConfigs.organizationId, membershipData.organizationId)
      ))
    );

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get delivery stats
    const { data: deliveries } = await safeSelect(async () =>
      db.select({
        id: webhookDeliveries.id,
        eventType: webhookDeliveries.eventType,
        httpStatus: webhookDeliveries.httpStatus,
        deliveredAt: webhookDeliveries.deliveredAt,
        status: webhookDeliveries.status,
        createdAt: webhookDeliveries.createdAt
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookConfigId, webhookId))
      .orderBy(webhookDeliveries.createdAt)
      .limit(20)
    );

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhookData = webhook as {
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
      organizationName: string;
      organizationSlug: string;
    };

    const deliveryList = (deliveries || []) as Array<{
      id: string;
      eventType: string;
      httpStatus: number;
      deliveredAt: Date | null;
      status: string;
      createdAt: Date;
    }>;
    
    const stats = {
      total_deliveries: deliveryList.length,
      successful_deliveries: deliveryList.filter(d => d.deliveredAt).length,
      failed_deliveries: deliveryList.filter(d => d.status === 'failed').length,
      last_delivery: deliveryList[0]?.createdAt || null,
      recent_deliveries: deliveryList
    };

    // Remove secret from response for security
    const { secret, organizationName, organizationSlug, organizationId, ...webhookResponse } = webhookData;

    return NextResponse.json({
      webhook: {
        ...webhookResponse,
        secret_hint: secret ? `${secret.substring(0, 8)}...` : null,
        organization: {
          id: organizationId,
          name: organizationName,
          slug: organizationSlug
        }
      },
      stats
    });

  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update webhook configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const webhookId = params.id;
    const body = await request.json();

    // Validate permissions
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
    
    if (!['admin', 'owner'].includes(memberData.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify webhook belongs to user's organization
    const { data: existingWebhook } = await safeSingle(async () =>
      db.select({ organizationId: webhookConfigs.organizationId })
      .from(webhookConfigs)
      .where(eq(webhookConfigs.id, webhookId))
    );

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const existingWebhookData = existingWebhook as { organizationId: string };
    
    if (existingWebhookData.organizationId !== memberData.organizationId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = new Set(['name', 'url', 'events', 'isActive', 'retryCount', 'timeoutSeconds']);
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      // Map legacy field names to new schema
      let mappedKey: string;
      if (key === 'retry_count') {
        mappedKey = 'retryCount';
      } else if (key === 'timeout_seconds') {
        mappedKey = 'timeoutSeconds';
      } else if (key === 'active') {
        mappedKey = 'isActive';
      } else {
        mappedKey = key;
      }
      
      if (allowedFields.has(mappedKey)) {
        updates[mappedKey] = value;
      }
    }

    // Validate URL if provided
    if (updates.url) {
      try {
        new URL(updates.url as string);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    // Validate events if provided
    if (updates.events) {
      if (!Array.isArray(updates.events)) {
        return NextResponse.json({ error: 'Events must be an array' }, { status: 400 });
      }

      const availableEventsSet = new Set(AVAILABLE_EVENTS as readonly string[]);
      const invalidEvents = (updates.events as string[]).filter(event => !availableEventsSet.has(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json({
          error: `Invalid events: ${invalidEvents.join(', ')}`
        }, { status: 400 });
      }
    }

    // Clamp numeric values
    if (updates.retryCount !== undefined) {
      updates.retryCount = Math.min(Math.max(updates.retryCount as number, 1), 10);
    }
    if (updates.timeoutSeconds !== undefined) {
      updates.timeoutSeconds = Math.min(Math.max(updates.timeoutSeconds as number, 5), 300);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update webhook
    const { data: webhook, error } = await safeUpdate(async () =>
      db.update(webhookConfigs)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(webhookConfigs.id, webhookId))
        .returning()
    );

    if (error || !webhook || webhook.length === 0) {
      console.error('Error updating webhook:', error);
      return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
    }

    const updatedWebhook = webhook[0] as {
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

    // Return without secret
    const { secret, ...webhookResponse } = updatedWebhook;

    return NextResponse.json({
      webhook: {
        ...webhookResponse,
        secret_hint: secret ? `${secret.substring(0, 8)}...` : null
      }
    });

  } catch (error) {
    console.error('Webhook PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete webhook configuration
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const webhookId = params.id;

    // Validate permissions
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
    
    if (!['admin', 'owner'].includes(memberData.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify webhook belongs to user's organization
    const { data: existingWebhook } = await safeSingle(async () =>
      db.select({ organizationId: webhookConfigs.organizationId })
      .from(webhookConfigs)
      .where(eq(webhookConfigs.id, webhookId))
    );

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const existingWebhookData = existingWebhook as { organizationId: string };
    
    if (existingWebhookData.organizationId !== memberData.organizationId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook
    const { error } = await safeDelete(async () =>
      db.delete(webhookConfigs)
        .where(eq(webhookConfigs.id, webhookId))
    );

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Webhook deleted successfully',
      webhook_id: webhookId
    });

  } catch (error) {
    console.error('Webhook DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
