// Database client interface for dependency injection
export interface DatabaseClient {
  select: (callback: () => any) => Promise<{ data: any; error?: any }>;
  insert: (callback: () => any) => Promise<{ data: any; error?: any }>;
  update: (callback: () => any) => Promise<{ data: any; error?: any }>;
  delete: (callback: () => any) => Promise<{ data: any; error?: any }>;
}

// Database schema interfaces - these should match the actual db schema
export interface WebhookConfigSchema {
  id: string;
  name: string;
  url: string;
  organizationId: string;
  environment: string;
  phiDataClassification: PhiDataClassification;
  hipaaComplianceStatus: HipaaComplianceStatus;
  baaSignedDate?: Date;
  baaExpiryDate?: Date;
  vendorName?: string;
  requiresEncryption?: boolean;
  timeoutSeconds?: number;
}

export interface WebhookDeliverySchema {
  id: string;
  webhookConfigId: string;
  eventType: string;
  eventData: any;
  environment: string;
  status: string;
  attemptCount: number;
  httpStatus?: number;
  responseBody?: string;
  deliveredAt?: Date;
  updatedAt?: Date;
  deliveryLatencyMs?: number;
}

export interface WebhookSecretSchema {
  id: string;
  webhookConfigId: string;
  secretId: string;
  algorithm: string;
  isActive: boolean;
}

export interface DatabaseWrapper {
  createAuthenticatedDatabaseClient: () => Promise<{ db: any }>;
  safeSelect: (callback: () => any) => Promise<{ data: any; error?: any }>;
  safeInsert: (callback: () => any) => Promise<{ data: any; error?: any }>;
  safeUpdate: (callback: () => any) => Promise<{ data: any; error?: any }>;
  safeDelete: (callback: () => any) => Promise<{ data: any; error?: any }>;
  safeSingle: (callback: () => any) => Promise<{ data: any; error?: any }>;
  // Schema objects for dependency injection
  schemas: {
    webhookConfigs: any;
    webhookDeliveries: any;
    webhookSecrets: any;
    webhookHipaaAuditLog: any;
    webhookDeliveryAttempts?: any; // Optional for backward compatibility
  };
}

// PHI Data Classification types
export type PhiDataClassification = 'none' | 'limited' | 'full';
export type HipaaComplianceStatus = 'compliant' | 'pending' | 'non_compliant';

// Webhook event data interface
export interface WebhookEventData {
  organizationId: string;
  environment: 'staging' | 'production';
  eventType: string;
  data: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

// Webhook headers interface
export interface WebhookHeaders {
  'x-foresight-signature'?: string;
  'x-foresight-timestamp'?: string;
  'x-foresight-delivery'?: string;
  'content-type'?: string;
  [key: string]: string | undefined;
}

// Webhook validation options
export interface WebhookValidationOptions {
  toleranceInSeconds?: number;
  requiredHeaders?: string[];
}

// HIPAA compliance validation result
export interface HipaaComplianceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// HIPAA audit event data
export interface HipaaAuditEventData {
  webhookConfigId: string;
  webhookDeliveryId?: string;
  auditEventType: 'phi_accessed' | 'baa_verified' | 'data_transmitted' | 'retention_policy_applied' | 'config_created' | 'config_updated';
  dataClassification: PhiDataClassification;
  phiDataTypes?: string[];
  entityIds?: string[];
  baaVerified?: boolean;
  encryptionVerified?: boolean;
  retentionPolicyApplied?: boolean;
  ipAddress?: string;
  userAgent?: string;
  requestHeaders?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus?: 'compliant' | 'violation' | 'under_review';
}

// Webhook compliance check result
export interface WebhookComplianceCheckResult {
  compliant: boolean;
  blockers: string[];
  warnings: string[];
  baaStatus: HipaaComplianceStatus;
}

// PHI classification result
export interface PhiClassificationResult {
  classification: PhiDataClassification;
  phiTypes: string[];
  riskScore: number;
  recommendations: string[];
}

// Encryption metadata interfaces
export interface EncryptionMetadata {
  kmsKeyId: string;
  encryptedDataKey: string;
  algorithm: string;
  fields: Record<string, FieldEncryptionInfo>;
  timestamp: string;
}

export interface FieldEncryptionInfo {
  iv: string;
  authTag: string;
  originalType: string;
}

export interface PhiEncryptionConfig {
  kmsKeyId: string;
  region?: string;
  autoDetectPhi?: boolean;
  encryptionRequired?: boolean;
  maxPayloadSize?: number;
}

// Webhook delivery result
export interface WebhookDeliveryResult {
  success: boolean;
  deliveryId?: string;
  complianceStatus: 'compliant' | 'blocked' | 'warning';
  issues: string[];
  auditLogId?: string;
}

// Data retention interfaces
export interface RetentionPolicyResult {
  success: boolean;
  processedWebhooks: number;
  purgedDeliveries: number;
  purgedAttempts: number;
  purgedAuditLogs: number;
  errors: string[];
}

export interface RetentionStatus {
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
}