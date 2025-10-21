import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { webhookConfigs, webhookSecrets, teamMembers } from '@foresight-cdss-next/db';
import { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import crypto from 'node:crypto';

// POST - Regenerate webhook secret
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
    const webhookId = params.id;

    // Verify user has admin permissions to the webhook's organization
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

    // Check if user has admin permissions (only admins and owners can regenerate secrets)
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Admin permissions required to regenerate webhook secrets'
      }, { status: 403 });
    }

    // Verify webhook exists and belongs to user's organization
    const { data: webhook } = await safeSingle(async () =>
      db.select({
        id: webhookConfigs.id,
        name: webhookConfigs.name,
        environment: webhookConfigs.environment,
        organizationId: webhookConfigs.organizationId,
        isActive: webhookConfigs.isActive
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

    const webhookData = webhook as {
      id: string;
      name: string;
      environment: 'staging' | 'production';
      organizationId: string;
      isActive: boolean;
    };

    // Generate new secret
    const newSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    const secretData = {
      secret: newSecret,
      algorithm: 'sha256',
      created_at: new Date().toISOString(),
      webhook_id: webhookId,
      organization_id: webhookData.organizationId
    };

    // Initialize AWS Secrets Manager client
    const secretsClient = new SecretsManagerClient({});
    const secretName = `foresight-webhook-${webhookId}-${webhookData.environment}`;

    try {
      // Get existing secret reference from database
      const { data: existingSecretRef } = await safeSingle(async () =>
        db.select({
          secretId: webhookSecrets.secretId,
          isActive: webhookSecrets.isActive
        })
        .from(webhookSecrets)
        .where(and(
          eq(webhookSecrets.webhookConfigId, webhookId),
          eq(webhookSecrets.isActive, true)
        ))
      );

      let secretArn: string;

      if (existingSecretRef) {
        // Update existing secret in AWS Secrets Manager
        const existingSecretData = existingSecretRef as { secretId: string; isActive: boolean };

        try {
          await secretsClient.send(new UpdateSecretCommand({
            SecretId: existingSecretData.secretId,
            SecretString: JSON.stringify(secretData),
            Description: `Webhook signing secret for ${webhookData.name} (${webhookData.environment}) - Regenerated ${new Date().toISOString()}`
          }));

          secretArn = existingSecretData.secretId;
        } catch (updateError) {
          console.error('Error updating existing secret, creating new one:', updateError);

          // If update fails, create a new secret
          const createSecretResult = await secretsClient.send(new CreateSecretCommand({
            Name: `${secretName}-${Date.now()}`, // Add timestamp to avoid conflicts
            Description: `Webhook signing secret for ${webhookData.name} (${webhookData.environment}) - Regenerated`,
            SecretString: JSON.stringify(secretData),
            Tags: [
              { Key: 'Project', Value: 'Foresight-CDSS' },
              { Key: 'Environment', Value: webhookData.environment },
              { Key: 'Component', Value: 'Webhooks' },
              { Key: 'WebhookConfigId', Value: webhookId },
              { Key: 'OrganizationId', Value: webhookData.organizationId },
              { Key: 'Regenerated', Value: 'true' }
            ]
          }));

          if (!createSecretResult.ARN) {
            throw new Error('Failed to get ARN from created secret');
          }
          secretArn = createSecretResult.ARN;
        }
      } else {
        // Create new secret in AWS Secrets Manager
        const createSecretResult = await secretsClient.send(new CreateSecretCommand({
          Name: secretName,
          Description: `Webhook signing secret for ${webhookData.name} (${webhookData.environment})`,
          SecretString: JSON.stringify(secretData),
          Tags: [
            { Key: 'Project', Value: 'Foresight-CDSS' },
            { Key: 'Environment', Value: webhookData.environment },
            { Key: 'Component', Value: 'Webhooks' },
            { Key: 'WebhookConfigId', Value: webhookId },
            { Key: 'OrganizationId', Value: webhookData.organizationId }
          ]
        }));

        if (!createSecretResult.ARN) {
          throw new Error('Failed to get ARN from created secret');
        }
        secretArn = createSecretResult.ARN;
      }

      // Deactivate old secret references in database
      await safeUpdate(async () =>
        db.update(webhookSecrets)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(webhookSecrets.webhookConfigId, webhookId))
          .returning()
      );

      // Insert new secret reference in database
      const { error: secretError } = await safeInsert(async () =>
        db.insert(webhookSecrets)
          .values({
            webhookConfigId: webhookId,
            secretId: secretArn,
            algorithm: 'sha256',
            isActive: true
          })
      );

      if (secretError) {
        console.error('Error storing new webhook secret reference:', secretError);
        return NextResponse.json({
          error: 'Failed to store secret reference'
        }, { status: 500 });
      }

      // Update webhook's updatedAt timestamp
      await safeUpdate(async () =>
        db.update(webhookConfigs)
          .set({ updatedAt: new Date() })
          .where(eq(webhookConfigs.id, webhookId))
          .returning()
      );

      // Return the new secret (this is the only time it will be shown)
      return NextResponse.json({
        message: 'Webhook secret regenerated successfully',
        secret: newSecret,
        webhook_id: webhookId,
        regenerated_at: new Date().toISOString(),
        algorithm: 'sha256'
      });

    } catch (awsError) {
      console.error('Error managing secret in AWS Secrets Manager:', awsError);
      return NextResponse.json({
        error: 'Failed to regenerate webhook secret'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook secret regeneration error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
