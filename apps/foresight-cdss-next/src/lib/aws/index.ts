/**
 * AWS Services Client
 * Replaces Supabase with AWS native services
 *
 * This module provides a drop-in replacement for Supabase functionality using:
 * - AWS Aurora PostgreSQL with RDS Data API (database)
 * - AWS S3 (file storage)
 * - AWS API Gateway + WebSocket (real-time)
 * - AWS Lambda (serverless functions)
 */

// Database client exports
import { createRealtimeClient } from "@/lib/aws/realtime";
import { createDatabaseClient } from "@/lib/aws/database";

export {
  createDatabaseClient,
  createAuthenticatedDatabaseClient,
  createDatabaseAdminClient,
  getCurrentUser,
  checkDatabaseHealth,
  withTeamContext,
  db,
  type DatabaseClient,
  type AuthenticatedDatabaseClient,
  type AdminDatabaseClient,
} from './database';

// Storage client exports
export {
  storage,
  documents,
  uploadFile,
  downloadFile,
  createSignedUrl,
  deleteFile,
  listFiles,
  StorageClient,
  StorageBucket,
  s3Client,
} from './storage';

// Real-time client exports
export {
  createRealtimeClient,
  createSSEClient,
  SSEClient,
  type RealtimeCallback,
  type RealtimeSubscription,
} from './realtime';

/**
 * Main AWS client that combines all services
 * This provides a Supabase-like interface for AWS services
 */
export class AWSClient {
  private _db: any = null;
  private _storage: any = null;
  private _realtime: any = null;

  constructor(
    private readonly config?: {
      realtimeEndpoint?: string;
    }
  ) {}

  /**
   * Get database client
   * Usage: aws.database or aws.db (shorthand)
   */
  get database() {
    if (!this._db) {
      this._db = createDatabaseClient();
    }
    return this._db;
  }

  // Shorthand for database
  get db() {
    return this.database;
  }

  /**
   * Get storage client
   * Usage: aws.storage.from('bucket-name')
   */
  get storage() {
    if (!this._storage) {
      const { storage } = require('./storage');
      this._storage = storage;
    }
    return this._storage;
  }

  /**
   * Get real-time client
   * Usage: aws.realtime.channel('table-name')
   */
  get realtime() {
    if (!this._realtime) {
      this._realtime = createRealtimeClient(this.config?.realtimeEndpoint);
    }
    return this._realtime;
  }

  /**
   * Create a channel for real-time subscriptions
   * This mimics supabase.channel() API
   */
  channel(name?: string) {
    return this.realtime.channel(name);
  }

  /**
   * Disconnect all connections
   */
  async disconnect() {
    if (this._realtime) {
      this._realtime.disconnect();
    }
  }
}

/**
 * Create AWS client instance
 * This replaces createSupabaseClient()
 */
export function createAWSClient(config?: {
  realtimeEndpoint?: string;
}): AWSClient {
  return new AWSClient(config);
}

/**
 * Default AWS client instance
 * This replaces the default supabase client export
 */
export const aws = createAWSClient({
  realtimeEndpoint: process.env.NEXT_PUBLIC_REALTIME_ENDPOINT,
});

// For backward compatibility and easy migration
export { aws as supabase };

/**
 * Migration helper utilities
 */
export const migration = {
  /**
   * Convert Supabase query to Drizzle query
   * This helps with gradual migration
   */
  convertQuery: (supabaseQuery: any) => {
    // Implementation would depend on specific query patterns
    console.warn('Query conversion not yet implemented. Please update to Drizzle syntax.');
    return supabaseQuery;
  },

  /**
   * Convert Supabase real-time subscription to AWS equivalent
   */
  convertSubscription: (supabaseChannel: any) => {
    console.warn('Subscription conversion not yet implemented. Please update to AWS real-time syntax.');
    return supabaseChannel;
  },

  /**
   * Convert Supabase storage operation to S3 equivalent
   */
  convertStorage: (supabaseStorage: any) => {
    console.warn('Storage conversion not yet implemented. Please update to S3 syntax.');
    return supabaseStorage;
  },
};

/**
 * Environment configuration helper
 */
export const config = {
  database: {
    clusterArn: process.env.DATABASE_CLUSTER_ARN,
    secretArn: process.env.DATABASE_SECRET_ARN,
    databaseName: process.env.DATABASE_NAME,
    region: process.env.AWS_REGION,
  },
  storage: {
    bucketName: process.env.DOCUMENTS_BUCKET_NAME,
    region: process.env.AWS_REGION,
  },
  realtime: {
    endpoint: process.env.NEXT_PUBLIC_REALTIME_ENDPOINT,
  },
  auth: {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  },
};

/**
 * Validate that all required environment variables are set
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const required = [
    'DATABASE_CLUSTER_ARN',
    'DATABASE_SECRET_ARN',
    'DATABASE_NAME',
    'DOCUMENTS_BUCKET_NAME',
    'AWS_REGION',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Default export
export default aws;
