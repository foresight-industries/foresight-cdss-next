import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';

export class ConnectionPoolLogger {
  private cloudWatch: CloudWatchClient;
  private metrics: Map<string, number> = new Map();
  private lastFlush: number = Date.now();
  private readonly flushInterval = 60000; // 1 minute

  constructor() {
    this.cloudWatch = new CloudWatchClient({});
  }

  // Log connection pool events
  logConnectionAcquired(poolName: string, activeConnections: number, waitingClients: number) {
    console.log(`[ConnectionPool:${poolName}] Connection acquired. Active: ${activeConnections}, Waiting: ${waitingClients}`);

    this.updateMetric('ConnectionsActive', activeConnections);
    this.updateMetric('ClientsWaiting', waitingClients);
    this.updateMetric('ConnectionsAcquired', 1);

    this.maybeFlushMetrics();
  }

  logConnectionReleased(poolName: string, activeConnections: number) {
    console.log(`[ConnectionPool:${poolName}] Connection released. Active: ${activeConnections}`);

    this.updateMetric('ConnectionsActive', activeConnections);
    this.updateMetric('ConnectionsReleased', 1);

    this.maybeFlushMetrics();
  }

  logConnectionCreated(poolName: string, totalConnections: number) {
    console.log(`[ConnectionPool:${poolName}] New connection created. Total: ${totalConnections}`);

    this.updateMetric('ConnectionsTotal', totalConnections);
    this.updateMetric('ConnectionsCreated', 1);

    this.maybeFlushMetrics();
  }

  logConnectionDestroyed(poolName: string, totalConnections: number, reason?: string) {
    console.log(`[ConnectionPool:${poolName}] Connection destroyed. Total: ${totalConnections}. Reason: ${reason || 'unknown'}`);

    this.updateMetric('ConnectionsTotal', totalConnections);
    this.updateMetric('ConnectionsDestroyed', 1);

    if (reason === 'error') {
      this.updateMetric('ConnectionErrors', 1);
    }

    this.maybeFlushMetrics();
  }

  logConnectionTimeout(poolName: string, waitTime: number) {
    console.warn(`[ConnectionPool:${poolName}] Connection timeout after ${waitTime}ms`);

    this.updateMetric('ConnectionTimeouts', 1);
    this.updateMetric('ConnectionWaitTime', waitTime);

    this.maybeFlushMetrics();
  }

  logPoolExhausted(poolName: string, maxConnections: number) {
    console.error(`[ConnectionPool:${poolName}] Pool exhausted! Max connections: ${maxConnections}`);

    this.updateMetric('PoolExhausted', 1);

    this.maybeFlushMetrics();
  }

  logAuthentication(success: boolean, username?: string, clientIP?: string, error?: string) {
    const timestamp = new Date().toISOString();

    if (success) {
      console.log(`[Auth:${timestamp}] Successful login for user: ${username || 'unknown'} from ${clientIP || 'unknown'}`);
      this.updateMetric('AuthSuccessful', 1);
    } else {
      console.warn(`[Auth:${timestamp}] Failed login attempt for user: ${username || 'unknown'} from ${clientIP || 'unknown'}. Error: ${error || 'unknown'}`);
      this.updateMetric('AuthFailed', 1);
    }

    this.maybeFlushMetrics();
  }

  updateMetric(name: string, value: number) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  private async maybeFlushMetrics() {
    const now = Date.now();
    if (now - this.lastFlush > this.flushInterval) {
      await this.flushMetrics();
      this.lastFlush = now;
    }
  }

  private async flushMetrics() {
    if (this.metrics.size === 0) return;

    try {
      const metricData = Array.from(this.metrics.entries()).map(([name, value]) => ({
        MetricName: name,
        Value: value,
        Unit: name.includes('Time') ? StandardUnit.Milliseconds : StandardUnit.Count,
        Timestamp: new Date(),
      }));

      const command = new PutMetricDataCommand({
        Namespace: 'RCM/Database/ConnectionPool',
        MetricData: metricData,
      });

      await this.cloudWatch.send(command);
      console.log(`Flushed ${metricData.length} connection pool metrics to CloudWatch`);

      // Clear metrics after sending
      this.metrics.clear();
    } catch (error) {
      console.error('Failed to flush connection pool metrics:', error);
    }
  }

  // Force flush metrics (useful for graceful shutdown)
  async forceFlush() {
    await this.flushMetrics();
  }
}

// Singleton instance
export const connectionPoolLogger = new ConnectionPoolLogger();

// Database connection wrapper with logging
export function createLoggedConnection(connectionConfig: any) {
  const originalConnect = connectionConfig.connect;
  const originalEnd = connectionConfig.end;

  return {
    ...connectionConfig,

    async connect() {
      const startTime = Date.now();

      try {
        const result = await originalConnect.call(this);
        const connectTime = Date.now() - startTime;

        connectionPoolLogger.logAuthentication(true, connectionConfig.user, connectionConfig.host);
        connectionPoolLogger.updateMetric('ConnectionTime', connectTime);

        return result;
      } catch (error) {
        const connectTime = Date.now() - startTime;

        connectionPoolLogger.logAuthentication(
          false,
          connectionConfig.user,
          connectionConfig.host,
          error instanceof Error ? error.message : 'Unknown error'
        );
        connectionPoolLogger.updateMetric('ConnectionTime', connectTime);

        throw error;
      }
    },

    async end() {
      try {
        const result = await originalEnd.call(this);
        connectionPoolLogger.logConnectionReleased('default', 0);
        return result;
      } catch (error) {
        connectionPoolLogger.logConnectionDestroyed('default', 0, 'error');
        throw error;
      }
    }
  };
}
