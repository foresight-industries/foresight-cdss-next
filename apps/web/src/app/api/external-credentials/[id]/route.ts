import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@foresight-cdss-next/db';
import { externalServiceCredentials, teamMembers } from '@foresight-cdss-next/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { SecretManagerService } from '@/lib/aws/secret-manager';
import { AuditLogger } from '@/lib/aws/audit-logger';

const updateCredentialSchema = z.object({
  credentialName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  enabledFeatures: z.array(z.enum(['erx', 'epa', 'formulary_check'])).optional(),
  credentials: z.object({
    apiKey: z.string().min(1),
    clinicKey: z.string().min(1),
    clinicId: z.string().min(1),
    userId: z.string().min(1),
    subscriptionKey: z.string().min(1),
  }).optional(),
  connectionSettings: z.object({
    timeout: z.number().min(1000).max(60000),
    retryAttempts: z.number().min(0).max(5),
    retryDelay: z.number().min(100).max(10000),
  }).optional(),
  isActive: z.boolean().optional(),
  autoRenew: z.boolean().optional(),
  expiresAt: z.iso.datetime().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auditLogger = new AuditLogger();

    const [credential] = await db
      .select({
        id: externalServiceCredentials.id,
        serviceName: externalServiceCredentials.serviceName,
        serviceType: externalServiceCredentials.serviceType,
        environment: externalServiceCredentials.environment,
        credentialName: externalServiceCredentials.credentialName,
        description: externalServiceCredentials.description,
        isActive: externalServiceCredentials.isActive,
        isValid: externalServiceCredentials.isValid,
        lastValidated: externalServiceCredentials.lastValidated,
        lastValidationError: externalServiceCredentials.lastValidationError,
        lastUsed: externalServiceCredentials.lastUsed,
        usageCount: externalServiceCredentials.usageCount,
        enabledFeatures: externalServiceCredentials.enabledFeatures,
        connectionSettings: externalServiceCredentials.connectionSettings,
        expiresAt: externalServiceCredentials.expiresAt,
        autoRenew: externalServiceCredentials.autoRenew,
        createdAt: externalServiceCredentials.createdAt,
        updatedAt: externalServiceCredentials.updatedAt,
      })
      .from(externalServiceCredentials)
      .where(
        and(
          eq(externalServiceCredentials.id, params.id),
          eq(externalServiceCredentials.organizationId, orgId),
          eq(externalServiceCredentials.deletedAt, null as any)
        )
      );

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    await auditLogger.log({
      organizationId: orgId,
      userId,
      action: 'CREDENTIALS_VIEW',
      resourceType: 'external_service_credentials',
      resourceId: credential.id.toString(),
    });

    return NextResponse.json({ credential });
  } catch (error) {
    console.error('Error fetching credential:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credential' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateCredentialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const secretManager = new SecretManagerService();
    const auditLogger = new AuditLogger();

    // Get user's team member ID
    const teamMember = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.clerkUserId, userId),
          eq(teamMembers.organizationId, orgId)
        )
      )
      .limit(1);

    if (!teamMember.length) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 403 });
    }

    // Get current credential
    const [currentCredential] = await db
      .select()
      .from(externalServiceCredentials)
      .where(
        and(
          eq(externalServiceCredentials.id, params.id),
          eq(externalServiceCredentials.organizationId, orgId),
          eq(externalServiceCredentials.deletedAt, null as any)
        )
      );

    if (!currentCredential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Update credentials in AWS Secrets Manager if provided
    if (data.credentials) {
      await secretManager.updateSecret(currentCredential.secretArn, data.credentials);
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: teamMember[0].id,
      updatedAt: new Date(),
    };

    if (data.credentialName !== undefined) updateData.credentialName = data.credentialName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.enabledFeatures !== undefined) updateData.enabledFeatures = data.enabledFeatures;
    if (data.connectionSettings !== undefined) updateData.connectionSettings = data.connectionSettings;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.autoRenew !== undefined) updateData.autoRenew = data.autoRenew;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    // If we're deactivating and there are other active credentials for the same service, update them
    if (data.isActive === false) {
      updateData.isValid = false;
      updateData.lastValidationError = 'Manually deactivated';
    }

    // Update database record
    const [updatedCredential] = await db
      .update(externalServiceCredentials)
      .set(updateData)
      .where(eq(externalServiceCredentials.id, params.id))
      .returning();

    await auditLogger.log({
      organizationId: orgId,
      userId,
      action: 'CREDENTIALS_UPDATE',
      resourceType: 'external_service_credentials',
      resourceId: updatedCredential.id.toString(),
      details: {
        changes: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'updatedBy'),
        hasCredentialUpdate: !!data.credentials,
      },
    });

    // Return updated credential without sensitive data
    const responseData = {
      id: updatedCredential.id,
      serviceName: updatedCredential.serviceName,
      serviceType: updatedCredential.serviceType,
      environment: updatedCredential.environment,
      credentialName: updatedCredential.credentialName,
      description: updatedCredential.description,
      isActive: updatedCredential.isActive,
      isValid: updatedCredential.isValid,
      lastValidated: updatedCredential.lastValidated,
      lastValidationError: updatedCredential.lastValidationError,
      enabledFeatures: updatedCredential.enabledFeatures,
      connectionSettings: updatedCredential.connectionSettings,
      autoRenew: updatedCredential.autoRenew,
      expiresAt: updatedCredential.expiresAt,
      updatedAt: updatedCredential.updatedAt,
    };

    return NextResponse.json({ credential: responseData });
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretManager = new SecretManagerService();
    const auditLogger = new AuditLogger();

    // Get user's team member ID
    const teamMember = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.clerkUserId, userId),
          eq(teamMembers.organizationId, orgId)
        )
      )
      .limit(1);

    if (!teamMember.length) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 403 });
    }

    // Get current credential
    const [currentCredential] = await db
      .select()
      .from(externalServiceCredentials)
      .where(
        and(
          eq(externalServiceCredentials.id, params.id),
          eq(externalServiceCredentials.organizationId, orgId),
          eq(externalServiceCredentials.deletedAt, null as any)
        )
      );

    if (!currentCredential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Soft delete in database
    await db
      .update(externalServiceCredentials)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedBy: teamMember[0].id,
        updatedAt: new Date(),
      })
      .where(eq(externalServiceCredentials.id, params.id));

    // Delete from AWS Secrets Manager
    await secretManager.deleteSecret(currentCredential.secretArn);

    await auditLogger.log({
      organizationId: orgId,
      userId,
      action: 'CREDENTIALS_DELETE',
      resourceType: 'external_service_credentials',
      resourceId: currentCredential.id.toString(),
      details: {
        serviceName: currentCredential.serviceName,
        environment: currentCredential.environment,
      },
    });

    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
