import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeSelect, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { teamMembers, webhookConfigs, webhookSecrets, webhookEventSubscriptions, webhookDeliveries } from '@foresight-cdss-next/db';
import { SecretsManagerClient, CreateSecretCommand } from '@aws-sdk/client-secrets-manager';
import crypto from 'node:crypto';

// Available webhook events
const AVAILABLE_EVENTS = [
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'organization.settings.changed',
  'user.created',
  'user.updated',
  'user.deleted',
  'user.role.changed',
  'patient.created',
  'patient.updated',
  'patient.deleted',
  'claim.created',
  'claim.updated',
  'claim.submitted',
  'claim.approved',
  'claim.denied',
  'claim.processing.started',
  'claim.processing.completed',
  'document.uploaded',
  'document.processed',
  'document.analysis.completed',
  'document.deleted',
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
    const environment = searchParams.get('environment') as 'staging' | 'production' || 'staging';

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

    // Get webhook configurations for the organization and environment
    const { data: webhooks } = await safeSelect(async () =>
      db.select({
        id: webhookConfigs.id,
        name: webhookConfigs.name,
        description: webhookConfigs.description,
        url: webhookConfigs.url,
        environment: webhookConfigs.environment,
        isActive: webhookConfigs.isActive,
        apiVersion: webhookConfigs.apiVersion,
        retryCount: webhookConfigs.retryCount,
        maxRetries: webhookConfigs.maxRetries,
        timeoutSeconds: webhookConfigs.timeoutSeconds,
        lastDelivery: webhookConfigs.lastDelivery,
        lastSuccessfulDelivery: webhookConfigs.lastSuccessfulDelivery,
        organizationId: webhookConfigs.organizationId,
        createdAt: webhookConfigs.createdAt,
        updatedAt: webhookConfigs.updatedAt
      })
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.organizationId, membershipData.organizationId),
        eq(webhookConfigs.environment, environment),
        isNull(webhookConfigs.deletedAt)
      ))
      .orderBy(webhookConfigs.createdAt)
    );

    // Get event subscriptions and delivery statistics for each webhook
    const webhooksWithDetails = await Promise.all(
      (webhooks || []).map(async (webhook) => {
        const webhookData = webhook as {
          id: string;
          name: string;
          description: string | null;
          url: string;
          environment: 'staging' | 'production';
          isActive: boolean;
          apiVersion: string | null;
          retryCount: number | null;
          maxRetries: number | null;
          timeoutSeconds: number | null;
          lastDelivery: Date | null;
          lastSuccessfulDelivery: Date | null;
          organizationId: string;
          createdAt: Date;
          updatedAt: Date;
        };

        // Get event subscriptions
        const { data: subscriptions } = await safeSelect(async () =>
          db.select({
            eventType: webhookEventSubscriptions.eventType,
            isEnabled: webhookEventSubscriptions.isEnabled
          })
          .from(webhookEventSubscriptions)
          .where(and(
            eq(webhookEventSubscriptions.webhookConfigId, webhookData.id),
            eq(webhookEventSubscriptions.isEnabled, true),
            isNull(webhookEventSubscriptions.deletedAt)
          ))
        );

        const eventSubscriptions = ((subscriptions as Array<{ eventType: string; isEnabled: boolean }>) || []).map(sub => sub.eventType);

        // Get recent delivery statistics
        const { data: deliveries } = await safeSelect(async () =>
          db.select({
            id: webhookDeliveries.id,
            status: webhookDeliveries.status,
            httpStatus: webhookDeliveries.httpStatus,
            attemptCount: webhookDeliveries.attemptCount,
            deliveryLatencyMs: webhookDeliveries.deliveryLatencyMs,
            createdAt: webhookDeliveries.createdAt
          })
          .from(webhookDeliveries)
          .where(eq(webhookDeliveries.webhookConfigId, webhookData.id))
          .orderBy(webhookDeliveries.createdAt)
          .limit(20)
        );

        const deliveryList = (deliveries || []) as Array<{
          id: string;
          status: string;
          httpStatus: number | null;
          attemptCount: number | null;
          deliveryLatencyMs: number | null;
          createdAt: Date;
        }>;

        const stats = {
          total_deliveries: deliveryList.length,
          successful_deliveries: deliveryList.filter(d => d.status === 'completed').length,
          failed_deliveries: deliveryList.filter(d => d.status === 'failed').length,
          pending_deliveries: deliveryList.filter(d => d.status === 'pending').length,
          average_response_time: deliveryList
            .filter(d => d.deliveryLatencyMs !== null)
            .reduce((sum, d) => sum + (d.deliveryLatencyMs || 0), 0) / 
            deliveryList.filter(d => d.deliveryLatencyMs !== null).length || 0,
          recent_deliveries: deliveryList.slice(0, 10)
        };

        return {
          ...webhookData,
          event_subscriptions: eventSubscriptions,
          stats
        };
      })
    );

    return NextResponse.json({
      webhooks: webhooksWithDetails,
      available_events: AVAILABLE_EVENTS,
      environment
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
      description,
      url,
      events,
      organization_id,
      environment = 'staging'
    } = body;

    if (!name || !url || !events || !Array.isArray(events) || !organization_id) {
      return NextResponse.json({
        error: 'Missing required fields: name, url, events, organization_id'
      }, { status: 400 });
    }

    if (!['staging', 'production'].includes(environment)) {
      return NextResponse.json({ error: 'Invalid environment. Must be staging or production' }, { status: 400 });
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

    // Create webhook configuration
    const { data: webhook, error } = await safeInsert(async () =>
      db.insert(webhookConfigs)
        .values({
          organizationId: organization_id,
          name,
          description: description || null,
          url,
          environment: environment as 'staging' | 'production',
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
      description: string | null;
      url: string;
      environment: 'staging' | 'production';
      isActive: boolean;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
    };

    // Generate webhook secret and store in AWS Secrets Manager
    const secretData = {
      key: crypto.randomBytes(32).toString('hex'),
      algorithm: 'sha256'
    };

    const secretsClient = new SecretsManagerClient({});
    const secretName = `foresight-webhook-${createdWebhook.id}-${environment}`;

    try {
      const createSecretResult = await secretsClient.send(new CreateSecretCommand({
        Name: secretName,
        Description: `Webhook signing secret for ${name} (${environment})`,
        SecretString: JSON.stringify(secretData),
        Tags: [
          { Key: 'Project', Value: 'Foresight-CDSS' },
          { Key: 'Environment', Value: environment },
          { Key: 'Component', Value: 'Webhooks' },
          { Key: 'WebhookConfigId', Value: createdWebhook.id },
          { Key: 'OrganizationId', Value: organization_id }
        ]
      }));

      // Store secret reference in database
      const { error: secretError } = await safeInsert(async () =>
        db.insert(webhookSecrets)
          .values({
            webhookConfigId: createdWebhook.id,
            secretId: createSecretResult.ARN!,
            algorithm: 'sha256',
            isActive: true
          })
      );

      if (secretError) {
        console.error('Error storing webhook secret reference:', secretError);
        return NextResponse.json({ error: 'Failed to create webhook secret' }, { status: 500 });
      }

      // Create event subscriptions
      const subscriptionPromises = events.map(eventType =>
        safeInsert(async () =>
          db.insert(webhookEventSubscriptions)
            .values({
              webhookConfigId: createdWebhook.id,
              eventType,
              isEnabled: true
            })
        )
      );

      await Promise.all(subscriptionPromises);

      return NextResponse.json({
        webhook: {
          ...createdWebhook,
          event_subscriptions: events,
          secret_hint: `${secretData.key.substring(0, 8)}...`
        }
      }, { status: 201 });

    } catch (secretError) {
      console.error('Error creating webhook secret:', secretError);
      
      // Clean up the webhook config if secret creation failed
      await db.delete(webhookConfigs).where(eq(webhookConfigs.id, createdWebhook.id));
      
      return NextResponse.json({ 
        error: 'Failed to create webhook secret. Webhook configuration has been rolled back.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}