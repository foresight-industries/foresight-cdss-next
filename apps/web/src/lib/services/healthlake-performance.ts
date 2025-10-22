import { db } from '@foresight-cdss-next/db';
import { fhirResources } from '@foresight-cdss-next/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export interface PerformanceConfig {
  batchSize: number;
  concurrentBatches: number;
  retryAttempts: number;
  retryDelayMs: number;
  compressionEnabled: boolean;
  cachingEnabled: boolean;
  cacheExpiryHours: number;
  resourcePriorities: Record<string, number>; // Higher number = higher priority
  rateLimiting: {
    enabled: boolean;
    requestsPerSecond: number;
    burstLimit: number;
  };
  deltaSync: {
    enabled: boolean;
    lookbackHours: number;
  };
}

export interface BatchJob {
  id: string;
  type: 'import' | 'export' | 'sync';
  organizationId: string;
  resourceType?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  resourceIds: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  totalResources: number;
  processedResources: number;
  failedResources: number;
  errors: string[];
  performance: {
    avgProcessingTimeMs: number;
    throughputPerSecond: number;
    memoryUsageMB: number;
  };
}

export interface ResourceCache {
  key: string;
  organizationId: string;
  resourceType: string;
  data: any;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface RateLimiter {
  tokens: number;
  lastRefill: Date;
  maxTokens: number;
  refillRate: number;
}

export class HealthLakePerformanceOptimizer {
  private jobQueue = new Map<string, BatchJob>();
  private runningJobs = new Set<string>();
  private resourceCache = new Map<string, ResourceCache>();
  private rateLimiters = new Map<string, RateLimiter>();
  private processingInterval?: NodeJS.Timeout;

  constructor(private config: PerformanceConfig) {
    this.startJobProcessor();
    this.initializeRateLimiters();
  }

  /**
   * Submit a batch job for processing
   */
  async submitBatchJob(
    type: BatchJob['type'],
    organizationId: string,
    resourceIds: string[],
    options: {
      resourceType?: string;
      priority?: number;
    } = {}
  ): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine priority based on resource type or provided priority
    let priority = options.priority || 5;
    if (options.resourceType && this.config.resourcePriorities[options.resourceType]) {
      priority = this.config.resourcePriorities[options.resourceType];
    }

    const job: BatchJob = {
      id: jobId,
      type,
      organizationId,
      resourceType: options.resourceType,
      status: 'pending',
      priority,
      resourceIds,
      createdAt: new Date(),
      progress: 0,
      totalResources: resourceIds.length,
      processedResources: 0,
      failedResources: 0,
      errors: [],
      performance: {
        avgProcessingTimeMs: 0,
        throughputPerSecond: 0,
        memoryUsageMB: 0
      }
    };

    this.jobQueue.set(jobId, job);
    console.log(`📋 Batch job ${jobId} submitted with ${resourceIds.length} resources (priority: ${priority})`);

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): BatchJob | null {
    return this.jobQueue.get(jobId) || null;
  }

  /**
   * Get all jobs for an organization
   */
  getOrganizationJobs(organizationId: string): BatchJob[] {
    return Array.from(this.jobQueue.values())
      .filter(job => job.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobQueue.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'running') {
      job.status = 'cancelled';
      this.runningJobs.delete(jobId);
    } else if (job.status === 'pending') {
      job.status = 'cancelled';
    }

    console.log(`❌ Job ${jobId} cancelled`);
  }

  /**
   * Optimize resource query for delta sync
   */
  async getResourcesForDeltaSync(
    organizationId: string,
    resourceType?: string,
    lastSyncTime?: Date
  ): Promise<string[]> {
    if (!this.config.deltaSync.enabled || !lastSyncTime) {
      // Return all resources if delta sync is disabled or no last sync time
      const allResources = await db
        .select({ id: fhirResources.id })
        .from(fhirResources)
        .where(
          and(
            eq(fhirResources.organizationId, organizationId),
            resourceType ? eq(fhirResources.resourceType, resourceType) : undefined
          )
        );

      return allResources.map(r => r.id);
    }

    // Get only resources modified since last sync
    const modifiedResources = await db
      .select({ id: fhirResources.id })
      .from(fhirResources)
      .where(
        and(
          eq(fhirResources.organizationId, organizationId),
          resourceType ? eq(fhirResources.resourceType, resourceType) : undefined,
          gte(fhirResources.updatedAt, lastSyncTime)
        )
      );

    console.log(`🔄 Delta sync: Found ${modifiedResources.length} modified resources since ${lastSyncTime.toISOString()}`);
    return modifiedResources.map(r => r.id);
  }

  /**
   * Batch process resources with optimal chunk size
   */
  async batchProcessResources<T>(
    resources: T[],
    processor: (batch: T[]) => Promise<void>,
    options: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<void> {
    const batchSize = options.batchSize || this.config.batchSize;
    const concurrency = options.concurrency || this.config.concurrentBatches;

    console.log(`⚡ Processing ${resources.length} resources in batches of ${batchSize} with concurrency ${concurrency}`);

    const batches: T[][] = [];
    for (let i = 0; i < resources.length; i += batchSize) {
      batches.push(resources.slice(i, i + batchSize));
    }

    let processedCount = 0;
    const semaphore = new Array(concurrency).fill(null);

    const processBatch = async (batch: T[]): Promise<void> => {
      const startTime = Date.now();

      try {
        await this.withRateLimit('batch_processing', async () => {
          await processor(batch);
        });

        processedCount += batch.length;
        const duration = Date.now() - startTime;
        const throughput = batch.length / (duration / 1000);

        console.log(`✅ Batch processed: ${batch.length} resources in ${duration}ms (${throughput.toFixed(1)} resources/sec)`);

        if (options.onProgress) {
          options.onProgress(processedCount, resources.length);
        }
      } catch (error) {
        console.error(`❌ Batch processing failed:`, error);
        throw error;
      }
    };

    // Process batches with limited concurrency
    const workers = semaphore.map(async () => {
      while (batches.length > 0) {
        const batch = batches.shift();
        if (batch) {
          await processBatch(batch);
        }
      }
    });

    await Promise.all(workers);
    console.log(`🎉 Completed processing ${resources.length} resources`);
  }

  /**
   * Cache resource data
   */
  cacheResource(
    organizationId: string,
    resourceType: string,
    resourceId: string,
    data: any
  ): void {
    if (!this.config.cachingEnabled) return;

    const key = `${organizationId}-${resourceType}-${resourceId}`;
    const expiresAt = new Date(Date.now() + this.config.cacheExpiryHours * 60 * 60 * 1000);

    this.resourceCache.set(key, {
      key,
      organizationId,
      resourceType,
      data,
      expiresAt,
      accessCount: 0,
      lastAccessed: new Date()
    });

    console.log(`💾 Cached resource: ${key}`);
  }

  /**
   * Get resource from cache
   */
  getCachedResource(
    organizationId: string,
    resourceType: string,
    resourceId: string
  ): any | null {
    if (!this.config.cachingEnabled) return null;

    const key = `${organizationId}-${resourceType}-${resourceId}`;
    const cached = this.resourceCache.get(key);

    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt < new Date()) {
      this.resourceCache.delete(key);
      return null;
    }

    // Update access stats
    cached.accessCount++;
    cached.lastAccessed = new Date();

    console.log(`📋 Cache hit: ${key} (accessed ${cached.accessCount} times)`);
    return cached.data;
  }

  /**
   * Clear cache for organization or resource type
   */
  clearCache(organizationId?: string, resourceType?: string): void {
    if (!organizationId && !resourceType) {
      // Clear all cache
      this.resourceCache.clear();
      console.log('🧹 Cleared entire cache');
      return;
    }

    const keysToDelete: string[] = [];

    for (const [key, cached] of this.resourceCache) {
      if (organizationId && cached.organizationId !== organizationId) continue;
      if (resourceType && cached.resourceType !== resourceType) continue;
      keysToDelete.push(key);
    }

    keysToDelete.forEach(key => this.resourceCache.delete(key));
    console.log(`🧹 Cleared ${keysToDelete.length} cache entries`);
  }

  /**
   * Compress data for efficient transfer
   */
  async compressData(data: any): Promise<Buffer> {
    if (!this.config.compressionEnabled) {
      return Buffer.from(JSON.stringify(data));
    }

    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);

    const jsonData = JSON.stringify(data);
    const compressed = await gzipAsync(Buffer.from(jsonData));

    const compressionRatio = compressed.length / jsonData.length;
    console.log(`🗜️ Compressed data: ${jsonData.length} → ${compressed.length} bytes (${(compressionRatio * 100).toFixed(1)}% of original)`);

    return compressed;
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData: Buffer): Promise<any> {
    if (!this.config.compressionEnabled) {
      return JSON.parse(compressedData.toString());
    }

    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);

    const decompressed = await gunzipAsync(compressedData);
    return JSON.parse(decompressed.toString());
  }

  /**
   * Execute with rate limiting
   */
  async withRateLimit<T>(
    limiterId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.config.rateLimiting.enabled) {
      return operation();
    }

    const limiter = this.rateLimiters.get(limiterId);
    if (!limiter) {
      throw new Error(`Rate limiter ${limiterId} not found`);
    }

    await this.waitForToken(limiter);
    return operation();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    queuedJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    cacheHitRate: number;
    cacheSize: number;
    avgJobDuration: number;
    totalResourcesProcessed: number;
  } {
    const jobs = Array.from(this.jobQueue.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');

    const totalCacheAccess = Array.from(this.resourceCache.values())
      .reduce((sum, cache) => sum + cache.accessCount, 0);
    const cacheHitRate = totalCacheAccess > 0 ? (this.resourceCache.size / totalCacheAccess) * 100 : 0;

    const avgJobDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          if (job.startedAt && job.completedAt) {
            return sum + (job.completedAt.getTime() - job.startedAt.getTime());
          }
          return sum;
        }, 0) / completedJobs.length
      : 0;

    const totalResourcesProcessed = jobs.reduce((sum, job) => sum + job.processedResources, 0);

    return {
      queuedJobs: jobs.filter(j => j.status === 'pending').length,
      runningJobs: this.runningJobs.size,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      cacheSize: this.resourceCache.size,
      avgJobDuration: Math.round(avgJobDuration),
      totalResourcesProcessed
    };
  }

  /**
   * Start the job processor
   */
  private startJobProcessor(): void {
    this.processingInterval = setInterval(async () => {
      await this.processJobQueue();
      await this.cleanupExpiredCache();
    }, 5000); // Process every 5 seconds

    console.log('⚡ Performance optimizer job processor started');
  }

  /**
   * Stop the job processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      console.log('🛑 Performance optimizer stopped');
    }
  }

  /**
   * Process the job queue
   */
  private async processJobQueue(): Promise<void> {
    if (this.runningJobs.size >= this.config.concurrentBatches) {
      return; // At capacity
    }

    // Get next highest priority pending job
    const pendingJobs = Array.from(this.jobQueue.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());

    if (pendingJobs.length === 0) {
      return; // No pending jobs
    }

    const job = pendingJobs[0];
    await this.executeJob(job);
  }

  /**
   * Execute a batch job
   */
  private async executeJob(job: BatchJob): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date();
    this.runningJobs.add(job.id);

    console.log(`🚀 Starting job ${job.id}: ${job.type} for ${job.totalResources} resources`);

    try {
      const startTime = Date.now();
      let processedCount = 0;

      // Process resources in batches
      const batches: string[][] = [];
      for (let i = 0; i < job.resourceIds.length; i += this.config.batchSize) {
        batches.push(job.resourceIds.slice(i, i + this.config.batchSize));
      }

      for (const batch of batches) {
        const batchStartTime = Date.now();

        try {
          // Simulate processing (replace with actual sync logic)
          await this.processBatch(job, batch);

          processedCount += batch.length;
          job.processedResources = processedCount;
          job.progress = (processedCount / job.totalResources) * 100;

          const batchDuration = Date.now() - batchStartTime;
          console.log(`📦 Processed batch: ${batch.length} resources in ${batchDuration}ms`);

        } catch (error) {
          console.error(`❌ Batch failed:`, error);
          job.failedResources += batch.length;
          job.errors.push(`Batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update job performance metrics
      const totalDuration = Date.now() - startTime;
      job.performance.avgProcessingTimeMs = totalDuration / job.processedResources;
      job.performance.throughputPerSecond = job.processedResources / (totalDuration / 1000);
      job.performance.memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;

      job.status = job.failedResources === 0 ? 'completed' : 'failed';
      job.completedAt = new Date();

      console.log(`✅ Job ${job.id} ${job.status}: ${job.processedResources}/${job.totalResources} resources processed`);

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push(`Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  /**
   * Process a batch of resources
   */
  private async processBatch(job: BatchJob, resourceIds: string[]): Promise<void> {
    // This would contain the actual sync logic
    // For now, simulate processing time
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated batch processing failure');
    }
  }

  /**
   * Initialize rate limiters
   */
  private initializeRateLimiters(): void {
    const { requestsPerSecond, burstLimit } = this.config.rateLimiting;

    this.rateLimiters.set('batch_processing', {
      tokens: burstLimit,
      lastRefill: new Date(),
      maxTokens: burstLimit,
      refillRate: requestsPerSecond
    });

    this.rateLimiters.set('api_calls', {
      tokens: burstLimit,
      lastRefill: new Date(),
      maxTokens: burstLimit,
      refillRate: requestsPerSecond
    });
  }

  /**
   * Wait for rate limiter token
   */
  private async waitForToken(limiter: RateLimiter): Promise<void> {
    // Refill tokens based on time elapsed
    const now = new Date();
    const timeSinceLastRefill = (now.getTime() - limiter.lastRefill.getTime()) / 1000;
    const tokensToAdd = Math.floor(timeSinceLastRefill * limiter.refillRate);

    if (tokensToAdd > 0) {
      limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd);
      limiter.lastRefill = now;
    }

    // Wait if no tokens available
    if (limiter.tokens <= 0) {
      const waitTime = (1 / limiter.refillRate) * 1000; // Time to get next token in ms
      await new Promise(resolve => setTimeout(resolve, waitTime));
      limiter.tokens = 1;
    } else {
      limiter.tokens--;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.resourceCache) {
      if (cached.expiresAt < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.resourceCache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }
}

// Default performance configuration
export const defaultPerformanceConfig: PerformanceConfig = {
  batchSize: 100,
  concurrentBatches: 3,
  retryAttempts: 3,
  retryDelayMs: 1000,
  compressionEnabled: true,
  cachingEnabled: true,
  cacheExpiryHours: 4,
  resourcePriorities: {
    'Patient': 10,
    'Encounter': 8,
    'Observation': 6,
    'Procedure': 7,
    'Medication': 5,
    'DiagnosticReport': 6,
    'AllergyIntolerance': 9
  },
  rateLimiting: {
    enabled: true,
    requestsPerSecond: 10,
    burstLimit: 50
  },
  deltaSync: {
    enabled: true,
    lookbackHours: 24
  }
};

// Global performance optimizer instance
export const healthLakePerformanceOptimizer = new HealthLakePerformanceOptimizer(defaultPerformanceConfig);
