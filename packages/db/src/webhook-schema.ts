import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  decimal,
  varchar,
  pgEnum,
  index,
  unique,
  jsonb
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { organizations } from './schema';

// ============================================================================
// WEBHOOK ENUMS
// ============================================================================

export const webhookEnvironmentEnum = pgEnum('webhook_environment', ['staging', 'production']);

// HIPAA compliance enums
export const phiDataClassificationEnum = pgEnum('phi_data_classification', [
  'none',        // No PHI data
  'limited',     // Contains some PHI (dates, zip codes)
  'full'         // Contains full PHI (names, SSN, detailed medical data)
]);

export const hipaaComplianceStatusEnum = pgEnum('hipaa_compliance_status', [
  'compliant',   // BAA signed, HIPAA compliant endpoint
  'pending',     // BAA pending review
  'non_compliant' // No BAA or non-compliant endpoint
]);

export const webhookEventTypeEnum = pgEnum('webhook_event_type', [
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'team_member.added',
  'team_member.updated',
  'team_member.removed',
  'encounter.created',
  'encounter.updated',
  'encounter.deleted',
  'patient.created',
  'patient.updated',
  'patient.deleted',
  'claim.created',
  'claim.updated',
  'claim.submitted',
  'prior_auth.created',
  'prior_auth.updated',
  'prior_auth.submitted',
  'prior_auth.approved',
  'prior_auth.denied',
  'prior_auth.pending',
  'prior_auth.expired',
  'prior_auth.cancelled',
  'document.uploaded',
  'document.processed',
  'document.analysis.completed',
  'document.deleted',
  'clinician.created',
  'clinician.updated',
  'clinician.deleted',
  'clinician.license.added',
  'clinician.license.updated',
  'clinician.license.expired',
  'clinician.credentials.verified',
  'clinician.status.changed',
  'clinician.specialty.updated',
  'clinician.npi.updated',
  'eligibility.checked',
  'user.deleted',
  'webhook.test'
]);

// ============================================================================
// WEBHOOK TABLES
// ============================================================================

// Enhanced webhook configuration table
export const webhookConfigs = pgTable('webhook_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Basic webhook details
  name: text('name').notNull(),
  url: text('url').notNull(),
  environment: webhookEnvironmentEnum('environment').notNull().default('production'),
  events: webhookEventTypeEnum('events').array().notNull().default([]),

  // API configuration
  apiVersion: varchar('api_version', { length: 10 }).default('v1'),
  contentType: varchar('content_type', { length: 50 }).default('application/json'),
  customHeaders: jsonb('custom_headers').default('{}'),
  userAgent: varchar('user_agent', { length: 255 }).default('Foresight-Webhooks/1.0'),

  // Retry and timeout configuration
  retryCount: integer('retry_count').default(3),
  maxRetries: integer('max_retries').default(5),
  timeoutSeconds: integer('timeout_seconds').default(30),
  retryBackoffMultiplier: decimal('retry_backoff_multiplier', { precision: 3, scale: 2 }).default('2.0'),

  // Security configuration
  signatureVersion: varchar('signature_version', { length: 10 }).default('v1'),
  primarySecretId: uuid('primary_secret_id'), // Will reference webhook_secrets.id

  // HIPAA compliance configuration
  phiDataClassification: phiDataClassificationEnum('phi_data_classification').default('none').notNull(),
  hipaaComplianceStatus: hipaaComplianceStatusEnum('hipaa_compliance_status').default('non_compliant').notNull(),
  baaSignedDate: timestamp('baa_signed_date'),
  baaExpiryDate: timestamp('baa_expiry_date'),
  vendorName: varchar('vendor_name', { length: 255 }),
  vendorContact: varchar('vendor_contact', { length: 255 }),
  dataRetentionDays: integer('data_retention_days').default(30),
  requiresEncryption: boolean('requires_encryption').default(true).notNull(),

  // Status and metadata
  isActive: boolean('is_active').default(true).notNull(),
  lastDelivery: timestamp('last_delivery'),
  lastSuccessfulDelivery: timestamp('last_successful_delivery'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('webhook_config_org_idx').on(table.organizationId),
  activeIdx: index('webhook_config_active_idx').on(table.isActive),
  environmentIdx: index('webhook_config_environment_idx').on(table.environment),
  uniqueWebhookPerOrgEnv: unique('unique_webhook_per_org_env').on(table.organizationId, table.environment, table.name),
}));

// Webhook secrets table for secret rotation support
export const webhookSecrets = pgTable('webhook_secret', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id').references(() => webhookConfigs.id, { onDelete: 'cascade' }).notNull(),

  // Secret details - stores AWS Secrets Manager reference
  secretId: text('secret_id').notNull(), // AWS Secrets Manager ARN
  algorithm: varchar('algorithm', { length: 20 }).default('sha256').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  rotationToken: text('rotation_token'), // For secret rotation process

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  configIdx: index('webhook_secrets_config_idx').on(table.webhookConfigId),
  activeIdx: index('webhook_secrets_active_idx').on(table.isActive, table.expiresAt),
}));

// Add the foreign key reference to webhook_configs after webhookSecrets is defined
export const webhookConfigsWithSecretRef = pgTable('webhook_config', {
  // ... all the same fields as above ...
  primarySecretId: uuid('primary_secret_id').references(() => webhookSecrets.id),
  // ... rest of fields ...
});

// Webhook event subscriptions table
export const webhookEventSubscriptions = pgTable('webhook_event_subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id').references(() => webhookConfigs.id, { onDelete: 'cascade' }).notNull(),

  // Event configuration
  eventType: webhookEventTypeEnum('event_type').notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  eventFilter: jsonb('event_filter'), // Optional filters for the event

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  configIdx: index('webhook_event_subs_config_idx').on(table.webhookConfigId),
  typeIdx: index('webhook_event_subs_type_idx').on(table.eventType, table.isEnabled),
  uniqueConfigEvent: unique('unique_webhook_config_event').on(table.webhookConfigId, table.eventType),
}));

// Source webhook events table
export const webhookEvents = pgTable('webhook_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Event details
  eventType: webhookEventTypeEnum('event_type').notNull(),
  environment: webhookEnvironmentEnum('environment').notNull().default('production'),
  entityId: uuid('entity_id'), // ID of the entity that changed
  entityType: varchar('entity_type', { length: 50 }), // Type of entity

  // Event data
  eventData: jsonb('event_data').notNull(),
  metadata: jsonb('metadata').default('{}'),

  // Processing status
  processedAt: timestamp('processed_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('webhook_events_org_idx').on(table.organizationId),
  typeIdx: index('webhook_events_type_idx').on(table.eventType),
  envIdx: index('webhook_events_env_idx').on(table.environment),
  entityIdx: index('webhook_events_entity_idx').on(table.entityId, table.entityType),
  createdIdx: index('webhook_events_created_idx').on(table.createdAt),
  processedIdx: index('webhook_events_processed_idx').on(table.processedAt),
}));

// Enhanced webhook deliveries table
export const webhookDeliveries = pgTable('webhook_delivery', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id').references(() => webhookConfigs.id).notNull(),
  webhookSecretId: uuid('webhook_secret_id').references(() => webhookSecrets.id),

  // Event tracking
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  environment: webhookEnvironmentEnum('environment').notNull().default('production'),
  correlationId: uuid('correlation_id').defaultRandom(),
  sourceEventId: uuid('source_event_id').references(() => webhookEvents.id),

  // Request details
  requestHeaders: jsonb('request_headers'),
  requestBodySize: integer('request_body_size'),
  signatureHeader: text('signature_header'),
  userAgent: varchar('user_agent', { length: 255 }).default('Foresight-Webhooks/1.0'),

  // Response details
  httpStatus: integer('http_status'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers'),
  responseBodySize: integer('response_body_size'),
  deliveryLatencyMs: integer('delivery_latency_ms'),

  // Retry logic
  attemptCount: integer('attempt_count').default(1),
  deliveredAt: timestamp('delivered_at'),
  nextRetryAt: timestamp('next_retry_at'),

  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, delivered, failed, retrying

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  webhookConfigIdx: index('webhook_delivery_webhook_config_idx').on(table.webhookConfigId),
  statusIdx: index('webhook_delivery_status_idx').on(table.status),
  eventTypeIdx: index('webhook_delivery_event_type_idx').on(table.eventType),
  nextRetryIdx: index('webhook_delivery_next_retry_idx').on(table.nextRetryAt),
  createdAtIdx: index('webhook_delivery_created_at_idx').on(table.createdAt),
  correlationIdx: index('webhook_delivery_correlation_idx').on(table.correlationId),
  sourceEventIdx: index('webhook_delivery_source_event_idx').on(table.sourceEventId),
  environmentIdx: index('webhook_delivery_environment_idx').on(table.environment),
  secretIdx: index('webhook_delivery_secret_idx').on(table.webhookSecretId),
}));

// Detailed delivery attempts tracking
export const webhookDeliveryAttempts = pgTable('webhook_delivery_attempt', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookDeliveryId: uuid('webhook_delivery_id').references(() => webhookDeliveries.id, { onDelete: 'cascade' }).notNull(),

  // Attempt details
  attemptNumber: integer('attempt_number').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

  // Response details
  httpStatus: integer('http_status'),
  responseTimeMs: integer('response_time_ms'),

  // Error details
  errorMessage: text('error_message'),
  errorType: varchar('error_type', { length: 50 }), // 'timeout', 'connection', 'http_error', 'dns', etc.

  // Request/Response data
  requestHeaders: jsonb('request_headers'),
  responseHeaders: jsonb('response_headers'),
  responseBodyPreview: text('response_body_preview'), // First 1000 chars for debugging
}, (table) => ({
  deliveryIdx: index('webhook_delivery_attempts_delivery_idx').on(table.webhookDeliveryId),
  statusIdx: index('webhook_delivery_attempts_status_idx').on(table.httpStatus),
  startedIdx: index('webhook_delivery_attempts_started_idx').on(table.startedAt),
}));

// HIPAA audit logging table
export const webhookHipaaAuditLog = pgTable('webhook_hipaa_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id').references(() => webhookConfigs.id).notNull(),
  webhookDeliveryId: uuid('webhook_delivery_id').references(() => webhookDeliveries.id),

  // Audit event details
  auditEventType: varchar('audit_event_type', { length: 50 }).notNull(), // 'phi_accessed', 'baa_verified', 'data_transmitted', 'retention_policy_applied'
  userId: varchar('user_id', { length: 255 }),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // PHI-specific details
  phiDataTypes: jsonb('phi_data_types'), // Array of PHI data types involved
  entityIds: jsonb('entity_ids'), // IDs of patients/entities whose PHI was accessed
  dataClassification: phiDataClassificationEnum('data_classification').notNull(),

  // Compliance verification
  baaVerified: boolean('baa_verified').default(false),
  encryptionVerified: boolean('encryption_verified').default(false),
  retentionPolicyApplied: boolean('retention_policy_applied').default(false),

  // Audit metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  requestHeaders: jsonb('request_headers'),

  // Risk assessment
  riskLevel: varchar('risk_level', { length: 20 }).default('low'), // low, medium, high, critical
  complianceStatus: varchar('compliance_status', { length: 20 }).default('compliant'), // compliant, violation, under_review

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  webhookConfigIdx: index('webhook_hipaa_audit_config_idx').on(table.webhookConfigId),
  auditEventTypeIdx: index('webhook_hipaa_audit_event_type_idx').on(table.auditEventType),
  organizationIdx: index('webhook_hipaa_audit_org_idx').on(table.organizationId),
  createdAtIdx: index('webhook_hipaa_audit_created_at_idx').on(table.createdAt),
  riskLevelIdx: index('webhook_hipaa_audit_risk_level_idx').on(table.riskLevel),
  complianceStatusIdx: index('webhook_hipaa_audit_compliance_status_idx').on(table.complianceStatus),
}));

// ============================================================================
// WEBHOOK TYPE EXPORTS
// ============================================================================

export type WebhookConfig = InferSelectModel<typeof webhookConfigs>;
export type NewWebhookConfig = InferInsertModel<typeof webhookConfigs>;

export type WebhookSecret = InferSelectModel<typeof webhookSecrets>;
export type NewWebhookSecret = InferInsertModel<typeof webhookSecrets>;

export type WebhookEventSubscription = InferSelectModel<typeof webhookEventSubscriptions>;
export type NewWebhookEventSubscription = InferInsertModel<typeof webhookEventSubscriptions>;

export type WebhookEvent = InferSelectModel<typeof webhookEvents>;
export type NewWebhookEvent = InferInsertModel<typeof webhookEvents>;

export type WebhookDelivery = InferSelectModel<typeof webhookDeliveries>;
export type NewWebhookDelivery = InferInsertModel<typeof webhookDeliveries>;

export type WebhookDeliveryAttempt = InferSelectModel<typeof webhookDeliveryAttempts>;
export type NewWebhookDeliveryAttempt = InferInsertModel<typeof webhookDeliveryAttempts>;

export type WebhookHipaaAuditLog = InferSelectModel<typeof webhookHipaaAuditLog>;
export type NewWebhookHipaaAuditLog = InferInsertModel<typeof webhookHipaaAuditLog>;

// Enum value types
export type WebhookEnvironment = typeof webhookEnvironmentEnum.enumValues[number];
export type WebhookEventType = typeof webhookEventTypeEnum.enumValues[number];
export type PhiDataClassification = typeof phiDataClassificationEnum.enumValues[number];
export type HipaaComplianceStatus = typeof hipaaComplianceStatusEnum.enumValues[number];
