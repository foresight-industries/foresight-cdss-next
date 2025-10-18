import { eq, and, lt, isNotNull } from 'drizzle-orm';
import type { DatabaseWrapper, PhiDataClassification } from './types';

/**
 * HIPAA Data Retention Manager
 * Handles automatic purging of webhook data based on retention policies
 */
export class WebhookDataRetentionManager {
  private readonly organizationId?: string;
  private readonly databaseWrapper: DatabaseWrapper;

  constructor(databaseWrapper: DatabaseWrapper, organizationId?: string) {
    this.databaseWrapper = databaseWrapper;
    this.organizationId = organizationId;
  }

  /**
   * Execute data retention policies for all webhooks
   */
  async executeRetentionPolicies(): Promise<{
    success: boolean;
    processedWebhooks: number;
    purgedDeliveries: number;
    purgedAttempts: number;
    purgedAuditLogs: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processedWebhooks = 0;
    let totalPurgedDeliveries = 0;
    let totalPurgedAttempts = 0;
    let totalPurgedAuditLogs = 0;

    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Get all webhook configurations with retention policies
      const whereClause = this.organizationId
        ? and(
            eq(this.databaseWrapper.schemas.webhookConfigs.organizationId, this.organizationId),
            isNotNull(this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays)
          )
        : isNotNull(this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays);

      const { data: webhooks, error: webhookError } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          id: this.databaseWrapper.schemas.webhookConfigs.id,
          name: this.databaseWrapper.schemas.webhookConfigs.name,
          organizationId: this.databaseWrapper.schemas.webhookConfigs.organizationId,
          dataRetentionDays: this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays,
          phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(whereClause)
      );

      if (webhookError) {
        errors.push(`Failed to fetch webhook configurations: ${webhookError}`);
        return {
          success: false,
          processedWebhooks: 0,
          purgedDeliveries: 0,
          purgedAttempts: 0,
          purgedAuditLogs: 0,
          errors,
        };
      }

      // Process each webhook's retention policy
      for (const webhook of webhooks || []) {
        try {
          const webhookData = webhook as {
            id: string;
            name: string;
            organizationId: string;
            dataRetentionDays: number;
            phiDataClassification: PhiDataClassification;
          };

          const retentionResult = await this.applyRetentionPolicy(webhookData);

          if (retentionResult.success) {
            processedWebhooks++;
            totalPurgedDeliveries += retentionResult.purgedDeliveries;
            totalPurgedAttempts += retentionResult.purgedAttempts;
            totalPurgedAuditLogs += retentionResult.purgedAuditLogs;
          } else {
            errors.push(`Failed to apply retention policy for webhook ${webhookData.name}: ${retentionResult.error}`);
          }

        } catch (error) {
          const webhookId = (webhook as any)?.id || 'unknown';
          errors.push(`Error processing webhook ${webhookId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        processedWebhooks,
        purgedDeliveries: totalPurgedDeliveries,
        purgedAttempts: totalPurgedAttempts,
        purgedAuditLogs: totalPurgedAuditLogs,
        errors,
      };

    } catch (error) {
      errors.push(`Retention policy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        processedWebhooks: 0,
        purgedDeliveries: 0,
        purgedAttempts: 0,
        purgedAuditLogs: 0,
        errors,
      };
    }
  }

  /**
   * Apply retention policy for a specific webhook
   */
  async applyRetentionPolicy(webhook: {
    id: string;
    name: string;
    organizationId: string;
    dataRetentionDays: number;
    phiDataClassification: 'none' | 'limited' | 'full';
  }): Promise<{
    success: boolean;
    purgedDeliveries: number;
    purgedAttempts: number;
    purgedAuditLogs: number;
    error?: string;
  }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - webhook.dataRetentionDays);

      // Log retention policy application
      console.log(`Applying retention policy for webhook ${webhook.name}: ${webhook.dataRetentionDays} days, cutoff: ${cutoffDate.toISOString()}`);

      // Step 1: Delete old delivery attempts (skip if schema not available)
      let deletedAttempts: any[] = [];
      if (this.databaseWrapper.schemas.webhookDeliveryAttempts) {
        const { data, error: attemptsError } = await this.databaseWrapper.safeDelete(async () =>
          db.delete(this.databaseWrapper.schemas.webhookDeliveryAttempts)
            .where(lt(this.databaseWrapper.schemas.webhookDeliveryAttempts.startedAt, cutoffDate))
            .returning({ id: this.databaseWrapper.schemas.webhookDeliveryAttempts.id })
        );

        if (attemptsError) {
          return {
            success: false,
            purgedDeliveries: 0,
            purgedAttempts: 0,
            purgedAuditLogs: 0,
            error: `Failed to delete delivery attempts: ${attemptsError}`,
          };
        }
        
        deletedAttempts = data || [];
      }

      // Step 2: Clean PHI data from old deliveries (for PHI webhooks)
      let cleanedDeliveries = 0;
      if (webhook.phiDataClassification !== 'none') {
        const { data: updatedDeliveries, error: cleanError } = await this.databaseWrapper.safeUpdate(async () =>
          db.update(this.databaseWrapper.schemas.webhookDeliveries)
            .set({
              eventData: '{"_purged": true, "_reason": "retention_policy", "_purged_at": "' + new Date().toISOString() + '"}',
              responseBody: null,
              requestHeaders: null,
              responseHeaders: null,
            })
            .where(and(
              eq(this.databaseWrapper.schemas.webhookDeliveries.webhookConfigId, webhook.id),
              lt(this.databaseWrapper.schemas.webhookDeliveries.createdAt, cutoffDate)
            ))
            .returning({ id: this.databaseWrapper.schemas.webhookDeliveries.id })
        );

        if (cleanError) {
          return {
            success: false,
            purgedDeliveries: 0,
            purgedAttempts: 0,
            purgedAuditLogs: 0,
            error: `Failed to clean PHI data from deliveries: ${cleanError}`,
          };
        }

        cleanedDeliveries = updatedDeliveries?.length || 0;
      }

      // Step 3: Delete old deliveries (for non-PHI webhooks) or very old deliveries
      const deleteCutoffDate = new Date();
      deleteCutoffDate.setDate(deleteCutoffDate.getDate() - Math.max(webhook.dataRetentionDays * 2, 365)); // Keep metadata longer

      const { data: deletedDeliveries, error: deliveriesError } = await this.databaseWrapper.safeDelete(async () =>
        db.delete(this.databaseWrapper.schemas.webhookDeliveries)
          .where(and(
            eq(this.databaseWrapper.schemas.webhookDeliveries.webhookConfigId, webhook.id),
            lt(this.databaseWrapper.schemas.webhookDeliveries.createdAt, deleteCutoffDate)
          ))
          .returning({ id: this.databaseWrapper.schemas.webhookDeliveries.id })
      );

      if (deliveriesError) {
        return {
          success: false,
          purgedDeliveries: 0,
          purgedAttempts: 0,
          purgedAuditLogs: 0,
          error: `Failed to delete old deliveries: ${deliveriesError}`,
        };
      }

      // Step 4: Clean audit logs (keep compliance records longer)
      const auditCutoffDate = new Date();
      auditCutoffDate.setDate(auditCutoffDate.getDate() - Math.max(webhook.dataRetentionDays * 3, 2555)); // 7 years for compliance

      const { data: cleanedAuditLogs, error: auditError } = await this.databaseWrapper.safeUpdate(async () =>
        db.update(this.databaseWrapper.schemas.webhookHipaaAuditLog)
          .set({
            phiDataTypes: null,
            entityIds: null,
            requestHeaders: null,
          })
          .where(and(
            eq(this.databaseWrapper.schemas.webhookHipaaAuditLog.webhookConfigId, webhook.id),
            lt(this.databaseWrapper.schemas.webhookHipaaAuditLog.createdAt, auditCutoffDate)
          ))
          .returning({ id: this.databaseWrapper.schemas.webhookHipaaAuditLog.id })
      );

      if (auditError) {
        return {
          success: false,
          purgedDeliveries: 0,
          purgedAttempts: 0,
          purgedAuditLogs: 0,
          error: `Failed to clean audit logs: ${auditError}`,
        };
      }

      return {
        success: true,
        purgedDeliveries: (deletedDeliveries?.length || 0) + cleanedDeliveries,
        purgedAttempts: deletedAttempts?.length || 0,
        purgedAuditLogs: cleanedAuditLogs?.length || 0,
      };

    } catch (error) {
      return {
        success: false,
        purgedDeliveries: 0,
        purgedAttempts: 0,
        purgedAuditLogs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get retention policy status for organization
   */
  async getRetentionStatus(organizationId?: string): Promise<{
    webhooks: Array<{
      id: string;
      name: string;
      dataRetentionDays: number;
      phiDataClassification: string;
      lastPurgeDate?: Date;
      estimatedDataSize: number;
      complianceStatus: 'compliant' | 'overdue' | 'warning';
    }>;
    summary: {
      totalWebhooks: number;
      compliantWebhooks: number;
      overdueWebhooks: number;
      warningWebhooks: number;
      totalDataSizeMB: number;
    };
  }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      const orgId = organizationId ?? this.organizationId;
      const whereClause = orgId ? eq(this.databaseWrapper.schemas.webhookConfigs.organizationId, orgId) : undefined;

      const { data: webhooks } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          id: this.databaseWrapper.schemas.webhookConfigs.id,
          name: this.databaseWrapper.schemas.webhookConfigs.name,
          dataRetentionDays: this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays,
          phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
          organizationId: this.databaseWrapper.schemas.webhookConfigs.organizationId,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(whereClause)
      );

      const webhookStatuses = await Promise.all((webhooks || []).map(async (webhook: any) => {
        const webhookData = webhook as {
          id: string;
          name: string;
          dataRetentionDays: number | null;
          phiDataClassification: string;
          organizationId: string;
        };

        // Get delivery count and size estimation
        const { data: deliveryStats } = await this.databaseWrapper.safeSelect(async () =>
          db.select({
            count: this.databaseWrapper.schemas.webhookDeliveries.id,
            totalSize: this.databaseWrapper.schemas.webhookDeliveries.requestBodySize,
          })
          .from(this.databaseWrapper.schemas.webhookDeliveries)
          .where(eq(this.databaseWrapper.schemas.webhookDeliveries.webhookConfigId, webhookData.id))
        );

        const estimatedDataSize = (deliveryStats?.length || 0) * 2; // Rough estimate in KB

        // Determine compliance status
        let complianceStatus: 'compliant' | 'overdue' | 'warning' = 'compliant';

        if (webhookData.dataRetentionDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - webhookData.dataRetentionDays);

          // Check if there are old deliveries
          const { data: oldDeliveries } = await this.databaseWrapper.safeSelect(async () =>
            db.select({ id: this.databaseWrapper.schemas.webhookDeliveries.id })
              .from(this.databaseWrapper.schemas.webhookDeliveries)
              .where(and(
                eq(this.databaseWrapper.schemas.webhookDeliveries.webhookConfigId, webhookData.id),
                lt(this.databaseWrapper.schemas.webhookDeliveries.createdAt, cutoffDate)
              ))
              .limit(1)
          );

          if (oldDeliveries && oldDeliveries.length > 0) {
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() - (webhookData.dataRetentionDays + 7));

            complianceStatus = cutoffDate < warningDate ? 'overdue' : 'warning';
          }
        }

        return {
          id: webhookData.id,
          name: webhookData.name,
          dataRetentionDays: webhookData.dataRetentionDays || 30,
          phiDataClassification: webhookData.phiDataClassification,
          estimatedDataSize,
          complianceStatus,
        };
      }));

      const summary = {
        totalWebhooks: webhookStatuses.length,
        compliantWebhooks: webhookStatuses.filter(w => w.complianceStatus === 'compliant').length,
        overdueWebhooks: webhookStatuses.filter(w => w.complianceStatus === 'overdue').length,
        warningWebhooks: webhookStatuses.filter(w => w.complianceStatus === 'warning').length,
        totalDataSizeMB: webhookStatuses.reduce((sum, w) => sum + w.estimatedDataSize, 0) / 1024,
      };

      return {
        webhooks: webhookStatuses,
        summary,
      };

    } catch (error) {
      console.error('Error getting retention status:', error);
      return {
        webhooks: [],
        summary: {
          totalWebhooks: 0,
          compliantWebhooks: 0,
          overdueWebhooks: 0,
          warningWebhooks: 0,
          totalDataSizeMB: 0,
        },
      };
    }
  }

  /**
   * Set retention policy for webhook
   */
  async setRetentionPolicy(
    webhookConfigId: string,
    retentionDays: number,
    autoApply = true
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Validate retention period
      if (retentionDays < 1 || retentionDays > 2555) { // Max 7 years
        return {
          success: false,
          error: 'Retention period must be between 1 and 2555 days',
        };
      }

      // Update webhook configuration
      const { error } = await this.databaseWrapper.safeUpdate(async () =>
        db.update(this.databaseWrapper.schemas.webhookConfigs)
          .set({
            dataRetentionDays: retentionDays,
            updatedAt: new Date(),
          })
          .where(eq(this.databaseWrapper.schemas.webhookConfigs.id, webhookConfigId))
      );

      if (error) {
        return {
          success: false,
          error: `Failed to update retention policy: ${error}`,
        };
      }

      // Optionally apply retention policy immediately
      if (autoApply) {
        const { data: webhook } = await this.databaseWrapper.safeSelect(async () =>
          db.select({
            id: this.databaseWrapper.schemas.webhookConfigs.id,
            name: this.databaseWrapper.schemas.webhookConfigs.name,
            organizationId: this.databaseWrapper.schemas.webhookConfigs.organizationId,
            dataRetentionDays: this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays,
            phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
          })
          .from(this.databaseWrapper.schemas.webhookConfigs)
          .where(eq(this.databaseWrapper.schemas.webhookConfigs.id, webhookConfigId))
        );

        if (webhook && webhook.length > 0) {
          const webhookData = webhook[0] as {
            id: string;
            name: string;
            organizationId: string;
            dataRetentionDays: number;
            phiDataClassification: 'none' | 'limited' | 'full';
          };

          await this.applyRetentionPolicy(webhookData);
        }
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Automated retention policy scheduler
 * Note: This class requires database wrapper to be passed to instances
 */
export class RetentionPolicyScheduler {
  private readonly databaseWrapper: DatabaseWrapper;

  constructor(databaseWrapper: DatabaseWrapper) {
    this.databaseWrapper = databaseWrapper;
  }

  /**
   * Schedule retention policy execution
   * In production, this would be called by a cron job or scheduled Lambda
   */
  async executeScheduledRetention(): Promise<{
    success: boolean;
    executionId: string;
    summary: {
      processedOrganizations: number;
      totalProcessedWebhooks: number;
      totalPurgedData: number;
    };
    errors: string[];
  }> {
    const executionId = `retention-${Date.now()}`;
    const errors: string[] = [];
    let processedOrganizations = 0;
    let totalProcessedWebhooks = 0;
    let totalPurgedData = 0;

    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Get all organizations with webhooks that have retention policies
      const { data: organizations } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          organizationId: this.databaseWrapper.schemas.webhookConfigs.organizationId,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(isNotNull(this.databaseWrapper.schemas.webhookConfigs.dataRetentionDays))
        .groupBy(this.databaseWrapper.schemas.webhookConfigs.organizationId)
      );

      // Process each organization
      for (const org of organizations || []) {
        try {
          const orgData = org as { organizationId: string };
          const retentionManager = new WebhookDataRetentionManager(this.databaseWrapper, orgData.organizationId);

          const result = await retentionManager.executeRetentionPolicies();

          if (result.success) {
            processedOrganizations++;
            totalProcessedWebhooks += result.processedWebhooks;
            totalPurgedData += result.purgedDeliveries + result.purgedAttempts + result.purgedAuditLogs;
          } else {
            errors.push(`Organization ${orgData.organizationId}: ${result.errors.join(', ')}`);
          }

        } catch (error) {
          errors.push(`Failed to process organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`Retention policy execution ${executionId} completed:`, {
        processedOrganizations,
        totalProcessedWebhooks,
        totalPurgedData,
        errorCount: errors.length,
      });

      return {
        success: errors.length === 0,
        executionId,
        summary: {
          processedOrganizations,
          totalProcessedWebhooks,
          totalPurgedData,
        },
        errors,
      };

    } catch (error) {
      errors.push(`Scheduled retention execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        executionId,
        summary: {
          processedOrganizations: 0,
          totalProcessedWebhooks: 0,
          totalPurgedData: 0,
        },
        errors,
      };
    }
  }
}