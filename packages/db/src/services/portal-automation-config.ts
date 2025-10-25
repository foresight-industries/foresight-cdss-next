import { eq, and, desc, lt } from 'drizzle-orm';
import { db } from '../connection';
import {
  portalAutomationConfigs,
  portalAutomationLogs,
  NewPortalAutomationConfig,
  PortalAutomationConfig,
  PortalAutomationLog
} from '../schema';
import { randomUUID } from 'node:crypto';

export interface PortalConfigUpdateResult {
  success: boolean;
  configId?: string;
  error?: string;
}

export interface PortalExecutionContext {
  executionId: string;
  configId: string;
  workflowId?: string;
  sessionId?: string;
  priorAuthId?: string;
}

export interface ExecutionLogEntry {
  step: string;
  action: string;
  status: 'success' | 'failed' | 'warning' | 'info';
  message?: string;
  errorCode?: string;
  selector?: string;
  elementFound?: boolean;
  waitTime?: number;
  screenshot?: string;
  executionTime?: number;
  botDetectionSignals?: {
    captchaDetected?: boolean;
    rateLimitHit?: boolean;
    suspiciousRedirect?: boolean;
    accountFlagged?: boolean;
    humanVerificationRequired?: boolean;
    ipBlocked?: boolean;
  };
  browserInfo?: {
    userAgent: string;
    viewport: { width: number; height: number };
    cookies: number;
    localStorage: number;
  };
}

export class PortalAutomationConfigService {
  async getPortalConfig(
    organizationId: string,
    payerId: string,
    portalName: string
  ): Promise<PortalAutomationConfig | null> {
    const configs = await db
      .select()
      .from(portalAutomationConfigs)
      .where(
        and(
          eq(portalAutomationConfigs.organizationId, organizationId),
          eq(portalAutomationConfigs.payerId, payerId),
          eq(portalAutomationConfigs.portalName, portalName),
          eq(portalAutomationConfigs.isActive, true)
        )
      )
      .orderBy(desc(portalAutomationConfigs.version))
      .limit(1);

    return configs.length > 0 ? configs[0] : null;
  }

  async createOrUpdatePortalConfig(
    config: Omit<NewPortalAutomationConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PortalConfigUpdateResult> {
    try {
      // Check if config already exists
      const existing = await this.getPortalConfig(
        config.organizationId,
        config.payerId,
        config.portalName
      );

      if (existing) {
        // Update existing config by incrementing version
        const [updated] = await db
          .update(portalAutomationConfigs)
          .set({
            ...config,
            version: Number(existing?.version) + 1,
            updatedAt: new Date(),
          })
          .where(eq(portalAutomationConfigs.id, existing.id))
          .returning();

        return { success: true, configId: updated.id };
      } else {
        // Create new config
        const [created] = await db
          .insert(portalAutomationConfigs)
          .values(config)
          .returning();

        return { success: true, configId: created.id };
      }
    } catch (error) {
      console.error('Error creating/updating portal config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validatePortalConfig(configId: string): Promise<{
    isValid: boolean;
    issues: string[];
    testedAt: Date;
  }> {
    const config = await db
      .select()
      .from(portalAutomationConfigs)
      .where(eq(portalAutomationConfigs.id, configId))
      .limit(1);

    if (!config.length) {
      return {
        isValid: false,
        issues: ['Configuration not found'],
        testedAt: new Date()
      };
    }

    const issues: string[] = [];
    const currentConfig = config[0];

    // Validate required selectors
    if (!currentConfig.selectors.login?.usernameField?.length) {
      issues.push('Missing username field selectors');
    }
    if (!currentConfig.selectors.login?.passwordField?.length) {
      issues.push('Missing password field selectors');
    }
    if (!currentConfig.selectors.forms?.submitButton?.length) {
      issues.push('Missing form submit button selectors');
    }

    // Validate timeouts
    if (currentConfig.timeouts?.pageLoad && currentConfig.timeouts.pageLoad < 5000) {
      issues.push('Page load timeout too short (minimum 5 seconds)');
    }
    if (currentConfig.timeouts?.overallTask && currentConfig.timeouts.overallTask > 1800000) { // 30 minutes
      issues.push('Overall task timeout too long (maximum 30 minutes)');
    }

    // Update validation status
    const validationStatus = issues.length === 0 ? 'validated' : 'broken';
    await db
      .update(portalAutomationConfigs)
      .set({
        validationStatus,
        lastValidatedAt: new Date(),
      })
      .where(eq(portalAutomationConfigs.id, configId));

    return {
      isValid: issues.length === 0,
      issues,
      testedAt: new Date()
    };
  }

  async startExecution(
    configId: string,
    workflowId?: string,
    priorAuthId?: string
  ): Promise<PortalExecutionContext> {
    const executionId = randomUUID();

    return {
      executionId,
      configId,
      workflowId,
      priorAuthId
    };
  }

  async logExecution(
    context: PortalExecutionContext,
    entry: ExecutionLogEntry
  ): Promise<void> {
    try {
      await db.insert(portalAutomationLogs).values({
        configId: context.configId,
        workflowId: context.workflowId,
        sessionId: context.sessionId,
        priorAuthId: context.priorAuthId,
        executionId: context.executionId,
        step: entry.step,
        action: entry.action,
        status: entry.status,
        message: entry.message,
        errorCode: entry.errorCode,
        selector: entry.selector,
        elementFound: entry.elementFound,
        waitTime: entry.waitTime,
        screenshot: entry.screenshot,
        executionTime: entry.executionTime,
        botDetectionSignals: entry.botDetectionSignals,
        browserInfo: entry.browserInfo,
      });
    } catch (error) {
      console.error('Error logging portal automation execution:', error);
    }
  }

  async updateConfigMetrics(
    configId: string,
    success: boolean,
    processingTime: number
  ): Promise<void> {
    try {
      const config = await db
        .select()
        .from(portalAutomationConfigs)
        .where(eq(portalAutomationConfigs.id, configId))
        .limit(1);

      if (!config.length) return;

      const current = config[0];
      const newTotalAttempts = (current.totalAttempts ?? 0) + 1;
      const newTotalSuccesses = (current.totalSuccesses ?? 0) + (success ? 1 : 0);
      const newSuccessRate = (newTotalSuccesses / newTotalAttempts) * 100;

      // Calculate moving average for processing time
      const newAvgProcessingTime = Math.round(
        ((current.avgProcessingTime ?? 0) * (current.totalAttempts ?? 0) + processingTime) / newTotalAttempts
      );

      await db
        .update(portalAutomationConfigs)
        .set({
          totalAttempts: newTotalAttempts,
          totalSuccesses: newTotalSuccesses,
          avgSuccessRate: newSuccessRate.toFixed(2),
          avgProcessingTime: newAvgProcessingTime,
          lastSuccessAt: success ? new Date() : current.lastSuccessAt,
          lastFailureAt: !success ? new Date() : current.lastFailureAt,
          updatedAt: new Date(),
        })
        .where(eq(portalAutomationConfigs.id, configId));
    } catch (error) {
      console.error('Error updating config metrics:', error);
    }
  }

  async getConfigsBySuccessRate(
    threshold: number = 85
  ): Promise<PortalAutomationConfig[]> {
    return db
      .select()
      .from(portalAutomationConfigs)
      .where(
        and(
          eq(portalAutomationConfigs.isActive, true),
          // Convert decimal to number for comparison
          // TODO: This might need adjustment based on how Drizzle handles decimal comparison
        )
      )
      .orderBy(desc(portalAutomationConfigs.avgSuccessRate));
  }

  async getExecutionLogs(
    executionId: string
  ): Promise<PortalAutomationLog[]> {
    return db
      .select()
      .from(portalAutomationLogs)
      .where(eq(portalAutomationLogs.executionId, executionId))
      .orderBy(portalAutomationLogs.timestamp);
  }

  async cleanup(): Promise<{
    logsDeleted: number;
    configsArchived: number;
  }> {
    try {
      // Delete logs older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedLogs = await db
        .delete(portalAutomationLogs)
        .where(lt(portalAutomationLogs.timestamp, thirtyDaysAgo))
        .returning({ id: portalAutomationLogs.id });

      // Archive configs that haven't been used in 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const archivedConfigs = await db
        .update(portalAutomationConfigs)
        .set({ isActive: false })
        .where(
          and(
            eq(portalAutomationConfigs.isActive, true),
            lt(portalAutomationConfigs.lastSuccessAt, ninetyDaysAgo)
          )
        )
        .returning({ id: portalAutomationConfigs.id });

      return {
        logsDeleted: deletedLogs.length,
        configsArchived: archivedConfigs.length
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { logsDeleted: 0, configsArchived: 0 };
    }
  }
}

export const portalAutomationConfigService = new PortalAutomationConfigService();
