import { db } from '@foresight-cdss-next/db';
import {
  fhirResources,
  ehrSyncJobs,
  ehrConnections,
  patients,
  encounters,
  type FhirResource,
  type NewFhirResource,
  type EhrSyncJob,
  type NewEhrSyncJob
} from '@foresight-cdss-next/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  [key: string]: any;
}

export interface EHRSyncConfig {
  organizationId: string;
  ehrConnectionId: string;
  resourceTypes: string[];
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    patientIds?: string[];
  };
  batchSize?: number;
}

export class EHRIntegrationService {

  /**
   * Process incoming FHIR resource from EHR system
   */
  async processFHIRResource(
    organizationId: string,
    ehrConnectionId: string,
    fhirResource: FHIRResource
  ): Promise<FhirResource> {
    const existingResource = await this.findExistingResource(
      ehrConnectionId,
      fhirResource.id,
      fhirResource.resourceType
    );

    const extractedData = this.extractResourceData(fhirResource);
    let localEntityId: string | null = null;

    // Map to local entities based on resource type
    if (fhirResource.resourceType === 'Patient') {
      localEntityId = await this.upsertPatient(organizationId, fhirResource, extractedData);
    } else if (fhirResource.resourceType === 'Encounter') {
      localEntityId = await this.upsertEncounter(organizationId, fhirResource, extractedData);
    }

    const resourceData: NewFhirResource = {
      organizationId,
      ehrConnectionId,
      fhirId: fhirResource.id,
      resourceType: fhirResource.resourceType,
      resourceVersion: fhirResource.meta?.versionId || '1',
      localEntityId,
      localEntityType: this.getLocalEntityType(fhirResource.resourceType),
      fhirData: fhirResource,
      extractedData,
      lastSyncAt: new Date(),
      syncStatus: 'synced'
    };

    if (existingResource) {
      // Update existing resource
      const [updatedResource] = await db
        .update(fhirResources)
        .set({
          ...resourceData,
          updatedAt: new Date()
        })
        .where(eq(fhirResources.id, existingResource.id))
        .returning();

      return updatedResource;
    } else {
      // Create new resource
      const [newResource] = await db
        .insert(fhirResources)
        .values(resourceData)
        .returning();

      return newResource;
    }
  }

  /**
   * Create EHR sync job for bulk data import
   */
  async createSyncJob(config: EHRSyncConfig): Promise<EhrSyncJob> {
    const jobData: NewEhrSyncJob = {
      organizationId: config.organizationId,
      ehrConnectionId: config.ehrConnectionId,
      jobType: 'full_sync',
      resourceTypes: config.resourceTypes,
      filters: config.filters || {},
      status: 'pending'
    };

    const [syncJob] = await db
      .insert(ehrSyncJobs)
      .values(jobData)
      .returning();

    return syncJob;
  }

  /**
   * Process EHR sync job - fetch and process resources in batches
   */
  async processSyncJob(syncJobId: string): Promise<void> {
    const syncJob = await this.getSyncJob(syncJobId);
    if (!syncJob) throw new Error('Sync job not found');

    await this.updateSyncJobStatus(syncJobId, 'running', { startedAt: new Date() });

    try {
      const ehrConnection = await this.getEHRConnection(syncJob.ehrConnectionId);
      if (!ehrConnection) throw new Error('EHR connection not found');

      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ resourceType: string; fhirId: string; error: string }> = [];

      // Process each resource type
      for (const resourceType of (syncJob.resourceTypes ?? [])) {
        const resources = await this.fetchResourcesFromEHR(
          ehrConnection,
          resourceType,
          syncJob.filters ?? {}
        );

        await this.updateSyncJobProgress(syncJobId, {
          totalResources: (syncJob.totalResources || 0) + resources.length
        });

        // Process resources in batches
        const batchSize = 50;
        for (let i = 0; i < resources.length; i += batchSize) {
          const batch = resources.slice(i, i + batchSize);

          for (const resource of batch) {
            try {
              await this.processFHIRResource(
                syncJob.organizationId,
                syncJob.ehrConnectionId,
                resource
              );
              successCount++;
            } catch (error) {
              errorCount++;
              errors.push({
                resourceType,
                fhirId: resource.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
            processedCount++;
          }

          // Update progress
          await this.updateSyncJobProgress(syncJobId, {
            processedResources: processedCount,
            successfulResources: successCount,
            failedResources: errorCount,
            progress: Math.round((processedCount / (syncJob.totalResources || 1)) * 100)
          });
        }
      }

      // Complete the job
      await this.updateSyncJobStatus(syncJobId, 'completed', {
        completedAt: new Date(),
        result: {
          summary: {
            total: processedCount,
            successful: successCount,
            failed: errorCount
          },
          errors,
          warnings: []
        }
      });

    } catch (error) {
      await this.updateSyncJobStatus(syncJobId, 'failed', {
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get FHIR resources for organization with local entity mapping
   */
  async getOrganizationFHIRResources(
    organizationId: string,
    resourceType?: string,
    limit = 100
  ): Promise<FhirResource[]> {
    // Build the where condition based on parameters
    const whereConditions = [eq(fhirResources.organizationId, organizationId)];

    if (resourceType) {
      whereConditions.push(eq(fhirResources.resourceType, resourceType));
    }

    const query = db
      .select()
      .from(fhirResources)
      .where(and(...whereConditions))
      .orderBy(desc(fhirResources.lastSyncAt))
      .limit(limit);

    return query;
  }

  /**
   * Get cross-provider analytics data
   */
  async getCrossProviderAnalytics(organizationIds: string[]) {
    // Get patient counts per organization
    const patientCounts = await db
      .select({
        organizationId: patients.organizationId,
        count: db.$count(patients)
      })
      .from(patients)
      .where(inArray(patients.organizationId, organizationIds))
      .groupBy(patients.organizationId);

    // Get encounter counts per organization
    const encounterCounts = await db
      .select({
        organizationId: encounters.organizationId,
        count: db.$count(encounters)
      })
      .from(encounters)
      .where(inArray(encounters.organizationId, organizationIds))
      .groupBy(encounters.organizationId);

    // Get FHIR sync status per organization
    const syncStatus = await db
      .select({
        organizationId: fhirResources.organizationId,
        resourceType: fhirResources.resourceType,
        syncStatus: fhirResources.syncStatus,
        count: db.$count(fhirResources)
      })
      .from(fhirResources)
      .where(inArray(fhirResources.organizationId, organizationIds))
      .groupBy(
        fhirResources.organizationId,
        fhirResources.resourceType,
        fhirResources.syncStatus
      );

    return {
      patientCounts,
      encounterCounts,
      syncStatus,
      totalProviders: organizationIds.length
    };
  }

  // Private helper methods
  private async findExistingResource(
    ehrConnectionId: string,
    fhirId: string,
    resourceType: string
  ): Promise<FhirResource | null> {
    const [existing] = await db
      .select()
      .from(fhirResources)
      .where(and(
        eq(fhirResources.ehrConnectionId, ehrConnectionId),
        eq(fhirResources.fhirId, fhirId),
        eq(fhirResources.resourceType, resourceType)
      ))
      .limit(1);

    return existing || null;
  }

  private extractResourceData(fhirResource: FHIRResource): Record<string, any> {
    const extracted: Record<string, any> = {};

    switch (fhirResource.resourceType) {
      case 'Patient':
        extracted.firstName = fhirResource.name?.[0]?.given?.[0];
        extracted.lastName = fhirResource.name?.[0]?.family;
        extracted.birthDate = fhirResource.birthDate;
        extracted.gender = fhirResource.gender;
        extracted.phone = fhirResource.telecom?.find((t: any) => t.system === 'phone')?.value;
        extracted.email = fhirResource.telecom?.find((t: any) => t.system === 'email')?.value;
        break;

      case 'Encounter':
        extracted.status = fhirResource.status;
        extracted.class = fhirResource.class?.code;
        extracted.period = fhirResource.period;
        extracted.patientReference = fhirResource.subject?.reference;
        break;
    }

    return extracted;
  }

  private async upsertPatient(
    organizationId: string,
    fhirResource: FHIRResource,
    extractedData: Record<string, any>
  ): Promise<string | null> {
    // Implementation would create/update patient in your patients table
    // Return the patient ID for mapping
    return null; // Placeholder
  }

  private async upsertEncounter(
    organizationId: string,
    fhirResource: FHIRResource,
    extractedData: Record<string, any>
  ): Promise<string | null> {
    // Implementation would create/update encounter in your encounters table
    // Return the encounter ID for mapping
    return null; // Placeholder
  }

  private getLocalEntityType(resourceType: string): string | null {
    const mapping: Record<string, string> = {
      'Patient': 'patient',
      'Encounter': 'encounter'
    };
    return mapping[resourceType] || null;
  }

  private async getSyncJob(syncJobId: string): Promise<EhrSyncJob | null> {
    const [job] = await db
      .select()
      .from(ehrSyncJobs)
      .where(eq(ehrSyncJobs.id, syncJobId))
      .limit(1);

    return job || null;
  }

  private async getEHRConnection(ehrConnectionId: string) {
    const [connection] = await db
      .select()
      .from(ehrConnections)
      .where(eq(ehrConnections.id, ehrConnectionId))
      .limit(1);

    return connection || null;
  }

  private async updateSyncJobStatus(
    syncJobId: string,
    status: string,
    updates: Partial<EhrSyncJob>
  ): Promise<void> {
    await db
      .update(ehrSyncJobs)
      .set({
        status,
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(ehrSyncJobs.id, syncJobId));
  }

  private async updateSyncJobProgress(
    syncJobId: string,
    progress: Partial<EhrSyncJob>
  ): Promise<void> {
    await db
      .update(ehrSyncJobs)
      .set({
        ...progress,
        updatedAt: new Date()
      })
      .where(eq(ehrSyncJobs.id, syncJobId));
  }

  private async fetchResourcesFromEHR(
    ehrConnection: any,
    resourceType: string,
    filters: Record<string, any>
  ): Promise<FHIRResource[]> {
    // Implementation would call actual EHR FHIR API
    // This is where you'd integrate with Epic, Cerner, etc.
    return []; // Placeholder
  }
}

export const ehrIntegrationService = new EHRIntegrationService();
