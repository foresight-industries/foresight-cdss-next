import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { AuditLogger } from '@/lib/aws/audit-logger';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations } from '@foresight-cdss-next/db';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

interface DosespotWebhookPayload {
  event_type: string;
  prescription_id?: string;
  patient_id?: string;
  provider_id?: string;
  status?: string;
  timestamp: string;
  [key: string]: any;
}

// Helper function to extract client IP from request headers
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const auditLogger = new AuditLogger();

  try {
    const { organizationId } = await params;
    const payload: DosespotWebhookPayload = await request.json();

    // Verify organization exists and is active
    const { db } = await createAuthenticatedDatabaseClient();
    const { data: organization } = await safeSingle(async () =>
      db.select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt)
        ))
    );

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Log webhook receipt for audit compliance
    await auditLogger.logCredentialUsage(
      organizationId,
      'system', // system user for webhooks
      'dosespot-webhook',
      'dosespot',
      `webhook_${payload.event_type}`,
      true,
      {
        event_type: payload.event_type,
        prescription_id: payload.prescription_id,
        webhook_url: request.url,
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    );

    // Process webhook based on event type
    switch (payload.event_type) {
      case 'prescription_created':
        await handlePrescriptionCreated(organizationId, payload);
        break;

      case 'prescription_updated':
        await handlePrescriptionUpdated(organizationId, payload);
        break;

      case 'prescription_dispensed':
        await handlePrescriptionDispensed(organizationId, payload);
        break;

      case 'prior_authorization_required':
        await handlePriorAuthRequired(organizationId, payload);
        break;

      case 'prior_authorization_approved':
        await handlePriorAuthApproved(organizationId, payload);
        break;

      case 'prior_authorization_denied':
        await handlePriorAuthDenied(organizationId, payload);
        break;

      default:
        console.warn(`Unknown DoseSpot event type: ${payload.event_type}`);
        // Still return success to avoid webhook retries
        break;
    }

    return NextResponse.json({
      success: true,
      organization_id: organizationId,
      event_processed: payload.event_type
    });

  } catch (error) {
    console.error('DoseSpot webhook processing error:', error);

    // Log security event for failed webhook processing
    try {
      const { organizationId } = await params;
      await auditLogger.logSecurityEvent(
        organizationId,
        'system',
        'VALIDATION_FAILURE',
        'DoseSpot webhook processing failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: request.url,
          ip_address: getClientIP(request)
        }
      );
    } catch (auditError) {
      console.error('Failed to log security event:', auditError);
    }

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        organization_id: (await params).organizationId
      },
      { status: 500 }
    );
  }
}

// Initialize Step Functions client
const stepFunctionsClient = new SFNClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Helper function to send webhook events to organizations
async function sendOrganizationWebhook(
  organizationId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<boolean> {
  try {
    const { db } = await createAuthenticatedDatabaseClient();

    // Get organization webhook configuration
    const { data: organization } = await safeSingle(async () =>
      db.select({
        id: organizations.id,
        name: organizations.name,
        settings: organizations.settings
      })
      .from(organizations)
      .where(and(
        eq(organizations.id, organizationId),
        isNull(organizations.deletedAt)
      ))
    );

    if (!organization || !organization.settings) {
      console.log(`No webhook configuration found for organization ${organizationId}`);
      return false;
    }

    // Extract webhook URL from organization settings
    const settings = organization.settings as Record<string, unknown>;
    const webhookConfig = settings.webhooks as Record<string, unknown> | undefined;
    const webhookUrl = webhookConfig?.url as string | undefined;

    if (!webhookUrl) {
      console.log(`No webhook URL configured for organization ${organizationId}`);
      return false;
    }

    // Prepare webhook payload
    const webhookPayload = {
      event_type: eventType,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      data: eventData,
      source: 'foresight_cdss',
      version: '1.0'
    };

    // Send webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Foresight-CDSS-Webhook/1.0',
        'X-Webhook-Source': 'foresight-cdss',
        'X-Organization-ID': organizationId,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (response.ok) {
      console.log(`Successfully sent ${eventType} webhook to organization ${organizationId}`);

      // Log successful webhook delivery
      const auditLogger = new AuditLogger();
      await auditLogger.logCredentialUsage(
        organizationId,
        'system',
        'outbound-webhook',
        'organization-webhook',
        `webhook_sent_${eventType}`,
        true,
        {
          webhookUrl,
          eventType,
          responseStatus: response.status,
          deliveredAt: new Date().toISOString(),
        }
      );

      return true;
    } else {
      console.error(`Failed to send webhook to organization ${organizationId}: ${response.status} ${response.statusText}`);

      // Log failed webhook delivery
      const auditLogger = new AuditLogger();
      await auditLogger.logSecurityEvent(
        organizationId,
        'system',
        'VALIDATION_FAILURE',
        'Failed to deliver webhook to organization',
        {
          webhookUrl,
          eventType,
          responseStatus: response.status,
          responseText: await response.text().catch(() => 'Unable to read response'),
          error: 'Webhook delivery failed',
        }
      );

      return false;
    }
  } catch (error) {
    console.error(`Error sending webhook to organization ${organizationId}:`, error);

    // Log webhook error
    try {
      const auditLogger = new AuditLogger();
      await auditLogger.logSecurityEvent(
        organizationId,
        'system',
        'VALIDATION_FAILURE',
        'Webhook delivery error',
        {
          eventType,
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString(),
        }
      );
    } catch (auditError) {
      console.error('Failed to log webhook error:', auditError);
    }

    return false;
  }
}

// Helper function to start Step Function execution
async function startPriorAuthWorkflow(
  organizationId: string,
  workflowInput: Record<string, unknown>
): Promise<string | null> {
  try {
    const stageName = process.env.NODE_ENV || 'staging';
    const accountId = process.env.AWS_ACCOUNT_ID;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!accountId) {
      console.error('AWS_ACCOUNT_ID environment variable not set');
      return null;
    }

    const stateMachineArn = `arn:aws:states:${region}:${accountId}:stateMachine:rcm-prior-auth-${stageName}`;
    const executionName = `dosespot-${organizationId}-${Date.now()}`;

    const command = new StartExecutionCommand({
      stateMachineArn,
      name: executionName,
      input: JSON.stringify(workflowInput),
    });

    const response = await stepFunctionsClient.send(command);
    console.log(`Started PA workflow execution: ${response.executionArn}`);
    return response.executionArn || null;
  } catch (error) {
    console.error('Failed to start prior auth workflow:', error);
    return null;
  }
}

// Event handlers for different DoseSpot webhook events
async function handlePrescriptionCreated(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prescription created for org ${organizationId}:`, payload.prescription_id);

  try {
    // Insert prescription record for tracking
    console.log('Prescription created:', {
      prescriptionId: payload.prescription_id,
      organizationId,
      patientId: payload.patient_id,
      providerId: payload.provider_id,
      status: 'created',
      dosespotData: payload,
    });

    // Future: Insert actual database record here
    // await db.insert(prescriptions).values({...})
  } catch (error) {
    console.error('Failed to store prescription data:', error);
  }
}

async function handlePrescriptionUpdated(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prescription updated for org ${organizationId}:`, payload.prescription_id);

  // Update prescription status in database
  console.log('Updating prescription status:', {
    prescriptionId: payload.prescription_id,
    status: payload.status,
    updatedData: payload,
  });
}

async function handlePrescriptionDispensed(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prescription dispensed for org ${organizationId}:`, payload.prescription_id);

  // Mark prescription as dispensed
  console.log('Marking prescription as dispensed:', {
    prescriptionId: payload.prescription_id,
    dispensedAt: new Date().toISOString(),
  });
}

async function handlePriorAuthRequired(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prior auth required for org ${organizationId}:`, payload.prescription_id);

  const workflowInput = {
    organizationId,
    prescriptionId: payload.prescription_id,
    patientId: payload.patient_id,
    providerId: payload.provider_id,
    dosespot: {
      event: payload,
      timestamp: payload.timestamp,
      requiresPA: true,
    },
    source: 'dosespot_webhook',
    triggerType: 'pa_required',
    workflow: {
      startedAt: new Date().toISOString(),
      initiatedBy: 'dosespot',
    },
  };

  const executionArn = await startPriorAuthWorkflow(organizationId, workflowInput);

  if (executionArn) {
    console.log(`Successfully started PA workflow: ${executionArn}`);

    // Log the workflow execution start
    const auditLogger = new AuditLogger();
    await auditLogger.logCredentialUsage(
      organizationId,
      'system',
      'dosespot-workflow',
      'stepfunctions',
      'start_prior_auth_workflow',
      true,
      {
        executionArn,
        prescriptionId: payload.prescription_id,
        workflowType: 'prior_authorization',
      }
    );
  } else {
    console.error('Failed to start PA workflow, manual intervention required');

    // Log the failure
    const auditLogger = new AuditLogger();
    await auditLogger.logSecurityEvent(
      organizationId,
      'system',
      'VALIDATION_FAILURE',
      'Failed to start prior auth workflow from DoseSpot webhook',
      {
        prescriptionId: payload.prescription_id,
        error: 'Step Function execution failed',
      }
    );
  }

  // **SEND WEBHOOK TO ORGANIZATION ABOUT PA REQUIRED**
  await sendOrganizationWebhook(
    organizationId,
    'prior_authorization_required',
    {
      prescription_id: payload.prescription_id,
      patient_id: payload.patient_id,
      provider_id: payload.provider_id,
      status: 'pa_required',
      workflow_execution_arn: executionArn,
      dosespot_event: {
        event_type: payload.event_type,
        timestamp: payload.timestamp,
      },
      created_at: new Date().toISOString(),
    }
  );
}

async function handlePriorAuthApproved(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prior auth approved for org ${organizationId}:`, payload.prescription_id);

  try {
    console.log('Updating prior auth status to approved:', {
      prescriptionId: payload.prescription_id,
      approvedAt: new Date().toISOString(),
      approvalData: payload,
    });

    // Future: Update actual database record here
    // const { db } = await createAuthenticatedDatabaseClient();
    // await db.update(priorAuthorizations).set({...})

    // Log the approval
    const auditLogger = new AuditLogger();
    await auditLogger.logCredentialUsage(
      organizationId,
      'system',
      'dosespot-approval',
      'dosespot',
      'prior_auth_approved',
      true,
      {
        prescriptionId: payload.prescription_id,
        approvedAt: new Date().toISOString(),
      }
    );

  } catch (error) {
    console.error('Failed to update PA approval status:', error);
  }

  // **SEND WEBHOOK TO ORGANIZATION ABOUT PA APPROVED**
  await sendOrganizationWebhook(
    organizationId,
    'prior_authorization_approved',
    {
      prescription_id: payload.prescription_id,
      patient_id: payload.patient_id,
      provider_id: payload.provider_id,
      status: 'approved',
      approval_code: payload.approval_code,
      approval_number: payload.approval_number,
      dosespot_event: {
        event_type: payload.event_type,
        timestamp: payload.timestamp,
      },
      approved_at: new Date().toISOString(),
    }
  );
}

async function handlePriorAuthDenied(organizationId: string, payload: DosespotWebhookPayload) {
  console.log(`Prior auth denied for org ${organizationId}:`, payload.prescription_id);

  // **INTEGRATION WITH DENIAL ANALYSIS WORKFLOW**
  const denialAnalysisInput = {
    organizationId,
    prescriptionId: payload.prescription_id,
    denialReason: payload.denial_reason || 'No reason provided',
    denialCode: payload.denial_code,
    dosespot: {
      event: payload,
      timestamp: payload.timestamp,
    },
    source: 'dosespot_webhook',
    triggerType: 'pa_denied',
    analysis: {
      requiresAnalysis: true,
      autoRetryEligible: true,
      startedAt: new Date().toISOString(),
    },
  };

  // Start the denial analysis workflow
  const executionArn = await startPriorAuthWorkflow(organizationId, denialAnalysisInput);

  if (executionArn) {
    console.log(`Started denial analysis workflow: ${executionArn}`);
  }

  // Log the denial
  const auditLogger = new AuditLogger();
  await auditLogger.logCredentialUsage(
    organizationId,
    'system',
    'dosespot-denial',
    'dosespot',
    'prior_auth_denied',
    true,
    {
      prescriptionId: payload.prescription_id,
      denialReason: payload.denial_reason,
      denialCode: payload.denial_code,
      deniedAt: new Date().toISOString(),
    }
  );

  // **SEND WEBHOOK TO ORGANIZATION ABOUT PA DENIED**
  await sendOrganizationWebhook(
    organizationId,
    'prior_authorization_denied',
    {
      prescription_id: payload.prescription_id,
      patient_id: payload.patient_id,
      provider_id: payload.provider_id,
      status: 'denied',
      denial_reason: payload.denial_reason || 'No reason provided',
      denial_code: payload.denial_code,
      analysis_workflow_arn: executionArn,
      dosespot_event: {
        event_type: payload.event_type,
        timestamp: payload.timestamp,
      },
      denied_at: new Date().toISOString(),
    }
  );
}
