import { NextRequest, NextResponse } from 'next/server';
import { requireTeamMembership } from '@/lib/team';
import { createAuthenticatedDatabaseClient, safeSelect, safeInsert } from '@/lib/aws/database';
import { externalServiceCredentials } from '@foresight-cdss-next/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { SecretManagerService } from '@/lib/aws/secret-manager';
import { AuditLogger } from '@/lib/aws/audit-logger';

const createCredentialSchema = z.object({
  serviceName: z.enum(['dosespot']),
  serviceType: z.enum(['erx', 'epa']),
  environment: z.enum(['production', 'sandbox']).default('production'),
  credentialName: z.string().min(1).max(100),
  description: z.string().optional(),
  enabledFeatures: z.array(z.enum(['erx', 'epa', 'formulary_check'])),
  credentials: z.object({
    apiKey: z.string().min(1),
    clinicKey: z.string().min(1),
    clinicId: z.string().min(1),
    userId: z.string().min(1),
    subscriptionKey: z.string().min(1),
  }),
  connectionSettings: z.object({
    timeout: z.number().min(1000).max(60000).default(30000),
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000),
  }).optional(),
  autoRenew: z.boolean().default(false),
  expiresAt: z.iso.datetime().optional(),
});


export async function GET(request: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const { db, userId } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    const auditLogger = new AuditLogger();

    const { data: credentials } = await safeSelect(async () =>
      db.select({
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
          eq(externalServiceCredentials.organizationId, organizationId),
          eq(externalServiceCredentials.deletedAt, null as any)
        )
      )
    );

    await auditLogger.log({
      organizationId,
      userId,
      action: 'CREDENTIALS_LIST',
      resourceType: 'external_service_credentials',
      details: { credentialCount: credentials?.length ?? 0 },
    });

    return NextResponse.json({
      success: true,
      data: { credentials: credentials ?? [] }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const membership = await requireTeamMembership();
    const { db, userId } = await createAuthenticatedDatabaseClient();
    const organizationId = membership.team_id;

    const body = await request.json();
    const validation = createCredentialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const secretManager = new SecretManagerService();
    const auditLogger = new AuditLogger();

    // Check if credential with same service already exists for this organization
    const { data: existingCredential } = await safeSelect(async () =>
      db.select({ id: externalServiceCredentials.id })
        .from(externalServiceCredentials)
        .where(
          and(
            eq(externalServiceCredentials.organizationId, organizationId),
            eq(externalServiceCredentials.serviceName, data.serviceName),
            eq(externalServiceCredentials.environment, data.environment),
            eq(externalServiceCredentials.isActive, true),
            eq(externalServiceCredentials.deletedAt, null as any)
          )
        )
        .limit(1)
    );

    if (existingCredential?.length) {
      return NextResponse.json(
        { error: 'Active credential for this service already exists' },
        { status: 409 }
      );
    }

    // Store credentials in AWS Secrets Manager
    const secretName = `rcm/staging/credentials/${organizationId}/${data.serviceName}/${data.environment}`;
    const secretArn = await secretManager.createSecret(secretName, data.credentials, {
      OrganizationId: organizationId,
      ServiceName: data.serviceName,
      Environment: data.environment,
      CreatedBy: userId,
    });

    // Create database record
    const { data: credentialResult } = await safeInsert(async () =>
      db.insert(externalServiceCredentials)
        .values({
          organizationId,
          serviceName: data.serviceName,
          serviceType: data.serviceType,
          environment: data.environment,
          secretArn,
          secretRegion: 'us-east-1',
          credentialName: data.credentialName,
          description: data.description,
          enabledFeatures: data.enabledFeatures,
          connectionSettings: data.connectionSettings ?? {},
          autoRenew: data.autoRenew,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          createdBy: userId,
        })
        .returning()
    );

    const credential = credentialResult?.[0] as typeof externalServiceCredentials.$inferSelect;
    if (!credential) {
      throw new Error('Failed to create credential');
    }

    await auditLogger.log({
      organizationId,
      userId,
      action: 'CREDENTIALS_CREATE',
      resourceType: 'external_service_credentials',
      resourceId: credential.id.toString(),
      details: {
        serviceName: data.serviceName,
        serviceType: data.serviceType,
        environment: data.environment,
        enabledFeatures: data.enabledFeatures,
      },
    });

    // Return credential without sensitive data
    const responseData = {
      id: credential.id.toString(),
      serviceName: credential.serviceName,
      serviceType: credential.serviceType,
      environment: credential.environment,
      credentialName: credential.credentialName,
      description: credential.description,
      isActive: credential.isActive,
      isValid: credential.isValid,
      enabledFeatures: credential.enabledFeatures,
      connectionSettings: credential.connectionSettings,
      autoRenew: credential.autoRenew,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: { credential: responseData }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: 500 }
    );
  }
}
