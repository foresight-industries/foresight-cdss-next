import { ehrIntegrationService } from './ehr-integration';
import { db } from '@foresight-cdss-next/db';
import { ehrSyncJobs, ehrConnections } from '@foresight-cdss-next/db/schema';
import { eq, and, or, lt, isNotNull } from 'drizzle-orm';

interface SyncJobQueue {
  id: string;
  priority: number;
  retryCount: number;
  nextRetryAt: Date | null;
}

export class EHRSyncProcessor {
  private isProcessing = false;
  private readonly maxConcurrentJobs = 3;
  private readonly currentJobs = new Set<string>();
  private readonly retryDelayMinutes = [5, 15, 60]; // Progressive retry delays

  /**
   * Start the sync job processor
   */
  async start(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log('🔄 EHR Sync Processor started');

    // Process jobs every 30 seconds
    setInterval(() => {
      this.processQueue().catch(console.error);
    }, 30000);

    // Initial processing
    await this.processQueue();
  }

  /**
   * Stop the sync job processor
   */
  stop(): void {
    this.isProcessing = false;
    console.log('⏹️ EHR Sync Processor stopped');
  }

  /**
   * Process pending sync jobs from queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isProcessing || this.currentJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    const pendingJobs = await this.getPendingJobs();

    for (const job of pendingJobs) {
      if (this.currentJobs.size >= this.maxConcurrentJobs) break;

      this.currentJobs.add(job.id);

      // Process job async without awaiting
      this.processJob(job.id)
        .catch(error => {
          console.error(`Failed to process sync job ${job.id}:`, error);
        })
        .finally(() => {
          this.currentJobs.delete(job.id);
        });
    }
  }

  /**
   * Get pending sync jobs ordered by priority and retry schedule
   */
  private async getPendingJobs(): Promise<SyncJobQueue[]> {
    const now = new Date();

    const jobs = await db
      .select({
        id: ehrSyncJobs.id,
        retryCount: ehrSyncJobs.retryCount,
        nextRetryAt: ehrSyncJobs.nextRetryAt,
        createdAt: ehrSyncJobs.createdAt,
        jobType: ehrSyncJobs.jobType
      })
      .from(ehrSyncJobs)
      .where(
        or(
          eq(ehrSyncJobs.status, 'pending'),
          and(
            eq(ehrSyncJobs.status, 'failed'),
            lt(ehrSyncJobs.retryCount, ehrSyncJobs.maxRetries),
            or(
              isNotNull(ehrSyncJobs.nextRetryAt) && lt(ehrSyncJobs.nextRetryAt, now),
              eq(isNotNull(ehrSyncJobs.nextRetryAt), false)
            )
          )
        )
      )
      .orderBy(ehrSyncJobs.createdAt)
      .limit(10);

    if (jobs.length === 0) {
      return [];
    }

    return jobs.map(job => ({
      id: job.id,
      priority: this.getJobPriority(job.jobType, Number(job.retryCount)),
      retryCount: job.retryCount || 0,
      nextRetryAt: job.nextRetryAt
    })).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process individual sync job
   */
  private async processJob(jobId: string): Promise<void> {
    console.log(`🔄 Processing sync job: ${jobId}`);

    try {
      // Validate EHR connection before processing
      await this.validateEHRConnection(jobId);

      // Process the job using the integration service
      await ehrIntegrationService.processSyncJob(jobId);

      console.log(`✅ Sync job completed: ${jobId}`);

    } catch (error) {
      console.error(`❌ Sync job failed: ${jobId}`, error);
      await this.handleJobFailure(jobId, error);
    }
  }

  /**
   * Validate EHR connection is active and healthy
   */
  private async validateEHRConnection(jobId: string): Promise<void> {
    const [job] = await db
      .select({
        ehrConnectionId: ehrSyncJobs.ehrConnectionId
      })
      .from(ehrSyncJobs)
      .where(eq(ehrSyncJobs.id, jobId))
      .limit(1);

    if (!job) {
      throw new Error('Sync job not found');
    }

    const [connection] = await db
      .select()
      .from(ehrConnections)
      .where(eq(ehrConnections.id, job.ehrConnectionId))
      .limit(1);

    if (!connection) {
      throw new Error('EHR connection not found');
    }

    if (!connection.isActive) {
      throw new Error(`EHR connection is inactive, cannot sync`);
    }

    // Test connection health (placeholder - implement actual health check)
    const isHealthy = await this.testEHRConnectionHealth(connection);
    if (!isHealthy) {
      throw new Error('EHR connection health check failed');
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(jobId: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const [job] = await db
      .select({
        retryCount: ehrSyncJobs.retryCount,
        maxRetries: ehrSyncJobs.maxRetries
      })
      .from(ehrSyncJobs)
      .where(eq(ehrSyncJobs.id, jobId))
      .limit(1);

    if (!job) return;

    const currentRetryCount = job.retryCount || 0;
    const maxRetries = job.maxRetries || 3;

    if (currentRetryCount < maxRetries) {
      // Schedule retry
      const retryDelayMinutes = this.retryDelayMinutes[currentRetryCount] || 60;
      const nextRetryAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000);

      await db
        .update(ehrSyncJobs)
        .set({
          status: 'failed',
          retryCount: currentRetryCount + 1,
          nextRetryAt,
          errorMessage,
          updatedAt: new Date()
        })
        .where(eq(ehrSyncJobs.id, jobId));

      console.log(`🔄 Scheduled retry ${currentRetryCount + 1}/${maxRetries} for job ${jobId} at ${nextRetryAt}`);
    } else {
      // Max retries reached, mark as permanently failed
      await db
        .update(ehrSyncJobs)
        .set({
          status: 'failed',
          errorMessage: `Max retries (${maxRetries}) exceeded. Last error: ${errorMessage}`,
          updatedAt: new Date()
        })
        .where(eq(ehrSyncJobs.id, jobId));

      console.error(`❌ Job ${jobId} permanently failed after ${maxRetries} retries`);

      // TODO: Send notification to admin/organization about permanent failure
      await this.notifyJobPermanentFailure(jobId, errorMessage);
    }
  }

  /**
   * Get job priority based on type and retry count
   */
  private getJobPriority(jobType: string, retryCount: number): number {
    const basePriority: Record<string, number> = {
      'incremental_sync': 100,
      'patient_sync': 80,
      'encounter_sync': 70,
      'full_sync': 50
    };

    const base = basePriority[jobType] || 50;

    // Reduce priority for jobs that have failed before
    const retryPenalty = retryCount * 10;

    return Math.max(1, base - retryPenalty);
  }

  /**
   * Test EHR connection health
   */
  private async testEHRConnectionHealth(connection: any): Promise<boolean> {
    try {
      // Implement actual health check based on EHR type
      // For now, just return true as placeholder
      return true;
    } catch (error) {
      console.error('EHR connection health check failed:', error);
      return false;
    }
  }

  /**
   * Notify about permanent job failure
   */
  private async notifyJobPermanentFailure(jobId: string, errorMessage: string): Promise<void> {
    // Implement notification logic (email, Slack, etc.)
    console.error(`🚨 PERMANENT FAILURE - Job ${jobId}: ${errorMessage}`);

    // Could integrate with your notification system here
    // await notificationService.sendAlert({
    //   type: 'ehr_sync_failure',
    //   jobId,
    //   errorMessage,
    //   severity: 'high'
    // });
  }

  /**
   * Get sync processor status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentJobs: Array.from(this.currentJobs),
      maxConcurrentJobs: this.maxConcurrentJobs,
      activeJobCount: this.currentJobs.size
    };
  }

  /**
   * Manually trigger job processing (for testing/admin use)
   */
  async triggerJobProcessing(): Promise<void> {
    if (this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Cancel a specific job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      await db
        .update(ehrSyncJobs)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(ehrSyncJobs.id, jobId));

      // Remove from current processing if active
      this.currentJobs.delete(jobId);

      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const ehrSyncProcessor = new EHRSyncProcessor();
