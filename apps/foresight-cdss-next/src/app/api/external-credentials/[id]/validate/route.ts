import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@foresight-cdss-next/db';
import { externalServiceCredentials } from '@foresight-cdss-next/db/schema';
import { and, eq } from 'drizzle-orm';
import { SecretManagerService } from '@/lib/aws/secret-manager';
import { DosespotCredentialValidator } from '@/lib/validators/dosespot-validator';
import { AuditLogger } from '@/lib/aws/audit-logger';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let credential;

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretManager = new SecretManagerService();
    const auditLogger = new AuditLogger();

    // Get credential
    [credential] = await db
      .select()
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

    // Retrieve credentials from AWS Secrets Manager
    const credentials = await secretManager.getSecret(credential.secretArn);

    let validationResult: any = { isValid: false, error: 'Unknown validation error' };

    // Validate based on service type
    switch (credential.serviceName) {
      case 'dosespot': {
        const dosespotValidator = new DosespotCredentialValidator();
        validationResult = await dosespotValidator.validate(credentials, credential.environment);
        break;
      }
      default:
        validationResult = {
          isValid: false,
          error: `Validation not implemented for service: ${credential.serviceName}`,
        };
    }

    // Update credential validation status
    const updateData: any = {
      isValid: validationResult.isValid,
      lastValidated: new Date(),
      validationAttempts: (credential?.validationAttempts ?? 0) + 1,
    };

    if (validationResult.isValid) {
      updateData.lastValidationError = null;
    } else {
      updateData.lastValidationError = validationResult.error;
    }

    await db
      .update(externalServiceCredentials)
      .set(updateData)
      .where(eq(externalServiceCredentials.id, params.id));

    await auditLogger.log({
      organizationId: orgId,
      userId,
      action: 'CREDENTIALS_VALIDATE',
      resourceType: 'external_service_credentials',
      resourceId: credential.id,
      details: {
        serviceName: credential.serviceName,
        environment: credential.environment,
        isValid: validationResult.isValid,
        error: validationResult.error || null,
      },
    });

    return NextResponse.json({
      isValid: validationResult.isValid,
      error: validationResult.error || null,
      lastValidated: updateData.lastValidated,
      validationAttempts: updateData.validationAttempts,
    });
  } catch (error) {
    console.error('Error validating credential:', error);

    // Update validation attempt count even on error
    try {
      await db
        .update(externalServiceCredentials)
        .set({
          validationAttempts: (credential?.validationAttempts ?? 0) + 1,
          lastValidationError: 'Validation service error',
        })
        .where(eq(externalServiceCredentials.id, params.id));
    } catch (updateError) {
      console.error('Error updating validation attempt:', updateError);
    }

    return NextResponse.json(
      { error: 'Failed to validate credential' },
      { status: 500 }
    );
  }
}
