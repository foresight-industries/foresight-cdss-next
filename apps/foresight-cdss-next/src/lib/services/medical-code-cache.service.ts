// Medical Code Caching Service for AWS + Next.js
// Uses Redis for distributed caching or in-memory with proper Next.js handling

import Redis, { Cluster } from 'ioredis';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { cptCodeMaster, icd10CodeMaster, codeCrosswalk, hotCodesCache } from '@foresight-cdss-next/db/src/schema';
import { eq, and } from 'drizzle-orm';

interface CptCode {
  code: string;
  description: string;
  category: string;
  isActive: boolean;
  effectiveDate: string;
}

interface Icd10Code {
  code: string;
  description: string;
  category: string;
  isActive: boolean;
  isBillable: boolean;
  requiresAdditionalDigit: boolean;
  parentCode?: string;
  effectiveDate: string;
}

interface CodeCrossWalk {
  icd10Code: string;
  cptCode: string;
  relationship: string;
  payerSpecific?: string;
  effectivenessDate?: string;
  terminationDate?: string;
}

class MedicalCodeCacheService {
  private redis: Redis | Cluster | null = null;
  private readonly db: ReturnType<typeof drizzle>;
  private readonly secretsClient: SecretsManagerClient;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly HOT_CODES_TTL = 7200; // 2 hours
  private readonly fallbackCache = new Map<string, { data: any; expires: number }>();
  private redisInitPromise: Promise<void> | null = null;

  constructor() {
    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    const rdsClient = new RDSDataClient({ region });
    this.secretsClient = new SecretsManagerClient({ region });

    if (
      !process.env.DATABASE_NAME ||
      !process.env.DATABASE_SECRET_ARN ||
      !process.env.DATABASE_CLUSTER_ARN
    ) {
      throw new Error('Missing required AWS RDS environment variables');
    }

    this.db = drizzle(rdsClient, {
      database: process.env.DATABASE_NAME,
      secretArn: process.env.DATABASE_SECRET_ARN,
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
    });

    // Redis will be initialized lazily on first use
  }

  private async ensureRedisInitialized(): Promise<void> {
    this.redisInitPromise ??= this.initRedis();
    await this.redisInitPromise;
  }

  private async getSecret(secretArn: string): Promise<string> {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await this.secretsClient.send(command);
      return response.SecretString || '';
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretArn}:`, error);
      throw error;
    }
  }

  private async initRedis(): Promise<void> {
    try {
      if (process.env.REDIS_DB_URL) {
        const isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true' || process.env.NODE_ENV === 'production';
        const password = process.env.REDIS_DB_PASSWORD;
        
        // Get Redis CA certificate for TLS connections
        let caCert: string | undefined;
        if (process.env.REDIS_CA_SECRET_ARN) {
          try {
            caCert = await this.getSecret(process.env.REDIS_CA_SECRET_ARN);
          } catch (error) {
            console.warn('Failed to retrieve Redis CA certificate, continuing without TLS:', error);
          }
        }

        if (isClusterMode) {
          // Production: Redis Cluster with VPC peering and TLS
          const url = process.env.REDIS_DB_URL.replace(/^rediss?:\/\//, '');
          const [hostPort] = url.split('@').slice(-1); // Get the part after @ if present
          const [host, port] = hostPort.split(':');

          const redisOptions: any = {
            password,
            connectTimeout: 10000,
            lazyConnect: true,
            keepAlive: 30000,
            maxRetriesPerRequest: null,
          };

          // Add TLS configuration if CA certificate is available
          if (caCert && process.env.REDIS_DB_URL.startsWith('rediss://')) {
            redisOptions.tls = {
              ca: caCert,
              checkServerIdentity: () => undefined, // Disable hostname verification for Redis.io
              rejectUnauthorized: true,
            };
          }

          this.redis = new Redis.Cluster(
            [{ host, port: Number.parseInt(port) || 6379 }],
            {
              enableReadyCheck: false,
              enableOfflineQueue: false,
              redisOptions,
              scaleReads: 'slave', // Read from replicas when possible
            }
          );

          console.log('Redis Cluster initialized for medical code caching with TLS:', !!caCert);
        } else {
          // Staging: Single Redis instance with optional TLS
          const redisOptions: any = {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 10000,
            keepAlive: 30000,
          };

          // Add TLS configuration if CA certificate is available
          if (caCert && process.env.REDIS_DB_URL.startsWith('rediss://')) {
            redisOptions.tls = {
              ca: caCert,
              checkServerIdentity: () => undefined, // Disable hostname verification for Redis.io
              rejectUnauthorized: true,
            };
          }

          this.redis = new Redis(process.env.REDIS_DB_URL, redisOptions);

          console.log('Redis single-node initialized for medical code caching with TLS:', !!caCert);
        }

        await this.redis.ping();
        console.log('Redis connection successful');
      }
    } catch (error) {
      console.warn('Redis not available, using fallback cache:', error);
      this.redis = null;
    }
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    await this.ensureRedisInitialized();

    try {
      if (this.redis) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        // Fallback in-memory cache for Next.js
        const entry = this.fallbackCache.get(key);
        if (entry && entry.expires > Date.now()) {
          return entry.data;
        } else if (entry) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    await this.ensureRedisInitialized();

    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      } else {
        // Fallback in-memory cache
        this.fallbackCache.set(key, {
          data,
          expires: Date.now() + (ttl * 1000),
        });

        // Clean up expired entries periodically
        if (this.fallbackCache.size > 1000) {
          this.cleanupFallbackCache();
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  private cleanupFallbackCache() {
    const now = Date.now();
    for (const [key, entry] of this.fallbackCache.entries()) {
      if (entry.expires <= now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  // ===================================
  // CPT CODE CACHING
  // ===================================
  async getCptCode(code: string): Promise<CptCode | null> {
    const cacheKey = `cpt:${code}`;

    // Try cache first
    let cptCode = await this.getFromCache<CptCode>(cacheKey);
    if (cptCode) {
      return cptCode;
    }

    // Fetch from AWS RDS
    const [result] = await this.db
      .select()
      .from(cptCodeMaster as any)
      .where(and(
        eq((cptCodeMaster as any).cptCode, code),
        eq((cptCodeMaster as any).isActive, true)
      ))
      .limit(1);

    if (result) {
      cptCode = {
        code: result.cptCode,
        description: result.shortDescription || '',
        category: result.category || '',
        isActive: result.isActive,
        effectiveDate: result.effectiveDate || '',
      };

      await this.setCache(cacheKey, cptCode, this.DEFAULT_TTL);
      return cptCode;
    }

    return null;
  }

  async getCptCodesByCategory(category: string): Promise<CptCode[]> {
    const cacheKey = `cpt:category:${category}`;

    let codes = await this.getFromCache<CptCode[]>(cacheKey);
    if (codes) {
      return codes;
    }

    const results = await this.db
      .select()
      .from(cptCodeMaster as any)
      .where(and(
        eq((cptCodeMaster as any).category, category),
        eq((cptCodeMaster as any).isActive, true)
      ))
      .orderBy((cptCodeMaster as any).cptCode);

    codes = results.map(d => ({
      code: d.cptCode,
      description: d.shortDescription || '',
      category: d.category || '',
      isActive: d.isActive,
      effectiveDate: d.effectiveDate || '',
    }));

    await this.setCache(cacheKey, codes, this.DEFAULT_TTL);
    return codes;
  }

  // ===================================
  // ICD-10 CODE CACHING
  // ===================================
  async getIcd10Code(code: string): Promise<Icd10Code | null> {
    const cacheKey = `icd10:${code}`;

    let icd10Code = await this.getFromCache<Icd10Code>(cacheKey);
    if (icd10Code) {
      return icd10Code;
    }

    const [result] = await this.db
      .select()
      .from(icd10CodeMaster as any)
      .where(and(
        eq((icd10CodeMaster as any).icd10Code, code),
        eq((icd10CodeMaster as any).isActive, true)
      ))
      .limit(1);

    if (result) {
      icd10Code = {
        code: result.icd10Code,
        description: result.shortDescription || '',
        category: result.category || '',
        isActive: result.isActive,
        isBillable: result.isBillable,
        requiresAdditionalDigit: result.requiresAdditionalDigit,
        parentCode: result.parentCode,
        effectiveDate: result.effectiveDate || '',
      };

      await this.setCache(cacheKey, icd10Code, this.DEFAULT_TTL);
      return icd10Code;
    }

    return null;
  }

  async getIcd10CodesByCategory(category: string): Promise<Icd10Code[]> {
    const cacheKey = `icd10:category:${category}`;

    let codes = await this.getFromCache<Icd10Code[]>(cacheKey);
    if (codes) {
      return codes;
    }

    const results = await this.db
      .select()
      .from(icd10CodeMaster as any)
      .where(and(
        eq((icd10CodeMaster as any).category, category),
        eq((icd10CodeMaster as any).isActive, true)
      ))
      .orderBy((icd10CodeMaster as any).icd10Code);

    codes = results.map(d => ({
      code: d.icd10Code,
      description: d.shortDescription || '',
      category: d.category || '',
      isActive: d.isActive,
      isBillable: d.isBillable,
      requiresAdditionalDigit: d.requiresAdditionalDigit,
      parentCode: d.parentCode,
      effectiveDate: d.effectiveDate || '',
    }));

    await this.setCache(cacheKey, codes, this.DEFAULT_TTL);
    return codes;
  }

  // ===================================
  // HOT CODES CACHING
  // ===================================
  async getHotCodes(teamId: string): Promise<{ cptCodes: string[]; icd10Codes: string[] }> {
    const cacheKey = `hot:codes:${teamId}`;

    let hotCodes = await this.getFromCache<{ cptCodes: string[]; icd10Codes: string[] }>(cacheKey);
    if (hotCodes) {
      return hotCodes;
    }

    const results = await this.db
      .select()
      .from(hotCodesCache as any)
      .where(and(
        eq((hotCodesCache as any).organizationId, teamId),
        eq((hotCodesCache as any).shouldCache, true)
      ));

    const cptCodes: string[] = [];
    const icd10Codes: string[] = [];

    for (const result of results) {
      if (result.codeType === 'CPT' && result.codeValue) {
        cptCodes.push(result.codeValue);
      } else if (result.codeType === 'ICD10' && result.codeValue) {
        icd10Codes.push(result.codeValue);
      }
    }

    hotCodes = { cptCodes, icd10Codes };

    // Cache hot codes longer since they're frequently accessed
    await this.setCache(cacheKey, hotCodes, this.HOT_CODES_TTL);
    return hotCodes;
  }

  // ===================================
  // CODE CROSSWALK CACHING
  // ===================================
  async getCrossWalk(icd10CodeId: string, cptCodeId?: string, organizationId?: string): Promise<CodeCrossWalk[]> {
    const cacheKey = cptCodeId ? `crosswalk:${icd10CodeId}:${cptCodeId}` : `crosswalk:${icd10CodeId}`;

    let crosswalk = await this.getFromCache<CodeCrossWalk[]>(cacheKey);
    if (crosswalk) {
      return crosswalk;
    }

    try {
      // Build query conditions
      const conditions = [eq((codeCrosswalk as any).icd10CodeId, icd10CodeId)];

      if (cptCodeId) {
        conditions.push(eq((codeCrosswalk as any).cptCodeId, cptCodeId));
      }

      if (organizationId) {
        conditions.push(eq((codeCrosswalk as any).organizationId, organizationId));
      }

      // Query crosswalk with joins to get actual code values
      const results = await this.db
        .select({
          id: (codeCrosswalk as any).id,
          relationshipType: (codeCrosswalk as any).relationshipType,
          payerSpecific: (codeCrosswalk as any).payerSpecific,
          effectivenessDate: (codeCrosswalk as any).effectivenessDate,
          terminationDate: (codeCrosswalk as any).terminationDate,
          icd10Code: (icd10CodeMaster as any).icd10Code,
          cptCode: (cptCodeMaster as any).cptCode,
        })
        .from(codeCrosswalk as any)
        .leftJoin(icd10CodeMaster as any, eq((codeCrosswalk as any).icd10CodeId, (icd10CodeMaster as any).id))
        .leftJoin(cptCodeMaster as any, eq((codeCrosswalk as any).cptCodeId, (cptCodeMaster as any).id))
        .where(and(...conditions));

      // Transform to interface format
      crosswalk = results.map(result => ({
        icd10Code: result.icd10Code || '',
        cptCode: result.cptCode || '',
        relationship: result.relationshipType || '',
        payerSpecific: result.payerSpecific || undefined,
        effectivenessDate: result.effectivenessDate || undefined,
        terminationDate: result.terminationDate || undefined,
      }));

      await this.setCache(cacheKey, crosswalk, this.DEFAULT_TTL);
      return crosswalk;
    } catch (error) {
      console.error('Error fetching crosswalk data:', error);
      return [];
    }
  }

  // ===================================
  // CACHE MANAGEMENT
  // ===================================
  async invalidateCodeCache(code: string, type: 'cpt' | 'icd10') {
    await this.ensureRedisInitialized();

    const cacheKey = `${type}:${code}`;
    try {
      if (this.redis) {
        await this.redis.del(cacheKey);
      } else {
        this.fallbackCache.delete(cacheKey);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateCategoryCache(category: string, type: 'cpt' | 'icd10') {
    await this.ensureRedisInitialized();

    const cacheKey = `${type}:category:${category}`;
    try {
      if (this.redis) {
        await this.redis.del(cacheKey);
      } else {
        this.fallbackCache.delete(cacheKey);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async clearAllCache() {
    await this.ensureRedisInitialized();

    try {
      if (this.redis) {
        // Handle both cluster and single-node Redis
        if (this.redis instanceof Redis.Cluster) {
          // For cluster mode, flush all nodes
          const nodes = this.redis.nodes('master');
          await Promise.all(nodes.map(node => node.flushall()));
        } else {
          await this.redis.flushall();
        }
      } else {
        this.fallbackCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Pre-warm cache with most frequently used codes
  async preWarmCache(teamId: string) {
    try {
      const hotCodes = await this.getHotCodes(teamId);

      // Preload hot codes in batches to avoid overwhelming the system
      const batchSize = 10;

      for (let i = 0; i < hotCodes.cptCodes.length; i += batchSize) {
        const batch = hotCodes.cptCodes.slice(i, i + batchSize);
        await Promise.all(batch.map(code => this.getCptCode(code)));
      }

      for (let i = 0; i < hotCodes.icd10Codes.length; i += batchSize) {
        const batch = hotCodes.icd10Codes.slice(i, i + batchSize);
        await Promise.all(batch.map(code => this.getIcd10Code(code)));
      }

      console.log(`Pre-warmed cache for team ${teamId}`);
    } catch (error) {
      console.error('Error pre-warming cache:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ redis: boolean; fallback: boolean; mode: string }> {
    let redisHealth = false;
    let mode = 'fallback';

    try {
      if (this.redis) {
        await this.redis.ping();
        redisHealth = true;
        mode = this.redis instanceof Redis.Cluster ? 'cluster' : 'single-node';
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return {
      redis: redisHealth,
      fallback: true, // In-memory fallback is always available
      mode,
    };
  }
}

// Create singleton instance that works with Next.js
let medicalCodeCacheInstance: MedicalCodeCacheService | null = null;

export function getMedicalCodeCache(): MedicalCodeCacheService {
  medicalCodeCacheInstance ??= new MedicalCodeCacheService();
  return medicalCodeCacheInstance;
}

export const medicalCodeCache = getMedicalCodeCache();
