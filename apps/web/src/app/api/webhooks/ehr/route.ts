import { NextRequest, NextResponse } from 'next/server';
import { db } from '@foresight-cdss-next/db';
import { ehrWebhookEvents, ehrConnections } from '@foresight-cdss-next/db/schema';
import { eq } from 'drizzle-orm';
import { ehrIntegrationService } from '@/lib/services/ehr-integration';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ehrConnectionId = searchParams.get('connectionId');

    if (!ehrConnectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId parameter' },
        { status: 400 }
      );
    }

    // Get EHR connection for validation
    const [ehrConnection] = await db
      .select()
      .from(ehrConnections)
      .where(eq(ehrConnections.id, ehrConnectionId))
      .limit(1);

    if (!ehrConnection) {
      return NextResponse.json(
        { error: 'EHR connection not found' },
        { status: 404 }
      );
    }

    // Verify webhook signature (security)
    const signature = request.headers.get('x-webhook-signature');
    const payload = await request.text();

    if (!verifyWebhookSignature(payload, signature, ehrConnection.clientSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const webhookData = JSON.parse(payload);
    const headers = Object.fromEntries(request.headers.entries());

    // Store webhook event for processing
    const [webhookEvent] = await db
      .insert(ehrWebhookEvents)
      .values({
        organizationId: ehrConnection.organizationId,
        ehrConnectionId: ehrConnection.id,
        eventType: webhookData.eventType || headers['x-event-type'] || 'unknown',
        eventId: webhookData.eventId,
        resourceType: webhookData.resourceType || extractResourceType(webhookData),
        resourceId: webhookData.resourceId || webhookData.id,
        payload: webhookData,
        headers,
        processed: false,
        receivedAt: new Date()
      })
      .returning();

    // Process webhook asynchronously
    processWebhookEvent(webhookEvent.id).catch(error => {
      console.error('Failed to process webhook event:', error);
    });

    return NextResponse.json({
      success: true,
      eventId: webhookEvent.id,
      message: 'Webhook received and queued for processing'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(eventId: string): Promise<void> {
  try {
    const [event] = await db
      .select()
      .from(ehrWebhookEvents)
      .where(eq(ehrWebhookEvents.id, eventId))
      .limit(1);

    if (!event || event.processed) {
      return;
    }

    const payload = event.payload as any;

    // Handle different event types
    switch (event.eventType) {
      case 'patient.created':
      case 'patient.updated':
        await handlePatientEvent(event, payload);
        break;

      case 'encounter.created':
      case 'encounter.updated':
        await handleEncounterEvent(event, payload);
        break;

      case 'observation.created':
      case 'observation.updated':
        await handleObservationEvent(event, payload);
        break;

      default:
        console.warn(`Unhandled webhook event type: ${event.eventType}`);
    }

    // Mark as processed
    await db
      .update(ehrWebhookEvents)
      .set({
        processed: true,
        processedAt: new Date()
      })
      .where(eq(ehrWebhookEvents.id, eventId));

    console.log(`✅ Processed webhook event: ${eventId} (${event.eventType})`);

  } catch (error) {
    console.error(`❌ Failed to process webhook event ${eventId}:`, error);

    // Update error status
    await db
      .update(ehrWebhookEvents)
      .set({
        processingError: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(ehrWebhookEvents.id, eventId));
  }
}

/**
 * Handle patient-related webhook events
 */
async function handlePatientEvent(event: any, payload: any): Promise<void> {
  try {
    // If payload contains full FHIR resource, process it directly
    if (payload.resourceType === 'Patient') {
      await ehrIntegrationService.processFHIRResource(
        event.organizationId,
        event.ehrConnectionId,
        payload
      );
    } else {
      // Fetch the full patient resource from EHR
      const fhirResource = await fetchFHIRResource(
        event.ehrConnectionId,
        'Patient',
        event.resourceId
      );

      if (fhirResource) {
        await ehrIntegrationService.processFHIRResource(
          event.organizationId,
          event.ehrConnectionId,
          fhirResource
        );
      }
    }
  } catch (error) {
    console.error('Error handling patient event:', error);
    throw error;
  }
}

/**
 * Handle encounter-related webhook events
 */
async function handleEncounterEvent(event: any, payload: any): Promise<void> {
  try {
    if (payload.resourceType === 'Encounter') {
      await ehrIntegrationService.processFHIRResource(
        event.organizationId,
        event.ehrConnectionId,
        payload
      );
    } else {
      const fhirResource = await fetchFHIRResource(
        event.ehrConnectionId,
        'Encounter',
        event.resourceId
      );

      if (fhirResource) {
        await ehrIntegrationService.processFHIRResource(
          event.organizationId,
          event.ehrConnectionId,
          fhirResource
        );
      }
    }
  } catch (error) {
    console.error('Error handling encounter event:', error);
    throw error;
  }
}

/**
 * Handle observation-related webhook events
 */
async function handleObservationEvent(event: any, payload: any): Promise<void> {
  try {
    if (payload.resourceType === 'Observation') {
      await ehrIntegrationService.processFHIRResource(
        event.organizationId,
        event.ehrConnectionId,
        payload
      );
    } else {
      const fhirResource = await fetchFHIRResource(
        event.ehrConnectionId,
        'Observation',
        event.resourceId
      );

      if (fhirResource) {
        await ehrIntegrationService.processFHIRResource(
          event.organizationId,
          event.ehrConnectionId,
          fhirResource
        );
      }
    }
  } catch (error) {
    console.error('Error handling observation event:', error);
    throw error;
  }
}

/**
 * Fetch FHIR resource from EHR system
 */
async function fetchFHIRResource(
  ehrConnectionId: string,
  resourceType: string,
  resourceId: string
): Promise<any | null> {
  try {
    // Get EHR connection details
    const [connection] = await db
      .select()
      .from(ehrConnections)
      .where(eq(ehrConnections.id, ehrConnectionId))
      .limit(1);

    if (!connection) {
      throw new Error('EHR connection not found');
    }

    // Implement actual FHIR API call based on EHR type
    // This is a placeholder - would integrate with actual EHR APIs
    const fhirEndpoint = `${connection.baseUrl}/fhir/R4/${resourceType}/${resourceId}`;

    const response = await fetch(fhirEndpoint, {
      headers: {
        'Authorization': `Bearer ${connection.apiKey}`,
        'Accept': 'application/fhir+json'
      }
    });

    if (!response.ok) {
      throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`Failed to fetch FHIR resource ${resourceType}/${resourceId}:`, error);
    return null;
  }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | null
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Extract resource type from webhook payload
 */
function extractResourceType(payload: any): string {
  if (payload.resourceType) {
    return payload.resourceType;
  }

  if (payload.resource?.resourceType) {
    return payload.resource.resourceType;
  }

  // Try to infer from event type
  if (payload.eventType) {
    const type = payload.eventType.split('.')[0];
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  return 'Unknown';
}
