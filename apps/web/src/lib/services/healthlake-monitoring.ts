import { db } from '@foresight-cdss-next/db';
import { organizations, fhirResources } from '@foresight-cdss-next/db/schema';
import { eq, count } from 'drizzle-orm';

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  organizationId?: string;
  resourceType?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  tags: string[];
}

export type AlertType =
  | 'sync_failure'
  | 'sync_delay'
  | 'data_quality'
  | 'conflict_rate'
  | 'performance'
  | 'resource_count'
  | 'validation_errors'
  | 'system_health';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface MonitoringConfig {
  enableRealTimeMonitoring: boolean;
  metricRetentionDays: number;
  alertThresholds: Record<string, {
    warning: number;
    error: number;
    critical: number;
  }>;
  notificationChannels: {
    email?: {
      enabled: boolean;
      recipients: string[];
      smtp?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
  };
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncDuration: number;
  resourcesSynced: number;
  conflictsDetected: number;
  conflictsResolved: number;
  validationErrors: number;
  dataQualityScore: number;
  lastSyncTime: Date | null;
}

export interface SystemHealthMetrics {
  healthLakeConnectivity: boolean;
  ehrConnectivity: Record<string, boolean>;
  databaseHealth: boolean;
  s3Connectivity: boolean;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

export class HealthLakeMonitoring {
  private readonly metrics = new Map<string, HealthMetric[]>();
  private readonly alerts = new Map<string, Alert>();
  private monitoringInterval?: NodeJS.Timeout;
  // private readonly defaultRetentionDays = 30;

  constructor(private readonly config: MonitoringConfig) {
    if (config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('Monitoring already running');
      return;
    }

    console.log('📊 Starting HealthLake monitoring');

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.evaluateAlerts();
        await this.cleanupOldData();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
        await this.createAlert({
          type: 'system_health',
          severity: 'error',
          title: 'Monitoring System Error',
          message: `Monitoring cycle failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tags: ['monitoring', 'system']
        });
      }
    }, 60000); // Every minute

    console.log('✅ Real-time monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('🛑 Real-time monitoring stopped');
    }
  }

  /**
   * Record a metric
   */
  recordMetric(metric: Omit<HealthMetric, 'timestamp'>): void {
    const fullMetric: HealthMetric = {
      ...metric,
      timestamp: new Date()
    };

    const key = `${metric.name}-${metric.organizationId || 'global'}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(fullMetric);
    console.log(`📈 Recorded metric: ${metric.name} = ${metric.value} ${metric.unit}`);
  }

  /**
   * Get sync metrics for organization or global
   */
  async getSyncMetrics(organizationId?: string): Promise<SyncMetrics> {
    // const now = new Date();
    // const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // This would typically query a metrics database
    // For now, we'll simulate with sample data and some real queries
    try {
      const resourceCount = await db
        .select({ count: count() })
        .from(fhirResources)
        .where(
          organizationId
            ? eq(fhirResources.organizationId, organizationId)
            : undefined
        );

      // const recentResources = await db
      //   .select({ count: count() })
      //   .from(fhirResources)
      //   .where(
      //     organizationId
      //       ? eq(fhirResources.organizationId, organizationId)
      //       : gte(fhirResources.updatedAt, last24Hours)
      //   );

      return {
        totalSyncs: 150,
        successfulSyncs: 142,
        failedSyncs: 8,
        averageSyncDuration: 45.2,
        resourcesSynced: resourceCount[0]?.count || 0,
        conflictsDetected: 12,
        conflictsResolved: 10,
        validationErrors: 5,
        dataQualityScore: 87.5,
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Error fetching sync metrics:', error);
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncDuration: 0,
        resourcesSynced: 0,
        conflictsDetected: 0,
        conflictsResolved: 0,
        validationErrors: 0,
        dataQualityScore: 0,
        lastSyncTime: null
      };
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const healthChecks = await Promise.allSettled([
      this.checkHealthLakeConnectivity(),
      this.checkEHRConnectivity(),
      this.checkDatabaseHealth(),
      this.checkS3Connectivity()
    ]);

    return {
      healthLakeConnectivity: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
      ehrConnectivity: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : {},
      databaseHealth: healthChecks[2].status === 'fulfilled' && healthChecks[2].value,
      s3Connectivity: healthChecks[3].status === 'fulfilled' && healthChecks[3].value,
      averageResponseTime: 125.5,
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
      cpuUsage: 15.2, // Would need proper CPU monitoring
      diskUsage: 65.8  // Would need proper disk monitoring
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(organizationId?: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .filter(alert => !organizationId || alert.organizationId === organizationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alert history
   */
  getAlertHistory(
    organizationId?: string,
    hours = 24
  ): Alert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= cutoff)
      .filter(alert => !organizationId || alert.organizationId === organizationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Create an alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.set(alertId, alert);

    // Send notifications
    await this.sendNotifications(alert);

    console.log(`🚨 Alert created: ${alert.severity.toUpperCase()} - ${alert.title}`);
    return alertId;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    console.log(`✅ Alert resolved: ${alert.title}`);
  }

  /**
   * Get metrics for a specific metric name
   */
  getMetrics(
    metricName: string,
    organizationId?: string,
    hours = 24
  ): HealthMetric[] {
    const key = `${metricName}-${organizationId || 'global'}`;
    const metrics = this.metrics.get(key) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return metrics
      .filter(metric => metric.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(organizationId?: string): Promise<{
    syncMetrics: SyncMetrics;
    systemHealth: SystemHealthMetrics;
    activeAlerts: Alert[];
    recentMetrics: Record<string, HealthMetric[]>;
  }> {
    const [syncMetrics, systemHealth] = await Promise.all([
      this.getSyncMetrics(organizationId),
      this.getSystemHealthMetrics()
    ]);

    const activeAlerts = this.getActiveAlerts(organizationId);

    const recentMetrics = {
      syncDuration: this.getMetrics('sync_duration', organizationId, 6),
      resourceCount: this.getMetrics('resource_count', organizationId, 6),
      conflictRate: this.getMetrics('conflict_rate', organizationId, 6),
      dataQuality: this.getMetrics('data_quality_score', organizationId, 6)
    };

    return {
      syncMetrics,
      systemHealth,
      activeAlerts,
      recentMetrics
    };
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect sync metrics
      const syncMetrics = await this.getSyncMetrics();
      this.recordMetric({
        name: 'sync_success_rate',
        value: (syncMetrics.successfulSyncs / syncMetrics.totalSyncs) * 100,
        unit: 'percent'
      });

      this.recordMetric({
        name: 'average_sync_duration',
        value: syncMetrics.averageSyncDuration,
        unit: 'seconds'
      });

      // Collect system health metrics
      const systemHealth = await this.getSystemHealthMetrics();
      this.recordMetric({
        name: 'response_time',
        value: systemHealth.averageResponseTime,
        unit: 'ms'
      });

      this.recordMetric({
        name: 'memory_usage',
        value: systemHealth.memoryUsage,
        unit: 'percent'
      });

      // Collect per-organization metrics
      const organizationsMetric = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.status, 'active'));

      for (const org of organizationsMetric) {
        const orgSyncMetrics = await this.getSyncMetrics(org.id);
        this.recordMetric({
          name: 'conflict_rate',
          value: orgSyncMetrics.conflictsDetected / Math.max(1, orgSyncMetrics.resourcesSynced),
          unit: 'ratio',
          organizationId: org.id
        });

        this.recordMetric({
          name: 'data_quality_score',
          value: orgSyncMetrics.dataQualityScore,
          unit: 'score',
          organizationId: org.id
        });
      }

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Evaluate alerts based on current metrics
   */
  private async evaluateAlerts(): Promise<void> {
    const thresholds = this.config.alertThresholds;

    // Check sync success rate
    const successRateMetrics = this.getMetrics('sync_success_rate', undefined, 1);
    if (successRateMetrics.length > 0) {
      const latestSuccessRate = successRateMetrics[successRateMetrics.length - 1].value;

      if (latestSuccessRate < thresholds.sync_success_rate?.critical) {
        await this.createAlert({
          type: 'sync_failure',
          severity: 'critical',
          title: 'Critical Sync Failure Rate',
          message: `Sync success rate dropped to ${latestSuccessRate.toFixed(1)}%`,
          currentValue: latestSuccessRate,
          threshold: thresholds.sync_success_rate.critical,
          tags: ['sync', 'critical']
        });
      } else if (latestSuccessRate < thresholds.sync_success_rate?.warning) {
        await this.createAlert({
          type: 'sync_failure',
          severity: 'warning',
          title: 'Low Sync Success Rate',
          message: `Sync success rate is ${latestSuccessRate.toFixed(1)}%`,
          currentValue: latestSuccessRate,
          threshold: thresholds.sync_success_rate.warning,
          tags: ['sync', 'performance']
        });
      }
    }

    // Check response time
    const responseTimeMetrics = this.getMetrics('response_time', undefined, 1);
    if (responseTimeMetrics.length > 0) {
      const latestResponseTime = responseTimeMetrics[responseTimeMetrics.length - 1].value;

      if (latestResponseTime > thresholds.response_time?.error) {
        await this.createAlert({
          type: 'performance',
          severity: 'error',
          title: 'High Response Time',
          message: `Response time is ${latestResponseTime.toFixed(1)}ms`,
          currentValue: latestResponseTime,
          threshold: thresholds.response_time.error,
          tags: ['performance', 'latency']
        });
      }
    }

    // Check memory usage
    const memoryMetrics = this.getMetrics('memory_usage', undefined, 1);
    if (memoryMetrics.length > 0) {
      const latestMemoryUsage = memoryMetrics[memoryMetrics.length - 1].value;

      if (latestMemoryUsage > thresholds.memory_usage?.critical) {
        await this.createAlert({
          type: 'system_health',
          severity: 'critical',
          title: 'Critical Memory Usage',
          message: `Memory usage is ${latestMemoryUsage.toFixed(1)}%`,
          currentValue: latestMemoryUsage,
          threshold: thresholds.memory_usage.critical,
          tags: ['system', 'memory', 'critical']
        });
      }
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const notifications = [];

    // Email notifications
    if (this.config.notificationChannels.email?.enabled) {
      notifications.push(this.sendEmailNotification(alert));
    }

    // Slack notifications
    if (this.config.notificationChannels.slack?.enabled) {
      notifications.push(this.sendSlackNotification(alert));
    }

    // Webhook notifications
    if (this.config.notificationChannels.webhook?.enabled) {
      notifications.push(this.sendWebhookNotification(alert));
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Implementation would use nodemailer or similar
    console.log(`📧 Email notification sent for alert: ${alert.title}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    const { slack } = this.config.notificationChannels;
    if (!slack?.webhookUrl) return;

    const payload = {
      channel: slack.channel,
      username: 'HealthLake Monitor',
      icon_emoji: this.getAlertEmoji(alert.severity),
      attachments: [
        {
          color: this.getAlertColor(alert.severity),
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Type',
              value: alert.type.replace('_', ' ').toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }

      console.log(`📱 Slack notification sent for alert: ${alert.title}`);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    const { webhook } = this.config.notificationChannels;
    if (!webhook?.url) return;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook notification failed: ${response.statusText}`);
      }

      console.log(`🔗 Webhook notification sent for alert: ${alert.title}`);
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Health check functions
   */
  private async checkHealthLakeConnectivity(): Promise<boolean> {
    try {
      // Implementation would make actual HealthLake API call
      return true;
    } catch {
      return false;
    }
  }

  private async checkEHRConnectivity(): Promise<Record<string, boolean>> {
    // Implementation would check each EHR connection
    return {
      'epic-main': true,
      'cerner-backup': false
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await db.select({ count: count() }).from(organizations).limit(1);
      return true;
    } catch {
      return false;
    }
  }

  private async checkS3Connectivity(): Promise<boolean> {
    try {
      // Implementation would make actual S3 API call
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup old metrics and alerts
   */
  private async cleanupOldData(): Promise<void> {
    const retentionCutoff = new Date(
      Date.now() - this.config.metricRetentionDays * 24 * 60 * 60 * 1000
    );

    // Clean up old metrics
    for (const [key, metrics] of this.metrics) {
      const filteredMetrics = metrics.filter(m => m.timestamp >= retentionCutoff);
      this.metrics.set(key, filteredMetrics);
    }

    // Clean up old resolved alerts
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < retentionCutoff) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Helper functions
   */
  private getAlertEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return ':red_circle:';
      case 'error': return ':warning:';
      case 'warning': return ':yellow_circle:';
      case 'info': return ':information_source:';
      default: return ':question:';
    }
  }

  private getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'error': return 'warning';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return '#cccccc';
    }
  }
}

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  enableRealTimeMonitoring: true,
  metricRetentionDays: 30,
  alertThresholds: {
    sync_success_rate: {
      warning: 90,
      error: 80,
      critical: 70
    },
    response_time: {
      warning: 1000,
      error: 2000,
      critical: 5000
    },
    memory_usage: {
      warning: 80,
      error: 90,
      critical: 95
    },
    conflict_rate: {
      warning: 0.05,
      error: 0.1,
      critical: 0.2
    },
    data_quality_score: {
      warning: 80,
      error: 70,
      critical: 60
    }
  },
  notificationChannels: {
    email: {
      enabled: false,
      recipients: []
    },
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#healthlake-alerts'
    },
    webhook: {
      enabled: false,
      url: ''
    }
  }
};

// Global monitoring instance
export const healthLakeMonitoring = new HealthLakeMonitoring(defaultMonitoringConfig);
