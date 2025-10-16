import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

interface EncounterUpdateEvent {
  encounterId: string;
  organizationId: string;
  clinicalNotes: string;
  changedFields: string[];
  userId?: string;
}

// Initialize EventBridge client only on server side
const getEventBridgeClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('EventBridge client should only be used on the server side');
  }
  
  return new EventBridgeClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });
};

/**
 * Publishes an encounter update event to EventBridge to trigger Comprehend Medical processing
 * This function should only be called from server-side API routes
 */
export async function publishEncounterUpdate(event: EncounterUpdateEvent): Promise<void> {
  try {
    // Only publish if clinical_notes was updated and is not empty
    if (!event.changedFields.includes('clinical_notes') || !event.clinicalNotes?.trim()) {
      console.log('Skipping Comprehend Medical processing - clinical_notes not updated or empty');
      return;
    }

    const eventBridge = getEventBridgeClient();

    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'foresight.encounters',
          DetailType: 'Encounter Updated',
          Detail: JSON.stringify({
            encounterId: event.encounterId,
            organizationId: event.organizationId,
            clinicalNotes: event.clinicalNotes,
            changedFields: event.changedFields,
            userId: event.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await eventBridge.send(command);
    
    console.log(`Published encounter update event for encounter ${event.encounterId} to trigger Comprehend Medical processing`);
  } catch (error) {
    console.error('Error publishing encounter update event:', error);
    // Don't throw - this should not block the main encounter update operation
  }
}

/**
 * Manually trigger Comprehend Medical processing for an encounter
 * Useful for backfill operations or manual processing
 */
export async function triggerManualProcessing(
  encounterId: string,
  organizationId: string,
  clinicalNotes: string
): Promise<void> {
  try {
    if (!clinicalNotes?.trim()) {
      throw new Error('Clinical notes cannot be empty for manual processing');
    }

    const eventBridge = getEventBridgeClient();

    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'foresight.manual',
          DetailType: 'Process Medical Entities',
          Detail: JSON.stringify({
            encounterId,
            organizationId,
            clinicalNotes,
            changedFields: ['clinical_notes'],
            manualTrigger: true,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await eventBridge.send(command);
    
    console.log(`Manually triggered Comprehend Medical processing for encounter ${encounterId}`);
  } catch (error) {
    console.error('Error triggering manual Comprehend Medical processing:', error);
    throw error; // Throw for manual operations since this is the primary purpose
  }
}

/**
 * Batch process multiple encounters for Comprehend Medical analysis
 * Useful for backfill operations
 */
export async function batchProcessEncounters(
  encounters: Array<{
    encounterId: string;
    organizationId: string;
    clinicalNotes: string;
  }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  const eventBridge = getEventBridgeClient();

  // Process in batches of 10 to avoid EventBridge limits
  const batchSize = 10;
  for (let i = 0; i < encounters.length; i += batchSize) {
    const batch = encounters.slice(i, i + batchSize);
    
    const entries = batch
      .filter(encounter => encounter.clinicalNotes?.trim())
      .map(encounter => ({
        Source: 'foresight.manual',
        DetailType: 'Process Medical Entities',
        Detail: JSON.stringify({
          encounterId: encounter.encounterId,
          organizationId: encounter.organizationId,
          clinicalNotes: encounter.clinicalNotes,
          changedFields: ['clinical_notes'],
          batchProcessing: true,
          timestamp: new Date().toISOString(),
        }),
      }));

    if (entries.length === 0) {
      continue;
    }

    try {
      const command = new PutEventsCommand({ Entries: entries });
      await eventBridge.send(command);
      
      results.success += entries.length;
      console.log(`Successfully queued batch of ${entries.length} encounters for Comprehend Medical processing`);
    } catch (error) {
      results.failed += entries.length;
      const errorMessage = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMessage);
      console.error(errorMessage);
    }

    // Add small delay between batches to avoid rate limiting
    if (i + batchSize < encounters.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}