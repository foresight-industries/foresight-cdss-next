// Settings Service - Hybrid approach for existing rules engine

import { createClient } from "@supabase/supabase-js";

// Types for the hybrid approach
export interface TeamAutomationConfig {
  id: string;
  team_id: string;
  global_confidence_threshold: number;
  auto_approval_threshold: number;
  require_review_threshold: number;
  cpt_code_threshold: number;
  icd10_threshold: number;
  place_of_service_threshold: number;
  modifiers_threshold: number;
  enable_auto_submission: boolean;
  enable_auto_epa: boolean;
  enable_bulk_processing: boolean;
  confidence_score_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamValidationConfig {
  id: string;
  team_id: string;
  telehealth_enabled: boolean;
  in_person_enabled: boolean;
  home_visits_enabled: boolean;
  enforce_pos_validation: boolean;
  block_on_missing_fields: boolean;
  enable_time_validation: boolean;
  extract_time_from_notes: boolean;
  enforce_credentialing: boolean;
  multi_state_licensure: boolean;
  show_credentialing_alerts: boolean;
  allowed_provider_statuses: string[];
  medical_necessity_threshold: number;
  log_rule_applications: boolean;
  log_auto_fixes: boolean;
  audit_retention_period: string;
  created_at: string;
  updated_at: string;
}

// Existing rule types (from your current schema)
export interface AutomationRule {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PayerOverrideRule {
  id: string;
  team_id: string;
  payer_name: string;
  rule_name: string;
  description: string;
  rule_type: string;
  conditions: any;
  actions: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmTimeRule {
  id: string;
  team_id: string;
  cpt_code: string;
  description: string;
  min_minutes: number;
  max_minutes: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DenialPlaybook {
  id: string;
  team_id: string;
  code: string;
  description: string;
  strategy: string;
  enabled: boolean;
  auto_fix_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Comprehensive settings response
export interface TeamSettingsResponse {
  // Basic config (from new tables)
  automation_config: TeamAutomationConfig;
  validation_config: TeamValidationConfig;

  // Existing sophisticated rules (from your current tables)
  automation_rules: AutomationRule[];
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
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ===================================
  // GET ALL SETTINGS (Hybrid Approach)
  // ===================================
  async getTeamSettings(teamId: string): Promise<TeamSettingsResponse> {
    // Fetch basic config and rules in parallel
    const [
      automationConfigResult,
      validationConfigResult,
      automationRulesResult,
      payerRulesResult,
      timeRulesResult,
      denialRulesResult,
    ] = await Promise.all([
      this.getOrCreateAutomationConfig(teamId),
      this.getOrCreateValidationConfig(teamId),
      this.getAutomationRules(teamId),
      this.getPayerOverrideRules(teamId),
      this.getEmTimeRules(teamId),
      this.getDenialPlaybook(teamId),
    ]);

    // Calculate rule summary
    const rule_summary = {
      total_automation_rules: automationRulesResult.length,
      active_automation_rules: automationRulesResult.filter((r) => r.is_active)
        .length,
      total_payer_rules: payerRulesResult.length,
      active_payer_rules: payerRulesResult.filter((r) => r.enabled).length,
      total_time_rules: timeRulesResult.length,
      active_time_rules: timeRulesResult.filter((r) => r.enabled).length,
      total_denial_rules: denialRulesResult.length,
      active_denial_rules: denialRulesResult.filter((r) => r.enabled).length,
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
    teamId: string,
    updates: Partial<
      Omit<TeamAutomationConfig, "id" | "team_id" | "created_at" | "updated_at">
    >
  ): Promise<TeamAutomationConfig> {
    const { data, error } = await this.supabase
      .from("team_automation_config")
      .update(updates)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateValidationConfig(
    teamId: string,
    updates: Partial<
      Omit<TeamValidationConfig, "id" | "team_id" | "created_at" | "updated_at">
    >
  ): Promise<TeamValidationConfig> {
    const { data, error } = await this.supabase
      .from("team_validation_config")
      .update(updates)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async getOrCreateAutomationConfig(
    teamId: string
  ): Promise<TeamAutomationConfig> {
    const { data, error } = await this.supabase
      .from("team_automation_config")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create default config
      const { data: newConfig, error: createError } = await this.supabase
        .from("team_automation_config")
        .insert({ team_id: teamId })
        .select()
        .single();

      if (createError) throw createError;
      return newConfig;
    }

    return data;
  }

  private async getOrCreateValidationConfig(
    teamId: string
  ): Promise<TeamValidationConfig> {
    const { data, error } = await this.supabase
      .from("team_validation_config")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create default config
      const { data: newConfig, error: createError } = await this.supabase
        .from("team_validation_config")
        .insert({ team_id: teamId })
        .select()
        .single();

      if (createError) throw createError;
      return newConfig;
    }

    return data;
  }

  // ===================================
  // EXISTING RULE MANAGEMENT (Leverage your current tables)
  // ===================================
  async getAutomationRules(teamId: string): Promise<AutomationRule[]> {
    const { data, error } = await this.supabase
      .from("automation_rule")
      .select("*")
      .eq("team_id", teamId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPayerOverrideRules(teamId: string): Promise<PayerOverrideRule[]> {
    const { data, error } = await this.supabase
      .from("payer_override_rule")
      .select("*")
      .eq("team_id", teamId)
      .order("payer_name");

    if (error) throw error;
    return data || [];
  }

  async getEmTimeRules(teamId: string): Promise<EmTimeRule[]> {
    const { data, error } = await this.supabase
      .from("em_time_rules")
      .select("*")
      .eq("team_id", teamId)
      .order("cpt_code");

    if (error) throw error;
    return data || [];
  }

  async getDenialPlaybook(teamId: string): Promise<DenialPlaybook[]> {
    const { data, error } = await this.supabase
      .from("denial_playbook")
      .select("*")
      .eq("team_id", teamId)
      .order("code");

    if (error) throw error;
    return data || [];
  }

  // ===================================
  // RULE MANAGEMENT (CRUD for existing tables)
  // ===================================
  async createAutomationRule(
    teamId: string,
    rule: Omit<AutomationRule, "id" | "team_id" | "created_at" | "updated_at">
  ): Promise<AutomationRule> {
    const { data, error } = await this.supabase
      .from("automation_rule")
      .insert({ ...rule, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAutomationRule(
    ruleId: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    const { data, error } = await this.supabase
      .from("automation_rule")
      .update(updates)
      .eq("id", ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAutomationRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("automation_rule")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  // Similar CRUD methods for other rule types...
  async createPayerOverrideRule(
    teamId: string,
    rule: Omit<
      PayerOverrideRule,
      "id" | "team_id" | "created_at" | "updated_at"
    >
  ): Promise<PayerOverrideRule> {
    const { data, error } = await this.supabase
      .from("payer_override_rule")
      .insert({ ...rule, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createEmTimeRule(
    teamId: string,
    rule: Omit<EmTimeRule, "id" | "team_id" | "created_at" | "updated_at">
  ): Promise<EmTimeRule> {
    const { data, error } = await this.supabase
      .from("em_time_rules")
      .insert({ ...rule, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createDenialRule(
    teamId: string,
    rule: Omit<DenialPlaybook, "id" | "team_id" | "created_at" | "updated_at">
  ): Promise<DenialPlaybook> {
    const { data, error } = await this.supabase
      .from("denial_playbook")
      .insert({ ...rule, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteConflictRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("automation_rule")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  async deleteTimeBasedRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("em_time_rules")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  async deleteDenialRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("denial_playbook")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  async deletePayerOverrideRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("payer_override_rule")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  async deleteFieldMapping(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("field_mapping")
      .delete()
      .eq("id", ruleId);

    if (error) throw error;
  }

  async updateNotificationSettings(teamId: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase
      .from("team_notification_config")
      .update(updates)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createConflictRule(
    teamId: string,
    rule: Omit<AutomationRule, "id" | "team_id" | "created_at" | "updated_at">
  ): Promise<AutomationRule> {
    const { data, error } = await this.supabase
      .from("automation_rule")
      .insert({ ...rule, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createFieldMapping(teamId: string, mapping: any): Promise<any> {
    const { data, error } = await this.supabase
      .from("field_mapping")
      .insert({ ...mapping, team_id: teamId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===================================
  // ANALYTICS (Leverage your existing rule_execution_log)
  // ===================================
  async getRuleExecutionStats(teamId: string, days = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.supabase
      .from("rule_execution_log")
      .select(
        `
        executed_at,
        execution_result,
        business_rule_id,
        business_rule:business_rule_id(name, rule_type)
      `
      )
      .eq("business_rule.team_id", teamId)
      .gte("executed_at", since.toISOString());

    if (error) throw error;
    return data;
  }

  async getTeamSettingsSummary(teamId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("team_settings_unified")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (error) throw error;
    return data;
  }

  // ===================================
  // BULK OPERATIONS
  // ===================================
  async bulkUpdateSettings(
    teamId: string,
    updates: {
      automation_config?: Partial<TeamAutomationConfig>;
      validation_config?: Partial<TeamValidationConfig>;
    }
  ): Promise<{
    automation_config: TeamAutomationConfig;
    validation_config: TeamValidationConfig;
  }> {
    const promises = [];

    if (updates.automation_config) {
      promises.push(
        this.updateAutomationConfig(teamId, updates.automation_config)
      );
    } else {
      promises.push(this.getOrCreateAutomationConfig(teamId));
    }

    if (updates.validation_config) {
      promises.push(
        this.updateValidationConfig(teamId, updates.validation_config)
      );
    } else {
      promises.push(this.getOrCreateValidationConfig(teamId));
    }

    const [automation_config, validation_config] = (await Promise.all(
      promises
    )) as [TeamAutomationConfig, TeamValidationConfig];

    return { automation_config, validation_config };
  }
}
