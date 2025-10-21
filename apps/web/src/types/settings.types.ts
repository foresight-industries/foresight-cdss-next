// Updated TypeScript types for normalized settings schema

export interface AutomationSettings {
  id: string;
  organization_id: string;
  global_confidence_threshold: number;
  auto_approval_threshold: number;
  require_review_threshold: number;
  max_retry_attempts: number;
  enable_bulk_processing: boolean;
  confidence_score_enabled: boolean;
  ocr_accuracy_threshold: number;
  enable_auto_submission: boolean;
  enable_auto_epa: boolean;
  cpt_code_threshold: number;
  icd10_threshold: number;
  place_of_service_threshold: number;
  modifiers_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  organization_id: string;
  email_alerts: boolean;
  slack_integration: boolean;
  approval_notifications: boolean;
  denial_notifications: boolean;
  system_maintenance_alerts: boolean;
  weekly_reports: boolean;
  daily_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationSettings {
  id: string;
  organization_id: string;
  telehealth_enabled: boolean;
  in_person_enabled: boolean;
  home_visits_enabled: boolean;
  enforce_telehealth_pos: boolean;
  enforce_in_person_pos: boolean;
  enforce_home_pos: boolean;
  modifier95_required: boolean;
  auto_add_modifier95: boolean;
  modifier95_conflict_resolution: boolean;
  validate_modifier_combinations: boolean;
  require_modifier_documentation: boolean;
  block_invalid_modifiers: boolean;
  enable_payer_specific_rules: boolean;
  block_on_missing_fields: boolean;
  time_validation_enabled: boolean;
  extract_time_from_notes: boolean;
  enforce_credentialing: boolean;
  multi_state_licensure: boolean;
  show_credentialing_alerts: boolean;
  allowed_provider_statuses: string[];
  auto_retry_enabled: boolean;
  max_denial_retry_attempts: number;
  validate_icd_to_cpt: boolean;
  medical_necessity_threshold: number;
  suggest_alternative_dx: boolean;
  log_rule_applications: boolean;
  log_auto_fixes: boolean;
  audit_retention_period: string;
  created_at: string;
  updated_at: string;
}

export interface ConflictRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  conflicting_modifiers: string[];
  resolution_strategy:
    | "remove_conflicting"
    | "prefer_first"
    | "prefer_last"
    | "block_submission"
    | "manual_review";
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeBasedRule {
  id: string;
  organization_id: string;
  cpt_code: string;
  description: string;
  min_minutes: number;
  max_minutes: number;
  flag_if_not_documented: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DenialRule {
  id: string;
  organization_id: string;
  denial_code: string;
  description: string;
  resolution_strategy: string;
  auto_fix_enabled: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayerOverrideRule {
  id: string;
  organization_id: string;
  payer_name: string;
  rule_name: string;
  description: string;
  rule_type: "validation" | "field_mapping" | "modifier" | "pos";
  conditions: any[];
  actions: any[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  id: string;
  organization_id: string;
  payer_name: string;
  field_name: string;
  mapping_rule: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Aggregate type for all settings
export interface OrganizationSettings {
  automation: AutomationSettings;
  notifications: NotificationSettings;
  validation: ValidationSettings;
  conflictRules: ConflictRule[];
  timeBasedRules: TimeBasedRule[];
  denialRules: DenialRule[];
  payerOverrideRules: PayerOverrideRule[];
  fieldMappings: FieldMapping[];
}

// API response types
export interface SettingsResponse {
  success: boolean;
  data?: OrganizationSettings;
  error?: string;
}

// Update request types
export interface UpdateAutomationSettingsRequest {
  global_confidence_threshold?: number;
  auto_approval_threshold?: number;
  require_review_threshold?: number;
  max_retry_attempts?: number;
  enable_bulk_processing?: boolean;
  confidence_score_enabled?: boolean;
  ocr_accuracy_threshold?: number;
  enable_auto_submission?: boolean;
  enable_auto_epa?: boolean;
  cpt_code_threshold?: number;
  icd10_threshold?: number;
  place_of_service_threshold?: number;
  modifiers_threshold?: number;
}

export interface UpdateNotificationSettingsRequest {
  email_alerts?: boolean;
  slack_integration?: boolean;
  approval_notifications?: boolean;
  denial_notifications?: boolean;
  system_maintenance_alerts?: boolean;
  weekly_reports?: boolean;
  daily_digest?: boolean;
}

export interface UpdateValidationSettingsRequest {
  telehealth_enabled?: boolean;
  in_person_enabled?: boolean;
  home_visits_enabled?: boolean;
  enforce_telehealth_pos?: boolean;
  enforce_in_person_pos?: boolean;
  enforce_home_pos?: boolean;
  modifier95_required?: boolean;
  auto_add_modifier95?: boolean;
  modifier95_conflict_resolution?: boolean;
  validate_modifier_combinations?: boolean;
  require_modifier_documentation?: boolean;
  block_invalid_modifiers?: boolean;
  enable_payer_specific_rules?: boolean;
  block_on_missing_fields?: boolean;
  time_validation_enabled?: boolean;
  extract_time_from_notes?: boolean;
  enforce_credentialing?: boolean;
  multi_state_licensure?: boolean;
  show_credentialing_alerts?: boolean;
  allowed_provider_statuses?: string[];
  auto_retry_enabled?: boolean;
  max_denial_retry_attempts?: number;
  validate_icd_to_cpt?: boolean;
  medical_necessity_threshold?: number;
  suggest_alternative_dx?: boolean;
  log_rule_applications?: boolean;
  log_auto_fixes?: boolean;
  audit_retention_period?: string;
}

export interface CreateConflictRuleRequest {
  name: string;
  description?: string;
  conflicting_modifiers: string[];
  resolution_strategy:
    | "remove_conflicting"
    | "prefer_first"
    | "prefer_last"
    | "block_submission"
    | "manual_review";
  enabled?: boolean;
}

export interface CreateTimeBasedRuleRequest {
  cpt_code: string;
  description: string;
  min_minutes: number;
  max_minutes: number;
  flag_if_not_documented?: boolean;
  enabled?: boolean;
}

export interface CreateDenialRuleRequest {
  denial_code: string;
  description: string;
  resolution_strategy: string;
  auto_fix_enabled?: boolean;
  enabled?: boolean;
}

export interface CreatePayerOverrideRuleRequest {
  payer_name: string;
  rule_name: string;
  description: string;
  rule_type: "validation" | "field_mapping" | "modifier" | "pos";
  conditions: any[];
  actions: any[];
  enabled?: boolean;
}

export interface CreateFieldMappingRequest {
  payer_name: string;
  field_name: string;
  mapping_rule: string;
  enabled?: boolean;
}
