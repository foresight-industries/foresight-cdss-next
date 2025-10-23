import { healthLakeService } from './healthlake-integration';
// import { ehrIntegrationService } from './ehr-integration';
import { db } from '@foresight-cdss-next/db';
import {
  fhirResources,
  // ehrSyncJobs,
  organizations,
  // crossProviderAnalytics,
  type FhirResource
} from '@foresight-cdss-next/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export interface HealthLakeSyncConfig {
  datastoreId: string;
  s3Bucket: string;
  dataAccessRoleArn: string;
  syncFrequencyHours: number;
  enableBidirectionalSync: boolean;
  organizationIds?: string[];
}

export interface SyncStatus {
  syncId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  direction: 'to_healthlake' | 'from_healthlake' | 'bidirectional';
  startTime: Date;
  endTime?: Date;
  resourcesProcessed: number;
  errors: string[];
  healthLakeJobIds: string[];
}

export class HealthLakeSyncService {
  private readonly s3Client: S3Client;
  private readonly config: HealthLakeSyncConfig;
  private readonly activeSyncs = new Map<string, SyncStatus>();

  constructor(config: HealthLakeSyncConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  /**
   * Start automated sync between local system and HealthLake
   */
  async startAutomatedSync(): Promise<void> {
    console.log('🔄 Starting HealthLake automated sync service');

    // Run initial sync
    await this.performBidirectionalSync();

    // Schedule recurring syncs
    setInterval(async () => {
      try {
        await this.performBidirectionalSync();
      } catch (error) {
        console.error('Automated HealthLake sync failed:', error);
      }
    }, this.config.syncFrequencyHours * 60 * 60 * 1000);
  }

  /**
   * Perform bidirectional sync between local and HealthLake
   */
  async performBidirectionalSync(organizationIds?: string[]): Promise<SyncStatus> {
    const syncId = `sync-${Date.now()}`;
    const syncStatus: SyncStatus = {
      syncId,
      status: 'running',
      direction: 'bidirectional',
      startTime: new Date(),
      resourcesProcessed: 0,
      errors: [],
      healthLakeJobIds: []
    };

    this.activeSyncs.set(syncId, syncStatus);

    try {
      // Step 1: Sync local FHIR resources TO HealthLake
      console.log('📤 Syncing local resources to HealthLake...');
      const toHealthLakeJobIds = await this.syncLocalToHealthLake(organizationIds);
      syncStatus.healthLakeJobIds.push(...toHealthLakeJobIds);

      // Step 2: Export from HealthLake and sync back to local
      console.log('📥 Syncing HealthLake resources to local...');
      const fromHealthLakeJobId = await this.syncHealthLakeToLocal(organizationIds);
      syncStatus.healthLakeJobIds.push(fromHealthLakeJobId);

      // Step 3: Monitor jobs and update status
      await this.monitorSyncJobs(syncStatus);

      syncStatus.status = 'completed';
      syncStatus.endTime = new Date();

      console.log(`✅ HealthLake bidirectional sync completed: ${syncId}`);
      return syncStatus;

    } catch (error) {
      syncStatus.status = 'failed';
      syncStatus.endTime = new Date();
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');

      console.error(`❌ HealthLake sync failed: ${syncId}`, error);
      throw error;
    }
  }

  /**
   * Sync local FHIR resources TO HealthLake
   */
  async syncLocalToHealthLake(organizationIds?: string[]): Promise<string[]> {
    const jobIds: string[] = [];
    const orgsToSync = organizationIds || await this.getAllActiveOrganizationIds();

    for (const orgId of orgsToSync) {
      try {
        // Get all local FHIR resources for the organization
        const resources = await db
          .select()
          .from(fhirResources)
          .where(eq(fhirResources.organizationId, orgId))
          .orderBy(desc(fhirResources.lastSyncAt));

        if (resources.length === 0) {
          console.log(`No FHIR resources found for organization ${orgId}, skipping`);
          continue;
        }

        // Create NDJSON content for HealthLake import
        const ndjsonContent = resources
          .map(resource => JSON.stringify({
            ...resource.fhirData,
            meta: {
              ...resource.fhirData.meta,
              source: `foresight-cdss-org-${orgId}`,
              lastUpdated: resource.lastSyncAt?.toISOString()
            }
          }))
          .join('\n');

        // Upload to S3
        const s3Key = `healthlake-imports/${orgId}/${Date.now()}/resources.ndjson`;
        await this.uploadToS3(s3Key, ndjsonContent, 'application/x-ndjson');

        // Start HealthLake import job
        const s3Uri = `s3://${this.config.s3Bucket}/${s3Key}`;
        const jobId = await healthLakeService.startImportJob(
          this.config.datastoreId,
          s3Uri,
          this.config.dataAccessRoleArn,
          `sync-to-healthlake-${orgId}-${Date.now()}`
        );

        jobIds.push(jobId);
        console.log(`Started HealthLake import job ${jobId} for organization ${orgId}`);

      } catch (error) {
        console.error(`Failed to sync organization ${orgId} to HealthLake:`, error);
        // Continue with other organizations
      }
    }

    return jobIds;
  }

  /**
   * Sync HealthLake resources back TO local system
   */
  async syncHealthLakeToLocal(organizationIds?: string[]): Promise<string> {
    const jobName = organizationIds
      ? `sync-from-healthlake-${organizationIds.join('-')}-${Date.now()}`
      : `sync-from-healthlake-all-${Date.now()}`;

    // Start HealthLake export job
    const exportJobId = await healthLakeService.startExportJob(
      this.config.datastoreId,
      `s3://${this.config.s3Bucket}/healthlake-exports/${jobName}/`,
      this.config.dataAccessRoleArn,
      jobName
    );

    console.log(`Started HealthLake export job ${exportJobId} for sync to local`);

    // Schedule processing of exported data when job completes
    this.scheduleExportProcessing(exportJobId, jobName, organizationIds);

    return exportJobId;
  }

  /**
   * Process exported HealthLake data and sync to local system
   */
  async processHealthLakeExport(
    exportJobId: string,
    jobName: string,
    organizationIds?: string[]
  ): Promise<void> {
    try {
      // Get export job status
      const exportJob = await healthLakeService.getExportJobStatus(
        this.config.datastoreId,
        exportJobId
      );

      if (!exportJob || exportJob.jobStatus !== 'COMPLETED') {
        throw new Error(`Export job ${exportJobId} not completed or failed`);
      }

      // Download and process exported NDJSON files from S3
      const s3Prefix = `healthlake-exports/${jobName}/`;
      const exportedFiles = await this.listS3Files(s3Prefix);

      for (const file of exportedFiles) {
        if (file.endsWith('.ndjson')) {
          await this.processExportedFile(file, organizationIds);
        }
      }

      console.log(`✅ Processed HealthLake export ${exportJobId}`);

    } catch (error) {
      console.error(`Failed to process HealthLake export ${exportJobId}:`, error);
      throw error;
    }
  }

  /**
   * Process individual exported NDJSON file
   */
  private async processExportedFile(s3Key: string, organizationIds?: string[]): Promise<void> {
    try {
      // Download file from S3
      const fileContent = await this.downloadFromS3(s3Key);
      const lines = fileContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const fhirResource = JSON.parse(line);

          // Extract organization ID from meta.source or other identifying fields
          const orgId = this.extractOrganizationId(fhirResource);

          if (!orgId || (organizationIds && !organizationIds.includes(orgId))) {
            continue; // Skip if org ID not found or not in target list
          }

          // Check if we already have this resource locally
          const existingResource = await this.findLocalFhirResource(
            orgId,
            fhirResource.id,
            fhirResource.resourceType
          );

          if (existingResource) {
            // Update if HealthLake version is newer
            const healthLakeUpdated = new Date(fhirResource.meta?.lastUpdated ?? 0);
            const localUpdated = new Date(existingResource.lastSyncAt ?? '');

            if (healthLakeUpdated > localUpdated) {
              await this.updateLocalFhirResource(existingResource.id, fhirResource);
            }
          } else {
            // Create new local resource
            await this.createLocalFhirResource(orgId, fhirResource);
          }

        } catch (error) {
          console.error('Failed to process FHIR resource line:', error);
          // Continue with next line
        }
      }

    } catch (error) {
      console.error(`Failed to process exported file ${s3Key}:`, error);
      throw error;
    }
  }

  /**
   * Monitor HealthLake import/export jobs
   */
  private async monitorSyncJobs(syncStatus: SyncStatus): Promise<void> {
    const checkInterval = 30000; // 30 seconds
    const maxWaitTime = 3600000; // 1 hour
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      let allJobsComplete = true;

      for (const jobId of syncStatus.healthLakeJobIds) {
        // Check import job status
        const importJob = await healthLakeService.getImportJobStatus(
          this.config.datastoreId,
          jobId
        );

        if (importJob && !['COMPLETED', 'FAILED'].includes(importJob.jobStatus)) {
          allJobsComplete = false;
        }

        // Check export job status
        const exportJob = await healthLakeService.getExportJobStatus(
          this.config.datastoreId,
          jobId
        );

        if (exportJob && !['COMPLETED', 'FAILED'].includes(exportJob.jobStatus)) {
          allJobsComplete = false;
        }
      }

      if (allJobsComplete) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  /**
   * Schedule processing of export when job completes
   */
  private scheduleExportProcessing(
    exportJobId: string,
    jobName: string,
    organizationIds?: string[]
  ): void {
    const checkInterval = 60000; // 1 minute

    const monitor = async () => {
      try {
        const exportJob = await healthLakeService.getExportJobStatus(
          this.config.datastoreId,
          exportJobId
        );

        if (exportJob?.jobStatus === 'COMPLETED') {
          await this.processHealthLakeExport(exportJobId, jobName, organizationIds);
        } else if (exportJob?.jobStatus === 'FAILED') {
          console.error(`HealthLake export job ${exportJobId} failed:`, exportJob.message);
        } else {
          // Job still running, check again later
          setTimeout(monitor, checkInterval);
        }
      } catch (error) {
        console.error(`Failed to monitor export job ${exportJobId}:`, error);
      }
    };

    setTimeout(monitor, checkInterval);
  }

  /**
   * Get sync status
   */
  getSyncStatus(syncId: string): SyncStatus | undefined {
    return this.activeSyncs.get(syncId);
  }

  /**
   * Get all active sync statuses
   */
  getAllSyncStatuses(): SyncStatus[] {
    return Array.from(this.activeSyncs.values());
  }

  // Helper methods

  private async getAllActiveOrganizationIds(): Promise<string[]> {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.status, 'active'));

    return orgs.map(org => org.id);
  }

  private async uploadToS3(key: string, content: string, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: key,
      Body: content,
      ContentType: contentType
    });

    await this.s3Client.send(command);
  }

  private async downloadFromS3(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: key
    });

    const response = await this.s3Client.send(command);
    return await response.Body!.transformToString();
  }

  private async listS3Files(prefix: string): Promise<string[]> {
    // Implementation would use ListObjectsV2Command
    // For now, return empty array as placeholder
    return [];
  }

  private extractOrganizationId(fhirResource: any): string | null {
    // Try to extract organization ID from various possible locations
    if (fhirResource.meta?.source) {
      const match = fhirResource.meta.source.match(/foresight-cdss-org-(.+)/);
      if (match) return match[1];
    }

    // Could also check other fields like contained resources, extensions, etc.
    return null;
  }

  private async findLocalFhirResource(
    organizationId: string,
    fhirId: string,
    resourceType: string
  ): Promise<FhirResource | null> {
    const [resource] = await db
      .select()
      .from(fhirResources)
      .where(and(
        eq(fhirResources.organizationId, organizationId),
        eq(fhirResources.fhirId, fhirId),
        eq(fhirResources.resourceType, resourceType)
      ))
      .limit(1);

    return resource ?? null;
  }

  private async updateLocalFhirResource(
    resourceId: string,
    fhirData: any
  ): Promise<void> {
    await db
      .update(fhirResources)
      .set({
        fhirData,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
        updatedAt: new Date()
      })
      .where(eq(fhirResources.id, resourceId));
  }

  private async createLocalFhirResource(
    organizationId: string,
    fhirData: any
  ): Promise<void> {
    // This would use the ehrIntegrationService to process the FHIR resource
    // For now, simplified implementation
    await db
      .insert(fhirResources)
      .values({
        organizationId,
        ehrConnectionId: '', // Would need to determine appropriate EHR connection
        fhirId: fhirData.id,
        resourceType: fhirData.resourceType,
        fhirData,
        lastSyncAt: new Date(),
        syncStatus: 'synced'
      });
  }
}

export function createHealthLakeSyncService(config: HealthLakeSyncConfig): HealthLakeSyncService {
  return new HealthLakeSyncService(config);
}

// Default instance
export const healthLakeSyncService = createHealthLakeSyncService({
  datastoreId: process.env.HEALTHLAKE_DATASTORE_ID ?? '',
  s3Bucket: process.env.HEALTHLAKE_S3_BUCKET ?? '',
  dataAccessRoleArn: process.env.HEALTHLAKE_DATA_ACCESS_ROLE_ARN ?? '',
  syncFrequencyHours: 24, // Daily sync by default
  enableBidirectionalSync: true
});
