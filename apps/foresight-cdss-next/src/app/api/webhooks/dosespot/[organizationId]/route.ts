import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { AuditLogger } from '@/lib/aws/audit-logger';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations } from '@foresight-cdss-next/db';

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

// Event handlers for different DoseSpot webhook events
async function handlePrescriptionCreated(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prescription created
  console.log(`Prescription created for org ${organizationId}:`, payload.prescription_id);
  
  // You could:
  // 1. Store prescription data in your database
  // 2. Trigger notifications to providers
  // 3. Update patient records
  // 4. Sync with your EHR system
}

async function handlePrescriptionUpdated(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prescription updated
  console.log(`Prescription updated for org ${organizationId}:`, payload.prescription_id);
}

async function handlePrescriptionDispensed(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prescription dispensed
  console.log(`Prescription dispensed for org ${organizationId}:`, payload.prescription_id);
}

async function handlePriorAuthRequired(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prior auth required
  console.log(`Prior auth required for org ${organizationId}:`, payload.prescription_id);
  
  // You could:
  // 1. Automatically trigger EPA workflow
  // 2. Notify providers about PA requirement
  // 3. Create tasks in your system
}

async function handlePriorAuthApproved(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prior auth approved
  console.log(`Prior auth approved for org ${organizationId}:`, payload.prescription_id);
}

async function handlePriorAuthDenied(organizationId: string, payload: DosespotWebhookPayload) {
  // Implementation for prior auth denied
  console.log(`Prior auth denied for org ${organizationId}:`, payload.prescription_id);
}