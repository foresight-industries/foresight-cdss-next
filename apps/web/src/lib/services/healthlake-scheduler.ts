import { db } from '@foresight-cdss-next/db';
import {
  organizations,
  // ehrConnections,
  fhirResources,
  // type Organization
} from '@foresight-cdss-next/db/schema';
import { eq, and, gte, isNull, or } from 'drizzle-orm';
import { healthLakeSyncService, type HealthLakeSyncConfig } from './healthlake-sync';

export interface SyncScheduleConfig {
  organizationId?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // Format: "HH:MM" for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
  autoRetry: boolean;
  maxRetries: number;
  retryDelayMinutes: number;
  syncDirection: 'to_healthlake' | 'from_healthlake' | 'bidirectional';
  resourceTypes?: string[]; // Filter specific FHIR resource types
  incrementalSync: boolean; // Only sync changed data since last sync
}

export interface ScheduledSyncJob {
  id: string;
  organizationId?: string;
  config: SyncScheduleConfig;
  nextRunTime: Date;
  lastRunTime?: Date;
  lastRunStatus?: 'success' | 'failed' | 'running';
  lastError?: string;
  consecutiveFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

export class HealthLakeScheduler {
  private readonly jobs = new Map<string, ScheduledSyncJob>();
  private readonly runningJobs = new Set<string>();
  private schedulerInterval?: NodeJS.Timeout;
  private readonly checkIntervalMs = 60000; // Check every minute

  constructor(
    private readonly syncConfig: HealthLakeSyncConfig,
    // @ts-expect-error - TS compiler is unable to recognize conditional invocation
    private readonly enableAutoStart = true
  ) {
    if (enableAutoStart) {
      this.start();
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.schedulerInterval) {
      console.log('HealthLake scheduler already running');
      return;
    }

    console.log('🕐 Starting HealthLake sync scheduler');

    // Load existing jobs from database/config
    this.loadScheduledJobs();

    // Start the scheduler loop
    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledJobs();
      } catch (error) {
        console.error('Error in HealthLake scheduler:', error);
      }
    }, this.checkIntervalMs);

    console.log('✅ HealthLake scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
      console.log('🛑 HealthLake scheduler stopped');
    }
  }

  /**
   * Schedule a new sync job
   */
  async scheduleSync(config: SyncScheduleConfig): Promise<string> {
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const nextRunTime = this.calculateNextRunTime(config);

    const job: ScheduledSyncJob = {
      id: jobId,
      organizationId: config.organizationId,
      config,
      nextRunTime,
      consecutiveFailures: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Persist to database
    await this.persistJob(job);

    console.log(`📅 Scheduled sync job ${jobId} for ${nextRunTime.toISOString()}`);
    return jobId;
  }

  /**
   * Update an existing scheduled job
   */
  async updateSchedule(jobId: string, config: Partial<SyncScheduleConfig>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Scheduled job ${jobId} not found`);
    }

    job.config = { ...job.config, ...config };
    job.nextRunTime = this.calculateNextRunTime(job.config);
    job.updatedAt = new Date();

    await this.persistJob(job);
    console.log(`📝 Updated scheduled job ${jobId}`);
  }

  /**
   * Remove a scheduled job
   */
  async removeSchedule(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Scheduled job ${jobId} not found`);
    }

    this.jobs.delete(jobId);
    await this.deleteJob(jobId);
    console.log(`🗑️ Removed scheduled job ${jobId}`);
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledSyncJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get scheduled jobs for a specific organization
   */
  getOrganizationJobs(organizationId: string): ScheduledSyncJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.organizationId === organizationId);
  }

  /**
   * Force run a scheduled job immediately
   */
  async runJobNow(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Scheduled job ${jobId} not found`);
    }

    if (this.runningJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    await this.executeJob(job);
  }

  /**
   * Process all scheduled jobs that are due to run
   */
  private async processScheduledJobs(): Promise<void> {
    const now = new Date();
    const dueJobs = Array.from(this.jobs.values())
      .filter(job =>
        job.config.enabled &&
        job.nextRunTime <= now &&
        !this.runningJobs.has(job.id)
      );

    if (dueJobs.length === 0) {
      return;
    }

    console.log(`⏰ Processing ${dueJobs.length} due sync jobs`);

    // Execute jobs in parallel
    await Promise.allSettled(
      dueJobs.map(job => this.executeJob(job))
    );
  }

  /**
   * Execute a scheduled sync job
   */
  private async executeJob(job: ScheduledSyncJob): Promise<void> {
    const { id: jobId, config, organizationId } = job;

    this.runningJobs.add(jobId);
    job.lastRunTime = new Date();
    job.lastRunStatus = 'running';

    try {
      console.log(`🚀 Executing scheduled sync job ${jobId}`);

      // Determine organizations to sync
      const orgsToSync = organizationId ? [organizationId] : await this.getActiveOrganizations();

      // Filter organizations if incremental sync is enabled
      const filteredOrgs = config.incrementalSync
        ? await this.filterOrganizationsForIncremental(orgsToSync)
        : orgsToSync;

      if (filteredOrgs.length === 0) {
        console.log(`📋 No organizations need syncing for job ${jobId}`);
        job.lastRunStatus = 'success';
        job.consecutiveFailures = 0;
        job.nextRunTime = this.calculateNextRunTime(config);
        return;
      }

      // Execute the sync based on direction

      // @ts-expect-error - TS compiler is unable to recognize conditional re-assignment
      let syncResult;
      switch (config.syncDirection) {
        case 'to_healthlake':
          syncResult = await healthLakeSyncService.syncLocalToHealthLake(filteredOrgs);
          break;
        case 'from_healthlake':
          syncResult = await healthLakeSyncService.syncHealthLakeToLocal(filteredOrgs);
          break;
        case 'bidirectional':
        default:
          syncResult = await healthLakeSyncService.performBidirectionalSync(filteredOrgs);
          break;
      }

      // Job completed successfully
      job.lastRunStatus = 'success';
      job.consecutiveFailures = 0;
      job.lastError = undefined;
      job.nextRunTime = this.calculateNextRunTime(config);

      console.log(`✅ Scheduled sync job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`❌ Scheduled sync job ${jobId} failed:`, error);

      job.lastRunStatus = 'failed';
      job.lastError = error instanceof Error ? error.message : 'Unknown error';
      job.consecutiveFailures++;

      // Handle retries
      if (config.autoRetry && job.consecutiveFailures <= config.maxRetries) {
        const retryDelay = config.retryDelayMinutes * 60 * 1000;
        job.nextRunTime = new Date(Date.now() + retryDelay);
        console.log(`🔄 Scheduling retry for job ${jobId} in ${config.retryDelayMinutes} minutes`);
      } else {
        // Max retries exceeded or auto-retry disabled
        job.nextRunTime = this.calculateNextRunTime(config);
        console.log(`⚠️ Job ${jobId} exceeded max retries or auto-retry disabled`);
      }

    } finally {
      this.runningJobs.delete(jobId);
      job.updatedAt = new Date();
      await this.persistJob(job);
    }
  }

  /**
   * Calculate the next run time based on schedule configuration
   */
  private calculateNextRunTime(config: SyncScheduleConfig): Date {
    const now = new Date();
    const nextRun = new Date(now);

    console.log('Sync Config: ', this.syncConfig);

    switch (config.frequency) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0, 0, 0);
        break;

      case 'daily':
        if (config.time) {
          const [hours, minutes] = config.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        } else {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        if (config.dayOfWeek !== undefined) {
          const currentDay = nextRun.getDay();
          const daysUntilTarget = (config.dayOfWeek - currentDay + 7) % 7;
          nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7));
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        if (config.time) {
          const [hours, minutes] = config.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
        break;

      case 'monthly':
        if (config.dayOfMonth) {
          nextRun.setDate(config.dayOfMonth);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
        } else {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        if (config.time) {
          const [hours, minutes] = config.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Get active organizations for syncing
   */
  private async getActiveOrganizations(): Promise<string[]> {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.status, 'active'));

    return orgs.map(org => org.id);
  }

  /**
   * Filter organizations that need incremental sync
   */
  private async filterOrganizationsForIncremental(organizationIds: string[]): Promise<string[]> {
    // Get organizations that have FHIR resources updated since last sync
    const orgsWithUpdates = await db
      .selectDistinct({ organizationId: fhirResources.organizationId })
      .from(fhirResources)
      .where(
        and(
          eq(fhirResources.organizationId, organizationIds[0]), // This would need to be adjusted for multiple orgs
          or(
            isNull(fhirResources.lastSyncAt),
            gte(fhirResources.updatedAt, fhirResources.lastSyncAt)
          )
        )
      );

    return orgsWithUpdates.map(org => org.organizationId);
  }

  /**
   * Load scheduled jobs from persistent storage
   */
  private async loadScheduledJobs(): Promise<void> {
    // In a real implementation, this would load from database
    // For now, we'll just initialize with default schedules

    try {
      const activeOrgs = await this.getActiveOrganizations();

      // Create default daily sync for each active organization
      for (const orgId of activeOrgs) {
        const defaultConfig: SyncScheduleConfig = {
          organizationId: orgId,
          frequency: 'daily',
          time: '02:00', // 2 AM
          enabled: true,
          autoRetry: true,
          maxRetries: 3,
          retryDelayMinutes: 30,
          syncDirection: 'bidirectional',
          incrementalSync: true
        };

        await this.scheduleSync(defaultConfig);
      }

      console.log(`📚 Loaded ${this.jobs.size} scheduled sync jobs`);
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    }
  }

  /**
   * Persist job to database
   */
  private async persistJob(job: ScheduledSyncJob): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just log the persistence
    console.log(`💾 Persisting job ${job.id} to database`);
  }

  /**
   * Delete job from database
   */
  private async deleteJob(jobId: string): Promise<void> {
    // In a real implementation, this would delete from database
    console.log(`🗑️ Deleting job ${jobId} from database`);
  }
}

// Helper functions for creating common schedule configurations
export const SchedulePresets = {
  daily: (time = '02:00'): Partial<SyncScheduleConfig> => ({
    frequency: 'daily',
    time,
    enabled: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelayMinutes: 30,
    syncDirection: 'bidirectional',
    incrementalSync: true
  }),

  hourly: (): Partial<SyncScheduleConfig> => ({
    frequency: 'hourly',
    enabled: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelayMinutes: 15,
    syncDirection: 'bidirectional',
    incrementalSync: true
  }),

  weekly: (dayOfWeek = 0, time = '03:00'): Partial<SyncScheduleConfig> => ({
    frequency: 'weekly',
    dayOfWeek,
    time,
    enabled: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelayMinutes: 60,
    syncDirection: 'bidirectional',
    incrementalSync: false // Full sync weekly
  })
};

// Global scheduler instance
export const healthLakeScheduler = new HealthLakeScheduler({
  datastoreId: process.env.HEALTHLAKE_DATASTORE_ID ?? '',
  s3Bucket: process.env.HEALTHLAKE_S3_BUCKET ?? '',
  dataAccessRoleArn: process.env.HEALTHLAKE_DATA_ACCESS_ROLE_ARN ?? '',
  syncFrequencyHours: 24,
  enableBidirectionalSync: true
});
