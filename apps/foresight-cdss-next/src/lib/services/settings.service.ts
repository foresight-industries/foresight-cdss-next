// Settings Service - AWS database integration for rules engine

import { createAuthenticatedDatabaseClient, safeSingle, safeSelect, safeInsert, safeUpdate, safeDelete } from "@/lib/aws/database";
import { eq, and } from "drizzle-orm";
import {
  systemSettings,
  automationRules,
  businessRules,
  notificationTemplates, SystemSettings
} from "@foresight-cdss-next/db";

// Types for AWS schema integration
export interface OrganizationAutomationConfig {
  id: string;
  organizationId: string;
  globalConfidenceThreshold: number;
  autoApprovalThreshold: number;
  requireReviewThreshold: number;
  cptCodeThreshold: number;
  icd10Threshold: number;
  placeOfServiceThreshold: number;
  modifiersThreshold: number;
  enableAutoSubmission: boolean;
  enableAutoEpa: boolean;
  enableBulkProcessing: boolean;
  confidenceScoreEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationValidationConfig {
  id: string;
  organizationId: string;
  telehealthEnabled: boolean;
  inPersonEnabled: boolean;
  homeVisitsEnabled: boolean;
  enforcePosValidation: boolean;
  blockOnMissingFields: boolean;
  enableTimeValidation: boolean;
  extractTimeFromNotes: boolean;
  enforceCredentialing: boolean;
  multiStateLicensure: boolean;
  showCredentialingAlerts: boolean;
  allowedProviderStatuses: string[];
  medicalNecessityThreshold: number;
  logRuleApplications: boolean;
  logAutoFixes: boolean;
  auditRetentionPeriod: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rule types adapted to AWS schema
export interface AutomationRuleType {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  conditions: any;
  actions: any;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayerOverrideRule {
  id: string;
  organizationId: string;
  payerName: string;
  ruleName: string;
  description: string;
  ruleType: string;
  conditions: any;
  actions: any;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmTimeRule {
  id: string;
  organizationId: string;
  cptCode: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DenialPlaybook {
  id: string;
  organizationId: string;
  code: string;
  description: string;
  strategy: string;
  enabled: boolean;
  autoFixEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comprehensive settings response
export interface OrganizationSettingsResponse {
  // Basic config (adapted to AWS schema)
  automation_config: OrganizationAutomationConfig;
  validation_config: OrganizationValidationConfig;

  // Rules from AWS schema
  automation_rules: AutomationRuleType[];
  payer_override_rules: PayerOverrideRule[];
  em_time_rules: EmTimeRule[];
  denial_playbook: DenialPlaybook[];

  // Rule counts for dashboard
  rule_summary: {
    total_automation_rules: number;
    active_automation_rules: number;
    total_payer_rules: number;
    active_payer_rules: number;
    total_time_rules: number;
    active_time_rules: number;
    total_denial_rules: number;
    active_denial_rules: number;
  };
}

export class SettingsService {
  // No longer needs constructor parameters since we use AWS database client
  constructor() {
    // AWS database client is created per-request
  }

  // ===================================
  // GET ALL SETTINGS (AWS Approach)
  // ===================================
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSettingsResponse> {
    // Fetch basic config and rules in parallel
    const [
      automationConfigResult,
      validationConfigResult,
      automationRulesResult,
      payerRulesResult,
      timeRulesResult,
      denialRulesResult,
    ] = await Promise.all([
      this.getOrCreateAutomationConfig(organizationId),
      this.getOrCreateValidationConfig(organizationId),
      this.getAutomationRules(organizationId),
      this.getPayerOverrideRules(organizationId),
      this.getEmTimeRules(organizationId),
      this.getDenialPlaybook(organizationId),
    ]);

    // Calculate rule summary
    const rule_summary = {
      total_automation_rules: automationRulesResult.length,
      active_automation_rules: automationRulesResult.filter((r: any) => r.isActive)
        .length,
      total_payer_rules: payerRulesResult.length,
      active_payer_rules: payerRulesResult.filter((r: any) => r.enabled).length,
      total_time_rules: timeRulesResult.length,
      active_time_rules: timeRulesResult.filter((r: any) => r.enabled).length,
      total_denial_rules: denialRulesResult.length,
      active_denial_rules: denialRulesResult.filter((r: any) => r.enabled).length,
    };

    return {
      automation_config: automationConfigResult,
      validation_config: validationConfigResult,
      automation_rules: automationRulesResult,
      payer_override_rules: payerRulesResult,
      em_time_rules: timeRulesResult,
      denial_playbook: denialRulesResult,
      rule_summary,
    };
  }

  // ===================================
  // BASIC CONFIG MANAGEMENT
  // ===================================
  async updateAutomationConfig(
    organizationId: string,
    updates: Partial<
      Omit<OrganizationAutomationConfig, "id" | "organizationId" | "createdAt" | "updatedAt">
    >
  ): Promise<OrganizationAutomationConfig> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeUpdate(async () =>
      db.update(systemSettings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.organizationId, organizationId))
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to update automation config');
    }

    return data[0] as unknown as OrganizationAutomationConfig;
  }

  async updateValidationConfig(
    organizationId: string,
    updates: Partial<
      Omit<OrganizationValidationConfig, "id" | "organizationId" | "createdAt" | "updatedAt">
    >
  ): Promise<OrganizationValidationConfig> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeUpdate(async () =>
      db.update(systemSettings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.organizationId, organizationId))
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to update validation config');
    }

    return data[0] as unknown as OrganizationValidationConfig;
  }

  private async getOrCreateAutomationConfig(
    organizationId: string
  ): Promise<OrganizationAutomationConfig> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data: existingConfig } = await safeSingle(async () =>
      db.select()
        .from(systemSettings)
        .where(eq(systemSettings.organizationId, organizationId))
    );

    if (existingConfig) {
      return existingConfig as unknown as OrganizationAutomationConfig;
    }

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    // Create default config
    const defaultConfigValue = {
      globalConfidenceThreshold: 0.7,
      autoApprovalThreshold: 0.9,
      requireReviewThreshold: 0.5,
      cptCodeThreshold: 0.8,
      icd10Threshold: 0.8,
      placeOfServiceThreshold: 0.8,
      modifiersThreshold: 0.8,
      enableAutoSubmission: false,
      enableAutoEpa: false,
      enableBulkProcessing: false,
      confidenceScoreEnabled: true
    };

    const { data: newConfig } = await safeInsert(async () =>
      db.insert(systemSettings)
        .values({
          organizationId,
          settingKey: 'automation_config',
          settingValue: JSON.stringify(defaultConfigValue),
          settingType: 'json',
          scope: 'organization',
          description: 'Default automation configuration'
        })
        .returning()
    );

    if (!newConfig || newConfig.length === 0) {
      throw new Error('Failed to create automation config');
    }

    return newConfig[0] as OrganizationAutomationConfig;
  }

  private async getOrCreateValidationConfig(
    organizationId: string
  ): Promise<OrganizationValidationConfig> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data: existingConfig } = await safeSingle(async () =>
      db.select()
        .from(systemSettings)
        .where(and(
          eq(systemSettings.organizationId, organizationId),
          eq(systemSettings.settingKey, 'validation_config')
        ))
    );

    if (existingConfig) {
      const parsedValue = JSON.parse(existingConfig.settingValue || '{}');
      return {
        id: existingConfig.id,
        organizationId: existingConfig.organizationId!,
        ...parsedValue,
        createdAt: existingConfig.createdAt,
        updatedAt: existingConfig.updatedAt
      } as OrganizationValidationConfig;
    }

    // Create default config
    const defaultValidationValue = {
      telehealthEnabled: true,
      inPersonEnabled: true,
      homeVisitsEnabled: false,
      enforcePosValidation: true,
      blockOnMissingFields: false,
      enableTimeValidation: true,
      extractTimeFromNotes: false,
      enforceCredentialing: true,
      multiStateLicensure: false,
      showCredentialingAlerts: true,
      allowedProviderStatuses: ['active', 'credentialed'],
      medicalNecessityThreshold: 0.8,
      logRuleApplications: true,
      logAutoFixes: true,
      auditRetentionPeriod: '365 days'
    };

    const { data: newConfig } = await safeInsert(async () =>
      db.insert(systemSettings)
        .values({
          organizationId,
          settingKey: 'validation_config',
          settingValue: JSON.stringify(defaultValidationValue),
          settingType: 'json',
          scope: 'organization',
          description: 'Default validation configuration'
        })
        .returning()
    );

    if (!newConfig || newConfig.length === 0) {
      throw new Error('Failed to create validation config');
    }

    const configData = newConfig[0] as SystemSettings;

    return {
      id: configData.id,
      organizationId: configData.organizationId!,
      ...defaultValidationValue,
      createdAt: configData.createdAt,
      updatedAt: configData.updatedAt
    } as OrganizationValidationConfig;
  }

  // ===================================
  // RULE MANAGEMENT
  // ===================================
  async getAutomationRules(organizationId: string): Promise<AutomationRuleType[]> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeSelect(async () =>
      db.select()
        .from(automationRules)
        .where(eq(automationRules.organizationId, organizationId))
        .orderBy(automationRules.priority)
    );

    return data as AutomationRuleType[] || [];
  }

  async getPayerOverrideRules(organizationId: string): Promise<PayerOverrideRule[]> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeSelect(async () =>
      db.select()
        .from(businessRules)
        .where(and(
          eq(businessRules.organizationId, organizationId),
          eq(businessRules.category, 'payer_override')
        ))
    );

    return (data as unknown as PayerOverrideRule[]) || [];
  }

  async getEmTimeRules(organizationId: string): Promise<EmTimeRule[]> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeSelect(async () =>
      db.select()
        .from(businessRules)
        .where(and(
          eq(businessRules.organizationId, organizationId),
          eq(businessRules.category, 'em_time')
        ))
    );

    return (data as unknown as EmTimeRule[]) || [];
  }

  async getDenialPlaybook(organizationId: string): Promise<DenialPlaybook[]> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeSelect(async () =>
      db.select()
        .from(businessRules)
        .where(and(
          eq(businessRules.organizationId, organizationId),
          eq(businessRules.category, 'denial_playbook')
        ))
    );

    return (data as unknown as DenialPlaybook[]) || [];
  }

  // ===================================
  // RULE MANAGEMENT (CRUD)
  // ===================================
  async createAutomationRule(
    organizationId: string,
    rule: Omit<AutomationRuleType, "id" | "organizationId" | "createdAt" | "updatedAt">
  ): Promise<AutomationRuleType> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeInsert(async () =>
      db.insert(automationRules)
        .values({
          organizationId,
          name: rule.name,
          description: rule.description,
          category: 'automation',
          ruleType: 'trigger',
          conditions: rule.conditions,
          actions: rule.actions,
          priority: rule.priority,
          status: rule.isActive ? 'active' : 'inactive'
        })
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to create automation rule');
    }

    return data[0] as AutomationRuleType;
  }

  async updateAutomationRule(
    ruleId: string,
    updates: Partial<AutomationRuleType>
  ): Promise<AutomationRuleType> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeUpdate(async () =>
      db.update(automationRules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(automationRules.id, ruleId))
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to update automation rule');
    }

    return data[0] as AutomationRuleType;
  }

  async deleteAutomationRule(ruleId: string): Promise<void> {
    const { db } = await createAuthenticatedDatabaseClient();

    await safeDelete(async () =>
      db.delete(automationRules)
        .where(eq(automationRules.id, ruleId))
        .returning({ id: automationRules.id })
    );
  }

  async createBusinessRule(
    organizationId: string,
    rule: Omit<PayerOverrideRule | EmTimeRule | DenialPlaybook, "id" | "organizationId" | "createdAt" | "updatedAt">
  ): Promise<PayerOverrideRule | EmTimeRule | DenialPlaybook> {
    const { db } = await createAuthenticatedDatabaseClient();

    // Map interface fields to schema fields based on rule type
    const businessRuleData: any = {
      organizationId,
      name: (rule as any).ruleName || (rule as any).code || 'Business Rule',
      description: rule.description || '',
      conditions: (rule as any).conditions || {},
      actions: (rule as any).actions || {},
      triggerEvent: 'manual',
      category: 'general'
    };

    // Determine category and map fields based on rule type
    if ('payerName' in rule) {
      // PayerOverrideRule
      businessRuleData.category = 'payer_override';
      businessRuleData.name = (rule as PayerOverrideRule).ruleName;
    } else if ('cptCode' in rule) {
      // EmTimeRule
      businessRuleData.category = 'em_time';
      businessRuleData.name = `Time rule for ${(rule as EmTimeRule).cptCode}`;
    } else if ('strategy' in rule) {
      // DenialPlaybook
      businessRuleData.category = 'denial_playbook';
      businessRuleData.name = `Denial strategy for ${(rule as DenialPlaybook).code}`;
    }

    const { data } = await safeInsert(async () =>
      db.insert(businessRules)
        .values(businessRuleData)
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to create business rule');
    }

    return data[0] as PayerOverrideRule | EmTimeRule | DenialPlaybook;
  }

  async deleteBusinessRule(ruleId: string): Promise<void> {
    const { db } = await createAuthenticatedDatabaseClient();

    await safeDelete(async () =>
      db.delete(businessRules)
        .where(eq(businessRules.id, ruleId))
        .returning({ id: businessRules.id })
    );
  }

  async updateNotificationSettings(organizationId: string, updates: Record<string, any>): Promise<Record<string, any>> {
    const { db } = await createAuthenticatedDatabaseClient();

    const { data } = await safeUpdate(async () =>
      db.update(notificationTemplates)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(notificationTemplates.organizationId, organizationId))
        .returning()
    );

    if (!data || data.length === 0) {
      throw new Error('Failed to update notification settings');
    }

    return data[0] as Record<string, any>;
  }

  // ===================================
  // ANALYTICS
  // ===================================
  async getRuleExecutionStats(organizationId: string, days = 30): Promise<Record<string, any>[]> {
    const { db } = await createAuthenticatedDatabaseClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await safeSelect(async () =>
      db.select({
        executedAt: businessRules.createdAt,
        ruleId: businessRules.id,
        ruleName: businessRules.name,
        category: businessRules.category
      })
      .from(businessRules)
      .where(and(
        eq(businessRules.organizationId, organizationId),
        // Note: No execution log table in AWS schema, using creation date as proxy
      ))
    );

    return data as Record<string, any>[] || [];
  }

  async getOrganizationSettingsSummary(organizationId: string): Promise<Record<string, any>> {
    const settings = await this.getOrganizationSettings(organizationId);

    return {
      organizationId,
      automation_enabled: settings.automation_config.enableAutoSubmission,
      validation_enabled: settings.validation_config.enforcePosValidation,
      total_rules: settings.rule_summary.total_automation_rules +
                   settings.rule_summary.total_payer_rules +
                   settings.rule_summary.total_time_rules +
                   settings.rule_summary.total_denial_rules,
      active_rules: settings.rule_summary.active_automation_rules +
                    settings.rule_summary.active_payer_rules +
                    settings.rule_summary.active_time_rules +
                    settings.rule_summary.active_denial_rules
    };
  }

  // ===================================
  // BULK OPERATIONS
  // ===================================
  async bulkUpdateSettings(
    organizationId: string,
    updates: {
      automation_config?: Partial<OrganizationAutomationConfig>;
      validation_config?: Partial<OrganizationValidationConfig>;
    }
  ): Promise<{
    automation_config: OrganizationAutomationConfig;
    validation_config: OrganizationValidationConfig;
  }> {
    const promises = [];

    if (updates.automation_config) {
      promises.push(
        this.updateAutomationConfig(organizationId, updates.automation_config)
      );
    } else {
      promises.push(this.getOrCreateAutomationConfig(organizationId));
    }

    if (updates.validation_config) {
      promises.push(
        this.updateValidationConfig(organizationId, updates.validation_config)
      );
    } else {
      promises.push(this.getOrCreateValidationConfig(organizationId));
    }

    const [automation_config, validation_config] = (await Promise.all(
      promises
    )) as [OrganizationAutomationConfig, OrganizationValidationConfig];

    return { automation_config, validation_config };
  }
}
