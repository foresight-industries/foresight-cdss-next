import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { connectionPoolLogger } from './utils/connection-pool-logger';
import * as schema from './schema';

// Enhanced RDS Data Client with logging
class LoggedRDSDataClient extends RDSDataClient {
  // private connectionCount = 0;
  private activeConnections = 0;
  private readonly poolName: string;

  constructor(config: any = {}, poolName = 'default') {
    super(config);
    this.poolName = poolName;
  }

  override async send(command: any): Promise<any> {
    const startTime = Date.now();
    const commandName = command.constructor.name;

    // Track connection activity
    if (commandName === 'ExecuteStatementCommand' || commandName === 'BatchExecuteStatementCommand') {
      this.activeConnections++;
      connectionPoolLogger.logConnectionAcquired(
        this.poolName,
        this.activeConnections,
        0 // AWS Data API doesn't have waiting clients
      );
    }

    try {
      const result = await super.send(command);
      const duration = Date.now() - startTime;

      // Log successful operation
      if (commandName === 'ExecuteStatementCommand') {
        connectionPoolLogger.logAuthentication(
          true,
          'aws-data-api-user',
          'aws-data-api'
        );
      }

      // Track slow queries
      if (duration > 1000) {
        console.warn(`[DB] Slow query detected: ${duration}ms for ${commandName}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log authentication/connection errors
      if (error instanceof Error) {
        if (error.message.includes('authentication') ||
            error.message.includes('unauthorized') ||
            error.message.includes('access denied')) {
          connectionPoolLogger.logAuthentication(
            false,
            'aws-data-api-user',
            'aws-data-api',
            error.message
          );
        }

        console.error(`[DB] Error in ${commandName} after ${duration}ms:`, error.message);
      }

      throw error;
    } finally {
      // Track connection release
      if (commandName === 'ExecuteStatementCommand' || commandName === 'BatchExecuteStatementCommand') {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
        connectionPoolLogger.logConnectionReleased(this.poolName, this.activeConnections);
      }
    }
  }

  // Public getters for monitoring (optional)
  public getActiveConnections(): number {
    return this.activeConnections;
  }

  public getPoolName(): string {
    return this.poolName;
  }
}

// Validate and extract required environment variables
const databaseName = process.env.DATABASE_NAME;
const clusterArn = process.env.DATABASE_CLUSTER_ARN;
const secretArn = process.env.DATABASE_SECRET_ARN;

if (!databaseName) {
  throw new Error('DATABASE_NAME is not defined');
}

if (!clusterArn) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

if (!secretArn) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

// Database configuration with validated environment variables
const dbConfig = {
  database: databaseName,
  resourceArn: clusterArn,
  secretArn: secretArn,
};

// Create logged RDS client with credentials
const rdsClient = new LoggedRDSDataClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
  }
}, 'main-pool');

// Create Drizzle database instance with schema
export const db = drizzle(rdsClient, {
  schema,
  ...dbConfig,
});

// Export types
export type Database = typeof db;

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();

    // Simple query to check connectivity
    await db.execute('SELECT 1 as health_check');

    const duration = Date.now() - startTime;
    console.log(`[DB] Health check passed in ${duration}ms`);

    return true;
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    connectionPoolLogger.logAuthentication(
      false,
      'health-check',
      'localhost',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  try {
    console.log('[DB] Flushing connection metrics...');
    await connectionPoolLogger.forceFlush();
    console.log('[DB] Database connection closed gracefully');
  } catch (error) {
    console.error('[DB] Error during database shutdown:', error);
  }
}
