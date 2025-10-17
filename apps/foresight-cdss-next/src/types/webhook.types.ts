export interface WebhookConfig {
  id: string;
  team_id: string;
  name: string;
  environment: 'development' | 'production';
  url: string;
  events: string[];
  active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
  secret_hint?: string;
  
  // HIPAA Compliance fields
  phi_data_classification: 'none' | 'limited' | 'full';
  business_associate_agreement_signed: boolean;
  baa_signed_date?: string;
  data_retention_days: number;
  hipaa_compliant: boolean;
  encryption_required: boolean;
  audit_log_enabled: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  response_time_ms?: number;
  attempt_number: number;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface WebhookQueue {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery?: string;
  recent_deliveries: WebhookDelivery[];
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  environment?: 'development' | 'production';
  retry_count?: number;
  timeout_seconds?: number;
  
  // HIPAA Compliance fields
  phi_data_classification?: 'none' | 'limited' | 'full';
  business_associate_agreement_signed?: boolean;
  data_retention_days?: number;
  encryption_required?: boolean;
  audit_log_enabled?: boolean;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
}

export interface WebhookEvent {
  event_type: string;
  team_id: string;
  timestamp: number;
  source: string;
  data?: any;
  before?: any;
  after?: any;
  changes?: any;
}

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Organization events
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',
  ORGANIZATION_SETTINGS_CHANGED: 'organization.settings.changed',
  
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role.changed',
  
  // Patient events
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_DELETED: 'patient.deleted',
  
  // Claims events
  CLAIM_CREATED: 'claim.created',
  CLAIM_UPDATED: 'claim.updated',
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_APPROVED: 'claim.approved',
  CLAIM_DENIED: 'claim.denied',
  CLAIM_PROCESSING_STARTED: 'claim.processing.started',
  CLAIM_PROCESSING_COMPLETED: 'claim.processing.completed',
  
  // Document events
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSED: 'document.processed',
  DOCUMENT_ANALYSIS_COMPLETED: 'document.analysis.completed',
  DOCUMENT_DELETED: 'document.deleted',
  
  // Team events (backward compatibility)
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',
  
  // Team member events (backward compatibility)
  TEAM_MEMBER_ADDED: 'team_member.added',
  TEAM_MEMBER_UPDATED: 'team_member.updated',
  TEAM_MEMBER_REMOVED: 'team_member.removed',
  
  // Test event
  WEBHOOK_TEST: 'webhook.test',
  
  // Special event for all events
  ALL: 'all'
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// HTTP headers sent with webhook requests
export interface WebhookHeaders {
  'Content-Type': 'application/json';
  'User-Agent': string;
  'X-Foresight-Event': string;
  'X-Foresight-Signature': string;
  'X-Foresight-Team-ID': string;
  'X-Foresight-Delivery': string;
}

// Response from webhook processor
export interface WebhookProcessorResponse {
  message: string;
  processed: number;
  total_queued: number;
  results: Array<{
    webhook_id: string;
    success: boolean;
    status_code?: number;
    response_body?: string;
    response_time_ms?: number;
    error_message?: string;
  }>;
}

// HIPAA Compliance Types
export interface HipaaComplianceStatus {
  compliant: boolean;
  issues: string[];
  classification: 'none' | 'limited' | 'full';
  encryption_enabled: boolean;
  baa_required: boolean;
  baa_signed: boolean;
  audit_logging: boolean;
}

export interface WebhookSecuritySettings {
  signature_verification_enabled: boolean;
  encryption_required: boolean;
  allowed_ip_ranges?: string[];
  max_retry_attempts: number;
  timeout_seconds: number;
}

export interface DataRetentionPolicy {
  retention_days: number;
  auto_delete_enabled: boolean;
  backup_before_delete: boolean;
  compliance_notes?: string;
}

// Event categories for UI organization
export const EVENT_CATEGORIES = {
  ORGANIZATION: 'Organization',
  USER: 'User Management', 
  PATIENT: 'Patient Data',
  CLAIMS: 'Claims Processing',
  DOCUMENTS: 'Document Management',
  TEAM: 'Team Management',
  SYSTEM: 'System Events'
} as const;

export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];