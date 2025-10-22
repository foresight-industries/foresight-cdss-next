import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  decimal,
  date,
  time,
  varchar,
  pgEnum,
  index,
  unique,
  json,
  jsonb,
  serial,
  bigint,
  uniqueIndex,
  type PgTableWithColumns,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel, and, eq, gt, isNull, sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const accessLevelEnum = pgEnum('access_level', ['none', 'read', 'write', 'admin', 'owner']);

export const adjustmentCodeTypeEnum = pgEnum('adjustment_code_type', [
  'CARC', 'RARC', 'GROUP', 'MOA', 'MIA', 'CUSTOM', 'PAYER_SPECIFIC'
]);

export const adjustmentReasonCategoryEnum = pgEnum('adjustment_reason_category', [
  'Patient Responsibility', 'Coverage', 'Medical Necessity', 'Benefit Limit',
  'Administrative', 'Duplicate', 'Authorization', 'COB', 'Contractual',
  'Documentation', 'Eligibility', 'Timely Filing', 'Coding Error', 'Bundling',
  'Appeal Rights', 'Routing', 'Informational'
]);

export const adjustmentTypeEnum = pgEnum('adjustment_type', [
  'contractual', 'write_off', 'refund', 'correction', 'transfer', 'reversal'
]);

export const claimStatusEnum = pgEnum('claim_status', [
  'draft', 'ready_for_submission', 'submitted', 'accepted', 'rejected',
  'paid', 'denied', 'pending', 'needs_review', 'appeal_required'
]);

export const priorAuthStatusEnum = pgEnum('prior_auth_status', [
  'pending', 'approved', 'denied', 'expired', 'cancelled'
]);

export const documentTypeEnum = pgEnum('document_type', [
  'medical_record', 'insurance_card', 'id_verification', 'prior_auth',
  'appeal_document', 'correspondence', 'claim_attachment', 'other'
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'pending', 'in_progress', 'completed', 'failed', 'cancelled'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire_transfer', 'insurance', 'other'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'processing', 'posted', 'failed', 'refunded', 'disputed'
]);

export const eraStatusEnum = pgEnum('era_status', [
  'pending', 'processing', 'posted', 'failed', 'partial'
]);

export const eligibilityCheckTypeEnum = pgEnum('eligibility_check_type', [
  'real_time', 'batch', 'manual'
]);

export const eligibilityResponseEnum = pgEnum('eligibility_response', [
  'active', 'inactive', 'terminated', 'unknown', 'error'
]);

export const ehrApiTypeEnum = pgEnum('ehr_api_type', [
  'fhir', 'rest', 'custom'
]);

export const ehrAuthMethodEnum = pgEnum('ehr_auth_method', [
  'oauth2', 'api_key', 'custom', 'smart_on_fhir'
]);

export const integrationTypeEnum = pgEnum('integration_type', [
  'ehr', 'clearinghouse', 'payer', 'pharmacy', 'lab', 'imaging', 'other'
]);

export const analyticsEventCategoryEnum = pgEnum('analytics_event_category', [
  'user_action', 'system_event', 'performance', 'error', 'security', 'business_metric'
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'email', 'sms', 'push', 'in_app', 'webhook'
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'email', 'phone', 'fax', 'portal', 'mail', 'sms'
]);

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'pending', 'matched', 'unmatched', 'disputed', 'resolved'
]);

export const appealStatusEnum = pgEnum('appeal_status', [
  'pending', 'submitted', 'in_review', 'approved', 'denied', 'withdrawn', 'escalated'
]);

export const appealLevelEnum = pgEnum('appeal_level', [
  'first_level', 'second_level', 'third_level', 'external_review'
]);

export const denialStatusEnum = pgEnum('denial_status', [
  'new', 'under_review', 'appealed', 'resolved', 'written_off'
]);

export const denialCategoryEnum = pgEnum('denial_category', [
  'authorization', 'eligibility', 'coverage', 'medical_necessity', 'coding',
  'documentation', 'duplicate', 'timely_filing', 'coordination_of_benefits'
]);

export const encounterStatusEnum = pgEnum('encounter_status', [
  'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
]);

export const visitTypeEnum = pgEnum('visit_type', [
  'office_visit', 'telemedicine', 'emergency', 'inpatient', 'outpatient',
  'consultation', 'procedure', 'follow_up', 'annual_physical'
]);

export const genderEnum = pgEnum('gender', ['M', 'F', 'O', 'U']);

export const patientStatusEnum = pgEnum('patient_status', [
  'active', 'inactive', 'deceased', 'merged', 'test'
]);

export const automationStatusEnum = pgEnum('automation_status', [
  'active', 'inactive', 'testing', 'error'
]);

export const batchStatusEnum = pgEnum('batch_status', [
  'pending', 'processing', 'completed', 'failed', 'cancelled'
]);

export const validationStatusEnum = pgEnum('validation_status', [
  'pending', 'valid', 'invalid', 'warning', 'needs_review'
]);

export const dataQualityStatusEnum = pgEnum('data_quality_status', [
  'high', 'medium', 'low', 'critical'
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending', 'in_progress', 'completed', 'failed', 'partial'
]);

export const contractStatusEnum = pgEnum('contract_status', [
  'active', 'inactive', 'pending', 'expired', 'terminated'
]);

export const statementStatusEnum = pgEnum('statement_status', [
  'draft', 'sent', 'paid', 'overdue', 'disputed', 'written_off'
]);

export const collectionStatusEnum = pgEnum('collection_status', [
  'current', 'overdue', 'in_collections', 'payment_plan', 'written_off', 'resolved'
]);

export const chargeStatusEnum = pgEnum('charge_status', [
  'pending', 'posted', 'billed', 'paid', 'adjusted', 'written_off'
]);

export const medicationStatusEnum = pgEnum('medication_status', [
  'active', 'inactive', 'discontinued', 'completed', 'suspended'
]);

export const labStatusEnum = pgEnum('lab_status', [
  'ordered', 'collected', 'in_progress', 'completed', 'cancelled', 'resulted'
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'emergency', 'family', 'friend', 'caregiver', 'legal_guardian', 'other'
]);

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'
]);

export const resourceTypeEnum = pgEnum('resource_type', [
  'room', 'equipment', 'vehicle', 'device', 'other'
]);

export const complianceStatusEnum = pgEnum('compliance_status', [
  'compliant', 'non_compliant', 'pending_review', 'needs_attention'
]);

export const retryBackoffStrategyEnum = pgEnum('retry_backoff_strategy', [
  'linear', 'exponential', 'fibonacci', 'fixed'
]);

export const varianceTypeEnum = pgEnum('variance_type', [
  'overpayment', 'underpayment', 'timing_difference', 'policy_change', 'coding_error', 'other'
]);

export const workQueueTypeEnum = pgEnum('work_queue_type', [
  'claim_review', 'prior_auth', 'appeal', 'payment_posting', 'denial_management', 'follow_up'
]);

export const formularyTierEnum = pgEnum('formulary_tier', [
  'tier_1', 'tier_2', 'tier_3', 'tier_4', 'specialty', 'non_formulary'
]);

export const dataSourceTypeEnum = pgEnum('data_source_type', [
  'ehr', 'manual_entry', 'api', 'file_import', 'automated_extraction'
]);

// ============================================================================
// CORE TABLES
// ============================================================================

// User profiles (individual records, separate from orgs)
export const userProfiles = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),

  // Profile
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: accessLevelEnum('role').default('read').notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastSeenAt: timestamp('last_seen_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  clerkUserIdx: index('user_profile_clerk_user_idx').on(table.clerkUserId),
}));

// Organizations (replacing teams for better multi-tenancy)
export const organizations = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').unique().notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  npi: varchar('npi', { length: 10 }),
  taxId: varchar('tax_id', { length: 20 }),

  // Contact info
  email: text('email'),
  phone: varchar('phone', { length: 20 }),
  website: text('website'),

  // Address
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),

  // Settings
  settings: json('settings').$type<Record<string, any>>().default({}),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  clerkOrgIdIdx: index('organization_clerk_org_id_idx').on(table.clerkOrgId),
  slugIdx: index('organization_slug_idx').on(table.slug),
}));

// Team members (users within organizations)
export const teamMembers = pgTable('team_member', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id).notNull(),
  clerkUserId: text('clerk_user_id').references(() => userProfiles.clerkUserId).notNull(),

  // Team-level role
  role: accessLevelEnum('role').default('read').notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastSeenAt: timestamp('last_seen_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgUserIdx: index('team_member_org_user_idx').on(table.organizationId, table.userProfileId),
  userProfileIdx: index('team_member_user_profile_idx').on(table.userProfileId),
}));

// Patients
export const patients = pgTable('patient', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Identifiers
  mrn: varchar('mrn', { length: 50 }),
  ssnLast4: varchar('ssn_last_4', { length: 4 }),
  dosespotPatientId: integer('dosespot_patient_id'),

  // Demographics
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 1 }), // M, F, O
  height: integer('height'), // In inches
  weight: integer('weight'), // In pounds

  // Contact
  email: text('email'),
  phoneHome: varchar('phone_home', { length: 20 }),
  phoneMobile: varchar('phone_mobile', { length: 20 }),
  phoneWork: varchar('phone_work', { length: 20 }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgPatientIdx: index('patient_org_idx').on(table.organizationId),
  mrnIdx: index('patient_mrn_idx').on(table.organizationId, table.mrn),
  nameIdx: index('patient_name_idx').on(table.lastName, table.firstName),
  dobIdx: index('patient_dob_idx').on(table.dateOfBirth),
}));

// Patient addresses
export const addresses = pgTable('address', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Address fields
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  city: text('city').notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),

  // Status
  isPrimary: boolean('is_primary').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  patientIdx: index('address_patient_idx').on(table.patientId),
  primaryIdx: index('address_primary_idx').on(table.patientId, table.isPrimary),
}));

// Providers
export const providers = pgTable('provider', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Identifiers
  npi: varchar('npi', { length: 10 }).unique(),
  taxId: varchar('tax_id', { length: 20 }),
  medicareId: varchar('medicare_id', { length: 20 }),
  medicaidId: varchar('medicaid_id', { length: 20 }),

  // Profile
  firstName: text('first_name'),
  lastName: text('last_name'),
  suffix: varchar('suffix', { length: 10 }),
  specialty: text('specialty'),
  licenseNumber: varchar('license_number', { length: 50 }),
  licenseState: varchar('license_state', { length: 2 }),

  // Contact
  email: text('email'),
  phone: varchar('phone', { length: 20 }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgProviderIdx: index('provider_org_idx').on(table.organizationId),
  npiIdx: index('provider_npi_idx').on(table.npi),
  nameIdx: index('provider_name_idx').on(table.lastName, table.firstName),
}));

// Payers (Insurance companies)
export const payers = pgTable('payer', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identifiers
  payerId: varchar('payer_id', { length: 50 }).unique(),
  name: text('name').notNull(),

  // Contact
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  website: text('website'),

  // Configuration
  supportsPriorAuth: boolean('supports_prior_auth').default(false),
  supportsElectronicClaims: boolean('supports_electronic_claims').default(false),
  supportsRealTimeEligibility: boolean('supports_real_time_eligibility').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  payerIdIdx: index('payer_payer_id_idx').on(table.payerId),
  nameIdx: index('payer_name_idx').on(table.name),
}));

// Insurance policies
export const insurancePolicies = pgTable('insurance_policy', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Policy details
  policyNumber: text('policy_number').notNull(),
  groupNumber: text('group_number'),
  planName: text('plan_name'),

  // Coverage
  coverageType: varchar('coverage_type', { length: 20 }), // primary, secondary, tertiary
  effectiveDate: date('effective_date'),
  terminationDate: date('termination_date'),

  // Subscriber
  subscriberRelationship: varchar('subscriber_relationship', { length: 20 }), // self, spouse, child, other
  subscriberFirstName: text('subscriber_first_name'),
  subscriberLastName: text('subscriber_last_name'),
  subscriberDob: date('subscriber_dob'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  patientIdx: index('insurance_policy_patient_idx').on(table.patientId),
  payerIdx: index('insurance_policy_payer_idx').on(table.payerId),
  policyIdx: index('insurance_policy_policy_idx').on(table.policyNumber),
}));

// Claims
export const claims = pgTable('claim', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Identifiers
  claimNumber: varchar('claim_number', { length: 50 }),
  controlNumber: varchar('control_number', { length: 50 }),

  // Service details
  serviceDate: date('service_date').notNull(),
  serviceDateTo: date('service_date_to'),
  totalCharges: decimal('total_charges', { precision: 10, scale: 2 }).notNull(),
  totalPaid: decimal('total_paid', { precision: 10, scale: 2 }).default('0'),
  totalAdjustments: decimal('total_adjustments', { precision: 10, scale: 2 }).default('0'),

  // Status
  status: claimStatusEnum('status').default('draft').notNull(),
  submissionDate: timestamp('submission_date'),
  paidDate: timestamp('paid_date'),

  // Processing
  clearinghouseId: uuid('clearinghouse_id'),
  batchId: uuid('batch_id'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgClaimIdx: index('claim_org_idx').on(table.organizationId),
  patientIdx: index('claim_patient_idx').on(table.patientId),
  providerIdx: index('claim_provider_idx').on(table.providerId),
  payerIdx: index('claim_payer_idx').on(table.payerId),
  statusIdx: index('claim_status_idx').on(table.status),
  serviceDateIdx: index('claim_service_date_idx').on(table.serviceDate),
  claimNumberIdx: index('claim_claim_number_idx').on(table.claimNumber),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;

export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;

export type Provider = InferSelectModel<typeof providers>;
export type NewProvider = InferInsertModel<typeof providers>;

export type Payer = InferSelectModel<typeof payers>;
export type NewPayer = InferInsertModel<typeof payers>;

export type InsurancePolicy = InferSelectModel<typeof insurancePolicies>;
export type NewInsurancePolicy = InferInsertModel<typeof insurancePolicies>;

// Claim lines (services/procedures on a claim)
export const claimLines = pgTable('claim_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),

  // Service details
  lineNumber: integer('line_number').notNull(),
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  modifier1: varchar('modifier_1', { length: 2 }),
  modifier2: varchar('modifier_2', { length: 2 }),
  modifier3: varchar('modifier_3', { length: 2 }),
  modifier4: varchar('modifier_4', { length: 2 }),

  // Charges
  chargeAmount: decimal('charge_amount', { precision: 10, scale: 2 }).notNull(),
  allowedAmount: decimal('allowed_amount', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  adjustmentAmount: decimal('adjustment_amount', { precision: 10, scale: 2 }).default('0'),

  // Service info
  serviceDate: date('service_date').notNull(),
  units: integer('units').default(1),
  diagnosisCode1: varchar('diagnosis_code_1', { length: 10 }),
  diagnosisCode2: varchar('diagnosis_code_2', { length: 10 }),
  diagnosisCode3: varchar('diagnosis_code_3', { length: 10 }),
  diagnosisCode4: varchar('diagnosis_code_4', { length: 10 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  claimIdx: index('claim_line_claim_idx').on(table.claimId),
  cptIdx: index('claim_line_cpt_idx').on(table.cptCode),
  serviceDateIdx: index('claim_line_service_date_idx').on(table.serviceDate),
}));

// Documents
export const documents = pgTable('document', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Relationships
  patientId: uuid('patient_id').references(() => patients.id),
  claimId: uuid('claim_id').references(() => claims.id),
  priorAuthId: uuid('prior_auth_id').references(() => priorAuths.id),
  appealId: uuid('appeal_id').references(() => appeals.id),
  encounterId: uuid('encounter_id').references(() => encounters.id),

  // Document details
  fileName: text('file_name').notNull(),
  originalFileName: text('original_file_name').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),

  // Classification
  documentType: documentTypeEnum('document_type').notNull(),
  description: text('description'),

  // Storage
  s3Key: text('s3_key').notNull(),
  s3Bucket: text('s3_bucket').notNull(),

  // Processing
  isProcessed: boolean('is_processed').default(false),
  ocrText: text('ocr_text'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  
  // Enhanced processing tracking
  uploadId: uuid('upload_id').unique(), // External reference for API clients
  processingStatus: varchar('processing_status', { length: 20 }).default('uploaded'), // uploaded, validating, processing, completed, failed
  processingStartedAt: timestamp('processing_started_at'),
  processingCompletedAt: timestamp('processing_completed_at'),
  
  // Validation results (from Rekognition)
  validationResult: json('validation_result').$type<{
    isValid: boolean;
    confidence: number;
    issues: string[];
    metadata?: {
      textConfidence?: number;
      documentQuality?: 'high' | 'medium' | 'low';
      suspiciousContent?: boolean;
    };
  }>(),
  
  // Extraction results (from Textract)
  extractedData: json('extracted_data').$type<Record<string, any>>(),
  
  // Error information
  errorMessage: text('error_message'),
  errorDetails: json('error_details'),
  
  // Retry information
  retryCount: integer('retry_count').default(0),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  uploadedBy: uuid('uploaded_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('document_org_idx').on(table.organizationId),
  patientIdx: index('document_patient_idx').on(table.patientId),
  claimIdx: index('document_claim_idx').on(table.claimId),
  typeIdx: index('document_type_idx').on(table.documentType),
  s3KeyIdx: index('document_s3_key_idx').on(table.s3Key),
}));

// Prior authorizations
export const priorAuths = pgTable('prior_auth', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),
  prescriptionId: integer('prescription_id').references(() => prescription.id),

  // Identifiers
  authNumber: varchar('auth_number', { length: 50 }),
  referenceNumber: varchar('reference_number', { length: 50 }),
  dosespotCaseId: integer('dosespot_case_id'),

  // Request details
  requestedService: text('requested_service').notNull(),
  cptCodes: text('cpt_codes'), // JSON array of CPT codes
  diagnosisCodes: text('diagnosis_codes'), // JSON array of diagnosis codes

  // Dates
  requestDate: date('request_date').notNull(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),

  // Status
  status: priorAuthStatusEnum('status').default('pending').notNull(),

  // Clinical
  clinicalNotes: text('clinical_notes'),
  medicalNecessity: text('medical_necessity'),

  // Processing
  submissionMethod: varchar('submission_method', { length: 20 }), // portal, phone, fax, mail
  approvedUnits: integer('approved_units'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('prior_auth_org_idx').on(table.organizationId),
  patientIdx: index('prior_auth_patient_idx').on(table.patientId),
  providerIdx: index('prior_auth_provider_idx').on(table.providerId),
  payerIdx: index('prior_auth_payer_idx').on(table.payerId),
  statusIdx: index('prior_auth_status_idx').on(table.status),
  authNumberIdx: index('prior_auth_auth_number_idx').on(table.authNumber),
  expirationIdx: index('prior_auth_expiration_idx').on(table.expirationDate),
  dosespotCaseIdUnique: uniqueIndex('prior_authorization_dosespot_case_id_unique').on(table.dosespotCaseId),
  prescriptionIdIdx: index('idx_prior_auth_prescription_id').on(table.prescriptionId),
  dosespotCaseIdx: index('idx_prior_auth_dosespot_case').on(table.dosespotCaseId),
}));

// Appointments
export const appointments = pgTable('appointment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Scheduling
  appointmentDate: timestamp('appointment_date').notNull(),
  duration: integer('duration').notNull(), // minutes
  appointmentType: varchar('appointment_type', { length: 50 }),

  // Location
  locationName: text('location_name'),
  roomNumber: varchar('room_number', { length: 20 }),

  // Status
  status: varchar('status', { length: 20 }).default('scheduled').notNull(),
  cancellationReason: text('cancellation_reason'),

  // Clinical
  chiefComplaint: text('chief_complaint'),
  notes: text('notes'),

  // Billing
  cptCodes: text('cpt_codes'), // JSON array
  diagnosisCodes: text('diagnosis_codes'), // JSON array

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('appointment_org_idx').on(table.organizationId),
  patientIdx: index('appointment_patient_idx').on(table.patientId),
  providerIdx: index('appointment_provider_idx').on(table.providerId),
  dateIdx: index('appointment_date_idx').on(table.appointmentDate),
  statusIdx: index('appointment_status_idx').on(table.status),
}));

// Audit logs for compliance
export const auditLogs = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Event details
  entityType: varchar('entity_type', { length: 50 }).notNull(), // table name
  entityId: uuid('entity_id').notNull(), // record ID
  action: varchar('action', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE, VIEW

  // Changes
  oldValues: json('old_values').$type<Record<string, any>>(),
  newValues: json('new_values').$type<Record<string, any>>(),
  changedFields: text('changed_fields'), // JSON array of field names

  // Context
  userId: uuid('user_id').references(() => teamMembers.id),
  userEmail: text('user_email'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  // PHI access tracking
  containsPhi: boolean('contains_phi').default(false).notNull(),
  accessReason: text('access_reason'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('audit_log_org_idx').on(table.organizationId),
  entityIdx: index('audit_log_entity_idx').on(table.entityType, table.entityId),
  userIdx: index('audit_log_user_idx').on(table.userId),
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
  phiIdx: index('audit_log_phi_idx').on(table.containsPhi),
}));

export type Claim = InferSelectModel<typeof claims>;
export type NewClaim = InferInsertModel<typeof claims>;

export type ClaimLine = InferSelectModel<typeof claimLines>;
export type NewClaimLine = InferInsertModel<typeof claimLines>;

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export type PriorAuth = InferSelectModel<typeof priorAuths>;
export type NewPriorAuth = InferInsertModel<typeof priorAuths>;

export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;

// Workflow executions (automated processes)
export const workflowExecutions = pgTable('workflow_execution', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Workflow details
  workflowName: varchar('workflow_name', { length: 100 }).notNull(),
  workflowVersion: varchar('workflow_version', { length: 20 }).default('1.0'),

  // Trigger
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // manual, scheduled, event
  triggeredBy: uuid('triggered_by').references(() => teamMembers.id),

  // Context
  entityType: varchar('entity_type', { length: 50 }), // patient, claim, prior_auth
  entityId: uuid('entity_id'),

  // Execution
  status: workflowStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

  // Results
  result: json('result').$type<Record<string, any>>(),
  errorMessage: text('error_message'),
  stepsCompleted: integer('steps_completed').default(0),
  totalSteps: integer('total_steps').default(0),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('workflow_execution_org_idx').on(table.organizationId),
  workflowIdx: index('workflow_execution_workflow_idx').on(table.workflowName),
  statusIdx: index('workflow_execution_status_idx').on(table.status),
  entityIdx: index('workflow_execution_entity_idx').on(table.entityType, table.entityId),
  startedAtIdx: index('workflow_execution_started_at_idx').on(table.startedAt),
}));

// Business rules for automation
export const businessRules = pgTable('business_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Rule details
  name: text('name').notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // claim_validation, prior_auth, payment

  // Trigger conditions
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(), // claim_created, claim_updated, etc.
  conditions: json('conditions').$type<Record<string, any>>().notNull(),

  // Actions
  actions: json('actions').$type<Record<string, any>>().notNull(),

  // Configuration
  priority: integer('priority').default(100),
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('business_rule_org_idx').on(table.organizationId),
  categoryIdx: index('business_rule_category_idx').on(table.category),
  triggerIdx: index('business_rule_trigger_idx').on(table.triggerEvent),
  activeIdx: index('business_rule_active_idx').on(table.isActive),
}));

// Work queue for manual tasks
export const workQueues = pgTable('work_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Item details
  title: text('title').notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 10 }).default('medium').notNull(), // low, medium, high, urgent

  // Assignment
  assignedTo: uuid('assigned_to').references(() => teamMembers.id),
  assignedAt: timestamp('assigned_at'),

  // Context
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),

  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, in_progress, completed, cancelled

  // Timing
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),

  // Results
  completionNotes: text('completion_notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('work_queue_org_idx').on(table.organizationId),
  assigneeIdx: index('work_queue_assignee_idx').on(table.assignedTo),
  statusIdx: index('work_queue_status_idx').on(table.status),
  priorityIdx: index('work_queue_priority_idx').on(table.priority),
  entityIdx: index('work_queue_entity_idx').on(table.entityType, table.entityId),
  dueDateIdx: index('work_queue_due_date_idx').on(table.dueDate),
}));

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

export type WorkflowExecution = InferSelectModel<typeof workflowExecutions>;
export type NewWorkflowExecution = InferInsertModel<typeof workflowExecutions>;

export type BusinessRule = InferSelectModel<typeof businessRules>;
export type NewBusinessRule = InferInsertModel<typeof businessRules>;

// ============================================================================
// PAYMENT PROCESSING TABLES
// ============================================================================

// Remittance advice (ERA - Electronic Remittance Advice)
export const remittanceAdvice = pgTable('remittance_advice', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // ERA details
  eraNumber: varchar('era_number', { length: 50 }).notNull(),
  traceNumber: varchar('trace_number', { length: 50 }),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),

  // Status
  status: eraStatusEnum('status').default('pending').notNull(),

  // Processing
  eraFilePath: text('era_file_path'),
  rawEraData: text('raw_era_data'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('remittance_advice_org_idx').on(table.organizationId),
  payerIdx: index('remittance_advice_payer_idx').on(table.payerId),
  eraNumberIdx: index('remittance_advice_era_number_idx').on(table.eraNumber),
  statusIdx: index('remittance_advice_status_idx').on(table.status),
  paymentDateIdx: index('remittance_advice_payment_date_idx').on(table.paymentDate),
}));

// Payment details (individual payment records)
export const paymentDetails = pgTable('payment_detail', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  remittanceAdviceId: uuid('remittance_advice_id').references(() => remittanceAdvice.id),

  // Payment amounts
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).notNull(),
  allowedAmount: decimal('allowed_amount', { precision: 10, scale: 2 }),
  deductibleAmount: decimal('deductible_amount', { precision: 10, scale: 2 }).default('0'),
  coinsuranceAmount: decimal('coinsurance_amount', { precision: 10, scale: 2 }).default('0'),
  copayAmount: decimal('copay_amount', { precision: 10, scale: 2 }).default('0'),

  // Processing
  status: paymentStatusEnum('status').default('pending').notNull(),
  checkNumber: varchar('check_number', { length: 50 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('payment_detail_org_idx').on(table.organizationId),
  claimIdx: index('payment_detail_claim_idx').on(table.claimId),
  patientIdx: index('payment_detail_patient_idx').on(table.patientId),
  remittanceIdx: index('payment_detail_remittance_idx').on(table.remittanceAdviceId),
  statusIdx: index('payment_detail_status_idx').on(table.status),
}));

// ERA line details (line-level payment details from ERA)
export const eraLineDetails = pgTable('era_line_detail', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentDetailId: uuid('payment_detail_id').references(() => paymentDetails.id).notNull(),
  claimLineId: uuid('claim_line_id').references(() => claimLines.id),

  // Line details
  lineNumber: integer('line_number').notNull(),
  serviceDate: date('service_date').notNull(),
  procedureCode: varchar('procedure_code', { length: 10 }).notNull(),

  // Amounts
  chargedAmount: decimal('charged_amount', { precision: 10, scale: 2 }).notNull(),
  allowedAmount: decimal('allowed_amount', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).notNull(),
  adjustmentAmount: decimal('adjustment_amount', { precision: 10, scale: 2 }).default('0'),

  // Adjustment codes
  adjustmentCodes: text('adjustment_codes'), // JSON array of codes
  remarks: text('remarks'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  paymentDetailIdx: index('era_line_detail_payment_detail_idx').on(table.paymentDetailId),
  claimLineIdx: index('era_line_detail_claim_line_idx').on(table.claimLineId),
  serviceDateIdx: index('era_line_detail_service_date_idx').on(table.serviceDate),
}));

// Payment adjustments
export const paymentAdjustments = pgTable('payment_adjustment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),
  paymentDetailId: uuid('payment_detail_id').references(() => paymentDetails.id),

  // Adjustment details
  adjustmentType: adjustmentTypeEnum('adjustment_type').notNull(),
  adjustmentAmount: decimal('adjustment_amount', { precision: 10, scale: 2 }).notNull(),
  adjustmentCode: varchar('adjustment_code', { length: 10 }),
  adjustmentDescription: text('adjustment_description'),

  // Processing
  reason: text('reason'),
  postedBy: uuid('posted_by').references(() => teamMembers.id),
  postedAt: timestamp('posted_at').defaultNow(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('payment_adjustment_org_idx').on(table.organizationId),
  claimIdx: index('payment_adjustment_claim_idx').on(table.claimId),
  paymentDetailIdx: index('payment_adjustment_payment_detail_idx').on(table.paymentDetailId),
  typeIdx: index('payment_adjustment_type_idx').on(table.adjustmentType),
  postedByIdx: index('payment_adjustment_posted_by_idx').on(table.postedBy),
}));

// Patient payment plans
export const paymentPlans = pgTable('payment_plan', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Plan details
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 10, scale: 2 }).notNull(),
  remainingBalance: decimal('remaining_balance', { precision: 10, scale: 2 }).notNull(),

  // Schedule
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  nextPaymentDate: date('next_payment_date'),

  // Payment method
  paymentMethodToken: text('payment_method_token'), // Encrypted token
  autoPayEnabled: boolean('auto_pay_enabled').default(false),

  // Status
  status: paymentStatusEnum('status').default('pending').notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('payment_plan_org_idx').on(table.organizationId),
  patientIdx: index('payment_plan_patient_idx').on(table.patientId),
  statusIdx: index('payment_plan_status_idx').on(table.status),
  nextPaymentIdx: index('payment_plan_next_payment_idx').on(table.nextPaymentDate),
}));

// Patient payments
export const patientPayments = pgTable('patient_payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  paymentPlanId: uuid('payment_plan_id').references(() => paymentPlans.id),

  // Payment details
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentDate: date('payment_date').notNull(),

  // Processing
  status: paymentStatusEnum('status').default('pending').notNull(),
  confirmationNumber: varchar('confirmation_number', { length: 50 }),
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('patient_payment_org_idx').on(table.organizationId),
  patientIdx: index('patient_payment_patient_idx').on(table.patientId),
  paymentPlanIdx: index('patient_payment_payment_plan_idx').on(table.paymentPlanId),
  statusIdx: index('patient_payment_status_idx').on(table.status),
  paymentDateIdx: index('patient_payment_payment_date_idx').on(table.paymentDate),
}));

export type WorkQueue = InferSelectModel<typeof workQueues>;
export type NewWorkQueue = InferInsertModel<typeof workQueues>;

export type RemittanceAdvice = InferSelectModel<typeof remittanceAdvice>;
export type NewRemittanceAdvice = InferInsertModel<typeof remittanceAdvice>;

export type PaymentDetail = InferSelectModel<typeof paymentDetails>;
export type NewPaymentDetail = InferInsertModel<typeof paymentDetails>;

export type EraLineDetail = InferSelectModel<typeof eraLineDetails>;
export type NewEraLineDetail = InferInsertModel<typeof eraLineDetails>;

export type PaymentAdjustment = InferSelectModel<typeof paymentAdjustments>;
export type NewPaymentAdjustment = InferInsertModel<typeof paymentAdjustments>;

export type PaymentPlan = InferSelectModel<typeof paymentPlans>;
export type NewPaymentPlan = InferInsertModel<typeof paymentPlans>;

// ============================================================================
// INTEGRATION & API MANAGEMENT TABLES
// ============================================================================

// Clearinghouse connections
export const clearinghouseConnections = pgTable('clearinghouse_connection', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Connection details
  clearinghouseName: text('clearinghouse_name').notNull(),
  connectionType: varchar('connection_type', { length: 20 }).notNull(), // sftp, api, edi

  // Configuration
  hostUrl: text('host_url'),
  username: text('username'),
  password: text('password'), // Should be encrypted
  port: integer('port'),

  // Settings
  submissionFormat: varchar('submission_format', { length: 10 }).default('X12'), // X12, FHIR
  testMode: boolean('test_mode').default(true),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastConnectionTest: timestamp('last_connection_test'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('clearinghouse_connection_org_idx').on(table.organizationId),
  nameIdx: index('clearinghouse_connection_name_idx').on(table.clearinghouseName),
  activeIdx: index('clearinghouse_connection_active_idx').on(table.isActive),
}));

// Clearinghouse batches
export const clearinghouseBatches = pgTable('clearinghouse_batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  clearinghouseId: uuid('clearinghouse_id').references(() => clearinghouseConnections.id).notNull(),

  // Batch details
  batchNumber: varchar('batch_number', { length: 50 }).notNull(),
  claimCount: integer('claim_count').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),

  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  submissionDate: timestamp('submission_date'),
  acknowledgmentDate: timestamp('acknowledgment_date'),

  // Files
  batchFilePath: text('batch_file_path'),
  acknowledgmentFilePath: text('acknowledgment_file_path'),

  // Processing
  submittedBy: uuid('submitted_by').references(() => teamMembers.id),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('clearinghouse_batch_org_idx').on(table.organizationId),
  clearinghouseIdx: index('clearinghouse_batch_clearinghouse_idx').on(table.clearinghouseId),
  batchNumberIdx: index('clearinghouse_batch_batch_number_idx').on(table.batchNumber),
  statusIdx: index('clearinghouse_batch_status_idx').on(table.status),
  submissionDateIdx: index('clearinghouse_batch_submission_date_idx').on(table.submissionDate),
}));

// Batch jobs for processing workflows
export const batchJobs = pgTable('batch_job', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Job details
  jobName: varchar('job_name', { length: 100 }).notNull(),
  jobType: varchar('job_type', { length: 50 }).notNull(), // claim_submission, era_processing, eligibility_check, etc
  description: text('description'),

  // Configuration
  parameters: json('parameters'), // JSON configuration for the batch job
  priority: integer('priority').default(5).notNull(), // 1-10 scale

  // Status and timing
  status: batchStatusEnum('status').default('pending').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Progress tracking
  totalItems: integer('total_items').default(0).notNull(),
  processedItems: integer('processed_items').default(0).notNull(),
  successfulItems: integer('successful_items').default(0).notNull(),
  failedItems: integer('failed_items').default(0).notNull(),

  // Error handling
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),
  lastError: text('last_error'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('batch_job_org_idx').on(table.organizationId),
  statusIdx: index('batch_job_status_idx').on(table.status),
  jobTypeIdx: index('batch_job_job_type_idx').on(table.jobType),
  scheduledAtIdx: index('batch_job_scheduled_at_idx').on(table.scheduledAt),
  createdAtIdx: index('batch_job_created_at_idx').on(table.createdAt),
}));

// Individual items within batch jobs
export const batchJobItems = pgTable('batch_job_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchJobId: uuid('batch_job_id').references(() => batchJobs.id).notNull(),

  // Item identification
  itemType: varchar('item_type', { length: 50 }).notNull(), // claim, patient, prior_auth, etc
  itemId: uuid('item_id').notNull(), // Reference to the actual item being processed
  itemData: json('item_data'), // Snapshot of item data at processing time

  // Processing details
  status: batchStatusEnum('status').default('pending').notNull(),
  processingOrder: integer('processing_order').notNull(),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Results
  result: json('result'), // Processing result data
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  batchJobIdx: index('batch_job_item_batch_job_idx').on(table.batchJobId),
  statusIdx: index('batch_job_item_status_idx').on(table.status),
  itemTypeIdx: index('batch_job_item_item_type_idx').on(table.itemType),
  itemIdIdx: index('batch_job_item_item_id_idx').on(table.itemId),
  processingOrderIdx: index('batch_job_item_processing_order_idx').on(table.processingOrder),
}));

// API keys for external integrations
export const apiKeys = pgTable('api_key', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Key details
  name: text('name').notNull(),
  description: text('description'),
  keyHash: text('key_hash').notNull(), // Hashed API key
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(), // First few chars for identification

  // Permissions
  scopes: text('scopes'), // JSON array of permissions

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('api_key_org_idx').on(table.organizationId),
  keyPrefixIdx: index('api_key_key_prefix_idx').on(table.keyPrefix),
  activeIdx: index('api_key_active_idx').on(table.isActive),
  expiresAtIdx: index('api_key_expires_at_idx').on(table.expiresAt),
}));

// External service credentials (HIPAA-compliant storage)
export const externalServiceCredentials = pgTable('external_service_credential', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Service identification
  serviceName: varchar('service_name', { length: 50 }).notNull(), // 'dosespot', 'surescripts', etc.
  serviceType: varchar('service_type', { length: 20 }).notNull(), // 'erx', 'epa', 'clearinghouse'
  environment: varchar('environment', { length: 10 }).default('production').notNull(), // 'production', 'sandbox'

  // AWS Secrets Manager reference (NOT the actual credentials)
  secretArn: text('secret_arn').notNull(), // ARN of the secret in AWS Secrets Manager
  secretRegion: varchar('secret_region', { length: 20 }).default('us-east-1').notNull(),

  // Credential metadata (non-sensitive)
  credentialName: text('credential_name').notNull(), // User-friendly name
  description: text('description'),

  // Status and validation
  isActive: boolean('is_active').default(true),
  isValid: boolean('is_valid').default(false), // Set to true after successful validation
  lastValidated: timestamp('last_validated'),
  lastValidationError: text('last_validation_error'),
  validationAttempts: integer('validation_attempts').default(0),

  // Usage tracking
  lastUsed: timestamp('last_used'),
  usageCount: integer('usage_count').default(0),

  // Feature enablement
  enabledFeatures: jsonb('enabled_features').notNull(), // ['erx', 'epa', 'formulary_check']

  // Connection settings
  connectionSettings: jsonb('connection_settings'), // Non-sensitive config like timeout, retry settings

  // Auto-renewal and expiration
  expiresAt: timestamp('expires_at'),
  autoRenew: boolean('auto_renew').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id).notNull(),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgServiceIdx: index('external_service_credential_org_service_idx').on(table.organizationId, table.serviceName),
  serviceTypeIdx: index('external_service_credential_service_type_idx').on(table.serviceType),
  activeIdx: index('external_service_credential_active_idx').on(table.isActive),
  validIdx: index('external_service_credential_valid_idx').on(table.isValid),
  secretArnIdx: index('external_service_credential_secret_arn_idx').on(table.secretArn),
  lastValidatedIdx: index('external_service_credential_last_validated_idx').on(table.lastValidated),
  expiresAtIdx: index('external_service_credential_expires_at_idx').on(table.expiresAt),
  // Ensure one active credential per organization per service
  orgServiceUniqueIdx: uniqueIndex('external_service_credential_org_service_unique_idx')
    .on(table.organizationId, table.serviceName, table.environment)
    .where(and(eq(table.isActive, true), isNull(table.deletedAt))!),
}));

// Enhanced webhook system - imported from dedicated webhook schema
// See ./webhook-schema.ts for the new webhook table definitions
export * from './webhook-schema';

// Integration event logs
export const integrationEventLogs = pgTable('integration_event_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Event details
  integrationType: integrationTypeEnum('integration_type').notNull(),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // inbound, outbound

  // Context
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),

  // Data
  requestData: json('request_data'),
  responseData: json('response_data'),
  errorMessage: text('error_message'),

  // Status
  status: varchar('status', { length: 20 }).notNull(), // success, error, timeout
  processingTimeMs: integer('processing_time_ms'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('integration_event_log_org_idx').on(table.organizationId),
  integrationTypeIdx: index('integration_event_log_integration_type_idx').on(table.integrationType),
  statusIdx: index('integration_event_log_status_idx').on(table.status),
  eventNameIdx: index('integration_event_log_event_name_idx').on(table.eventName),
  createdAtIdx: index('integration_event_log_created_at_idx').on(table.createdAt),
}));

export type PatientPayment = InferSelectModel<typeof patientPayments>;
export type NewPatientPayment = InferInsertModel<typeof patientPayments>;

export type ClearinghouseConnection = InferSelectModel<typeof clearinghouseConnections>;
export type NewClearinghouseConnection = InferInsertModel<typeof clearinghouseConnections>;

export type ClearinghouseBatch = InferSelectModel<typeof clearinghouseBatches>;
export type NewClearinghouseBatch = InferInsertModel<typeof clearinghouseBatches>;

export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;


// ============================================================================
// CLINICAL & EHR INTEGRATION TABLES
// ============================================================================

// Eligibility checks
export const eligibilityChecks = pgTable('eligibility_check', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  insurancePolicyId: uuid('insurance_policy_id').references(() => insurancePolicies.id).notNull(),

  // Check details
  checkType: eligibilityCheckTypeEnum('check_type').notNull(),
  serviceDate: date('service_date').notNull(),

  // Response
  eligibilityStatus: eligibilityResponseEnum('eligibility_status'),
  effectiveDate: date('effective_date'),
  terminationDate: date('termination_date'),

  // Benefits
  deductible: decimal('deductible', { precision: 10, scale: 2 }),
  deductibleMet: decimal('deductible_met', { precision: 10, scale: 2 }),
  outOfPocketMax: decimal('out_of_pocket_max', { precision: 10, scale: 2 }),
  outOfPocketMet: decimal('out_of_pocket_met', { precision: 10, scale: 2 }),
  copay: decimal('copay', { precision: 10, scale: 2 }),
  coinsurance: decimal('coinsurance', { precision: 5, scale: 4 }), // 0.2000 = 20%

  // Raw response
  rawResponse: text('raw_response'),
  errorMessage: text('error_message'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  checkedBy: uuid('checked_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('eligibility_check_org_idx').on(table.organizationId),
  patientIdx: index('eligibility_check_patient_idx').on(table.patientId),
  policyIdx: index('eligibility_check_policy_idx').on(table.insurancePolicyId),
  statusIdx: index('eligibility_check_status_idx').on(table.eligibilityStatus),
  serviceDateIdx: index('eligibility_check_service_date_idx').on(table.serviceDate),
}));

// Eligibility cache for performance
export const eligibilityCache = pgTable('eligibility_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  insurancePolicyId: uuid('insurance_policy_id').references(() => insurancePolicies.id).notNull(),

  // Cache key
  cacheKey: varchar('cache_key', { length: 128 }).notNull().unique(),

  // Cached eligibility data
  eligibilityData: json('eligibility_data').notNull(),

  // Expiration
  expiresAt: timestamp('expires_at').notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('eligibility_cache_org_idx').on(table.organizationId),
  patientIdx: index('eligibility_cache_patient_idx').on(table.patientId),
  policyIdx: index('eligibility_cache_policy_idx').on(table.insurancePolicyId),
  cacheKeyIdx: index('eligibility_cache_cache_key_idx').on(table.cacheKey),
  expiresAtIdx: index('eligibility_cache_expires_at_idx').on(table.expiresAt),
}));

// Referrals
export const referrals = pgTable('referral', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Referring provider
  referringProviderId: uuid('referring_provider_id').references(() => providers.id).notNull(),

  // Referred to provider
  referredToProviderNpi: varchar('referred_to_provider_npi', { length: 10 }),
  referredToProviderName: text('referred_to_provider_name'),
  referredToSpecialty: text('referred_to_specialty'),

  // Referral details
  referralType: varchar('referral_type', { length: 50 }), // consult, treatment, diagnostic
  reasonForReferral: text('reason_for_referral').notNull(),
  urgency: varchar('urgency', { length: 20 }).default('routine'), // routine, urgent, emergent

  // Authorization
  authorizationRequired: boolean('authorization_required').default(false),
  authorizationNumber: varchar('authorization_number', { length: 50 }),

  // Dates
  referralDate: date('referral_date').notNull(),
  expirationDate: date('expiration_date'),

  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(),

  // Clinical
  diagnosisCodes: text('diagnosis_codes'), // JSON array
  clinicalNotes: text('clinical_notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('referral_org_idx').on(table.organizationId),
  patientIdx: index('referral_patient_idx').on(table.patientId),
  referringProviderIdx: index('referral_referring_provider_idx').on(table.referringProviderId),
  statusIdx: index('referral_status_idx').on(table.status),
  referralDateIdx: index('referral_referral_date_idx').on(table.referralDate),
  expirationIdx: index('referral_expiration_idx').on(table.expirationDate),
}));

// EHR connections
export const ehrConnections = pgTable('ehr_connection', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // EHR details
  ehrSystemName: text('ehr_system_name').notNull(),
  version: varchar('version', { length: 20 }),

  // API configuration
  apiType: ehrApiTypeEnum('api_type'),
  authMethod: ehrAuthMethodEnum('auth_method'),

  // Connection details
  baseUrl: text('base_url'),
  clientId: text('client_id'),
  clientSecret: text('client_secret'), // Should be encrypted
  apiKey: text('api_key'), // Should be encrypted

  // OAuth specific
  tokenUrl: text('token_url'),
  authorizeUrl: text('authorize_url'),
  scopes: text('scopes'), // JSON array

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  lastTestAt: timestamp('last_test_at'),
  testStatus: varchar('test_status', { length: 20 }), // success, failed, pending

  // Settings
  syncPatients: boolean('sync_patients').default(false),
  syncAppointments: boolean('sync_appointments').default(false),
  syncDocuments: boolean('sync_documents').default(false),

  // Rate limiting
  rateLimitPerMinute: integer('rate_limit_per_minute').default(100),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('ehr_connection_org_idx').on(table.organizationId),
  systemNameIdx: index('ehr_connection_system_name_idx').on(table.ehrSystemName),
  activeIdx: index('ehr_connection_active_idx').on(table.isActive),
  lastSyncIdx: index('ehr_connection_last_sync_idx').on(table.lastSyncAt),
}));

export type IntegrationEventLog = InferSelectModel<typeof integrationEventLogs>;
export type NewIntegrationEventLog = InferInsertModel<typeof integrationEventLogs>;

export type EligibilityCheck = InferSelectModel<typeof eligibilityChecks>;
export type NewEligibilityCheck = InferInsertModel<typeof eligibilityChecks>;

export type EligibilityCache = InferSelectModel<typeof eligibilityCache>;
export type NewEligibilityCache = InferInsertModel<typeof eligibilityCache>;

export type Referral = InferSelectModel<typeof referrals>;
export type NewReferral = InferInsertModel<typeof referrals>;

// ============================================================================
// ANALYTICS & BUSINESS INTELLIGENCE TABLES
// ============================================================================

// Analytics events for tracking user behavior and system performance
export const analyticsEvents = pgTable('analytics_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),

  // Event details
  eventName: varchar('event_name', { length: 100 }).notNull(),
  category: analyticsEventCategoryEnum('category').notNull(),

  // Event data
  properties: json('properties'),
  sessionId: varchar('session_id', { length: 128 }),

  // Context
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  url: text('url'),
  referrer: text('referrer'),

  // Timing
  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('analytics_event_org_idx').on(table.organizationId),
  memberIdx: index('analytics_event_member_idx').on(table.teamMemberId),
  eventIdx: index('analytics_event_event_idx').on(table.eventName),
  categoryIdx: index('analytics_event_category_idx').on(table.category),
  timestampIdx: index('analytics_event_timestamp_idx').on(table.timestamp),
}));

// KPI definitions
export const kpiDefinitions = pgTable('kpi_definition', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // KPI details
  kpiName: varchar('kpi_name', { length: 100 }).notNull(),
  description: text('description'),
  formula: text('formula').notNull(), // SQL or calculation formula
  unit: varchar('unit', { length: 20 }), // percentage, currency, count, etc.

  // Configuration
  isActive: boolean('is_active').default(true).notNull(),
  refreshInterval: varchar('refresh_interval', { length: 20 }), // hourly, daily, weekly, monthly

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('kpi_definition_org_idx').on(table.organizationId),
  nameIdx: index('kpi_definition_name_idx').on(table.kpiName),
  activeIdx: index('kpi_definition_active_idx').on(table.isActive),
}));

// KPI snapshots (calculated values at specific points in time)
export const kpiSnapshots = pgTable('kpi_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  kpiDefinitionId: uuid('kpi_definition_id').references(() => kpiDefinitions.id).notNull(),

  // Snapshot data
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  period: varchar('period', { length: 20 }).notNull(), // YYYY-MM-DD or YYYY-MM or YYYY
  snapshotDate: timestamp('snapshot_date').notNull(),

  // Metadata
  calculationDuration: integer('calculation_duration'), // milliseconds
  dataPoints: integer('data_points'), // number of records used in calculation

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('kpi_snapshot_org_idx').on(table.organizationId),
  kpiIdx: index('kpi_snapshot_kpi_idx').on(table.kpiDefinitionId),
  periodIdx: index('kpi_snapshot_period_idx').on(table.period),
  snapshotDateIdx: index('kpi_snapshot_snapshot_date_idx').on(table.snapshotDate),
}));

// ML model metrics and predictions
export const mlModelMetrics = pgTable('ml_model_metric', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Model details
  modelName: varchar('model_name', { length: 100 }).notNull(),
  modelVersion: varchar('model_version', { length: 20 }).notNull(),

  // Metrics
  accuracy: decimal('accuracy', { precision: 5, scale: 4 }), // 0.9500 = 95%
  precision: decimal('precision', { precision: 5, scale: 4 }),
  recall: decimal('recall', { precision: 5, scale: 4 }),
  f1Score: decimal('f1_score', { precision: 5, scale: 4 }),

  // Training data
  trainingDataSize: integer('training_data_size'),
  validationDataSize: integer('validation_data_size'),

  // Timing
  trainingStarted: timestamp('training_started'),
  trainingCompleted: timestamp('training_completed'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('ml_model_metric_org_idx').on(table.organizationId),
  modelIdx: index('ml_model_metric_model_idx').on(table.modelName, table.modelVersion),
  trainingDateIdx: index('ml_model_metric_training_date_idx').on(table.trainingCompleted),
}));

// ML predictions
export const mlPredictions = pgTable('ml_prediction', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Model details
  modelName: varchar('model_name', { length: 100 }).notNull(),
  modelVersion: varchar('model_version', { length: 20 }).notNull(),

  // Prediction context
  entityType: varchar('entity_type', { length: 50 }).notNull(), // claim, patient, etc.
  entityId: uuid('entity_id').notNull(),

  // Prediction results
  prediction: text('prediction').notNull(), // JSON or string result
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // 0.8500 = 85%

  // Input features (for debugging/auditing)
  features: json('features'),

  // Feedback
  actualOutcome: text('actual_outcome'),
  isCorrect: boolean('is_correct'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('ml_prediction_org_idx').on(table.organizationId),
  modelIdx: index('ml_prediction_model_idx').on(table.modelName, table.modelVersion),
  entityIdx: index('ml_prediction_entity_idx').on(table.entityType, table.entityId),
  confidenceIdx: index('ml_prediction_confidence_idx').on(table.confidence),
  createdAtIdx: index('ml_prediction_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// QUALITY MANAGEMENT TABLES
// ============================================================================

// Data quality fixes and recommendations
export const suggestedFixes = pgTable('suggested_fix', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Target entity
  entityType: varchar('entity_type', { length: 50 }).notNull(), // claim, patient, prior_auth, etc
  entityId: uuid('entity_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),

  // Issue details
  issueType: varchar('issue_type', { length: 50 }).notNull(), // missing_data, invalid_format, inconsistent_data, etc
  severity: varchar('severity', { length: 20 }).default('medium').notNull(), // low, medium, high, critical
  description: text('description').notNull(),

  // Current and suggested values
  currentValue: text('current_value'),
  suggestedValue: text('suggested_value').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // 0.8500 = 85%

  // Source of suggestion
  source: varchar('source', { length: 50 }).notNull(), // manual, ai_model, business_rule, validation_rule
  sourceDetails: text('source_details'), // Additional context about how suggestion was generated

  // Status
  status: validationStatusEnum('status').default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => teamMembers.id),
  reviewedAt: timestamp('reviewed_at'),

  // Implementation
  appliedBy: uuid('applied_by').references(() => teamMembers.id),
  appliedAt: timestamp('applied_at'),
  rejectedReason: text('rejected_reason'),

  // Impact tracking
  estimatedImpact: varchar('estimated_impact', { length: 50 }), // claim_approval, faster_processing, reduced_denials
  actualImpact: text('actual_impact'), // Measured after implementation

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('suggested_fix_org_idx').on(table.organizationId),
  entityIdx: index('suggested_fix_entity_idx').on(table.entityType, table.entityId),
  statusIdx: index('suggested_fix_status_idx').on(table.status),
  severityIdx: index('suggested_fix_severity_idx').on(table.severity),
  fieldNameIdx: index('suggested_fix_field_name_idx').on(table.fieldName),
  sourceIdx: index('suggested_fix_source_idx').on(table.source),
  confidenceIdx: index('suggested_fix_confidence_idx').on(table.confidence),
  createdAtIdx: index('suggested_fix_created_at_idx').on(table.createdAt),
}));

// Field-level confidence scores for data quality
export const fieldConfidence = pgTable('field_confidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Target field
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),

  // Confidence metrics
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }).notNull(), // 0.9500 = 95%
  qualityStatus: dataQualityStatusEnum('quality_status').notNull(),

  // Contributing factors
  sourceReliability: decimal('source_reliability', { precision: 5, scale: 4 }), // How reliable is the data source
  validationResults: json('validation_results'), // Results from validation rules
  consistencyScore: decimal('consistency_score', { precision: 5, scale: 4 }), // Consistency with related data
  completenessScore: decimal('completeness_score', { precision: 5, scale: 4 }), // How complete is the data

  // Metadata
  lastValidated: timestamp('last_validated').defaultNow().notNull(),
  validationMethod: varchar('validation_method', { length: 50 }), // manual, automated, ml_model

  // History tracking
  previousScore: decimal('previous_score', { precision: 5, scale: 4 }),
  scoreChangeReason: text('score_change_reason'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('field_confidence_org_idx').on(table.organizationId),
  entityIdx: index('field_confidence_entity_idx').on(table.entityType, table.entityId),
  fieldNameIdx: index('field_confidence_field_name_idx').on(table.fieldName),
  confidenceScoreIdx: index('field_confidence_confidence_score_idx').on(table.confidenceScore),
  qualityStatusIdx: index('field_confidence_quality_status_idx').on(table.qualityStatus),
  lastValidatedIdx: index('field_confidence_last_validated_idx').on(table.lastValidated),
}));

// Data scrubbing and cleansing results
export const scrubbingResults = pgTable('scrubbing_result', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  batchJobId: uuid('batch_job_id').references(() => batchJobs.id),

  // Scrubbing session details
  sessionId: uuid('session_id').notNull(), // Groups multiple scrubbing operations
  scrubType: varchar('scrub_type', { length: 50 }).notNull(), // data_validation, format_correction, duplicate_detection

  // Target data
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }),

  // Issue details
  issueType: varchar('issue_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  description: text('description').notNull(),

  // Values
  originalValue: text('original_value'),
  scrubbedValue: text('scrubbed_value'),

  // Processing details
  rule: varchar('rule', { length: 100 }), // The scrubbing rule that was applied
  confidence: decimal('confidence', { precision: 5, scale: 4 }),

  // Status
  status: validationStatusEnum('status').default('pending').notNull(),
  manualReviewRequired: boolean('manual_review_required').default(false),

  // Review and approval
  reviewedBy: uuid('reviewed_by').references(() => teamMembers.id),
  reviewedAt: timestamp('reviewed_at'),
  approved: boolean('approved'),
  rejectionReason: text('rejection_reason'),

  // Impact
  impactAssessment: text('impact_assessment'),
  relatedRecords: text('related_records'), // JSON array of related record IDs that might be affected

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  processedBy: uuid('processed_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('scrubbing_result_org_idx').on(table.organizationId),
  batchJobIdx: index('scrubbing_result_batch_job_idx').on(table.batchJobId),
  sessionIdx: index('scrubbing_result_session_idx').on(table.sessionId),
  entityIdx: index('scrubbing_result_entity_idx').on(table.entityType, table.entityId),
  statusIdx: index('scrubbing_result_status_idx').on(table.status),
  scrubTypeIdx: index('scrubbing_result_scrub_type_idx').on(table.scrubType),
  severityIdx: index('scrubbing_result_severity_idx').on(table.severity),
  manualReviewIdx: index('scrubbing_result_manual_review_idx').on(table.manualReviewRequired),
  createdAtIdx: index('scrubbing_result_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// COMMUNICATION & NOTIFICATION TABLES
// ============================================================================

// Notification templates
export const notificationTemplates = pgTable('notification_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Template details
  name: text('name').notNull(),
  description: text('description'),
  type: notificationTypeEnum('type').notNull(),

  // Content
  subject: text('subject'),
  body: text('body').notNull(),
  htmlBody: text('html_body'),

  // Configuration
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('notification_template_org_idx').on(table.organizationId),
  typeIdx: index('notification_template_type_idx').on(table.type),
  activeIdx: index('notification_template_active_idx').on(table.isActive),
}));

// Notifications
export const notifications = pgTable('notification', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id).notNull(),
  templateId: uuid('template_id').references(() => notificationTemplates.id),

  // Notification details
  type: notificationTypeEnum('type').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),

  // Recipients
  recipient: text('recipient').notNull(), // email, phone number, etc.

  // Status
  isRead: boolean('is_read').default(false).notNull(),
  isSent: boolean('is_sent').default(false).notNull(),
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),

  // Context
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('notification_org_idx').on(table.organizationId),
  memberIdx: index('notification_member_idx').on(table.teamMemberId),
  typeIdx: index('notification_type_idx').on(table.type),
  unreadIdx: index('notification_unread_idx').on(table.teamMemberId, table.isRead),
  entityIdx: index('notification_entity_idx').on(table.entityType, table.entityId),
}));

// Communication logs
export const communicationLogs = pgTable('communication_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Communication details
  communicationType: communicationTypeEnum('communication_type').notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // inbound, outbound

  // Parties
  fromAddress: text('from_address'), // email, phone, fax number
  toAddress: text('to_address'),

  // Content
  subject: text('subject'),
  body: text('body'),
  attachments: text('attachments'), // JSON array of file paths

  // Context
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),

  // Processing
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  errorMessage: text('error_message'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('communication_log_org_idx').on(table.organizationId),
  typeIdx: index('communication_log_type_idx').on(table.communicationType),
  directionIdx: index('communication_log_direction_idx').on(table.direction),
  statusIdx: index('communication_log_status_idx').on(table.status),
  entityIdx: index('communication_log_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('communication_log_created_at_idx').on(table.createdAt),
}));

// Payment reconciliation
export const paymentReconciliation = pgTable('payment_reconciliation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),

  // Reconciliation details
  expectedAmount: decimal('expected_amount', { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 10, scale: 2 }).notNull(),
  variance: decimal('variance', { precision: 10, scale: 2 }).notNull(),

  // Status
  reconciliationStatus: reconciliationStatusEnum('reconciliation_status').default('pending').notNull(),
  reconciliationDate: timestamp('reconciliation_date'),

  // Notes
  notes: text('notes'),

  // Processing
  reconciledBy: uuid('reconciled_by').references(() => teamMembers.id),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('payment_reconciliation_org_idx').on(table.organizationId),
  claimIdx: index('payment_reconciliation_claim_idx').on(table.claimId),
  statusIdx: index('payment_reconciliation_status_idx').on(table.reconciliationStatus),
  dateIdx: index('payment_reconciliation_date_idx').on(table.reconciliationDate),
}));

export type EhrConnection = InferSelectModel<typeof ehrConnections>;
export type NewEhrConnection = InferInsertModel<typeof ehrConnections>;

export type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
export type NewAnalyticsEvent = InferInsertModel<typeof analyticsEvents>;

export type KpiDefinition = InferSelectModel<typeof kpiDefinitions>;
export type NewKpiDefinition = InferInsertModel<typeof kpiDefinitions>;

export type KpiSnapshot = InferSelectModel<typeof kpiSnapshots>;
export type NewKpiSnapshot = InferInsertModel<typeof kpiSnapshots>;

export type MlModelMetric = InferSelectModel<typeof mlModelMetrics>;
export type NewMlModelMetric = InferInsertModel<typeof mlModelMetrics>;

export type MlPrediction = InferSelectModel<typeof mlPredictions>;
export type NewMlPrediction = InferInsertModel<typeof mlPredictions>;

export type NotificationTemplate = InferSelectModel<typeof notificationTemplates>;
export type NewNotificationTemplate = InferInsertModel<typeof notificationTemplates>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type CommunicationLog = InferSelectModel<typeof communicationLogs>;
export type NewCommunicationLog = InferInsertModel<typeof communicationLogs>;

export type PaymentReconciliation = InferSelectModel<typeof paymentReconciliation>;
export type NewPaymentReconciliation = InferInsertModel<typeof paymentReconciliation>;

// ============================================================================
// APPEALS & DENIAL MANAGEMENT TABLES
// ============================================================================

// Appeals management
export const appeals = pgTable('appeal', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Appeal details
  appealNumber: varchar('appeal_number', { length: 50 }),
  appealLevel: appealLevelEnum('appeal_level').default('first_level').notNull(),
  appealType: varchar('appeal_type', { length: 50 }), // medical_necessity, authorization, coding, etc.

  // Dates
  appealDate: date('appeal_date').notNull(),
  dueDate: date('due_date'),
  responseDate: date('response_date'),

  // Status
  status: appealStatusEnum('status').default('pending').notNull(),

  // Financial
  appealedAmount: decimal('appealed_amount', { precision: 10, scale: 2 }).notNull(),
  recoveredAmount: decimal('recovered_amount', { precision: 10, scale: 2 }).default('0'),

  // Content
  appealReason: text('appeal_reason').notNull(),
  clinicalJustification: text('clinical_justification'),
  additionalDocumentation: text('additional_documentation'),

  // Processing
  submissionMethod: varchar('submission_method', { length: 20 }), // portal, mail, fax, phone
  confirmationNumber: varchar('confirmation_number', { length: 50 }),

  // Response
  payerResponse: text('payer_response'),
  responseReason: text('response_reason'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('appeal_org_idx').on(table.organizationId),
  claimIdx: index('appeal_claim_idx').on(table.claimId),
  patientIdx: index('appeal_patient_idx').on(table.patientId),
  payerIdx: index('appeal_payer_idx').on(table.payerId),
  statusIdx: index('appeal_status_idx').on(table.status),
  levelIdx: index('appeal_level_idx').on(table.appealLevel),
  appealDateIdx: index('appeal_appeal_date_idx').on(table.appealDate),
  dueDateIdx: index('appeal_due_date_idx').on(table.dueDate),
}));

// Prior Authorization Appeals
export const priorAuthAppeals = pgTable('prior_auth_appeal', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  priorAuthId: uuid('prior_auth_id').references(() => priorAuths.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Appeal details
  appealNumber: varchar('appeal_number', { length: 50 }),
  appealLevel: appealLevelEnum('appeal_level').default('first_level').notNull(),
  appealType: varchar('appeal_type', { length: 50 }), // medical_necessity, coverage, eligibility, etc.

  // Dates
  appealDate: date('appeal_date').notNull(),
  dueDate: date('due_date'),
  responseDate: date('response_date'),

  // Status
  status: appealStatusEnum('status').default('pending').notNull(),

  // Content
  appealReason: text('appeal_reason').notNull(),
  clinicalJustification: text('clinical_justification'),
  medicalNecessityRationale: text('medical_necessity_rationale'),
  additionalDocumentation: text('additional_documentation'),

  // Original denial details
  originalDenialReason: text('original_denial_reason'),
  originalDenialCode: varchar('original_denial_code', { length: 20 }),
  originalDenialDate: date('original_denial_date'),

  // Processing
  submissionMethod: varchar('submission_method', { length: 20 }), // portal, mail, fax, phone, api
  confirmationNumber: varchar('confirmation_number', { length: 50 }),

  // Response
  payerResponse: text('payer_response'),
  responseReason: text('response_reason'),
  finalDecision: varchar('final_decision', { length: 20 }), // approved, denied, partially_approved

  // Clinical attachments/evidence
  attachedDocuments: text('attached_documents'), // JSON array of document references
  letterOfMedicalNecessity: text('letter_of_medical_necessity'),

  // Escalation tracking
  escalatedToExternalReview: boolean('escalated_to_external_review').default(false),
  externalReviewOrganization: varchar('external_review_organization', { length: 100 }),
  externalReviewNumber: varchar('external_review_number', { length: 50 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('prior_auth_appeal_org_idx').on(table.organizationId),
  priorAuthIdx: index('prior_auth_appeal_prior_auth_idx').on(table.priorAuthId),
  patientIdx: index('prior_auth_appeal_patient_idx').on(table.patientId),
  payerIdx: index('prior_auth_appeal_payer_idx').on(table.payerId),
  providerIdx: index('prior_auth_appeal_provider_idx').on(table.providerId),
  statusIdx: index('prior_auth_appeal_status_idx').on(table.status),
  levelIdx: index('prior_auth_appeal_level_idx').on(table.appealLevel),
  appealDateIdx: index('prior_auth_appeal_appeal_date_idx').on(table.appealDate),
  dueDateIdx: index('prior_auth_appeal_due_date_idx').on(table.dueDate),
  originalDenialDateIdx: index('prior_auth_appeal_original_denial_date_idx').on(table.originalDenialDate),
  escalatedIdx: index('prior_auth_appeal_escalated_idx').on(table.escalatedToExternalReview),
}));

// Denial tracking
export const denialTracking = pgTable('denial_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),
  claimLineId: uuid('claim_line_id').references(() => claimLines.id),

  // Denial details
  denialDate: date('denial_date').notNull(),
  denialCode: varchar('denial_code', { length: 10 }).notNull(),
  denialReason: text('denial_reason').notNull(),
  denialCategory: denialCategoryEnum('denial_category').notNull(),

  // Financial impact
  deniedAmount: decimal('denied_amount', { precision: 10, scale: 2 }).notNull(),

  // Status
  status: denialStatusEnum('status').default('new').notNull(),

  // Analysis
  isAppealable: boolean('is_appealable').default(true),
  appealDeadline: date('appeal_deadline'),
  recommendedAction: varchar('recommended_action', { length: 50 }), // appeal, write_off, resubmit, etc.

  // Resolution
  resolutionDate: date('resolution_date'),
  resolutionMethod: varchar('resolution_method', { length: 50 }), // appeal, corrected_claim, write_off
  resolutionAmount: decimal('resolution_amount', { precision: 10, scale: 2 }),
  resolutionNotes: text('resolution_notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('denial_tracking_org_idx').on(table.organizationId),
  claimIdx: index('denial_tracking_claim_idx').on(table.claimId),
  claimLineIdx: index('denial_tracking_claim_line_idx').on(table.claimLineId),
  statusIdx: index('denial_tracking_status_idx').on(table.status),
  categoryIdx: index('denial_tracking_category_idx').on(table.denialCategory),
  denialDateIdx: index('denial_tracking_denial_date_idx').on(table.denialDate),
  appealDeadlineIdx: index('denial_tracking_appeal_deadline_idx').on(table.appealDeadline),
  isAppealableIdx: index('denial_tracking_is_appealable_idx').on(table.isAppealable),
}));

// Denial playbooks (automated responses to common denials)
export const denialPlaybooks = pgTable('denial_playbook', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Playbook identification
  name: text('name').notNull(),
  description: text('description'),

  // Trigger conditions
  denialCodes: text('denial_codes'), // JSON array of denial codes this applies to
  denialCategories: text('denial_categories'), // JSON array of categories
  payerIds: text('payer_ids'), // JSON array of payer IDs

  // Automated actions
  automaticActions: json('automatic_actions').$type<Record<string, any>>().default({}),

  // Appeal template
  appealTemplate: text('appeal_template'),
  requiredDocuments: text('required_documents'), // JSON array

  // Configuration
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(100),

  // Statistics
  timesUsed: integer('times_used').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 4 }), // 0.8500 = 85%
  averageRecovery: decimal('average_recovery', { precision: 10, scale: 2 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('denial_playbook_org_idx').on(table.organizationId),
  activeIdx: index('denial_playbook_active_idx').on(table.isActive),
  priorityIdx: index('denial_playbook_priority_idx').on(table.priority),
  nameIdx: index('denial_playbook_name_idx').on(table.name),
}));

export type Appeal = InferSelectModel<typeof appeals>;
export type NewAppeal = InferInsertModel<typeof appeals>;

export type DenialTracking = InferSelectModel<typeof denialTracking>;
export type NewDenialTracking = InferInsertModel<typeof denialTracking>;

export type DenialPlaybook = InferSelectModel<typeof denialPlaybooks>;
export type NewDenialPlaybook = InferInsertModel<typeof denialPlaybooks>;

// ============================================================================
// CLINICAL WORKFLOW TABLES
// ============================================================================

// Clinical encounters (episodes of care)
export const encounters = pgTable('encounter', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id),

  // Encounter details
  encounterNumber: varchar('encounter_number', { length: 50 }),
  encounterType: visitTypeEnum('encounter_type').notNull(),

  // Timing
  encounterDate: timestamp('encounter_date').notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // minutes

  // Status
  status: encounterStatusEnum('status').default('scheduled').notNull(),

  // Location
  locationName: text('location_name'),
  roomNumber: varchar('room_number', { length: 20 }),

  // Clinical
  chiefComplaint: text('chief_complaint'),
  presentIllness: text('present_illness'),
  clinicalNotes: text('clinical_notes'),
  assessment: text('assessment'),
  plan: text('plan'),

  // Coding
  primaryDiagnosis: varchar('primary_diagnosis', { length: 10 }),
  secondaryDiagnoses: text('secondary_diagnoses'), // JSON array
  procedureCodes: text('procedure_codes'), // JSON array

  // Billing
  isChargeable: boolean('is_chargeable').default(true),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('encounter_org_idx').on(table.organizationId),
  patientIdx: index('encounter_patient_idx').on(table.patientId),
  providerIdx: index('encounter_provider_idx').on(table.providerId),
  appointmentIdx: index('encounter_appointment_idx').on(table.appointmentId),
  statusIdx: index('encounter_status_idx').on(table.status),
  dateIdx: index('encounter_date_idx').on(table.encounterDate),
  encounterNumberIdx: index('encounter_encounter_number_idx').on(table.encounterNumber),
}));

// Clinical staff (healthcare workers)
export const clinicians = pgTable('clinician', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userProfileId: uuid('user_profile_id').references(() => userProfiles.id),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),

  // Identifiers
  employeeId: varchar('employee_id', { length: 50 }),
  npi: varchar('npi', { length: 10 }),
  licenseNumber: varchar('license_number', { length: 50 }),
  dosespotProviderId: integer('dosespot_provider_id'),
  dosespotConfirmed: boolean('dosespot_confirmed').default(false).notNull(),
  dosespotNotificationsCount: integer('dosespot_notifications_count').default(0).notNull(),
  dosespotIdpCompleted: boolean('dosespot_idp_completed').default(false).notNull(),

  // Profile
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  suffix: varchar('suffix', { length: 10 }),

  // Professional
  title: varchar('title', { length: 50 }), // RN, LPN, MA, etc.
  department: varchar('department', { length: 50 }),
  specialty: text('specialty'),
  credentials: text('credentials'), // JSON array of certifications

  // Contact
  email: text('email'),
  phone: varchar('phone', { length: 20 }),

  // Employment
  hireDate: date('hire_date'),
  terminationDate: date('termination_date'),
  employmentStatus: varchar('employment_status', { length: 20 }).default('active'), // active, inactive, terminated

  // Access
  canAccessPhi: boolean('can_access_phi').default(false),
  accessLevel: accessLevelEnum('access_level').default('read'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('clinician_org_idx').on(table.organizationId),
  employeeIdIdx: index('clinician_employee_id_idx').on(table.organizationId, table.employeeId),
  npiIdx: index('clinician_npi_idx').on(table.npi),
  nameIdx: index('clinician_name_idx').on(table.lastName, table.firstName),
  activeIdx: index('clinician_active_idx').on(table.isActive),
  departmentIdx: index('clinician_department_idx').on(table.department),
}));

// Patient medical history
export const medicalHistory = pgTable('medical_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Condition details
  conditionName: text('condition_name').notNull(),
  icd10Code: varchar('icd10_code', { length: 10 }),
  snomedCode: varchar('snomed_code', { length: 20 }),

  // Timing
  onsetDate: date('onset_date'),
  diagnosisDate: date('diagnosis_date'),
  resolvedDate: date('resolved_date'),

  // Status
  isActive: boolean('is_active').default(true),
  severity: varchar('severity', { length: 20 }), // mild, moderate, severe, critical

  // Clinical details
  symptoms: text('symptoms'),
  treatment: text('treatment'),
  notes: text('notes'),

  // Source
  diagnosedBy: uuid('diagnosed_by').references(() => providers.id),
  source: varchar('source', { length: 50 }), // patient_reported, clinical_diagnosis, lab_result, etc.

  // Family history flag
  isFamilyHistory: boolean('is_family_history').default(false),
  relationToPatient: varchar('relation_to_patient', { length: 50 }), // for family history

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('medical_history_org_idx').on(table.organizationId),
  patientIdx: index('medical_history_patient_idx').on(table.patientId),
  activeIdx: index('medical_history_active_idx').on(table.isActive),
  conditionIdx: index('medical_history_condition_idx').on(table.conditionName),
  icd10Idx: index('medical_history_icd10_idx').on(table.icd10Code),
  onsetDateIdx: index('medical_history_onset_date_idx').on(table.onsetDate),
  diagnosedByIdx: index('medical_history_diagnosed_by_idx').on(table.diagnosedBy),
}));

export const prescription = pgTable('prescription', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  clinicianId: integer('clinician_id').notNull().references(() => clinicians.id),
  dosespotPrescriptionId: integer('dosespot_prescription_id'),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  medicationStrength: varchar('medication_strength', { length: 100 }),
  dosageForm: varchar('dosage_form', { length: 100 }),
  ndcCode: varchar('ndc_code', { length: 11 }),
  dispensableDrugId: integer('dispensable_drug_id'),
  quantity: decimal('quantity', { precision: 10, scale: 2 }),
  daysSupply: integer('days_supply'),
  refillsRemaining: integer('refills_remaining').default(0),
  totalRefills: integer('total_refills').default(0),
  directions: text('directions'),
  prescriberNotes: text('prescriber_notes'),
  pharmacyNotes: text('pharmacy_notes'),
  status: varchar('status', { length: 50 }).default('draft'),
  noSubstitutions: boolean('no_substitutions').default(false),
  deaSchedule: varchar('dea_schedule', { length: 5 }),
  prescribedDate: timestamp('prescribed_date').defaultNow(),
  lastFilledDate: timestamp('last_filled_date'),
  expirationDate: timestamp('expiration_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  dosespotPrescriptionIdUnique:
    uniqueIndex('prescription_dosespot_prescription_id_unique').on(table.dosespotPrescriptionId),
  patientIdIdx: index('idx_prescription_patient_id').on(table.patientId),
  clinicianIdIdx: index('idx_prescription_clinician_id').on(table.clinicianId),
  dosespotIdIdx: index('idx_prescription_dosespot_id').on(table.dosespotPrescriptionId),
  statusIdx: index('idx_prescription_status').on(table.status),
  prescribedDateIdx: index('idx_prescription_prescribed_date').on(table.prescribedDate),
  quantityPositiveCheck: check('chk_prescription_quantity_positive', sql`quantity > 0`),
  daysSupplyPositiveCheck: check('chk_prescription_days_supply_positive', sql`days_supply > 0`),
  refillsValidCheck: check('chk_prescription_refills_valid', sql`refills_remaining >= 0 AND total_refills >= 0 AND
  refills_remaining <= total_refills`),
}));

// Pharmacy network information
export const pharmacyNetwork = pgTable('pharmacy_network', {
  id: serial('id').primaryKey(),
  dosespotPharmacyId: integer('dosespot_pharmacy_id').notNull(),
  pharmacyName: varchar('pharmacy_name', { length: 255 }).notNull(),
  npi: varchar('npi', { length: 10 }),
  ncpdpId: varchar('ncpdp_id', { length: 7 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zip: varchar('zip', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  fax: varchar('fax', { length: 20 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').default(true),
  acceptsControlled: boolean('accepts_controlled').default(false),
  acceptsSpecialty: boolean('accepts_specialty').default(false),
  acceptsCompounds: boolean('accepts_compounds').default(false),
  ePrescribingEnabled: boolean('e_prescribing_enabled').default(true),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dosespotPharmacyIdUnique: uniqueIndex('pharmacy_network_dosespot_pharmacy_id_unique').on(table.dosespotPharmacyId),
  dosespotIdIdx: index('idx_pharmacy_network_dosespot_id').on(table.dosespotPharmacyId),
  activeIdx: index('idx_pharmacy_network_active').on(table.isActive),
  locationIdx: index('idx_pharmacy_network_location').on(table.city, table.state, table.zip),
  capabilitiesIdx: index('idx_pharmacy_network_capabilities').on(table.acceptsControlled, table.acceptsSpecialty),
}));

// Patient preferred pharmacies
export const patientPharmacy = pgTable('patient_pharmacy', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  dosespotPharmacyId: integer('dosespot_pharmacy_id').notNull(),
  pharmacyName: varchar('pharmacy_name', { length: 255 }),
  pharmacyAddress: text('pharmacy_address'),
  pharmacyPhone: varchar('pharmacy_phone', { length: 20 }),
  pharmacyFax: varchar('pharmacy_fax', { length: 20 }),
  isPreferred: boolean('is_preferred').default(false),
  isActive: boolean('is_active').default(true),
  medicationType: varchar('medication_type', { length: 50 }).default('general'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by').references(() => clinicians.id),
}, (table) => ({
  uniquePreferredPharmacy: uniqueIndex('unique_preferred_pharmacy').on(table.patientId, table.medicationType),
  patientIdIdx: index('idx_patient_pharmacy_patient_id').on(table.patientId),
  dosespotIdIdx: index('idx_patient_pharmacy_dosespot_id').on(table.dosespotPharmacyId),
  preferredIdx: index('idx_patient_pharmacy_preferred').on(table.patientId, table.isPreferred).where(sql`is_preferred =
  true`),
  activeIdx: index('idx_patient_pharmacy_active').on(table.patientId, table.isActive).where(sql`is_active = true`),
  dosespotPharmacyIdFk: foreignKey({
    columns: [table.dosespotPharmacyId],
    foreignColumns: [pharmacyNetwork.dosespotPharmacyId],
  }),
}));

// Prescription routing and pharmacy history
export const prescriptionPharmacyHistory = pgTable('prescription_pharmacy_history', {
  id: serial('id').primaryKey(),
  prescriptionId: integer('prescription_id').notNull().references(() => prescription.id),
  dosespotPharmacyId: integer('dosespot_pharmacy_id').notNull(),
  pharmacyName: varchar('pharmacy_name', { length: 255 }),
  routedAt: timestamp('routed_at').defaultNow(),
  routedBy: integer('routed_by').references(() => clinicians.id),
  status: varchar('status', { length: 50 }).notNull(),
  statusDate: timestamp('status_date').defaultNow(),
  fillDate: timestamp('fill_date'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  prescriptionIdIdx: index('idx_prescription_history_prescription_id').on(table.prescriptionId),
  pharmacyIdIdx: index('idx_prescription_history_pharmacy_id').on(table.dosespotPharmacyId),
  statusIdx: index('idx_prescription_history_status').on(table.status),
  routedAtIdx: index('idx_prescription_history_routed_at').on(table.routedAt),
}));

// Prescription refill history
export const prescriptionRefillHistory = pgTable('prescription_refill_history', {
  id: serial('id').primaryKey(),
  prescriptionId: integer('prescription_id').notNull().references(() => prescription.id),
  refillNumber: integer('refill_number').notNull(),
  dosespotPharmacyId: integer('dosespot_pharmacy_id').notNull(),
  quantityDispensed: decimal('quantity_dispensed', { precision: 10, scale: 2 }),
  daysSupply: integer('days_supply'),
  fillDate: timestamp('fill_date').notNull(),
  prescriberAuthorization: boolean('prescriber_authorization').default(false),
  authorizedBy: integer('authorized_by').references(() => clinicians.id),
  authorizedAt: timestamp('authorized_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  prescriptionIdIdx: index('idx_refill_history_prescription_id').on(table.prescriptionId),
  fillDateIdx: index('idx_refill_history_fill_date').on(table.fillDate),
  quantityPositiveCheck: check('chk_refill_quantity_positive', sql`quantity_dispensed > 0`),
  daysSupplyPositiveCheck: check('chk_refill_days_supply_positive', sql`days_supply > 0`),
}));

// Medication formulary cache
export const medicationFormulary = pgTable('medication_formulary', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  medicationNdc: varchar('medication_ndc', { length: 11 }).notNull(),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  insurancePlan: varchar('insurance_plan', { length: 255 }),
  tierLevel: integer('tier_level'),
  copayAmount: decimal('copay_amount', { precision: 10, scale: 2 }),
  requiresPriorAuth: boolean('requires_prior_auth').default(false),
  isCovered: boolean('is_covered').default(true),
  alternativeMedications: text('alternative_medications').array(),
  lastChecked: timestamp('last_checked').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  patientMedicationIdx: index('idx_formulary_patient_medication').on(table.patientId, table.medicationNdc),
  expiresIdx: index('idx_formulary_expires').on(table.expiresAt),
}));

// Prescription requests
export const prescriptionRequest = pgTable('prescription_request', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  clinicianId: integer('clinician_id').notNull().references(() => clinicians.id),
  encounterId: integer('encounter_id'),
  diagnosisCodes: varchar('diagnosis_codes', { length: 50 }).array(),
  indication: text('indication'),
  clinicalNotes: text('clinical_notes'),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  medicationStrength: varchar('medication_strength', { length: 100 }),
  dosageForm: varchar('dosage_form', { length: 100 }),
  ndcCode: varchar('ndc_code', { length: 11 }),
  dispensableDrugId: integer('dispensable_drug_id'),
  quantity: decimal('quantity', { precision: 10, scale: 2 }),
  daysSupply: integer('days_supply'),
  refills: integer('refills').default(0),
  directions: text('directions').notNull(),
  prescriberNotes: text('prescriber_notes'),
  noSubstitutions: boolean('no_substitutions').default(false),
  requiresPriorAuth: boolean('requires_prior_auth').default(false),
  priorAuthStatus: varchar('prior_auth_status', { length: 50 }),
  priorAuthId: integer('prior_auth_id').references(() => priorAuths.id),
  status: varchar('status', { length: 50 }).default('requested'),
  priority: varchar('priority', { length: 20 }).default('routine'),
  requestedBy: integer('requested_by').references(() => clinicians.id),
  reviewedBy: integer('reviewed_by').references(() => clinicians.id),
  approvedBy: integer('approved_by').references(() => clinicians.id),
  preferredPharmacyId: integer('preferred_pharmacy_id'),
  pharmacyNotes: text('pharmacy_notes'),
  requestedAt: timestamp('requested_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  approvedAt: timestamp('approved_at'),
  prescribedAt: timestamp('prescribed_at'),
  prescriptionId: integer('prescription_id').references(() => prescription.id),
  dosespotPrescriptionId: integer('dosespot_prescription_id'),
  billingCode: varchar('billing_code', { length: 20 }),
  chargeAmount: decimal('charge_amount', { precision: 10, scale: 2 }),
  isBillable: boolean('is_billable').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by').references(() => clinicians.id),
}, (table) => ({
  patientIdIdx: index('idx_prescription_request_patient_id').on(table.patientId),
  clinicianIdIdx: index('idx_prescription_request_clinician_id').on(table.clinicianId),
  encounterIdIdx: index('idx_prescription_request_encounter_id').on(table.encounterId),
  statusIdx: index('idx_prescription_request_status').on(table.status),
  priorityIdx: index('idx_prescription_request_priority').on(table.priority),
  requestedAtIdx: index('idx_prescription_request_requested_at').on(table.requestedAt),
  priorAuthIdx: index('idx_prescription_request_prior_auth').on(table.requiresPriorAuth, table.priorAuthStatus),
  prescriptionIdIdx: index('idx_prescription_request_prescription_id').on(table.prescriptionId),
  preferredPharmacyIdFk: foreignKey({
    columns: [table.preferredPharmacyId],
    foreignColumns: [pharmacyNetwork.dosespotPharmacyId],
  }),
}));

// Prescription request workflow history
export const prescriptionRequestHistory = pgTable('prescription_request_history', {
  id: serial('id').primaryKey(),
  prescriptionRequestId: integer('prescription_request_id').notNull().references(() => prescriptionRequest.id),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }),
  changedBy: integer('changed_by').references(() => clinicians.id),
  reason: text('reason'),
  notes: text('notes'),
  changedAt: timestamp('changed_at').defaultNow(),
}, (table) => ({
  requestIdIdx: index('idx_prescription_request_history_request_id').on(table.prescriptionRequestId),
  changedAtIdx: index('idx_prescription_request_history_changed_at').on(table.changedAt),
}));

// Patient diagnoses (encounter-specific)
export const patientDiagnoses = pgTable('patient_diagnosis', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  encounterId: uuid('encounter_id').references(() => encounters.id),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Diagnosis details
  diagnosisCode: varchar('diagnosis_code', { length: 10 }).notNull(), // ICD-10
  diagnosisDescription: text('diagnosis_description').notNull(),
  codeSystem: varchar('code_system', { length: 20 }).default('ICD10'), // ICD10, ICD9, SNOMED

  // Classification
  diagnosisType: varchar('diagnosis_type', { length: 20 }).notNull(), // primary, secondary, admitting, discharge
  isPrimary: boolean('is_primary').default(false),

  // Timing
  diagnosisDate: date('diagnosis_date').notNull(),
  onsetDate: date('onset_date'),

  // Clinical context
  severity: varchar('severity', { length: 20 }), // mild, moderate, severe
  status: varchar('status', { length: 20 }).default('active'), // active, resolved, chronic, rule_out

  // Present on admission (for hospital encounters)
  presentOnAdmission: boolean('present_on_admission'),

  // Clinical notes
  clinicalNotes: text('clinical_notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('patient_diagnosis_org_idx').on(table.organizationId),
  patientIdx: index('patient_diagnosis_patient_idx').on(table.patientId),
  encounterIdx: index('patient_diagnosis_encounter_idx').on(table.encounterId),
  providerIdx: index('patient_diagnosis_provider_idx').on(table.providerId),
  diagnosisCodeIdx: index('patient_diagnosis_diagnosis_code_idx').on(table.diagnosisCode),
  isPrimaryIdx: index('patient_diagnosis_is_primary_idx').on(table.isPrimary),
  diagnosisDateIdx: index('patient_diagnosis_diagnosis_date_idx').on(table.diagnosisDate),
  statusIdx: index('patient_diagnosis_status_idx').on(table.status),
}));

export type Encounter = InferSelectModel<typeof encounters>;
export type NewEncounter = InferInsertModel<typeof encounters>;

export type Clinician = InferSelectModel<typeof clinicians>;
export type NewClinician = InferInsertModel<typeof clinicians>;

export type MedicalHistory = InferSelectModel<typeof medicalHistory>;
export type NewMedicalHistory = InferInsertModel<typeof medicalHistory>;

export type PatientDiagnosis = InferSelectModel<typeof patientDiagnoses>;
export type NewPatientDiagnosis = InferInsertModel<typeof patientDiagnoses>;

export type BatchJob = InferSelectModel<typeof batchJobs>;
export type NewBatchJob = InferInsertModel<typeof batchJobs>;

export type BatchJobItem = InferSelectModel<typeof batchJobItems>;
export type NewBatchJobItem = InferInsertModel<typeof batchJobItems>;

export type SuggestedFix = InferSelectModel<typeof suggestedFixes>;
export type NewSuggestedFix = InferInsertModel<typeof suggestedFixes>;

export type FieldConfidence = InferSelectModel<typeof fieldConfidence>;
export type NewFieldConfidence = InferInsertModel<typeof fieldConfidence>;

export type ScrubbingResult = InferSelectModel<typeof scrubbingResults>;
export type NewScrubbingResult = InferInsertModel<typeof scrubbingResults>;

// ============================================================================
// AUTOMATION RULES TABLES
// ============================================================================

// Automation rules (automated business logic and workflows)
export const automationRules = pgTable('automation_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Rule identification
  name: text('name').notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // data_validation, claim_processing, denial_management, eligibility, prior_auth
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // trigger, scheduled, continuous, manual

  // Trigger conditions
  triggerEvents: text('trigger_events'), // JSON array of events that trigger this rule
  conditions: json('conditions').$type<Record<string, any>>().notNull(), // Complex rule conditions

  // Processing
  actions: json('actions').$type<Record<string, any>>().notNull(), // Actions to take when rule fires
  actionOrder: integer('action_order').default(1), // Order of execution for multiple actions

  // Configuration
  priority: integer('priority').default(100), // 1-1000 scale for execution order
  retryCount: integer('retry_count').default(0), // How many times to retry on failure
  maxRetries: integer('max_retries').default(3),
  timeoutSeconds: integer('timeout_seconds').default(30),

  // Scope and targeting
  entityTypes: text('entity_types'), // JSON array of entity types this rule applies to
  payerIds: text('payer_ids'), // JSON array of specific payers this rule applies to
  providerIds: text('provider_ids'), // JSON array of specific providers this rule applies to

  // Status and control
  status: automationStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastExecuted: timestamp('last_executed'),

  // Performance tracking
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  averageExecutionTime: integer('average_execution_time'), // milliseconds

  // Rate limiting
  rateLimitPerHour: integer('rate_limit_per_hour'), // Max executions per hour
  rateLimitPerDay: integer('rate_limit_per_day'), // Max executions per day

  // Testing and validation
  testMode: boolean('test_mode').default(false), // Run in test mode (don't apply actions)
  validationRules: json('validation_rules'), // Rules to validate input data

  // Scheduling (for scheduled rules)
  scheduleCron: varchar('schedule_cron', { length: 100 }), // Cron expression for scheduled execution
  scheduleTimezone: varchar('schedule_timezone', { length: 50 }).default('UTC'),
  nextExecution: timestamp('next_execution'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('automation_rule_org_idx').on(table.organizationId),
  statusIdx: index('automation_rule_status_idx').on(table.status),
  categoryIdx: index('automation_rule_category_idx').on(table.category),
  ruleTypeIdx: index('automation_rule_rule_type_idx').on(table.ruleType),
  activeIdx: index('automation_rule_active_idx').on(table.isActive),
  priorityIdx: index('automation_rule_priority_idx').on(table.priority),
  lastExecutedIdx: index('automation_rule_last_executed_idx').on(table.lastExecuted),
  nextExecutionIdx: index('automation_rule_next_execution_idx').on(table.nextExecution),
  testModeIdx: index('automation_rule_test_mode_idx').on(table.testMode),
}));

// Business rule action executions (track when automation rules fire)
export const businessRuleActions: PgTableWithColumns<{
  name: 'business_rule_action';
  schema: undefined;
  columns: any;
  dialect: 'pg';
}> = pgTable('business_rule_action', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  automationRuleId: uuid('automation_rule_id').references(() => automationRules.id).notNull(),
  businessRuleId: uuid('business_rule_id').references(() => businessRules.id), // Link to existing business rules

  // Execution context
  entityType: varchar('entity_type', { length: 50 }).notNull(), // claim, patient, prior_auth, etc.
  entityId: uuid('entity_id').notNull(),

  // Trigger information
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
  triggerData: json('trigger_data'), // Data that caused the rule to fire
  triggerTimestamp: timestamp('trigger_timestamp').defaultNow().notNull(),

  // Execution details
  executionStatus: varchar('execution_status', { length: 20 }).notNull(), // pending, running, completed, failed, skipped
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  executionTimeMs: integer('execution_time_ms'),

  // Conditions evaluation
  conditionsEvaluated: json('conditions_evaluated'), // Results of condition evaluation
  conditionsMet: boolean('conditions_met').default(false),
  conditionsFailureReason: text('conditions_failure_reason'),

  // Actions performed
  actionsPerformed: json('actions_performed').$type<Record<string, any>>(), // Details of actions taken
  actionResults: json('action_results').$type<Record<string, any>>(), // Results of each action

  // Outcome
  result: varchar('result', { length: 20 }).notNull(), // success, failure, warning, no_action
  resultMessage: text('result_message'),
  errorMessage: text('error_message'),

  // Impact tracking
  impactDescription: text('impact_description'), // What changed as a result
  affectedRecords: text('affected_records'), // JSON array of record IDs that were modified

  // Retry information
  retryCount: integer('retry_count').default(0),
  isRetry: boolean('is_retry').default(false),
  originalExecutionId: uuid('original_execution_id').references(() => businessRuleActions.id),

  // Context for debugging
  inputData: json('input_data'), // Snapshot of relevant data at execution time
  environment: varchar('environment', { length: 20 }), // production, staging, test

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  executedBy: varchar('executed_by', { length: 20 }).default('system'), // system, user, batch_job
}, (table) => ({
  orgIdx: index('business_rule_action_org_idx').on(table.organizationId),
  automationRuleIdx: index('business_rule_action_automation_rule_idx').on(table.automationRuleId),
  businessRuleIdx: index('business_rule_action_business_rule_idx').on(table.businessRuleId),
  entityIdx: index('business_rule_action_entity_idx').on(table.entityType, table.entityId),
  statusIdx: index('business_rule_action_status_idx').on(table.executionStatus),
  resultIdx: index('business_rule_action_result_idx').on(table.result),
  triggerEventIdx: index('business_rule_action_trigger_event_idx').on(table.triggerEvent),
  triggerTimestampIdx: index('business_rule_action_trigger_timestamp_idx').on(table.triggerTimestamp),
  conditionsMetIdx: index('business_rule_action_conditions_met_idx').on(table.conditionsMet),
  isRetryIdx: index('business_rule_action_is_retry_idx').on(table.isRetry),
  environmentIdx: index('business_rule_action_environment_idx').on(table.environment),
  createdAtIdx: index('business_rule_action_created_at_idx').on(table.createdAt),
}));

export type AutomationRule = InferSelectModel<typeof automationRules>;
export type NewAutomationRule = InferInsertModel<typeof automationRules>;

export type BusinessRuleAction = InferSelectModel<typeof businessRuleActions>;
export type NewBusinessRuleAction = InferInsertModel<typeof businessRuleActions>;

// ============================================================================
// CONTRACT MANAGEMENT & FINANCIAL TABLES
// ============================================================================

// Payer contracts and fee schedules
export const payerContracts = pgTable('payer_contract', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Contract details
  contractNumber: varchar('contract_number', { length: 50 }),
  contractName: text('contract_name').notNull(),
  contractType: varchar('contract_type', { length: 50 }), // fee_for_service, capitation, value_based

  // Financial terms
  defaultReimbursementRate: decimal('default_reimbursement_rate', { precision: 5, scale: 4 }), // 0.8500 = 85%

  // Dates
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),
  terminationDate: date('termination_date'),

  // Status
  status: contractStatusEnum('status').default('active').notNull(),

  // Terms and conditions
  terms: text('terms'),
  billingRequirements: json('billing_requirements'), // JSON object with special billing rules
  authorizationRequired: boolean('authorization_required').default(false),

  // Performance metrics
  averagePaymentDays: integer('average_payment_days'),
  denialRate: decimal('denial_rate', { precision: 5, scale: 4 }), // 0.0250 = 2.5%

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('payer_contract_org_idx').on(table.organizationId),
  payerIdx: index('payer_contract_payer_idx').on(table.payerId),
  statusIdx: index('payer_contract_status_idx').on(table.status),
  effectiveDateIdx: index('payer_contract_effective_date_idx').on(table.effectiveDate),
  expirationDateIdx: index('payer_contract_expiration_date_idx').on(table.expirationDate),
  contractNumberIdx: index('payer_contract_contract_number_idx').on(table.contractNumber),
}));

// Contracted rates for specific procedures
export const contractedRates = pgTable('contracted_rate', {
  id: uuid('id').primaryKey().defaultRandom(),
  payerContractId: uuid('payer_contract_id').references(() => payerContracts.id).notNull(),

  // Procedure details
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  modifier: varchar('modifier', { length: 5 }),
  description: text('description'),

  // Rate details
  contractedAmount: decimal('contracted_amount', { precision: 10, scale: 2 }).notNull(),
  reimbursementRate: decimal('reimbursement_rate', { precision: 5, scale: 4 }), // Percentage of charges

  // Unit information
  unitType: varchar('unit_type', { length: 20 }).default('per_service'), // per_service, per_unit, per_day
  maxUnits: integer('max_units'), // Maximum billable units

  // Date range
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),

  // Special conditions
  requiresPriorAuth: boolean('requires_prior_auth').default(false),
  specialConditions: text('special_conditions'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  contractIdx: index('contracted_rate_contract_idx').on(table.payerContractId),
  cptIdx: index('contracted_rate_cpt_idx').on(table.cptCode),
  effectiveDateIdx: index('contracted_rate_effective_date_idx').on(table.effectiveDate),
  cptContractIdx: index('contracted_rate_cpt_contract_idx').on(table.cptCode, table.payerContractId),
}));

// Master fee schedules
export const feeSchedules: PgTableWithColumns<{
  name: 'fee_schedule';
  schema: undefined;
  columns: any;
  dialect: 'pg';
}> = pgTable('fee_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Schedule details
  name: text('name').notNull(),
  description: text('description'),
  scheduleType: varchar('schedule_type', { length: 50 }).notNull(), // standard, medicare, medicaid, private

  // Date range
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false),

  // Version control
  version: varchar('version', { length: 20 }).default('1.0'),
  baseScheduleId: uuid('base_schedule_id').references(() => feeSchedules.id), // For versioning

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('fee_schedule_org_idx').on(table.organizationId),
  nameIdx: index('fee_schedule_name_idx').on(table.name),
  activeIdx: index('fee_schedule_active_idx').on(table.isActive),
  defaultIdx: index('fee_schedule_default_idx').on(table.isDefault),
  effectiveDateIdx: index('fee_schedule_effective_date_idx').on(table.effectiveDate),
}));

// Fee schedule items (individual procedure fees)
export const feeScheduleItems = pgTable('fee_schedule_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  feeScheduleId: uuid('fee_schedule_id').references(() => feeSchedules.id).notNull(),

  // Procedure details
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  modifier: varchar('modifier', { length: 5 }),
  description: text('description'),

  // Fee information
  standardFee: decimal('standard_fee', { precision: 10, scale: 2 }).notNull(),
  facilityFee: decimal('facility_fee', { precision: 10, scale: 2 }),

  // RVU information (for Medicare)
  workRvu: decimal('work_rvu', { precision: 8, scale: 4 }),
  practiceExpenseRvu: decimal('practice_expense_rvu', { precision: 8, scale: 4 }),
  malpracticeRvu: decimal('malpractice_rvu', { precision: 8, scale: 4 }),
  totalRvu: decimal('total_rvu', { precision: 8, scale: 4 }),

  // Billing information
  billableUnits: integer('billable_units').default(1),
  globalPeriod: integer('global_period'), // Days

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  scheduleIdx: index('fee_schedule_item_schedule_idx').on(table.feeScheduleId),
  cptIdx: index('fee_schedule_item_cpt_idx').on(table.cptCode),
  scheduleCptIdx: index('fee_schedule_item_schedule_cpt_idx').on(table.feeScheduleId, table.cptCode),
}));

// Patient statements
export const patientStatements = pgTable('patient_statement', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Statement details
  statementNumber: varchar('statement_number', { length: 50 }).notNull(),
  statementDate: date('statement_date').notNull(),
  dueDate: date('due_date').notNull(),

  // Financial summary
  previousBalance: decimal('previous_balance', { precision: 10, scale: 2 }).default('0'),
  newCharges: decimal('new_charges', { precision: 10, scale: 2 }).default('0'),
  payments: decimal('payments', { precision: 10, scale: 2 }).default('0'),
  adjustments: decimal('adjustments', { precision: 10, scale: 2 }).default('0'),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).notNull(),

  // Aging buckets
  current: decimal('current', { precision: 10, scale: 2 }).default('0'),
  days30: decimal('days_30', { precision: 10, scale: 2 }).default('0'),
  days60: decimal('days_60', { precision: 10, scale: 2 }).default('0'),
  days90: decimal('days_90', { precision: 10, scale: 2 }).default('0'),
  days120Plus: decimal('days_120_plus', { precision: 10, scale: 2 }).default('0'),

  // Status and delivery
  status: statementStatusEnum('status').default('draft').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 20 }), // mail, email, portal, print
  sentDate: timestamp('sent_date'),

  // Payment information
  minimumPayment: decimal('minimum_payment', { precision: 10, scale: 2 }),
  paymentOptions: text('payment_options'), // JSON array of available payment methods

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('patient_statement_org_idx').on(table.organizationId),
  patientIdx: index('patient_statement_patient_idx').on(table.patientId),
  statusIdx: index('patient_statement_status_idx').on(table.status),
  statementDateIdx: index('patient_statement_statement_date_idx').on(table.statementDate),
  dueDateIdx: index('patient_statement_due_date_idx').on(table.dueDate),
  statementNumberIdx: index('patient_statement_statement_number_idx').on(table.statementNumber),
}));

// Collections management
export const collections = pgTable('collection', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id),

  // Collections details
  accountNumber: varchar('account_number', { length: 50 }),
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).notNull(),

  // Status tracking
  status: collectionStatusEnum('status').default('current').notNull(),
  daysOutstanding: integer('days_outstanding').notNull(),

  // Collection efforts
  lastContactDate: date('last_contact_date'),
  nextContactDate: date('next_contact_date'),
  contactAttempts: integer('contact_attempts').default(0),

  // Assignment
  assignedCollector: uuid('assigned_collector').references(() => teamMembers.id),
  assignedDate: timestamp('assigned_date'),

  // External collections
  isExternalCollection: boolean('is_external_collection').default(false),
  externalAgency: text('external_agency'),
  externalAccountNumber: varchar('external_account_number', { length: 50 }),
  placementDate: date('placement_date'),

  // Resolution
  resolutionDate: date('resolution_date'),
  resolutionMethod: varchar('resolution_method', { length: 50 }), // paid_in_full, payment_plan, write_off, bankruptcy
  resolutionAmount: decimal('resolution_amount', { precision: 10, scale: 2 }),

  // Notes and history
  notes: text('notes'),
  collectionHistory: json('collection_history'), // JSON array of collection activities

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('collection_org_idx').on(table.organizationId),
  patientIdx: index('collection_patient_idx').on(table.patientId),
  statusIdx: index('collection_status_idx').on(table.status),
  daysOutstandingIdx: index('collection_days_outstanding_idx').on(table.daysOutstanding),
  assignedCollectorIdx: index('collection_assigned_collector_idx').on(table.assignedCollector),
  nextContactDateIdx: index('collection_next_contact_date_idx').on(table.nextContactDate),
  accountNumberIdx: index('collection_account_number_idx').on(table.accountNumber),
}));

// Charge capture
export const chargeCapture: PgTableWithColumns<{
  name: 'charge_capture';
  schema: undefined;
  columns: any;
  dialect: 'pg';
}> = pgTable('charge_capture', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  encounterId: uuid('encounter_id').references(() => encounters.id),

  // Charge details
  chargeNumber: varchar('charge_number', { length: 50 }),
  serviceDate: date('service_date').notNull(),
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  modifier1: varchar('modifier_1', { length: 2 }),
  modifier2: varchar('modifier_2', { length: 2 }),

  // Financial
  units: integer('units').default(1).notNull(),
  chargeAmount: decimal('charge_amount', { precision: 10, scale: 2 }).notNull(),
  contractedAmount: decimal('contracted_amount', { precision: 10, scale: 2 }),

  // Diagnosis linking
  primaryDiagnosis: varchar('primary_diagnosis', { length: 10 }),
  diagnosisPointer: varchar('diagnosis_pointer', { length: 4 }), // Links to diagnosis on claim

  // Status
  status: chargeStatusEnum('status').default('pending').notNull(),
  postedDate: timestamp('posted_date'),
  billedDate: timestamp('billed_date'),

  // Processing
  isLateCharge: boolean('is_late_charge').default(false),
  originalChargeId: uuid('original_charge_id').references(() => chargeCapture.id),
  reasonCode: varchar('reason_code', { length: 10 }),

  // Validation
  isValidated: boolean('is_validated').default(false),
  validatedBy: uuid('validated_by').references(() => teamMembers.id),
  validatedAt: timestamp('validated_at'),
  validationNotes: text('validation_notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('charge_capture_org_idx').on(table.organizationId),
  patientIdx: index('charge_capture_patient_idx').on(table.patientId),
  providerIdx: index('charge_capture_provider_idx').on(table.providerId),
  encounterIdx: index('charge_capture_encounter_idx').on(table.encounterId),
  statusIdx: index('charge_capture_status_idx').on(table.status),
  serviceDateIdx: index('charge_capture_service_date_idx').on(table.serviceDate),
  cptCodeIdx: index('charge_capture_cpt_code_idx').on(table.cptCode),
  chargeNumberIdx: index('charge_capture_charge_number_idx').on(table.chargeNumber),
  validatedIdx: index('charge_capture_validated_idx').on(table.isValidated),
}));

// Write-offs and adjustments
export const writeOffs = pgTable('write_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id),
  claimLineId: uuid('claim_line_id').references(() => claimLines.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  chargeId: uuid('charge_id').references(() => chargeCapture.id),

  // Write-off details
  writeOffType: adjustmentTypeEnum('write_off_type').notNull(),
  writeOffAmount: decimal('write_off_amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  reasonCode: varchar('reason_code', { length: 10 }),

  // Categories
  category: varchar('category', { length: 50 }), // bad_debt, charity_care, contractual, small_balance
  isContractual: boolean('is_contractual').default(false),
  isBadDebt: boolean('is_bad_debt').default(false),

  // Approval workflow
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: uuid('approved_by').references(() => teamMembers.id),
  approvedAt: timestamp('approved_at'),
  approvalReason: text('approval_reason'),

  // Processing
  postedDate: date('posted_date').notNull(),
  reversalDate: date('reversal_date'),
  isReversed: boolean('is_reversed').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('write_off_org_idx').on(table.organizationId),
  claimIdx: index('write_off_claim_idx').on(table.claimId),
  patientIdx: index('write_off_patient_idx').on(table.patientId),
  typeIdx: index('write_off_type_idx').on(table.writeOffType),
  categoryIdx: index('write_off_category_idx').on(table.category),
  postedDateIdx: index('write_off_posted_date_idx').on(table.postedDate),
  approvedByIdx: index('write_off_approved_by_idx').on(table.approvedBy),
  isReversedIdx: index('write_off_is_reversed_idx').on(table.isReversed),
}));

export type PayerContract = InferSelectModel<typeof payerContracts>;
export type NewPayerContract = InferInsertModel<typeof payerContracts>;

export type ContractedRate = InferSelectModel<typeof contractedRates>;
export type NewContractedRate = InferInsertModel<typeof contractedRates>;

export type FeeSchedule = InferSelectModel<typeof feeSchedules>;
export type NewFeeSchedule = InferInsertModel<typeof feeSchedules>;

export type FeeScheduleItem = InferSelectModel<typeof feeScheduleItems>;
export type NewFeeScheduleItem = InferInsertModel<typeof feeScheduleItems>;

export type PatientStatement = InferSelectModel<typeof patientStatements>;
export type NewPatientStatement = InferInsertModel<typeof patientStatements>;

export type Collection = InferSelectModel<typeof collections>;
export type NewCollection = InferInsertModel<typeof collections>;

export type ChargeCapture = InferSelectModel<typeof chargeCapture>;
export type NewChargeCapture = InferInsertModel<typeof chargeCapture>;

export type WriteOff = InferSelectModel<typeof writeOffs>;
export type NewWriteOff = InferInsertModel<typeof writeOffs>;

// ============================================================================
// MEDICATION MANAGEMENT TABLES
// ============================================================================

// Patient medications and prescriptions
export const medications = pgTable('medication', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  encounterId: uuid('encounter_id').references(() => encounters.id),

  // Medication identification
  medicationName: text('medication_name').notNull(),
  genericName: text('generic_name'),
  brandName: text('brand_name'),
  ndcNumber: varchar('ndc_number', { length: 11 }), // National Drug Code
  rxcuiCode: varchar('rxcui_code', { length: 20 }), // RxNorm concept unique identifier

  // Prescription details
  prescriptionNumber: varchar('prescription_number', { length: 50 }),
  dosage: varchar('dosage', { length: 100 }).notNull(), // e.g., "10mg", "5ml"
  strength: varchar('strength', { length: 50 }), // e.g., "500mg/tablet"
  dosageForm: varchar('dosage_form', { length: 50 }), // tablet, capsule, liquid, injection
  route: varchar('route', { length: 50 }), // oral, IV, IM, topical, etc.

  // Instructions
  directions: text('directions').notNull(), // e.g., "Take 1 tablet by mouth twice daily"
  frequency: varchar('frequency', { length: 50 }), // BID, TID, QID, PRN, etc.
  quantity: integer('quantity'), // Number of units prescribed
  daysSupply: integer('days_supply'), // Number of days medication should last

  // Dates
  prescribedDate: date('prescribed_date').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  lastFilledDate: date('last_filled_date'),

  // Refills
  refillsAllowed: integer('refills_allowed').default(0),
  refillsRemaining: integer('refills_remaining').default(0),

  // Status
  status: medicationStatusEnum('status').default('active').notNull(),
  discontinuedDate: date('discontinued_date'),
  discontinuedReason: text('discontinued_reason'),

  // Clinical information
  indication: text('indication'), // Reason for prescription
  allergies: text('allergies'), // Known allergies related to this medication
  sideEffects: text('side_effects'), // Observed side effects

  // Pharmacy information
  pharmacyName: text('pharmacy_name'),
  pharmacyPhone: varchar('pharmacy_phone', { length: 20 }),
  pharmacyNpi: varchar('pharmacy_npi', { length: 10 }),

  // Compliance and monitoring
  adherenceRate: decimal('adherence_rate', { precision: 5, scale: 4 }), // 0.9500 = 95%
  lastReviewDate: date('last_review_date'),
  nextReviewDate: date('next_review_date'),

  // Cost information
  cost: decimal('cost', { precision: 10, scale: 2 }),
  copay: decimal('copay', { precision: 10, scale: 2 }),
  insuranceCovered: boolean('insurance_covered').default(true),

  // Clinical decision support
  isHighRisk: boolean('is_high_risk').default(false),
  requiresMonitoring: boolean('requires_monitoring').default(false),
  monitoringParameters: text('monitoring_parameters'), // Lab values to monitor

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('medication_org_idx').on(table.organizationId),
  patientIdx: index('medication_patient_idx').on(table.patientId),
  providerIdx: index('medication_provider_idx').on(table.providerId),
  encounterIdx: index('medication_encounter_idx').on(table.encounterId),
  statusIdx: index('medication_status_idx').on(table.status),
  prescriptionNumberIdx: index('medication_prescription_number_idx').on(table.prescriptionNumber),
  medicationNameIdx: index('medication_medication_name_idx').on(table.medicationName),
  ndcNumberIdx: index('medication_ndc_number_idx').on(table.ndcNumber),
  prescribedDateIdx: index('medication_prescribed_date_idx').on(table.prescribedDate),
  endDateIdx: index('medication_end_date_idx').on(table.endDate),
  isHighRiskIdx: index('medication_is_high_risk_idx').on(table.isHighRisk),
  nextReviewDateIdx: index('medication_next_review_date_idx').on(table.nextReviewDate),
}));

// Drug interactions and safety alerts
export const drugInteractions = pgTable('drug_interaction', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Interacting medications
  drug1NdcNumber: varchar('drug1_ndc_number', { length: 11 }).notNull(),
  drug1Name: text('drug1_name').notNull(),
  drug2NdcNumber: varchar('drug2_ndc_number', { length: 11 }).notNull(),
  drug2Name: text('drug2_name').notNull(),

  // Interaction details
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // drug_drug, drug_food, drug_allergy, drug_condition
  severityLevel: varchar('severity_level', { length: 20 }).notNull(), // minor, moderate, major, contraindicated

  // Clinical information
  mechanism: text('mechanism'), // How the interaction occurs
  clinicalEffects: text('clinical_effects').notNull(), // What happens when drugs interact
  management: text('management'), // How to manage the interaction

  // Evidence and references
  evidenceLevel: varchar('evidence_level', { length: 20 }), // established, probable, theoretical
  references: text('references'), // Scientific references

  // Monitoring recommendations
  monitoringRequired: boolean('monitoring_required').default(false),
  monitoringParameters: text('monitoring_parameters'),
  monitoringFrequency: varchar('monitoring_frequency', { length: 50 }),

  // Patient-specific factors
  ageGroupRestrictions: text('age_group_restrictions'), // pediatric, geriatric, adult
  conditionRestrictions: text('condition_restrictions'), // JSON array of conditions

  // System information
  source: varchar('source', { length: 50 }).notNull(), // First_DataBank, Lexicomp, clinical_staff
  sourceVersion: varchar('source_version', { length: 20 }),
  lastUpdated: timestamp('last_updated').defaultNow(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('drug_interaction_org_idx').on(table.organizationId),
  drug1Idx: index('drug_interaction_drug1_idx').on(table.drug1NdcNumber),
  drug2Idx: index('drug_interaction_drug2_idx').on(table.drug2NdcNumber),
  drugsIdx: index('drug_interaction_drugs_idx').on(table.drug1NdcNumber, table.drug2NdcNumber),
  severityIdx: index('drug_interaction_severity_idx').on(table.severityLevel),
  typeIdx: index('drug_interaction_type_idx').on(table.interactionType),
  activeIdx: index('drug_interaction_active_idx').on(table.isActive),
  evidenceLevelIdx: index('drug_interaction_evidence_level_idx').on(table.evidenceLevel),
}));

// Medication adherence tracking
export const medicationAdherence = pgTable('medication_adherence', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  medicationId: uuid('medication_id').references(() => medications.id).notNull(),

  // Tracking period
  trackingPeriodStart: date('tracking_period_start').notNull(),
  trackingPeriodEnd: date('tracking_period_end').notNull(),

  // Adherence metrics
  dosesScheduled: integer('doses_scheduled').notNull(),
  dosesTaken: integer('doses_taken').notNull(),
  dosesSkipped: integer('doses_skipped').default(0),
  adherenceRate: decimal('adherence_rate', { precision: 5, scale: 4 }).notNull(), // 0.8500 = 85%

  // Tracking method
  trackingMethod: varchar('tracking_method', { length: 50 }), // self_reported, pharmacy_refills, pill_count, electronic_monitoring

  // Barriers to adherence
  barriers: text('barriers'), // JSON array of adherence barriers
  sideEffectsReported: text('side_effects_reported'),
  costConcerns: boolean('cost_concerns').default(false),

  // Interventions
  interventionsProvided: text('interventions_provided'), // JSON array of interventions

  // Clinical assessment
  assessmentDate: date('assessment_date').notNull(),
  assessedBy: uuid('assessed_by').references(() => teamMembers.id),
  clinicalNotes: text('clinical_notes'),

  // Follow-up
  nextAssessmentDate: date('next_assessment_date'),
  followUpRequired: boolean('follow_up_required').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('medication_adherence_org_idx').on(table.organizationId),
  patientIdx: index('medication_adherence_patient_idx').on(table.patientId),
  medicationIdx: index('medication_adherence_medication_idx').on(table.medicationId),
  trackingPeriodIdx: index('medication_adherence_tracking_period_idx').on(table.trackingPeriodStart, table.trackingPeriodEnd),
  adherenceRateIdx: index('medication_adherence_adherence_rate_idx').on(table.adherenceRate),
  assessmentDateIdx: index('medication_adherence_assessment_date_idx').on(table.assessmentDate),
  nextAssessmentIdx: index('medication_adherence_next_assessment_idx').on(table.nextAssessmentDate),
  followUpIdx: index('medication_adherence_follow_up_idx').on(table.followUpRequired),
}));

// Formulary management (approved drug list)
export const formulary = pgTable('formulary', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id),

  // Formulary details
  formularyName: text('formulary_name').notNull(),
  description: text('description'),
  formularyType: varchar('formulary_type', { length: 50 }), // open, closed, preferred, restricted

  // Medication details
  medicationName: text('medication_name').notNull(),
  genericName: text('generic_name'),
  ndcNumber: varchar('ndc_number', { length: 11 }),
  rxcuiCode: varchar('rxcui_code', { length: 20 }),

  // Coverage details
  tier: varchar('tier', { length: 20 }), // tier_1, tier_2, tier_3, specialty
  copayAmount: decimal('copay_amount', { precision: 10, scale: 2 }),
  coinsuranceRate: decimal('coinsurance_rate', { precision: 5, scale: 4 }), // 0.2000 = 20%

  // Restrictions
  requiresPriorAuth: boolean('requires_prior_auth').default(false),
  quantityLimits: integer('quantity_limits'),
  stepTherapyRequired: boolean('step_therapy_required').default(false),
  ageRestrictions: text('age_restrictions'),

  // Status
  status: varchar('status', { length: 20 }).default('active').notNull(),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),

  // Alternative medications
  preferredAlternatives: text('preferred_alternatives'), // JSON array of alternative NDC numbers

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('formulary_org_idx').on(table.organizationId),
  payerIdx: index('formulary_payer_idx').on(table.payerId),
  medicationNameIdx: index('formulary_medication_name_idx').on(table.medicationName),
  ndcNumberIdx: index('formulary_ndc_number_idx').on(table.ndcNumber),
  statusIdx: index('formulary_status_idx').on(table.status),
  tierIdx: index('formulary_tier_idx').on(table.tier),
  effectiveDateIdx: index('formulary_effective_date_idx').on(table.effectiveDate),
  priorAuthIdx: index('formulary_prior_auth_idx').on(table.requiresPriorAuth),
}));

export type Medication = InferSelectModel<typeof medications>;
export type NewMedication = InferInsertModel<typeof medications>;

export type DrugInteraction = InferSelectModel<typeof drugInteractions>;
export type NewDrugInteraction = InferInsertModel<typeof drugInteractions>;

export type MedicationAdherence = InferSelectModel<typeof medicationAdherence>;
export type NewMedicationAdherence = InferInsertModel<typeof medicationAdherence>;

export type Formulary = InferSelectModel<typeof formulary>;
export type NewFormulary = InferInsertModel<typeof formulary>;

// ============================================================================
// LAB AND DIAGNOSTICS TABLES
// ============================================================================

// Laboratory orders
export const labOrders = pgTable('lab_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  encounterId: uuid('encounter_id').references(() => encounters.id),

  // Order identification
  orderNumber: varchar('order_number', { length: 50 }),
  accessionNumber: varchar('accession_number', { length: 50 }),

  // Test details
  testName: text('test_name').notNull(),
  loincCode: varchar('loinc_code', { length: 20 }), // Logical Observation Identifiers Names and Codes
  cptCode: varchar('cpt_code', { length: 10 }), // Current Procedural Terminology
  testCategory: varchar('test_category', { length: 50 }), // chemistry, hematology, microbiology, pathology

  // Ordering information
  orderDate: timestamp('order_date').notNull(),
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, stat, asap

  // Collection details
  specimenType: varchar('specimen_type', { length: 50 }), // blood, urine, stool, sputum, etc.
  collectionDate: timestamp('collection_date'),
  collectedBy: uuid('collected_by').references(() => teamMembers.id),
  collectionMethod: varchar('collection_method', { length: 50 }), // venipuncture, finger_stick, clean_catch
  collectionSite: varchar('collection_site', { length: 50 }), // left_arm, right_arm, midstream, etc.

  // Processing
  status: labStatusEnum('status').default('ordered').notNull(),
  resultDate: timestamp('result_date'),
  reviewedDate: timestamp('reviewed_date'),
  reviewedBy: uuid('reviewed_by').references(() => providers.id),

  // Clinical context
  clinicalIndication: text('clinical_indication'),
  diagnosisCodes: text('diagnosis_codes'), // JSON array of ICD-10 codes

  // External lab information
  externalLabName: text('external_lab_name'),
  externalLabId: varchar('external_lab_id', { length: 50 }),
  isExternalLab: boolean('is_external_lab').default(false),

  // Billing
  isBillable: boolean('is_billable').default(true),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),

  // Quality and tracking
  turnaroundTime: integer('turnaround_time'), // Hours from order to result
  isAbnormal: boolean('is_abnormal').default(false),
  isCritical: boolean('is_critical').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('lab_order_org_idx').on(table.organizationId),
  patientIdx: index('lab_order_patient_idx').on(table.patientId),
  providerIdx: index('lab_order_provider_idx').on(table.providerId),
  encounterIdx: index('lab_order_encounter_idx').on(table.encounterId),
  statusIdx: index('lab_order_status_idx').on(table.status),
  orderNumberIdx: index('lab_order_order_number_idx').on(table.orderNumber),
  accessionNumberIdx: index('lab_order_accession_number_idx').on(table.accessionNumber),
  orderDateIdx: index('lab_order_order_date_idx').on(table.orderDate),
  testNameIdx: index('lab_order_test_name_idx').on(table.testName),
  testCategoryIdx: index('lab_order_test_category_idx').on(table.testCategory),
  priorityIdx: index('lab_order_priority_idx').on(table.priority),
  collectionDateIdx: index('lab_order_collection_date_idx').on(table.collectionDate),
  resultDateIdx: index('lab_order_result_date_idx').on(table.resultDate),
  isAbnormalIdx: index('lab_order_is_abnormal_idx').on(table.isAbnormal),
  isCriticalIdx: index('lab_order_is_critical_idx').on(table.isCritical),
}));

// Laboratory results
export const labResults = pgTable('lab_result', {
  id: uuid('id').primaryKey().defaultRandom(),
  labOrderId: uuid('lab_order_id').references(() => labOrders.id).notNull(),

  // Result identification
  resultCode: varchar('result_code', { length: 50 }),
  testName: text('test_name').notNull(),
  componentName: text('component_name'), // For panels with multiple components
  loincCode: varchar('loinc_code', { length: 20 }),

  // Result values
  numericValue: decimal('numeric_value', { precision: 15, scale: 6 }),
  textValue: text('text_value'),
  unit: varchar('unit', { length: 20 }), // mg/dL, mmol/L, etc.

  // Reference ranges
  referenceRangeLow: decimal('reference_range_low', { precision: 15, scale: 6 }),
  referenceRangeHigh: decimal('reference_range_high', { precision: 15, scale: 6 }),
  referenceRangeText: text('reference_range_text'), // For non-numeric ranges

  // Result interpretation
  interpretation: varchar('interpretation', { length: 50 }), // normal, high, low, critical_high, critical_low
  isAbnormal: boolean('is_abnormal').default(false),
  isCritical: boolean('is_critical').default(false),
  isPanic: boolean('is_panic').default(false),

  // Flags and comments
  resultFlags: text('result_flags'), // H, L, HH, LL, etc.
  comments: text('comments'),
  technicalNotes: text('technical_notes'),

  // Quality control
  instrumentId: varchar('instrument_id', { length: 50 }),
  methodId: varchar('method_id', { length: 50 }),
  rerunCount: integer('rerun_count').default(0),

  // Timing
  resultedAt: timestamp('resulted_at'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => teamMembers.id),

  // Status
  status: varchar('status', { length: 20 }).default('preliminary'), // preliminary, final, corrected, cancelled

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  labOrderIdx: index('lab_result_lab_order_idx').on(table.labOrderId),
  testNameIdx: index('lab_result_test_name_idx').on(table.testName),
  componentNameIdx: index('lab_result_component_name_idx').on(table.componentName),
  loincCodeIdx: index('lab_result_loinc_code_idx').on(table.loincCode),
  isAbnormalIdx: index('lab_result_is_abnormal_idx').on(table.isAbnormal),
  isCriticalIdx: index('lab_result_is_critical_idx').on(table.isCritical),
  isPanicIdx: index('lab_result_is_panic_idx').on(table.isPanic),
  statusIdx: index('lab_result_status_idx').on(table.status),
  resultedAtIdx: index('lab_result_resulted_at_idx').on(table.resultedAt),
  interpretationIdx: index('lab_result_interpretation_idx').on(table.interpretation),
}));

// Imaging orders
export const imagingOrders = pgTable('imaging_order', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  encounterId: uuid('encounter_id').references(() => encounters.id),

  // Order identification
  orderNumber: varchar('order_number', { length: 50 }),
  accessionNumber: varchar('accession_number', { length: 50 }),

  // Study details
  studyDescription: text('study_description').notNull(),
  modalityType: varchar('modality_type', { length: 20 }).notNull(), // CT, MRI, X-RAY, US, NM, PET, etc.
  bodyPart: varchar('body_part', { length: 50 }), // chest, abdomen, head, spine, etc.
  studyProtocol: text('study_protocol'),

  // Coding
  cptCode: varchar('cpt_code', { length: 10 }),
  icdCode: varchar('icd_code', { length: 10 }),

  // Ordering information
  orderDate: timestamp('order_date').notNull(),
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, stat

  // Scheduling
  scheduledDate: timestamp('scheduled_date'),
  scheduledLocation: text('scheduled_location'),

  // Clinical information
  clinicalIndication: text('clinical_indication').notNull(),
  clinicalHistory: text('clinical_history'),
  contraindications: text('contraindications'),
  specialInstructions: text('special_instructions'),

  // Contrast information
  contrastUsed: boolean('contrast_used').default(false),
  contrastType: varchar('contrast_type', { length: 50 }), // oral, IV, both
  contrastVolume: integer('contrast_volume'), // mL
  allergicToContrast: boolean('allergic_to_contrast').default(false),

  // Prior studies
  priorStudyDate: date('prior_study_date'),
  priorStudyLocation: text('prior_study_location'),
  comparisonStudyIds: text('comparison_study_ids'), // JSON array of study IDs

  // Processing
  status: varchar('status', { length: 20 }).default('ordered').notNull(),
  studyDate: timestamp('study_date'),
  readDate: timestamp('read_date'),
  reportedDate: timestamp('reported_date'),

  // Reading radiologist
  readingRadiologist: uuid('reading_radiologist').references(() => providers.id),

  // Technical details
  technologist: varchar('technologist', { length: 100 }),
  equipment: varchar('equipment', { length: 100 }),

  // Quality metrics
  radiationDose: decimal('radiation_dose', { precision: 10, scale: 4 }), // mGy or mSv
  imageQuality: varchar('image_quality', { length: 20 }), // excellent, good, fair, poor

  // External facility
  externalFacilityName: text('external_facility_name'),
  isExternalStudy: boolean('is_external_study').default(false),

  // Billing
  isBillable: boolean('is_billable').default(true),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('imaging_order_org_idx').on(table.organizationId),
  patientIdx: index('imaging_order_patient_idx').on(table.patientId),
  providerIdx: index('imaging_order_provider_idx').on(table.providerId),
  encounterIdx: index('imaging_order_encounter_idx').on(table.encounterId),
  statusIdx: index('imaging_order_status_idx').on(table.status),
  orderNumberIdx: index('imaging_order_order_number_idx').on(table.orderNumber),
  accessionNumberIdx: index('imaging_order_accession_number_idx').on(table.accessionNumber),
  orderDateIdx: index('imaging_order_order_date_idx').on(table.orderDate),
  modalityTypeIdx: index('imaging_order_modality_type_idx').on(table.modalityType),
  bodyPartIdx: index('imaging_order_body_part_idx').on(table.bodyPart),
  priorityIdx: index('imaging_order_priority_idx').on(table.priority),
  scheduledDateIdx: index('imaging_order_scheduled_date_idx').on(table.scheduledDate),
  studyDateIdx: index('imaging_order_study_date_idx').on(table.studyDate),
  readingRadiologistIdx: index('imaging_order_reading_radiologist_idx').on(table.readingRadiologist),
}));

// Radiology reports
export const radiologyReports = pgTable('radiology_report', {
  id: uuid('id').primaryKey().defaultRandom(),
  imagingOrderId: uuid('imaging_order_id').references(() => imagingOrders.id).notNull(),

  // Report identification
  reportNumber: varchar('report_number', { length: 50 }),

  // Report content
  indication: text('indication'),
  technique: text('technique'),
  comparison: text('comparison'),
  findings: text('findings').notNull(),
  impression: text('impression').notNull(),
  recommendations: text('recommendations'),

  // Classifications
  biRadsScore: varchar('bi_rads_score', { length: 10 }), // For mammography
  lungRadsScore: varchar('lung_rads_score', { length: 10 }), // For lung CT
  liRadsScore: varchar('li_rads_score', { length: 10 }), // For liver imaging

  // Critical findings
  hasCriticalFindings: boolean('has_critical_findings').default(false),
  criticalFindingsText: text('critical_findings_text'),
  criticalFindingsNotified: boolean('critical_findings_notified').default(false),
  notificationDate: timestamp('notification_date'),
  notifiedBy: uuid('notified_by').references(() => teamMembers.id),

  // Report status and workflow
  status: varchar('status', { length: 20 }).default('draft'), // draft, preliminary, final, addendum, corrected
  draftedDate: timestamp('drafted_date'),
  preliminaryDate: timestamp('preliminary_date'),
  finalizedDate: timestamp('finalized_date'),

  // Radiologist information
  readingRadiologist: uuid('reading_radiologist').references(() => providers.id).notNull(),
  attendingRadiologist: uuid('attending_radiologist').references(() => providers.id),

  // Quality and teaching
  residentResident: uuid('resident_resident').references(() => providers.id),
  isTeachingCase: boolean('is_teaching_case').default(false),
  teachingPoints: text('teaching_points'),

  // Follow-up recommendations
  followUpRequired: boolean('follow_up_required').default(false),
  followUpTimeframe: varchar('follow_up_timeframe', { length: 50 }), // 3_months, 6_months, 1_year
  followUpInstructions: text('follow_up_instructions'),

  // Structured reporting
  structuredData: json('structured_data'), // JSON for structured reporting elements

  // External factors
  limitingFactors: text('limiting_factors'), // motion, contrast, etc.

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  imagingOrderIdx: index('radiology_report_imaging_order_idx').on(table.imagingOrderId),
  reportNumberIdx: index('radiology_report_report_number_idx').on(table.reportNumber),
  statusIdx: index('radiology_report_status_idx').on(table.status),
  readingRadiologistIdx: index('radiology_report_reading_radiologist_idx').on(table.readingRadiologist),
  attendingRadiologistIdx: index('radiology_report_attending_radiologist_idx').on(table.attendingRadiologist),
  hasCriticalFindingsIdx: index('radiology_report_has_critical_findings_idx').on(table.hasCriticalFindings),
  criticalFindingsNotifiedIdx: index('radiology_report_critical_findings_notified_idx').on(table.criticalFindingsNotified),
  followUpRequiredIdx: index('radiology_report_follow_up_required_idx').on(table.followUpRequired),
  finalizedDateIdx: index('radiology_report_finalized_date_idx').on(table.finalizedDate),
  isTeachingCaseIdx: index('radiology_report_is_teaching_case_idx').on(table.isTeachingCase),
}));

// Pathology specimens
export const pathologySpecimens = pgTable('pathology_specimen', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Specimen identification
  specimenNumber: varchar('specimen_number', { length: 50 }).notNull(),
  accessionNumber: varchar('accession_number', { length: 50 }),

  // Collection details
  collectionDate: timestamp('collection_date').notNull(),
  collectionProcedure: varchar('collection_procedure', { length: 100 }), // biopsy, excision, cytology
  specimenType: varchar('specimen_type', { length: 50 }), // tissue, cytology, blood, bone_marrow
  specimenSite: text('specimen_site').notNull(), // anatomical location

  // Clinical information
  clinicalHistory: text('clinical_history'),
  clinicalDiagnosis: text('clinical_diagnosis'),
  grossDescription: text('gross_description'),

  // Processing information
  fixationType: varchar('fixation_type', { length: 50 }), // formalin, frozen, etc.
  processingDate: timestamp('processing_date'),
  processedBy: uuid('processed_by').references(() => teamMembers.id),

  // Staining and techniques
  stainsUsed: text('stains_used'), // JSON array of stains (H&E, IHC, etc.)
  specialTechniques: text('special_techniques'), // JSON array of special techniques

  // Status tracking
  status: varchar('status', { length: 20 }).default('received'), // received, processing, ready, reported

  // Quality control
  adequacyAssessment: varchar('adequacy_assessment', { length: 50 }), // adequate, inadequate, limited
  qualityIssues: text('quality_issues'),

  // External lab
  externalLabName: text('external_lab_name'),
  isExternalLab: boolean('is_external_lab').default(false),

  // Billing
  isBillable: boolean('is_billable').default(true),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('pathology_specimen_org_idx').on(table.organizationId),
  patientIdx: index('pathology_specimen_patient_idx').on(table.patientId),
  providerIdx: index('pathology_specimen_provider_idx').on(table.providerId),
  specimenNumberIdx: index('pathology_specimen_specimen_number_idx').on(table.specimenNumber),
  accessionNumberIdx: index('pathology_specimen_accession_number_idx').on(table.accessionNumber),
  collectionDateIdx: index('pathology_specimen_collection_date_idx').on(table.collectionDate),
  specimenTypeIdx: index('pathology_specimen_specimen_type_idx').on(table.specimenType),
  statusIdx: index('pathology_specimen_status_idx').on(table.status),
  collectionProcedureIdx: index('pathology_specimen_collection_procedure_idx').on(table.collectionProcedure),
}));

// Pathology reports
export const pathologyReports = pgTable('pathology_report', {
  id: uuid('id').primaryKey().defaultRandom(),
  pathologySpecimenId: uuid('pathology_specimen_id').references(() => pathologySpecimens.id).notNull(),

  // Report identification
  reportNumber: varchar('report_number', { length: 50 }),

  // Report sections
  macroscopicDescription: text('macroscopic_description'),
  microscopicDescription: text('microscopic_description').notNull(),
  diagnosis: text('diagnosis').notNull(),
  comment: text('comment'),

  // Cancer staging (if applicable)
  tumorSize: varchar('tumor_size', { length: 20 }),
  tumorGrade: varchar('tumor_grade', { length: 20 }),
  tumorStage: varchar('tumor_stage', { length: 20 }),
  marginsStatus: varchar('margins_status', { length: 50 }), // clear, positive, close
  lymphNodeStatus: varchar('lymph_node_status', { length: 50 }),

  // Molecular markers
  receptorStatus: text('receptor_status'), // JSON object for various receptors
  molecularMarkers: text('molecular_markers'), // JSON array of markers tested

  // Quality metrics
  turnaroundTime: integer('turnaround_time'), // Hours from receipt to report

  // Report workflow
  status: varchar('status', { length: 20 }).default('draft'), // draft, preliminary, final, addendum
  draftedDate: timestamp('drafted_date'),
  finalizedDate: timestamp('finalized_date'),

  // Pathologist information
  primaryPathologist: uuid('primary_pathologist').references(() => providers.id).notNull(),
  reviewingPathologist: uuid('reviewing_pathologist').references(() => providers.id),

  // Consultation
  consultationRequested: boolean('consultation_requested').default(false),
  consultingPathologist: uuid('consulting_pathologist').references(() => providers.id),
  consultationComments: text('consultation_comments'),

  // Follow-up
  followUpRequired: boolean('follow_up_required').default(false),
  followUpInstructions: text('follow_up_instructions'),

  // Critical values
  hasCriticalValues: boolean('has_critical_values').default(false),
  criticalValuesText: text('critical_values_text'),
  criticalValuesNotified: boolean('critical_values_notified').default(false),

  // Addenda and corrections
  hasAddendum: boolean('has_addendum').default(false),
  addendumText: text('addendum_text'),
  correctionReason: text('correction_reason'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  pathologySpecimenIdx: index('pathology_report_pathology_specimen_idx').on(table.pathologySpecimenId),
  reportNumberIdx: index('pathology_report_report_number_idx').on(table.reportNumber),
  statusIdx: index('pathology_report_status_idx').on(table.status),
  primaryPathologistIdx: index('pathology_report_primary_pathologist_idx').on(table.primaryPathologist),
  reviewingPathologistIdx: index('pathology_report_reviewing_pathologist_idx').on(table.reviewingPathologist),
  finalizedDateIdx: index('pathology_report_finalized_date_idx').on(table.finalizedDate),
  hasCriticalValuesIdx: index('pathology_report_has_critical_values_idx').on(table.hasCriticalValues),
  followUpRequiredIdx: index('pathology_report_follow_up_required_idx').on(table.followUpRequired),
  consultationRequestedIdx: index('pathology_report_consultation_requested_idx').on(table.consultationRequested),
}));

export type LabOrder = InferSelectModel<typeof labOrders>;
export type NewLabOrder = InferInsertModel<typeof labOrders>;

export type LabResult = InferSelectModel<typeof labResults>;
export type NewLabResult = InferInsertModel<typeof labResults>;

export type ImagingOrder = InferSelectModel<typeof imagingOrders>;
export type NewImagingOrder = InferInsertModel<typeof imagingOrders>;

export type RadiologyReport = InferSelectModel<typeof radiologyReports>;
export type NewRadiologyReport = InferInsertModel<typeof radiologyReports>;

export type PathologySpecimen = InferSelectModel<typeof pathologySpecimens>;
export type NewPathologySpecimen = InferInsertModel<typeof pathologySpecimens>;

export type PathologyReport = InferSelectModel<typeof pathologyReports>;
export type NewPathologyReport = InferInsertModel<typeof pathologyReports>;

// ====================================
// EMERGENCY CONTACTS & PATIENT EXTENSIONS
// ====================================

// Emergency contacts
export const emergencyContacts = pgTable('emergency_contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Contact information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  suffix: varchar('suffix', { length: 20 }), // Jr, Sr, II, III

  // Relationship
  relationshipToPatient: varchar('relationship_to_patient', { length: 50 }).notNull(), // spouse, parent, child, sibling, friend, other
  isLegalGuardian: boolean('is_legal_guardian').default(false),
  isPrimaryContact: boolean('is_primary_contact').default(false),
  priority: integer('priority').default(1), // 1 = primary, 2 = secondary, etc.

  // Communication preferences
  phoneNumber: varchar('phone_number', { length: 20 }),
  phoneType: varchar('phone_type', { length: 20 }), // home, work, mobile
  alternatePhone: varchar('alternate_phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  preferredContactMethod: varchar('preferred_contact_method', { length: 20 }), // phone, email, text

  // Address information
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),

  // Contact permissions
  canReceiveMedicalInfo: boolean('can_receive_medical_info').default(false),
  canMakeDecisions: boolean('can_make_decisions').default(false),
  canPickUpPatient: boolean('can_pick_up_patient').default(false),
  canVisitDuringRestricted: boolean('can_visit_during_restricted').default(false),

  // Emergency specific
  shouldContactInEmergency: boolean('should_contact_in_emergency').default(true),
  availabilityNotes: text('availability_notes'), // "Work hours only", "Available 24/7", etc.

  // Status
  isActive: boolean('is_active').default(true),
  notes: text('notes'),

  // Verification
  lastVerifiedDate: date('last_verified_date'),
  verifiedBy: uuid('verified_by').references(() => teamMembers.id),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('emergency_contact_org_idx').on(table.organizationId),
  patientIdx: index('emergency_contact_patient_idx').on(table.patientId),
  isPrimaryContactIdx: index('emergency_contact_is_primary_contact_idx').on(table.isPrimaryContact),
  priorityIdx: index('emergency_contact_priority_idx').on(table.priority),
  shouldContactInEmergencyIdx: index('emergency_contact_should_contact_in_emergency_idx').on(table.shouldContactInEmergency),
  isActiveIdx: index('emergency_contact_is_active_idx').on(table.isActive),
  lastVerifiedDateIdx: index('emergency_contact_last_verified_date_idx').on(table.lastVerifiedDate),
}));

// Patient extensions - additional demographic and preference data
export const patientExtensions = pgTable('patient_extension', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Extended demographics
  ethnicity: varchar('ethnicity', { length: 100 }), // Hispanic/Latino, Not Hispanic/Latino, Unknown
  race: varchar('race', { length: 100 }), // American Indian, Asian, Black, Native Hawaiian, White, Other, Unknown
  raceSecondary: varchar('race_secondary', { length: 100 }), // For patients with multiple races
  preferredLanguage: varchar('preferred_language', { length: 50 }), // English, Spanish, French, etc.
  interpreterNeeded: boolean('interpreter_needed').default(false),
  interpreterLanguage: varchar('interpreter_language', { length: 50 }),

  // Cultural and religious preferences
  religion: varchar('religion', { length: 100 }),
  culturalConsiderations: text('cultural_considerations'),
  dietaryRestrictions: text('dietary_restrictions'),

  // Communication preferences
  communicationPreferences: text('communication_preferences'), // JSON array
  privacyPreferences: text('privacy_preferences'), // JSON object
  consentToText: boolean('consent_to_text').default(false),
  consentToEmail: boolean('consent_to_email').default(false),
  consentToVoicemail: boolean('consent_to_voicemail').default(false),

  // Accessibility needs
  mobilityAssistance: text('mobility_assistance'), // wheelchair, walker, cane, none
  visualAssistance: text('visual_assistance'), // large_print, braille, magnifier, none
  hearingAssistance: text('hearing_assistance'), // hearing_aid, interpreter, written_communication, none
  cognitiveAssistance: text('cognitive_assistance'), // simplified_instructions, caregiver_present, none

  // Social determinants of health
  employmentStatus: varchar('employment_status', { length: 50 }), // employed, unemployed, retired, student, disabled
  education: varchar('education', { length: 50 }), // less_than_high_school, high_school, some_college, college, graduate
  householdSize: integer('household_size'),
  householdIncome: varchar('household_income', { length: 50 }), // income ranges for privacy
  transportationChallenges: boolean('transportation_challenges').default(false),
  housingStability: varchar('housing_stability', { length: 50 }), // stable, temporary, homeless, other
  foodInsecurity: boolean('food_insecurity').default(false),

  // Emergency and safety information
  emergencyMedicalInfo: text('emergency_medical_info'), // Allergies, conditions, medications
  safetyAlerts: text('safety_alerts'), // Violence history, security concerns, etc.
  advanceDirectives: boolean('advance_directives').default(false),
  advanceDirectivesLocation: text('advance_directives_location'),
  organDonor: boolean('organ_donor').default(false),

  // Care team preferences
  preferredProvider: uuid('preferred_provider').references(() => providers.id),
  preferredPharmacy: text('preferred_pharmacy'),
  preferredHospital: text('preferred_hospital'),
  preferredAppointmentTime: varchar('preferred_appointment_time', { length: 50 }), // morning, afternoon, evening

  // Clinical research and marketing
  consentToResearch: boolean('consent_to_research').default(false),
  consentToMarketing: boolean('consent_to_marketing').default(false),
  shareDataWithPartners: boolean('share_data_with_partners').default(false),

  // Additional notes and custom fields
  notes: text('notes'),
  customFields: json('custom_fields'), // JSON object for organization-specific fields

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('patient_extension_org_idx').on(table.organizationId),
  patientIdx: index('patient_extension_patient_idx').on(table.patientId),
  preferredLanguageIdx: index('patient_extension_preferred_language_idx').on(table.preferredLanguage),
  interpreterNeededIdx: index('patient_extension_interpreter_needed_idx').on(table.interpreterNeeded),
  employmentStatusIdx: index('patient_extension_employment_status_idx').on(table.employmentStatus),
  transportationChallengesIdx: index('patient_extension_transportation_challenges_idx').on(table.transportationChallenges),
  foodInsecurityIdx: index('patient_extension_food_insecurity_idx').on(table.foodInsecurity),
  preferredProviderIdx: index('patient_extension_preferred_provider_idx').on(table.preferredProvider),
  consentToResearchIdx: index('patient_extension_consent_to_research_idx').on(table.consentToResearch),
}));

// Patient contacts - for general contact management beyond emergency contacts
export const patientContacts = pgTable('patient_contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),

  // Contact type and relationship
  contactType: varchar('contact_type', { length: 50 }).notNull(), // family, friend, caregiver, professional, other
  relationshipToPatient: varchar('relationship_to_patient', { length: 100 }).notNull(),

  // Contact information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  suffix: varchar('suffix', { length: 20 }),

  // Communication
  phoneNumber: varchar('phone_number', { length: 20 }),
  phoneType: varchar('phone_type', { length: 20 }),
  alternatePhone: varchar('alternate_phone', { length: 20 }),
  email: varchar('email', { length: 255 }),

  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),

  // Permissions and roles
  canReceiveGeneralInfo: boolean('can_receive_general_info').default(false),
  canScheduleAppointments: boolean('can_schedule_appointments').default(false),
  canAccessPortal: boolean('can_access_portal').default(false),
  isPrimaryCaregiver: boolean('is_primary_caregiver').default(false),

  // Professional contacts (for caregivers, social workers, etc.)
  organization: varchar('organization', { length: 200 }),
  title: varchar('title', { length: 100 }),
  specialty: varchar('specialty', { length: 100 }),
  licenseNumber: varchar('license_number', { length: 50 }),

  // Status and notes
  isActive: boolean('is_active').default(true),
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('patient_contact_org_idx').on(table.organizationId),
  patientIdx: index('patient_contact_patient_idx').on(table.patientId),
  contactTypeIdx: index('patient_contact_contact_type_idx').on(table.contactType),
  isPrimaryCaregiverIdx: index('patient_contact_is_primary_caregiver_idx').on(table.isPrimaryCaregiver),
  isActiveIdx: index('patient_contact_is_active_idx').on(table.isActive),
  organizationIdx: index('patient_contact_organization_idx').on(table.organization),
}));

export type EmergencyContact = InferSelectModel<typeof emergencyContacts>;
export type NewEmergencyContact = InferInsertModel<typeof emergencyContacts>;

export type PatientExtension = InferSelectModel<typeof patientExtensions>;
export type NewPatientExtension = InferInsertModel<typeof patientExtensions>;

export type PatientContact = InferSelectModel<typeof patientContacts>;
export type NewPatientContact = InferInsertModel<typeof patientContacts>;

// ====================================
// QUALITY MEASURES & COMPLIANCE TRACKING
// ====================================

// Quality measure definitions and tracking
export const qualityMeasures = pgTable('quality_measure', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Measure identification
  measureId: varchar('measure_id', { length: 50 }).notNull(), // CMS measure ID, NQF number, etc.
  measureName: text('measure_name').notNull(),
  measureType: varchar('measure_type', { length: 50 }).notNull(), // process, outcome, structure, patient_experience

  // Program association
  qualityProgram: varchar('quality_program', { length: 50 }), // MIPS, CMS_Core_Measures, Joint_Commission
  reportingYear: integer('reporting_year').notNull(),

  // Measure details
  description: text('description'),
  numeratorDescription: text('numerator_description'),
  denominatorDescription: text('denominator_description'),
  exclusionCriteria: text('exclusion_criteria'),

  // Performance targets
  targetRate: decimal('target_rate', { precision: 5, scale: 4 }), // 0.8500 = 85%
  benchmarkRate: decimal('benchmark_rate', { precision: 5, scale: 4 }),
  nationalAverage: decimal('national_average', { precision: 5, scale: 4 }),

  // Risk adjustment
  isRiskAdjusted: boolean('is_risk_adjusted').default(false),
  riskAdjustmentMethod: text('risk_adjustment_method'),

  // Reporting requirements
  reportingFrequency: varchar('reporting_frequency', { length: 20 }), // monthly, quarterly, annually
  submissionDeadline: date('submission_deadline'),

  // Implementation
  implementationGuide: text('implementation_guide'),
  dataSource: varchar('data_source', { length: 50 }), // ehr, claims, registry, hybrid
  automatedCollection: boolean('automated_collection').default(false),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isRetired: boolean('is_retired').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('quality_measure_org_idx').on(table.organizationId),
  measureIdIdx: index('quality_measure_measure_id_idx').on(table.measureId),
  measureTypeIdx: index('quality_measure_measure_type_idx').on(table.measureType),
  qualityProgramIdx: index('quality_measure_quality_program_idx').on(table.qualityProgram),
  reportingYearIdx: index('quality_measure_reporting_year_idx').on(table.reportingYear),
  isActiveIdx: index('quality_measure_is_active_idx').on(table.isActive),
  submissionDeadlineIdx: index('quality_measure_submission_deadline_idx').on(table.submissionDeadline),
}));

// Quality measure performance tracking
export const qualityMeasurePerformance = pgTable('quality_measure_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  qualityMeasureId: uuid('quality_measure_id').references(() => qualityMeasures.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id),

  // Reporting period
  reportingPeriodStart: date('reporting_period_start').notNull(),
  reportingPeriodEnd: date('reporting_period_end').notNull(),

  // Performance metrics
  numerator: integer('numerator').notNull(),
  denominator: integer('denominator').notNull(),
  exclusions: integer('exclusions').default(0),
  performanceRate: decimal('performance_rate', { precision: 5, scale: 4 }).notNull(),

  // Comparisons
  targetMet: boolean('target_met').default(false),
  varianceFromTarget: decimal('variance_from_target', { precision: 6, scale: 4 }), // Can be negative
  percentileRank: decimal('percentile_rank', { precision: 5, scale: 4 }), // National percentile

  // Risk adjustment
  riskAdjustedRate: decimal('risk_adjusted_rate', { precision: 5, scale: 4 }),
  riskScore: decimal('risk_score', { precision: 8, scale: 4 }),

  // Data quality
  dataCompleteness: decimal('data_completeness', { precision: 5, scale: 4 }), // 0.9500 = 95%
  dataAccuracy: decimal('data_accuracy', { precision: 5, scale: 4 }),

  // Submission tracking
  submissionStatus: varchar('submission_status', { length: 20 }).default('pending'), // pending, submitted, accepted, rejected
  submissionDate: timestamp('submission_date'),
  submissionId: varchar('submission_id', { length: 100 }),

  // Comments and notes
  performanceNotes: text('performance_notes'),
  improvementActions: text('improvement_actions'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  calculatedBy: uuid('calculated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('quality_measure_performance_org_idx').on(table.organizationId),
  qualityMeasureIdx: index('quality_measure_performance_quality_measure_idx').on(table.qualityMeasureId),
  providerIdx: index('quality_measure_performance_provider_idx').on(table.providerId),
  reportingPeriodIdx: index('quality_measure_performance_reporting_period_idx').on(table.reportingPeriodStart, table.reportingPeriodEnd),
  performanceRateIdx: index('quality_measure_performance_performance_rate_idx').on(table.performanceRate),
  targetMetIdx: index('quality_measure_performance_target_met_idx').on(table.targetMet),
  submissionStatusIdx: index('quality_measure_performance_submission_status_idx').on(table.submissionStatus),
}));

// Compliance tracking
export const complianceTracking = pgTable('compliance_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Compliance requirement details
  requirementName: text('requirement_name').notNull(),
  regulatoryBody: varchar('regulatory_body', { length: 100 }), // CMS, Joint_Commission, HIPAA, OSHA
  requirementType: varchar('requirement_type', { length: 50 }), // policy, training, audit, certification
  complianceCategory: varchar('compliance_category', { length: 50 }), // privacy, security, quality, safety

  // Requirement details
  description: text('description'),
  requirements: text('requirements'), // Detailed compliance requirements
  frequencyRequired: varchar('frequency_required', { length: 50 }), // annual, monthly, continuous, one_time

  // Dates and deadlines
  effectiveDate: date('effective_date').notNull(),
  nextDueDate: date('next_due_date'),
  lastCompletedDate: date('last_completed_date'),

  // Status tracking
  status: complianceStatusEnum('status').default('pending_review').notNull(),
  complianceLevel: decimal('compliance_level', { precision: 5, scale: 4 }), // 0.9500 = 95% compliant

  // Assignment and ownership
  responsibleParty: uuid('responsible_party').references(() => teamMembers.id),
  backupResponsible: uuid('backup_responsible').references(() => teamMembers.id),

  // Evidence and documentation
  evidenceRequired: text('evidence_required'), // JSON array of required evidence types
  evidenceProvided: text('evidence_provided'), // JSON array of provided evidence
  documentationPath: text('documentation_path'),

  // Risk assessment
  riskLevel: varchar('risk_level', { length: 20 }), // low, medium, high, critical
  impactOfNonCompliance: text('impact_of_non_compliance'),
  mitigationSteps: text('mitigation_steps'),

  // Monitoring and alerts
  monitoringFrequency: varchar('monitoring_frequency', { length: 50 }),
  alertThreshold: integer('alert_threshold'), // Days before due date to alert
  escalationRequired: boolean('escalation_required').default(false),

  // Costs
  implementationCost: decimal('implementation_cost', { precision: 10, scale: 2 }),
  maintenanceCost: decimal('maintenance_cost', { precision: 10, scale: 2 }),
  nonCompliancePenalty: decimal('non_compliance_penalty', { precision: 10, scale: 2 }),

  // Training requirements
  trainingRequired: boolean('training_required').default(false),
  trainingFrequency: varchar('training_frequency', { length: 50 }),
  lastTrainingDate: date('last_training_date'),
  nextTrainingDate: date('next_training_date'),

  // External relationships
  auditingBody: varchar('auditing_body', { length: 100 }),
  certificationNumber: varchar('certification_number', { length: 100 }),

  // Remediation tracking
  deficienciesIdentified: text('deficiencies_identified'), // JSON array
  correctiveActions: text('corrective_actions'), // JSON array
  correctiveActionDeadline: date('corrective_action_deadline'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('compliance_tracking_org_idx').on(table.organizationId),
  requirementNameIdx: index('compliance_tracking_requirement_name_idx').on(table.requirementName),
  regulatoryBodyIdx: index('compliance_tracking_regulatory_body_idx').on(table.regulatoryBody),
  requirementTypeIdx: index('compliance_tracking_requirement_type_idx').on(table.requirementType),
  statusIdx: index('compliance_tracking_status_idx').on(table.status),
  nextDueDateIdx: index('compliance_tracking_next_due_date_idx').on(table.nextDueDate),
  responsiblePartyIdx: index('compliance_tracking_responsible_party_idx').on(table.responsibleParty),
  riskLevelIdx: index('compliance_tracking_risk_level_idx').on(table.riskLevel),
  complianceLevelIdx: index('compliance_tracking_compliance_level_idx').on(table.complianceLevel),
}));

// Compliance audit log
export const complianceAudits = pgTable('compliance_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  complianceTrackingId: uuid('compliance_tracking_id').references(() => complianceTracking.id).notNull(),

  // Audit details
  auditType: varchar('audit_type', { length: 50 }).notNull(), // internal, external, regulatory, self_assessment
  auditDate: date('audit_date').notNull(),
  auditorName: text('auditor_name'),
  auditingOrganization: text('auditing_organization'),

  // Scope and methodology
  auditScope: text('audit_scope'),
  auditMethodology: text('audit_methodology'),
  sampleSize: integer('sample_size'),

  // Findings
  findingsCount: integer('findings_count').default(0),
  majorFindings: integer('major_findings').default(0),
  minorFindings: integer('minor_findings').default(0),
  observations: integer('observations').default(0),

  // Overall results
  overallRating: varchar('overall_rating', { length: 20 }), // excellent, satisfactory, needs_improvement, unsatisfactory
  complianceScore: decimal('compliance_score', { precision: 5, scale: 4 }), // 0.9500 = 95%

  // Detailed findings
  findings: text('findings'), // JSON array of detailed findings
  recommendations: text('recommendations'), // JSON array of recommendations
  bestPractices: text('best_practices'), // JSON array of observed best practices

  // Follow-up requirements
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  correctiveActionPlan: text('corrective_action_plan'),
  correctiveActionDeadline: date('corrective_action_deadline'),

  // Documentation
  auditReportPath: text('audit_report_path'),
  evidenceCollected: text('evidence_collected'), // JSON array of evidence

  // Status tracking
  status: varchar('status', { length: 20 }).default('in_progress'), // scheduled, in_progress, completed, closed

  // Costs
  auditCost: decimal('audit_cost', { precision: 10, scale: 2 }),
  remediationCost: decimal('remediation_cost', { precision: 10, scale: 2 }),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('compliance_audit_org_idx').on(table.organizationId),
  complianceTrackingIdx: index('compliance_audit_compliance_tracking_idx').on(table.complianceTrackingId),
  auditTypeIdx: index('compliance_audit_audit_type_idx').on(table.auditType),
  auditDateIdx: index('compliance_audit_audit_date_idx').on(table.auditDate),
  statusIdx: index('compliance_audit_status_idx').on(table.status),
  overallRatingIdx: index('compliance_audit_overall_rating_idx').on(table.overallRating),
  followUpRequiredIdx: index('compliance_audit_follow_up_required_idx').on(table.followUpRequired),
  followUpDateIdx: index('compliance_audit_follow_up_date_idx').on(table.followUpDate),
}));

export type QualityMeasure = InferSelectModel<typeof qualityMeasures>;
export type NewQualityMeasure = InferInsertModel<typeof qualityMeasures>;

export type QualityMeasurePerformance = InferSelectModel<typeof qualityMeasurePerformance>;
export type NewQualityMeasurePerformance = InferInsertModel<typeof qualityMeasurePerformance>;

export type ComplianceTracking = InferSelectModel<typeof complianceTracking>;
export type NewComplianceTracking = InferInsertModel<typeof complianceTracking>;

export type ComplianceAudit = InferSelectModel<typeof complianceAudits>;
export type NewComplianceAudit = InferInsertModel<typeof complianceAudits>;

// ===================================
// STAFF SCHEDULING AND RESOURCE MANAGEMENT
// ===================================

// Shift type enum
export const shiftTypeEnum = pgEnum('shift_type', [
  'regular', 'overtime', 'on_call', 'emergency', 'vacation_coverage', 'sick_coverage'
]);

// Resource status enum
export const resourceStatusEnum = pgEnum('resource_status', [
  'available', 'in_use', 'maintenance', 'out_of_service', 'reserved'
]);

// Staff schedules
export const staffSchedules = pgTable('staff_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  staffMemberId: uuid('staff_member_id').references(() => teamMembers.id).notNull(),

  // Schedule details
  scheduleDate: date('schedule_date').notNull(),
  shiftStart: time('shift_start').notNull(),
  shiftEnd: time('shift_end').notNull(),
  shiftType: shiftTypeEnum('shift_type').default('regular').notNull(),

  // Department/location
  departmentId: uuid('department_id'), // Reference to departments table
  locationId: uuid('location_id'), // Reference to locations/facilities

  // Role and responsibilities
  roleTitle: varchar('role_title', { length: 100 }),
  specialtyRequired: varchar('specialty_required', { length: 100 }),
  skillsRequired: text('skills_required'), // JSON array of required skills

  // Break times
  breakStart1: time('break_start_1'),
  breakEnd1: time('break_end_1'),
  breakStart2: time('break_start_2'),
  breakEnd2: time('break_end_2'),
  lunchStart: time('lunch_start'),
  lunchEnd: time('lunch_end'),

  // Status and tracking
  status: scheduleStatusEnum('status').default('scheduled').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // JSON pattern for recurring schedules

  // Assignments
  assignedPatients: text('assigned_patients'), // JSON array of patient IDs
  assignedRooms: text('assigned_rooms'), // JSON array of room IDs

  // Time tracking
  clockInTime: timestamp('clock_in_time'),
  clockOutTime: timestamp('clock_out_time'),
  actualBreakTime: integer('actual_break_time'), // minutes
  actualLunchTime: integer('actual_lunch_time'), // minutes

  // Overtime and compensation
  overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }),
  holidayPay: boolean('holiday_pay').default(false),
  shiftDifferential: decimal('shift_differential', { precision: 5, scale: 2 }), // percentage

  // Coverage and substitution
  coveringForId: uuid('covering_for_id').references(() => teamMembers.id), // If covering for someone
  substituteId: uuid('substitute_id').references(() => teamMembers.id), // If someone is covering this shift

  // Notes and special instructions
  notes: text('notes'),
  specialInstructions: text('special_instructions'),

  // Approval workflow
  approvedBy: uuid('approved_by').references(() => teamMembers.id),
  approvedAt: timestamp('approved_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('staff_schedule_org_idx').on(table.organizationId),
  staffMemberIdx: index('staff_schedule_staff_member_idx').on(table.staffMemberId),
  scheduleDateIdx: index('staff_schedule_date_idx').on(table.scheduleDate),
  statusIdx: index('staff_schedule_status_idx').on(table.status),
  shiftTypeIdx: index('staff_schedule_shift_type_idx').on(table.shiftType),
  departmentIdx: index('staff_schedule_department_idx').on(table.departmentId),
  coveringForIdx: index('staff_schedule_covering_for_idx').on(table.coveringForId),
  clockInIdx: index('staff_schedule_clock_in_idx').on(table.clockInTime),
  recurringIdx: index('staff_schedule_recurring_idx').on(table.isRecurring),
}));

// Resource schedules
export const resourceSchedules = pgTable('resource_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Resource identification
  resourceName: text('resource_name').notNull(),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  resourceIdentifier: varchar('resource_identifier', { length: 50 }), // Room number, equipment ID, etc.

  // Location
  departmentId: uuid('department_id'),
  locationId: uuid('location_id'),
  buildingFloor: varchar('building_floor', { length: 20 }),

  // Scheduling
  scheduleDate: date('schedule_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),

  // Assignment
  assignedToId: uuid('assigned_to_id').references(() => teamMembers.id), // Staff member
  assignedPatientId: uuid('assigned_patient_id').references(() => patients.id),
  assignedAppointmentId: uuid('assigned_appointment_id').references(() => appointments.id),

  // Purpose and usage
  usagePurpose: varchar('usage_purpose', { length: 100 }), // consultation, procedure, surgery, etc.
  procedureType: varchar('procedure_type', { length: 100 }),
  requiredSetup: text('required_setup'), // JSON array of setup requirements

  // Resource details
  capacity: integer('capacity'), // Number of people/patients the resource can accommodate
  features: text('features'), // JSON array of available features
  restrictions: text('restrictions'), // JSON array of usage restrictions

  // Status and availability
  status: resourceStatusEnum('status').default('available').notNull(),
  isMaintenanceScheduled: boolean('is_maintenance_scheduled').default(false),
  maintenanceNotes: text('maintenance_notes'),

  // Cleaning and preparation
  cleaningRequired: boolean('cleaning_required').default(false),
  cleaningCompletedAt: timestamp('cleaning_completed_at'),
  setupTime: integer('setup_time'), // minutes required for setup
  teardownTime: integer('teardown_time'), // minutes required for teardown

  // Utilization tracking
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  utilizationRate: decimal('utilization_rate', { precision: 5, scale: 2 }), // percentage

  // Recurring reservations
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // JSON pattern
  recurringEndDate: date('recurring_end_date'),

  // Cost and billing
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  billableToPatient: boolean('billable_to_patient').default(false),

  // Notes
  notes: text('notes'),
  specialRequirements: text('special_requirements'),

  // Approval
  approvedBy: uuid('approved_by').references(() => teamMembers.id),
  approvedAt: timestamp('approved_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('resource_schedule_org_idx').on(table.organizationId),
  resourceTypeIdx: index('resource_schedule_resource_type_idx').on(table.resourceType),
  resourceIdentifierIdx: index('resource_schedule_identifier_idx').on(table.resourceIdentifier),
  scheduleDateIdx: index('resource_schedule_date_idx').on(table.scheduleDate),
  statusIdx: index('resource_schedule_status_idx').on(table.status),
  assignedToIdx: index('resource_schedule_assigned_to_idx').on(table.assignedToId),
  assignedPatientIdx: index('resource_schedule_assigned_patient_idx').on(table.assignedPatientId),
  departmentIdx: index('resource_schedule_department_idx').on(table.departmentId),
  usagePurposeIdx: index('resource_schedule_usage_purpose_idx').on(table.usagePurpose),
  recurringIdx: index('resource_schedule_recurring_idx').on(table.isRecurring),
}));

// Staff time off requests
export const staffTimeOff = pgTable('staff_time_off', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  staffMemberId: uuid('staff_member_id').references(() => teamMembers.id).notNull(),

  // Time off details
  requestType: varchar('request_type', { length: 50 }).notNull(), // vacation, sick, personal, bereavement, maternity, etc.
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDays: decimal('total_days', { precision: 4, scale: 1 }),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }),

  // Partial day details
  isPartialDay: boolean('is_partial_day').default(false),
  startTime: time('start_time'),
  endTime: time('end_time'),

  // Request details
  reason: text('reason'),
  emergencyRequest: boolean('emergency_request').default(false),
  documentationRequired: boolean('documentation_required').default(false),
  documentationProvided: boolean('documentation_provided').default(false),

  // Approval workflow
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, denied, cancelled
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: uuid('reviewed_by').references(() => teamMembers.id),
  reviewedAt: timestamp('reviewed_at'),
  approvalNotes: text('approval_notes'),

  // Coverage arrangements
  coverageRequired: boolean('coverage_required').default(true),
  coverageArranged: boolean('coverage_arranged').default(false),
  coveringStaffId: uuid('covering_staff_id').references(() => teamMembers.id),
  coverageNotes: text('coverage_notes'),

  // Balance tracking
  balanceBeforeRequest: decimal('balance_before_request', { precision: 6, scale: 2 }),
  balanceAfterRequest: decimal('balance_after_request', { precision: 6, scale: 2 }),

  // Payroll impact
  paidTimeOff: boolean('paid_time_off').default(true),
  payrollProcessed: boolean('payroll_processed').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('staff_time_off_org_idx').on(table.organizationId),
  staffMemberIdx: index('staff_time_off_staff_member_idx').on(table.staffMemberId),
  requestTypeIdx: index('staff_time_off_request_type_idx').on(table.requestType),
  statusIdx: index('staff_time_off_status_idx').on(table.status),
  startDateIdx: index('staff_time_off_start_date_idx').on(table.startDate),
  emergencyIdx: index('staff_time_off_emergency_idx').on(table.emergencyRequest),
  coveringStaffIdx: index('staff_time_off_covering_staff_idx').on(table.coveringStaffId),
  requestedAtIdx: index('staff_time_off_requested_at_idx').on(table.requestedAt),
}));

// Shift change requests
export const shiftChangeRequests = pgTable('shift_change_request', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  requestingStaffId: uuid('requesting_staff_id').references(() => teamMembers.id).notNull(),

  // Original shift details
  originalScheduleId: uuid('original_schedule_id').references(() => staffSchedules.id).notNull(),
  originalShiftDate: date('original_shift_date').notNull(),
  originalShiftStart: time('original_shift_start').notNull(),
  originalShiftEnd: time('original_shift_end').notNull(),

  // Change request details
  changeType: varchar('change_type', { length: 30 }).notNull(), // swap, pickup, drop, modify_time
  requestReason: varchar('request_reason', { length: 50 }), // personal, medical, family, education, etc.
  reasonDescription: text('reason_description'),

  // For swap requests
  targetStaffId: uuid('target_staff_id').references(() => teamMembers.id), // Staff member to swap with
  targetScheduleId: uuid('target_schedule_id').references(() => staffSchedules.id),

  // For time modification requests
  newShiftStart: time('new_shift_start'),
  newShiftEnd: time('new_shift_end'),
  newShiftDate: date('new_shift_date'),

  // Request metadata
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  urgentRequest: boolean('urgent_request').default(false),
  noticeGivenHours: integer('notice_given_hours'), // Hours of advance notice given

  // Approval workflow
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, denied, cancelled, completed
  managerApprovalRequired: boolean('manager_approval_required').default(true),
  managerApprovedBy: uuid('manager_approved_by').references(() => teamMembers.id),
  managerApprovedAt: timestamp('manager_approved_at'),

  // For swap requests - target staff approval
  targetStaffApproved: boolean('target_staff_approved').default(false),
  targetStaffApprovedAt: timestamp('target_staff_approved_at'),

  // Processing
  processedBy: uuid('processed_by').references(() => teamMembers.id),
  processedAt: timestamp('processed_at'),
  processingNotes: text('processing_notes'),

  // Impact assessment
  coverageImpact: varchar('coverage_impact', { length: 20 }), // none, minimal, moderate, significant
  costImpact: decimal('cost_impact', { precision: 8, scale: 2 }), // Additional cost/savings
  patientCareImpact: varchar('patient_care_impact', { length: 20 }), // none, minimal, moderate, significant

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orgIdx: index('shift_change_request_org_idx').on(table.organizationId),
  requestingStaffIdx: index('shift_change_request_requesting_staff_idx').on(table.requestingStaffId),
  originalScheduleIdx: index('shift_change_request_original_schedule_idx').on(table.originalScheduleId),
  changeTypeIdx: index('shift_change_request_change_type_idx').on(table.changeType),
  statusIdx: index('shift_change_request_status_idx').on(table.status),
  targetStaffIdx: index('shift_change_request_target_staff_idx').on(table.targetStaffId),
  requestedAtIdx: index('shift_change_request_requested_at_idx').on(table.requestedAt),
  urgentIdx: index('shift_change_request_urgent_idx').on(table.urgentRequest),
}));

export type StaffSchedule = InferSelectModel<typeof staffSchedules>;
export type NewStaffSchedule = InferInsertModel<typeof staffSchedules>;

export type ResourceSchedule = InferSelectModel<typeof resourceSchedules>;
export type NewResourceSchedule = InferInsertModel<typeof resourceSchedules>;

export type StaffTimeOff = InferSelectModel<typeof staffTimeOff>;
export type NewStaffTimeOff = InferInsertModel<typeof staffTimeOff>;

export type ShiftChangeRequest = InferSelectModel<typeof shiftChangeRequests>;
export type NewShiftChangeRequest = InferInsertModel<typeof shiftChangeRequests>;

// ===================================
// PROVIDER ENROLLMENT AND CREDENTIALING
// ===================================

// Provider enrollment status enum
export const providerEnrollmentStatusEnum = pgEnum('provider_enrollment_status', [
  'pending', 'in_progress', 'approved', 'denied', 'suspended', 'terminated', 'revalidating'
]);

// Provider enrollment type enum
export const providerEnrollmentTypeEnum = pgEnum('provider_enrollment_type', [
  'initial', 'revalidation', 'change_of_ownership', 'change_of_location', 'reassignment'
]);

// Credentialing status enum
export const credentialingStatusEnum = pgEnum('credentialing_status', [
  'not_started', 'in_progress', 'pending_review', 'approved', 'denied', 'expired', 'suspended'
]);

// License status enum
export const licenseStatusEnum = pgEnum('license_status', [
  'active', 'inactive', 'expired', 'suspended', 'revoked', 'pending'
]);

// Provider enrollments (with payers/networks)
export const providerEnrollments = pgTable('provider_enrollment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id),

  // Enrollment details
  enrollmentType: providerEnrollmentTypeEnum('enrollment_type').notNull(),
  networkName: text('network_name'),
  planName: text('plan_name'),
  contractNumber: varchar('contract_number', { length: 50 }),

  // Provider identifiers for this enrollment
  enrollmentNpi: varchar('enrollment_npi', { length: 10 }).notNull(),
  medicareId: varchar('medicare_id', { length: 20 }),
  medicaidId: varchar('medicaid_id', { length: 20 }),

  // Application details
  applicationDate: date('application_date').notNull(),
  submissionDate: date('submission_date'),
  applicationNumber: varchar('application_number', { length: 50 }),

  // Status tracking
  status: providerEnrollmentStatusEnum('status').default('pending').notNull(),
  statusDate: date('status_date').notNull(),
  statusReason: text('status_reason'),

  // Important dates
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  revalidationDueDate: date('revalidation_due_date'),
  terminationDate: date('termination_date'),

  // Enrollment details
  practiceLocations: text('practice_locations'), // JSON array of practice location details
  specialties: text('specialties'), // JSON array of enrolled specialties
  taxonomyCodes: text('taxonomy_codes'), // JSON array of taxonomy codes

  // Fee schedule and reimbursement
  feeSchedule: varchar('fee_schedule', { length: 50 }),
  reimbursementRate: decimal('reimbursement_rate', { precision: 5, scale: 4 }), // 0.8500 = 85%

  // Required documentation
  requiredDocuments: text('required_documents'), // JSON array of required documents
  submittedDocuments: text('submitted_documents'), // JSON array of submitted documents
  missingDocuments: text('missing_documents'), // JSON array of missing documents

  // Processing information
  processingTimeline: text('processing_timeline'), // JSON array of processing milestones
  contactPerson: text('contact_person'),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: text('contact_email'),

  // Quality and compliance
  qualityPrograms: text('quality_programs'), // JSON array of quality programs enrolled in
  complianceRequirements: text('compliance_requirements'), // JSON array of compliance requirements

  // Financial information
  applicationFee: decimal('application_fee', { precision: 10, scale: 2 }),
  enrollmentFee: decimal('enrollment_fee', { precision: 10, scale: 2 }),
  maintenanceFee: decimal('maintenance_fee', { precision: 10, scale: 2 }),

  // Appeal and reconsideration
  appealRights: boolean('appeal_rights').default(true),
  appealDeadline: date('appeal_deadline'),
  appealSubmitted: boolean('appeal_submitted').default(false),
  appealStatus: varchar('appeal_status', { length: 20 }),

  // Notes and comments
  notes: text('notes'),
  internalComments: text('internal_comments'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('provider_enrollment_org_idx').on(table.organizationId),
  providerIdx: index('provider_enrollment_provider_idx').on(table.providerId),
  payerIdx: index('provider_enrollment_payer_idx').on(table.payerId),
  statusIdx: index('provider_enrollment_status_idx').on(table.status),
  enrollmentTypeIdx: index('provider_enrollment_enrollment_type_idx').on(table.enrollmentType),
  enrollmentNpiIdx: index('provider_enrollment_enrollment_npi_idx').on(table.enrollmentNpi),
  applicationDateIdx: index('provider_enrollment_application_date_idx').on(table.applicationDate),
  effectiveDateIdx: index('provider_enrollment_effective_date_idx').on(table.effectiveDate),
  expirationDateIdx: index('provider_enrollment_expiration_date_idx').on(table.expirationDate),
  revalidationDueDateIdx: index('provider_enrollment_revalidation_due_date_idx').on(table.revalidationDueDate),
  applicationNumberIdx: index('provider_enrollment_application_number_idx').on(table.applicationNumber),
}));

// Provider credentials and certifications
export const providerCredentials = pgTable('provider_credential', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Credential type and details
  credentialType: varchar('credential_type', { length: 50 }).notNull(), // license, certification, registration, fellowship, residency
  credentialName: text('credential_name').notNull(),
  credentialNumber: varchar('credential_number', { length: 100 }),

  // Issuing organization
  issuingOrganization: text('issuing_organization').notNull(),
  issuingState: varchar('issuing_state', { length: 2 }),
  issuingCountry: varchar('issuing_country', { length: 3 }).default('USA'),

  // Dates
  issueDate: date('issue_date'),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  renewalDate: date('renewal_date'),

  // Status
  status: licenseStatusEnum('status').default('active').notNull(),
  statusDate: date('status_date').notNull(),
  statusReason: text('status_reason'),

  // Credential details
  specialty: text('specialty'),
  subspecialty: text('subspecialty'),
  practiceScope: text('practice_scope'),
  restrictions: text('restrictions'),
  conditions: text('conditions'),

  // Verification
  verificationRequired: boolean('verification_required').default(true),
  verificationStatus: varchar('verification_status', { length: 20 }), // pending, verified, failed, expired
  verificationDate: date('verification_date'),
  verifiedBy: uuid('verified_by').references(() => teamMembers.id),
  verificationSource: text('verification_source'),
  verificationMethod: varchar('verification_method', { length: 50 }), // primary_source, database, manual

  // Primary source verification
  primarySourceVerified: boolean('primary_source_verified').default(false),
  primarySourceDate: date('primary_source_date'),
  primarySourceContact: text('primary_source_contact'),

  // Renewal and maintenance
  cmeRequired: boolean('cme_required').default(false),
  cmeHoursRequired: integer('cme_hours_required'),
  cmeHoursCompleted: integer('cme_hours_completed'),
  nextCmeDeadline: date('next_cme_deadline'),

  // Disciplinary actions
  hasDisciplinaryActions: boolean('has_disciplinary_actions').default(false),
  disciplinaryActions: text('disciplinary_actions'), // JSON array of disciplinary actions

  // Document management
  documentPath: text('document_path'),
  documentExpirationDate: date('document_expiration_date'),
  reminderSent: boolean('reminder_sent').default(false),
  reminderDate: date('reminder_date'),

  // Notes
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('provider_credential_org_idx').on(table.organizationId),
  providerIdx: index('provider_credential_provider_idx').on(table.providerId),
  credentialTypeIdx: index('provider_credential_credential_type_idx').on(table.credentialType),
  credentialNumberIdx: index('provider_credential_credential_number_idx').on(table.credentialNumber),
  statusIdx: index('provider_credential_status_idx').on(table.status),
  expirationDateIdx: index('provider_credential_expiration_date_idx').on(table.expirationDate),
  renewalDateIdx: index('provider_credential_renewal_date_idx').on(table.renewalDate),
  verificationStatusIdx: index('provider_credential_verification_status_idx').on(table.verificationStatus),
  primarySourceVerifiedIdx: index('provider_credential_primary_source_verified_idx').on(table.primarySourceVerified),
  hasDisciplinaryActionsIdx: index('provider_credential_has_disciplinary_actions_idx').on(table.hasDisciplinaryActions),
  issuingOrganizationIdx: index('provider_credential_issuing_organization_idx').on(table.issuingOrganization),
}));

// Credentialing applications and processes
export const credentialingApplications = pgTable('credentialing_application', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),

  // Application details
  applicationNumber: varchar('application_number', { length: 50 }).notNull(),
  applicationType: varchar('application_type', { length: 50 }).notNull(), // initial, reappointment, privilege_modification, locum_tenens
  applicationDate: date('application_date').notNull(),

  // Credentialing organization
  credentialingOrganization: text('credentialing_organization').notNull(), // hospital, health_system, insurance_plan
  organizationContact: text('organization_contact'),
  organizationPhone: varchar('organization_phone', { length: 20 }),
  organizationEmail: text('organization_email'),

  // Status tracking
  status: credentialingStatusEnum('status').default('not_started').notNull(),
  statusDate: date('status_date').notNull(),
  statusReason: text('status_reason'),

  // Timeline
  submissionDeadline: date('submission_deadline'),
  targetCompletionDate: date('target_completion_date'),
  actualCompletionDate: date('actual_completion_date'),

  // Requested privileges
  requestedPrivileges: text('requested_privileges'), // JSON array of privileges requested
  grantedPrivileges: text('granted_privileges'), // JSON array of privileges granted
  deniedPrivileges: text('denied_privileges'), // JSON array of privileges denied

  // Department/service line
  primaryDepartment: varchar('primary_department', { length: 100 }),
  secondaryDepartments: text('secondary_departments'), // JSON array
  serviceLines: text('service_lines'), // JSON array

  // Professional details
  boardCertifications: text('board_certifications'), // JSON array
  fellowshipTraining: text('fellowship_training'), // JSON array
  residencyTraining: text('residency_training'), // JSON array
  medicalEducation: text('medical_education'), // JSON array

  // Practice history
  practiceHistory: text('practice_history'), // JSON array of practice locations and dates
  hospitalAffiliations: text('hospital_affiliations'), // JSON array

  // References
  professionalReferences: text('professional_references'), // JSON array of references
  peerReferences: text('peer_references'), // JSON array of peer references

  // Background checks
  backgroundCheckRequired: boolean('background_check_required').default(true),
  backgroundCheckCompleted: boolean('background_check_completed').default(false),
  backgroundCheckDate: date('background_check_date'),
  backgroundCheckResults: text('background_check_results'),

  // Insurance and financial
  malpracticeInsurance: text('malpractice_insurance'), // JSON object with insurance details
  deaNumber: varchar('dea_number', { length: 20 }),
  deaExpirationDate: date('dea_expiration_date'),

  // Quality indicators
  qualityIndicators: text('quality_indicators'), // JSON object with quality metrics
  patientSafetyIncidents: text('patient_safety_incidents'), // JSON array

  // Document checklist
  requiredDocuments: text('required_documents'), // JSON array of required documents
  submittedDocuments: text('submitted_documents'), // JSON array of submitted documents
  outstandingDocuments: text('outstanding_documents'), // JSON array of missing documents

  // Committee review
  committeeReviewDate: date('committee_review_date'),
  committeeDecision: varchar('committee_decision', { length: 50 }), // approved, denied, deferred, conditional
  committeeComments: text('committee_comments'),

  // Fees and costs
  applicationFee: decimal('application_fee', { precision: 10, scale: 2 }),
  backgroundCheckFee: decimal('background_check_fee', { precision: 10, scale: 2 }),
  totalFees: decimal('total_fees', { precision: 10, scale: 2 }),
  feesPaid: boolean('fees_paid').default(false),

  // Appeal process
  appealAvailable: boolean('appeal_available').default(true),
  appealDeadline: date('appeal_deadline'),
  appealSubmitted: boolean('appeal_submitted').default(false),

  // Notes and tracking
  notes: text('notes'),
  nextAction: text('next_action'),
  responsibleParty: uuid('responsible_party').references(() => teamMembers.id),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('credentialing_application_org_idx').on(table.organizationId),
  providerIdx: index('credentialing_application_provider_idx').on(table.providerId),
  applicationNumberIdx: index('credentialing_application_application_number_idx').on(table.applicationNumber),
  statusIdx: index('credentialing_application_status_idx').on(table.status),
  applicationTypeIdx: index('credentialing_application_application_type_idx').on(table.applicationType),
  applicationDateIdx: index('credentialing_application_application_date_idx').on(table.applicationDate),
  submissionDeadlineIdx: index('credentialing_application_submission_deadline_idx').on(table.submissionDeadline),
  targetCompletionDateIdx: index('credentialing_application_target_completion_date_idx').on(table.targetCompletionDate),
  credentialingOrganizationIdx: index('credentialing_application_credentialing_organization_idx').on(table.credentialingOrganization),
  responsiblePartyIdx: index('credentialing_application_responsible_party_idx').on(table.responsibleParty),
  committeeReviewDateIdx: index('credentialing_application_committee_review_date_idx').on(table.committeeReviewDate),
}));

// Provider privilege tracking
export const providerPrivileges = pgTable('provider_privilege', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  credentialingApplicationId: uuid('credentialing_application_id').references(() => credentialingApplications.id),

  // Privilege details
  privilegeName: text('privilege_name').notNull(),
  privilegeCode: varchar('privilege_code', { length: 50 }),
  privilegeCategory: varchar('privilege_category', { length: 50 }), // core, special, procedural, administrative

  // Department and service
  department: varchar('department', { length: 100 }).notNull(),
  serviceLine: varchar('service_line', { length: 100 }),
  location: text('location'),

  // Status and dates
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive, suspended, revoked, pending
  grantedDate: date('granted_date').notNull(),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),
  lastReviewDate: date('last_review_date'),
  nextReviewDate: date('next_review_date'),

  // Conditions and restrictions
  conditions: text('conditions'), // JSON array of conditions
  restrictions: text('restrictions'), // JSON array of restrictions
  supervisionRequired: boolean('supervision_required').default(false),
  supervisingPhysician: uuid('supervising_physician').references(() => providers.id),

  // Volume and case requirements
  minimumCaseVolume: integer('minimum_case_volume'),
  actualCaseVolume: integer('actual_case_volume'),
  caseVolumeTrackingPeriod: varchar('case_volume_tracking_period', { length: 20 }), // monthly, quarterly, annually

  // Quality requirements
  outcomeMetrics: text('outcome_metrics'), // JSON object with quality metrics
  complicationRates: text('complication_rates'), // JSON object with complication data
  satisfactionScores: text('satisfaction_scores'), // JSON object with patient satisfaction

  // Training and certification requirements
  trainingRequired: text('training_required'), // JSON array of required training
  trainingCompleted: text('training_completed'), // JSON array of completed training
  certificationRequired: text('certification_required'), // JSON array of certifications
  certificationStatus: text('certification_status'), // JSON array of certification statuses

  // Renewal process
  renewalRequired: boolean('renewal_required').default(true),
  renewalFrequency: varchar('renewal_frequency', { length: 20 }), // annually, biannually
  autoRenewal: boolean('auto_renewal').default(false),
  renewalCriteria: text('renewal_criteria'), // JSON array of renewal criteria

  // Proctoring and monitoring
  proctoringRequired: boolean('proctoring_required').default(false),
  proctoringPhysician: uuid('proctoring_physician').references(() => providers.id),
  proctoringCases: integer('proctoring_cases'),
  proctoringCompleted: boolean('proctoring_completed').default(false),
  proctoringCompletionDate: date('proctoring_completion_date'),

  // Financial implications
  privilegeFee: decimal('privilege_fee', { precision: 10, scale: 2 }),
  renewalFee: decimal('renewal_fee', { precision: 10, scale: 2 }),

  // Documentation
  grantingCommittee: text('granting_committee'),
  grantingRationale: text('granting_rationale'),
  revocationReason: text('revocation_reason'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdBy: uuid('created_by').references(() => teamMembers.id),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('provider_privilege_org_idx').on(table.organizationId),
  providerIdx: index('provider_privilege_provider_idx').on(table.providerId),
  credentialingApplicationIdx: index('provider_privilege_credentialing_application_idx').on(table.credentialingApplicationId),
  privilegeNameIdx: index('provider_privilege_privilege_name_idx').on(table.privilegeName),
  privilegeCodeIdx: index('provider_privilege_privilege_code_idx').on(table.privilegeCode),
  statusIdx: index('provider_privilege_status_idx').on(table.status),
  departmentIdx: index('provider_privilege_department_idx').on(table.department),
  grantedDateIdx: index('provider_privilege_granted_date_idx').on(table.grantedDate),
  expirationDateIdx: index('provider_privilege_expiration_date_idx').on(table.expirationDate),
  nextReviewDateIdx: index('provider_privilege_next_review_date_idx').on(table.nextReviewDate),
  supervisingPhysicianIdx: index('provider_privilege_supervising_physician_idx').on(table.supervisingPhysician),
}));

export type ProviderEnrollment = InferSelectModel<typeof providerEnrollments>;
export type NewProviderEnrollment = InferInsertModel<typeof providerEnrollments>;

// ============================================================================
// MISSING CRITICAL RCM TABLES
// ============================================================================

// Adjustment Reason Codes - Critical for claim adjustments
export const adjustmentReasonCodes = pgTable('adjustment_reason_code', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details
  code: varchar('code', { length: 10 }).notNull(),
  codeType: adjustmentCodeTypeEnum('code_type').notNull(),
  category: adjustmentReasonCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 100 }),

  // Payer specific
  payerId: uuid('payer_id').references(() => payers.id),
  payerSpecificCode: varchar('payer_specific_code', { length: 20 }),

  // Financial impact
  financialClass: varchar('financial_class', { length: 50 }), // patient_responsibility, contractual, etc
  requiresPatientNotification: boolean('requires_patient_notification').default(false),
  appealable: boolean('appealable').default(false),

  // Status
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  codeIdx: index('adjustment_reason_code_code_idx').on(table.code),
  codeTypeIdx: index('adjustment_reason_code_type_idx').on(table.codeType),
  categoryIdx: index('adjustment_reason_code_category_idx').on(table.category),
  payerIdx: index('adjustment_reason_code_payer_idx').on(table.payerId),
  activeIdx: index('adjustment_reason_code_active_idx').on(table.isActive),
}));

// CPT Code Master - Essential for procedure coding
export const cptCodeMaster = pgTable('cpt_code_master', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  shortDescription: varchar('short_description', { length: 100 }).notNull(),
  longDescription: text('long_description').notNull(),

  // Classification
  category: varchar('category', { length: 50 }), // E/M, Surgery, Radiology, etc
  section: varchar('section', { length: 50 }),
  subsection: varchar('subsection', { length: 50 }),

  // Billing information
  rvuWork: decimal('rvu_work', { precision: 10, scale: 4 }),
  rvuPracticeExpense: decimal('rvu_practice_expense', { precision: 10, scale: 4 }),
  rvuMalpractice: decimal('rvu_malpractice', { precision: 10, scale: 4 }),
  rvuTotal: decimal('rvu_total', { precision: 10, scale: 4 }),

  // Usage rules
  bilateralSurgery: boolean('bilateral_surgery').default(false),
  assistantSurgeon: boolean('assistant_surgeon').default(false),
  coSurgeon: boolean('co_surgeon').default(false),
  multipleProc: boolean('multiple_proc').default(false),

  // Additional billing fields from guide
  globalPeriod: varchar('global_period', { length: 10 }),
  priorAuthCommonlyRequired: boolean('prior_auth_commonly_required').default(false),
  modifier51Exempt: boolean('modifier_51_exempt').default(false),

  // Usage tracking from guide
  usageCount: integer('usage_count').default(0),
  lastUsedDate: date('last_used_date'),

  // Status and dates
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Existing indexes
  cptCodeIdx: index('cpt_code_master_cpt_code_idx').on(table.cptCode),
  categoryIdx: index('cpt_code_master_category_idx').on(table.category),
  activeIdx: index('cpt_code_master_active_idx').on(table.isActive),

  // Performance indexes from guide
  // RVU-based queries (for billing calculations)
  rvuIdx: index('cpt_code_master_rvu_idx').on(table.rvuTotal),

  // Prior auth required codes
  priorAuthIdx: index('cpt_code_master_prior_auth_idx').on(table.priorAuthCommonlyRequired),

  // Hot CPT codes
  hotCodesIdx: index('cpt_code_master_hot_codes_idx').on(table.usageCount, table.cptCode),

  // Global period for billing workflows
  globalPeriodIdx: index('cpt_code_master_global_period_idx').on(table.globalPeriod),

  // Usage tracking for caching decisions
  usageTrackingIdx: index('cpt_code_master_usage_tracking_idx').on(table.usageCount, table.lastUsedDate),
}));

// ICD-10 Code Master - Essential for diagnosis coding
export const icd10CodeMaster = pgTable('icd10_code_master', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details
  icd10Code: varchar('icd10_code', { length: 10 }).notNull(),
  shortDescription: varchar('short_description', { length: 100 }).notNull(),
  longDescription: text('long_description').notNull(),

  // Classification
  chapter: varchar('chapter', { length: 100 }), // Chapter name (e.g., "Diseases of the circulatory system")
  chapterRange: varchar('chapter_range', { length: 20 }), // Chapter code range (e.g., "I00-I99")
  section: varchar('section', { length: 100 }), // Section within chapter
  category: varchar('category', { length: 50 }), // 3-character category code

  // Code characteristics
  codeType: varchar('code_type', { length: 20 }), // diagnosis, procedure, external_cause, etc.
  laterality: varchar('laterality', { length: 20 }), // left, right, bilateral, unspecified
  encounter: varchar('encounter', { length: 20 }), // initial, subsequent, sequela

  // Clinical information
  ageGroup: varchar('age_group', { length: 50 }), // adult, pediatric, newborn, etc.
  gender: varchar('gender', { length: 20 }), // male, female, unspecified

  // Code usage
  reportingRequired: boolean('reporting_required').default(false),
  publicHealthReporting: boolean('public_health_reporting').default(false),
  manifestationCode: boolean('manifestation_code').default(false), // Cannot be primary diagnosis

  // Additional fields from guide
  isBillable: boolean('is_billable').default(true).notNull(),
  isHeader: boolean('is_header').default(false).notNull(),
  requiresAdditionalDigit: boolean('requires_additional_digit').default(false).notNull(),

  // Usage tracking from guide
  usageCount: integer('usage_count').default(0),
  lastUsedDate: date('last_used_date'),

  // Status and dates
  isActive: boolean('is_active').default(true).notNull(),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Existing indexes
  icd10CodeIdx: index('icd10_code_master_icd10_code_idx').on(table.icd10Code),
  chapterIdx: index('icd10_code_master_chapter_idx').on(table.chapter),
  categoryIdx: index('icd10_code_master_category_idx').on(table.category),
  codeTypeIdx: index('icd10_code_master_code_type_idx').on(table.codeType),
  activeIdx: index('icd10_code_master_active_idx').on(table.isActive),

  // Performance indexes from guide
  // Billable codes only (most queries need billable codes)
  billableActiveIdx: index('icd10_code_master_billable_active_idx').on(table.icd10Code).where(
    and(eq(table.isBillable, true), eq(table.isActive, true))!
  ),

  // Hot codes index (frequently used)
  hotCodesIdx: index('icd10_code_master_hot_codes_idx').on(table.icd10Code, table.shortDescription).where(
    gt(table.usageCount, 100)
  ),

  // Composite index for common query patterns
  compositeIdx: index('icd10_code_master_composite_idx').on(
    table.icd10Code,
    table.shortDescription,
    table.category,
    table.isBillable
  ).where(eq(table.isActive, true)),

  // Usage tracking for caching decisions
  usageTrackingIdx: index('icd10_code_master_usage_tracking_idx').on(table.usageCount, table.lastUsedDate),
}));

// HCPCS Level II Code Master - Healthcare Common Procedure Coding System Level II
export const hcpcsCodeMaster = pgTable('hcpcs_code_master', {
  id: uuid('id').primaryKey().defaultRandom(),

  // HCPCS code details
  hcpcsCode: varchar('hcpcs_code', { length: 10 }).notNull().unique(),
  shortDescription: varchar('short_description', { length: 100 }),
  longDescription: text('long_description'),

  // Classification
  category: varchar('category', { length: 100 }), // Transportation Services, Enteral and Parenteral Therapy, etc.
  level: varchar('level', { length: 10 }).default('II'), // Level I (CPT) or Level II (National)

  // Administrative codes
  actionCode: varchar('action_code', { length: 50 }), // A=Add, C=Change, D=Discontinued, etc.
  coverageStatus: varchar('coverage_status', { length: 50 }),
  pricingIndicator: varchar('pricing_indicator', { length: 50 }),
  multiplePricingIndicator: varchar('multiple_pricing_indicator', { length: 50 }),

  // Billing and payment
  aSCPaymentIndicator: varchar('asc_payment_indicator', { length: 10 }),
  aSCGroupPaymentWeight: decimal('asc_group_payment_weight', { precision: 10, scale: 4 }),

  // Status and tracking
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date'),
  terminationDate: date('termination_date'),
  usageCount: integer('usage_count').default(0),
  lastUsedDate: timestamp('last_used_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Primary indexes
  hcpcsCodeIdx: index('hcpcs_code_master_code_idx').on(table.hcpcsCode),
  categoryIdx: index('hcpcs_code_master_category_idx').on(table.category),
  activeIdx: index('hcpcs_code_master_active_idx').on(table.isActive),
  actionCodeIdx: index('hcpcs_code_master_action_code_idx').on(table.actionCode),

  // Date-based indexes
  effectiveDateIdx: index('hcpcs_code_master_effective_date_idx').on(table.effectiveDate),

  // Performance indexes
  activeCodesIdx: index('hcpcs_code_master_active_codes_idx').on(
    table.hcpcsCode,
    table.shortDescription,
    table.category
  ).where(eq(table.isActive, true)),

  // Usage tracking
  usageTrackingIdx: index('hcpcs_code_master_usage_tracking_idx').on(table.usageCount, table.lastUsedDate),
}));

// Cross-reference table for code relationships
export const codeCrosswalk = pgTable('code_crosswalk', {
  id: serial('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Code references
  icd10CodeId: uuid('icd10_code_id').references(() => icd10CodeMaster.id),
  cptCodeId: uuid('cpt_code_id').references(() => cptCodeMaster.id),

  // Relationship details
  relationshipType: varchar('relationship_type', { length: 50 }), // 'commonly_paired', 'requires_support', etc.
  payerSpecific: varchar('payer_specific', { length: 100 }),
  effectivenessDate: date('effectiveness_date'),
  terminationDate: date('termination_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('code_crosswalk_org_idx').on(table.organizationId),
  icd10Idx: index('code_crosswalk_icd10_idx').on(table.icd10CodeId),
  cptIdx: index('code_crosswalk_cpt_idx').on(table.cptCodeId),
  relationshipIdx: index('code_crosswalk_relationship_idx').on(table.relationshipType),
}));

// Audit table for code updates
export const codeUpdateHistory = pgTable('code_update_history', {
  id: serial('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Changed entity details
  tableName: varchar('table_name', { length: 50 }).notNull(), // 'cpt_code_master' or 'icd10_code_master'
  codeId: uuid('code_id'), // References either icd10_code_master.id or cpt_code_master.id
  codeValue: varchar('code_value', { length: 10 }),

  // Change details
  fieldChanged: varchar('field_changed', { length: 100 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changeType: varchar('change_type', { length: 20 }).notNull(), // 'INSERT', 'UPDATE', 'DELETE'

  // Change attribution
  changedBy: uuid('changed_by').references(() => teamMembers.id),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  updateSource: varchar('update_source', { length: 100 }), // 'CMS', 'AMA', 'Manual', etc.
}, (table) => ({
  orgIdx: index('code_update_history_org_idx').on(table.organizationId),
  tableIdx: index('code_update_history_table_idx').on(table.tableName),
  codeIdx: index('code_update_history_code_idx').on(table.codeId),
  changedByIdx: index('code_update_history_changed_by_idx').on(table.changedBy),
  changedAtIdx: index('code_update_history_changed_at_idx').on(table.changedAt),
}));

// Table for tracking most commonly used codes (for caching optimization)
export const hotCodesCache = pgTable('hot_codes_cache', {
  id: serial('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Code identification
  codeType: varchar('code_type', { length: 10 }).notNull(), // 'ICD10' or 'CPT'
  codeId: uuid('code_id'), // References either table
  codeValue: varchar('code_value', { length: 10 }).notNull(),

  // Usage tracking
  usageCount: integer('usage_count').default(0),
  lastCalculated: timestamp('last_calculated').defaultNow().notNull(),
  shouldCache: boolean('should_cache').default(false),
}, (table) => ({
  orgIdx: index('hot_codes_cache_org_idx').on(table.organizationId),
  codeTypeIdx: index('hot_codes_cache_code_type_idx').on(table.codeType),
  codeIdx: index('hot_codes_cache_code_idx').on(table.codeId),
  usageIdx: index('hot_codes_cache_usage_idx').on(table.usageCount),
  shouldCacheIdx: index('hot_codes_cache_should_cache_idx').on(table.shouldCache),
}));

// Staging tables for annual code updates
export const cptCodeStaging = pgTable('cpt_code_staging', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details (same structure as cptCodeMaster)
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  shortDescription: varchar('short_description', { length: 100 }).notNull(),
  longDescription: text('long_description').notNull(),

  // Classification
  category: varchar('category', { length: 50 }),
  section: varchar('section', { length: 50 }),
  subsection: varchar('subsection', { length: 50 }),

  // Billing information
  rvuWork: decimal('rvu_work', { precision: 10, scale: 4 }),
  rvuPracticeExpense: decimal('rvu_practice_expense', { precision: 10, scale: 4 }),
  rvuMalpractice: decimal('rvu_malpractice', { precision: 10, scale: 4 }),
  rvuTotal: decimal('rvu_total', { precision: 10, scale: 4 }),

  // Usage rules
  bilateralSurgery: boolean('bilateral_surgery').default(false),
  assistantSurgeon: boolean('assistant_surgeon').default(false),
  coSurgeon: boolean('co_surgeon').default(false),
  multipleProc: boolean('multiple_proc').default(false),

  // Additional billing fields
  globalPeriod: varchar('global_period', { length: 10 }),
  priorAuthCommonlyRequired: boolean('prior_auth_commonly_required').default(false),
  modifier51Exempt: boolean('modifier_51_exempt').default(false),

  // Status and dates
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Staging metadata
  updateYear: integer('update_year').notNull(),
  importBatch: varchar('import_batch', { length: 50 }),
  validationStatus: varchar('validation_status', { length: 20 }).default('pending'),
  validationErrors: jsonb('validation_errors'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cptCodeIdx: index('cpt_code_staging_cpt_code_idx').on(table.cptCode),
  updateYearIdx: index('cpt_code_staging_update_year_idx').on(table.updateYear),
  batchIdx: index('cpt_code_staging_batch_idx').on(table.importBatch),
  validationIdx: index('cpt_code_staging_validation_idx').on(table.validationStatus),
}));

export const icd10CodeStaging = pgTable('icd10_code_staging', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details (same structure as icd10CodeMaster)
  icd10Code: varchar('icd10_code', { length: 10 }).notNull(),
  shortDescription: varchar('short_description', { length: 100 }).notNull(),
  longDescription: text('long_description').notNull(),

  // Classification
  chapter: varchar('chapter', { length: 100 }),
  chapterRange: varchar('chapter_range', { length: 20 }),
  section: varchar('section', { length: 100 }),
  category: varchar('category', { length: 50 }),

  // Code characteristics
  codeType: varchar('code_type', { length: 20 }),
  laterality: varchar('laterality', { length: 20 }),
  encounter: varchar('encounter', { length: 20 }),

  // Clinical information
  ageGroup: varchar('age_group', { length: 50 }),
  gender: varchar('gender', { length: 20 }),

  // Code usage
  reportingRequired: boolean('reporting_required').default(false),
  publicHealthReporting: boolean('public_health_reporting').default(false),
  manifestationCode: boolean('manifestation_code').default(false),

  // Additional fields
  isBillable: boolean('is_billable').default(true),
  isHeader: boolean('is_header').default(false),
  requiresAdditionalDigit: boolean('requires_additional_digit').default(false),

  // Status and dates
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Staging metadata
  updateYear: integer('update_year').notNull(),
  importBatch: varchar('import_batch', { length: 50 }),
  validationStatus: varchar('validation_status', { length: 20 }).default('pending'),
  validationErrors: jsonb('validation_errors'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  icd10CodeIdx: index('icd10_code_staging_icd10_code_idx').on(table.icd10Code),
  updateYearIdx: index('icd10_code_staging_update_year_idx').on(table.updateYear),
  batchIdx: index('icd10_code_staging_batch_idx').on(table.importBatch),
  validationIdx: index('icd10_code_staging_validation_idx').on(table.validationStatus),
}));

export const hcpcsCodeStaging = pgTable('hcpcs_code_staging', {
  id: uuid('id').primaryKey().defaultRandom(),

  // HCPCS code details (same structure as hcpcsCodeMaster)
  hcpcsCode: varchar('hcpcs_code', { length: 10 }).notNull(),
  shortDescription: varchar('short_description', { length: 100 }),
  longDescription: text('long_description'),

  // Classification
  category: varchar('category', { length: 100 }), // Transportation Services, Enteral and Parenteral Therapy, etc.
  level: varchar('level', { length: 10 }).default('II'), // Level I (CPT) or Level II (National)

  // Administrative codes
  actionCode: varchar('action_code', { length: 50 }), // A=Add, C=Change, D=Discontinued, etc.
  coverageStatus: varchar('coverage_status', { length: 50 }),
  pricingIndicator: varchar('pricing_indicator', { length: 50 }),
  multiplePricingIndicator: varchar('multiple_pricing_indicator', { length: 50 }),

  // Billing and payment
  aSCPaymentIndicator: varchar('asc_payment_indicator', { length: 10 }),
  aSCGroupPaymentWeight: decimal('asc_group_payment_weight', { precision: 10, scale: 4 }),

  // Status and dates
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date'),
  terminationDate: date('termination_date'),

  // Staging metadata
  updateYear: integer('update_year').notNull(),
  importBatch: varchar('import_batch', { length: 50 }),
  validationStatus: varchar('validation_status', { length: 20 }).default('pending'),
  validationErrors: jsonb('validation_errors'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  hcpcsCodeIdx: index('hcpcs_code_staging_hcpcs_code_idx').on(table.hcpcsCode),
  updateYearIdx: index('hcpcs_code_staging_update_year_idx').on(table.updateYear),
  batchIdx: index('hcpcs_code_staging_batch_idx').on(table.importBatch),
  validationIdx: index('hcpcs_code_staging_validation_idx').on(table.validationStatus),
}));

// Annual update tracking
export const annualCodeUpdates = pgTable('annual_code_update', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Update details
  updateYear: integer('update_year').notNull(),
  codeType: varchar('code_type', { length: 10 }).notNull(), // 'ICD10' or 'CPT'

  // Update process tracking
  status: varchar('status', { length: 20 }).default('planned'), // planned, in_progress, completed, failed, rolled_back
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Statistics
  totalRecordsProcessed: integer('total_records_processed'),
  newCodes: integer('new_codes'),
  updatedCodes: integer('updated_codes'),
  deprecatedCodes: integer('deprecated_codes'),

  // Data source
  sourceFile: varchar('source_file', { length: 255 }),
  sourceChecksum: varchar('source_checksum', { length: 64 }),
  sourceUrl: text('source_url'),

  // Backup information
  backupLocation: text('backup_location'),
  canRollback: boolean('can_rollback').default(true),

  // Error handling
  errorMessage: text('error_message'),
  validationErrors: jsonb('validation_errors'),

  // Attribution
  initiatedBy: uuid('initiated_by').references(() => teamMembers.id),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  yearTypeIdx: index('annual_code_update_year_type_idx').on(table.updateYear, table.codeType),
  statusIdx: index('annual_code_update_status_idx').on(table.status),
  initiatedByIdx: index('annual_code_update_initiated_by_idx').on(table.initiatedBy),
}));

// Place of Service - Service location codes
export const placeOfService = pgTable('place_of_service', {
  id: uuid('id').primaryKey().defaultRandom(),

  // POS details
  posCode: varchar('pos_code', { length: 5 }).notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 100 }),

  // Classification
  category: varchar('category', { length: 50 }), // facility, non_facility
  subcategory: varchar('subcategory', { length: 50 }),

  // Usage
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  posCodeIdx: index('place_of_service_pos_code_idx').on(table.posCode),
  activeIdx: index('place_of_service_active_idx').on(table.isActive),
}));

// Modifier Codes - Medical coding modifiers
export const modifierCodes = pgTable('modifier_code', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Modifier details
  modifierCode: varchar('modifier_code', { length: 5 }).notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 100 }),

  // Classification
  category: varchar('category', { length: 50 }), // anesthesia, surgery, radiology, etc
  type: varchar('type', { length: 30 }), // informational, pricing, payment

  // Usage rules
  levelIIndicator: varchar('level_i_indicator', { length: 10 }),
  levelIIIndicator: varchar('level_ii_indicator', { length: 10 }),

  // Status
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  modifierCodeUnique: unique('modifier_code_unique').on(table.modifierCode),
  modifierCodeIdx: index('modifier_code_modifier_code_idx').on(table.modifierCode),
  categoryIdx: index('modifier_code_category_idx').on(table.category),
  activeIdx: index('modifier_code_active_idx').on(table.isActive),
}));

// Claim Validation - Essential for claim processing
export const claimValidations = pgTable('claim_validation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),

  // Validation details
  validationType: varchar('validation_type', { length: 50 }).notNull(), // eligibility, benefits, coding, clinical
  validationRule: text('validation_rule').notNull(),
  validationResult: varchar('validation_result', { length: 20 }).notNull(), // passed, failed, warning

  // Error details
  errorCode: varchar('error_code', { length: 20 }),
  errorMessage: text('error_message'),
  errorSeverity: varchar('error_severity', { length: 20 }), // critical, warning, info

  // Resolution
  canAutoFix: boolean('can_auto_fix').default(false),
  autoFixApplied: boolean('auto_fix_applied').default(false),
  manualReviewRequired: boolean('manual_review_required').default(false),

  // Confidence scoring
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }), // 0.0000 to 1.0000

  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, resolved, ignored
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => teamMembers.id),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('claim_validation_org_idx').on(table.organizationId),
  claimIdx: index('claim_validation_claim_idx').on(table.claimId),
  validationTypeIdx: index('claim_validation_type_idx').on(table.validationType),
  resultIdx: index('claim_validation_result_idx').on(table.validationResult),
  statusIdx: index('claim_validation_status_idx').on(table.status),
}));

// Benefits Coverage - Patient benefit coverage details
export const benefitsCoverage = pgTable('benefits_coverage', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  insurancePolicyId: uuid('insurance_policy_id').references(() => insurancePolicies.id).notNull(),

  // Coverage details
  serviceCategory: varchar('service_category', { length: 50 }).notNull(), // medical, dental, vision, mental_health
  serviceType: varchar('service_type', { length: 50 }), // inpatient, outpatient, emergency, preventive

  // Financial terms
  deductible: decimal('deductible', { precision: 10, scale: 2 }),
  deductibleMet: decimal('deductible_met', { precision: 10, scale: 2 }).default('0'),
  outOfPocketMax: decimal('out_of_pocket_max', { precision: 10, scale: 2 }),
  outOfPocketMet: decimal('out_of_pocket_met', { precision: 10, scale: 2 }).default('0'),

  // Copay/Coinsurance
  copay: decimal('copay', { precision: 8, scale: 2 }),
  coinsurancePatient: decimal('coinsurance_patient', { precision: 5, scale: 4 }), // 0.2000 = 20%
  coinsurancePlan: decimal('coinsurance_plan', { precision: 5, scale: 4 }), // 0.8000 = 80%

  // Limits
  visitLimit: integer('visit_limit'),
  visitLimitPeriod: varchar('visit_limit_period', { length: 20 }), // annual, monthly
  amountLimit: decimal('amount_limit', { precision: 10, scale: 2 }),
  amountLimitPeriod: varchar('amount_limit_period', { length: 20 }),

  // Authorization requirements
  priorAuthRequired: boolean('prior_auth_required').default(false),
  referralRequired: boolean('referral_required').default(false),
  preApprovalRequired: boolean('pre_approval_required').default(false),

  // Network status
  inNetwork: boolean('in_network').default(true),
  networkTier: varchar('network_tier', { length: 20 }), // tier1, tier2, out_of_network

  // Status and dates
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  terminationDate: date('termination_date'),
  lastVerifiedDate: date('last_verified_date'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('benefits_coverage_org_idx').on(table.organizationId),
  patientIdx: index('benefits_coverage_patient_idx').on(table.patientId),
  insuranceIdx: index('benefits_coverage_insurance_idx').on(table.insurancePolicyId),
  serviceCategoryIdx: index('benefits_coverage_service_category_idx').on(table.serviceCategory),
  activeIdx: index('benefits_coverage_active_idx').on(table.isActive),
}));

// Payer Configuration - Payer-specific configurations
export const payerConfigs = pgTable('payer_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Submission settings
  submissionMethod: varchar('submission_method', { length: 30 }).notNull(), // electronic, paper, portal
  clearinghouseId: uuid('clearinghouse_id').references(() => clearinghouseConnections.id),

  // Claim settings
  requiresPriorAuth: boolean('requires_prior_auth').default(false),
  priorAuthTypes: text('prior_auth_types'), // JSON array
  maxClaimsPerBatch: integer('max_claims_per_batch').default(100),

  // Timing settings
  submissionFrequency: varchar('submission_frequency', { length: 20 }), // daily, weekly, real_time
  submissionTimes: text('submission_times'), // JSON array of times
  followUpDays: integer('follow_up_days').default(30),

  // Appeal settings
  appealTimeLimit: integer('appeal_time_limit').default(90), // days
  secondLevelAppealTimeLimit: integer('second_level_appeal_time_limit').default(180),
  appealSubmissionMethod: varchar('appeal_submission_method', { length: 30 }),

  // Payment settings
  paymentMethod: varchar('payment_method', { length: 30 }), // ach, check, eft
  paymentFrequency: varchar('payment_frequency', { length: 20 }), // weekly, bi_weekly, monthly
  expectedPaymentDays: integer('expected_payment_days').default(30),

  // Contact information
  contactName: varchar('contact_name', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 100 }),
  submissionAddress: text('submission_address'),
  appealAddress: text('appeal_address'),

  // Status
  isActive: boolean('is_active').default(true),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('payer_config_org_idx').on(table.organizationId),
  payerIdx: index('payer_config_payer_idx').on(table.payerId),
  submissionMethodIdx: index('payer_config_submission_method_idx').on(table.submissionMethod),
  activeIdx: index('payer_config_active_idx').on(table.isActive),
}));

export type ProviderCredential = InferSelectModel<typeof providerCredentials>;
export type NewProviderCredential = InferInsertModel<typeof providerCredentials>;

export type CredentialingApplication = InferSelectModel<typeof credentialingApplications>;
export type NewCredentialingApplication = InferInsertModel<typeof credentialingApplications>;

export type ProviderPrivilege = InferSelectModel<typeof providerPrivileges>;
export type NewProviderPrivilege = InferInsertModel<typeof providerPrivileges>;

// ============================================================================
// MISSING CRITICAL RCM TABLE TYPE EXPORTS
// ============================================================================

export type AdjustmentReasonCode = InferSelectModel<typeof adjustmentReasonCodes>;
export type NewAdjustmentReasonCode = InferInsertModel<typeof adjustmentReasonCodes>;

export type CptCodeMaster = InferSelectModel<typeof cptCodeMaster>;
export type NewCptCodeMaster = InferInsertModel<typeof cptCodeMaster>;

export type PlaceOfService = InferSelectModel<typeof placeOfService>;
export type NewPlaceOfService = InferInsertModel<typeof placeOfService>;

export type ModifierCode = InferSelectModel<typeof modifierCodes>;
export type NewModifierCode = InferInsertModel<typeof modifierCodes>;

export type ClaimValidation = InferSelectModel<typeof claimValidations>;
export type NewClaimValidation = InferInsertModel<typeof claimValidations>;

export type BenefitsCoverage = InferSelectModel<typeof benefitsCoverage>;
export type NewBenefitsCoverage = InferInsertModel<typeof benefitsCoverage>;

export type PayerConfig = InferSelectModel<typeof payerConfigs>;
export type NewPayerConfig = InferInsertModel<typeof payerConfigs>;

// ============================================================================
// ADDITIONAL CRITICAL MISSING TABLES
// ============================================================================

// Business Rule Conditions - Essential for automation rules
export const businessRuleConditions = pgTable('business_rule_condition', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  businessRuleId: uuid('business_rule_id').references(() => businessRules.id).notNull(),

  // Condition details
  conditionType: varchar('condition_type', { length: 50 }).notNull(), // field_value, calculation, date_range, etc
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  operator: varchar('operator', { length: 20 }).notNull(), // equals, not_equals, greater_than, contains, etc
  expectedValue: text('expected_value'),

  // Logic
  logicalOperator: varchar('logical_operator', { length: 10 }).default('AND'), // AND, OR
  grouping: varchar('grouping', { length: 10 }), // for parenthetical grouping

  // Processing
  isActive: boolean('is_active').default(true),
  evaluationOrder: integer('evaluation_order').default(1),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('business_rule_condition_org_idx').on(table.organizationId),
  ruleIdx: index('business_rule_condition_rule_idx').on(table.businessRuleId),
  fieldIdx: index('business_rule_condition_field_idx').on(table.fieldName),
  activeIdx: index('business_rule_condition_active_idx').on(table.isActive),
}));

// EHR System - Electronic Health Record system configurations
export const ehrSystems = pgTable('ehr_system', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // System details
  systemName: text('system_name').notNull(),
  vendor: varchar('vendor', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }),

  // Integration details
  apiType: ehrApiTypeEnum('api_type').default('fhir').notNull(),
  baseUrl: text('base_url').notNull(),
  authMethod: ehrAuthMethodEnum('auth_method').default('oauth2').notNull(),

  // Configuration
  clientId: varchar('client_id', { length: 255 }),
  redirectUri: text('redirect_uri'),
  scopes: text('scopes'), // JSON array of OAuth scopes

  // Capabilities
  supportedResources: text('supported_resources'), // JSON array of FHIR resources
  supportedOperations: text('supported_operations'), // JSON array of operations

  // Data sync settings
  syncEnabled: boolean('sync_enabled').default(false),
  syncFrequency: varchar('sync_frequency', { length: 20 }), // real_time, hourly, daily
  lastSyncAt: timestamp('last_sync_at'),

  // Status
  isActive: boolean('is_active').default(true),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('ehr_system_org_idx').on(table.organizationId),
  vendorIdx: index('ehr_system_vendor_idx').on(table.vendor),
  activeIdx: index('ehr_system_active_idx').on(table.isActive),
}));

// Automation Events - Event tracking for automation
export const automationEvents = pgTable('automation_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  automationRuleId: uuid('automation_rule_id').references(() => automationRules.id).notNull(),

  // Event details
  eventType: varchar('event_type', { length: 50 }).notNull(), // trigger, execution, completion, error
  eventData: json('event_data').$type<Record<string, any>>().default({}),

  // Context
  contextType: varchar('context_type', { length: 50 }), // claim, patient, appointment, etc
  contextId: uuid('context_id'),

  // Execution details
  executionId: uuid('execution_id'), // Groups related events
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),

  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, running, completed, failed
  errorMessage: text('error_message'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('automation_event_org_idx').on(table.organizationId),
  ruleIdx: index('automation_event_rule_idx').on(table.automationRuleId),
  contextIdx: index('automation_event_context_idx').on(table.contextType, table.contextId),
  executionIdx: index('automation_event_execution_idx').on(table.executionId),
  statusIdx: index('automation_event_status_idx').on(table.status),
  startedAtIdx: index('automation_event_started_at_idx').on(table.startedAt),
}));

// Claim State History - Track claim status changes
export const claimStateHistory = pgTable('claim_state_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id).notNull(),

  // State change details
  fromStatus: claimStatusEnum('from_status'),
  toStatus: claimStatusEnum('to_status').notNull(),
  changeReason: text('change_reason'),

  // Context
  changedBy: uuid('changed_by').references(() => teamMembers.id),
  changeDate: timestamp('change_date').defaultNow().notNull(),

  // Additional data
  notes: text('notes'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('claim_state_history_org_idx').on(table.organizationId),
  claimIdx: index('claim_state_history_claim_idx').on(table.claimId),
  toStatusIdx: index('claim_state_history_to_status_idx').on(table.toStatus),
  changeDateIdx: index('claim_state_history_change_date_idx').on(table.changeDate),
}));

// Payment Posting Activity - Track payment posting events
export const paymentPostingActivity = pgTable('payment_posting_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Session tracking
  sessionId: uuid('session_id').notNull(),
  batchNumber: varchar('batch_number', { length: 50 }),

  // Payment details
  paymentId: uuid('payment_id').references(() => paymentDetails.id),
  claimId: uuid('claim_id').references(() => claims.id),

  // Activity details
  activityType: varchar('activity_type', { length: 50 }).notNull(), // payment, adjustment, denial, reversal
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),

  // Processing
  postedBy: uuid('posted_by').references(() => teamMembers.id).notNull(),
  postedAt: timestamp('posted_at').defaultNow().notNull(),

  // Status
  status: varchar('status', { length: 20 }).default('posted'), // posted, reversed, corrected

  // Notes
  notes: text('notes'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('payment_posting_activity_org_idx').on(table.organizationId),
  sessionIdx: index('payment_posting_activity_session_idx').on(table.sessionId),
  paymentIdx: index('payment_posting_activity_payment_idx').on(table.paymentId),
  claimIdx: index('payment_posting_activity_claim_idx').on(table.claimId),
  activityTypeIdx: index('payment_posting_activity_activity_type_idx').on(table.activityType),
  postedAtIdx: index('payment_posting_activity_posted_at_idx').on(table.postedAt),
}));

// Revenue Cycle Metrics - KPI tracking
export const revenueCycleMetrics = pgTable('revenue_cycle_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Reporting period
  reportingPeriod: date('reporting_period').notNull(),
  periodType: varchar('period_type', { length: 20 }).notNull(), // daily, weekly, monthly, quarterly

  // Days in AR
  daysInAR: decimal('days_in_ar', { precision: 6, scale: 2 }),
  daysInAR30: decimal('days_in_ar_30', { precision: 6, scale: 2 }),
  daysInAR60: decimal('days_in_ar_60', { precision: 6, scale: 2 }),
  daysInAR90: decimal('days_in_ar_90', { precision: 6, scale: 2 }),
  daysInAR120Plus: decimal('days_in_ar_120_plus', { precision: 6, scale: 2 }),

  // Collection rates
  collectionRate: decimal('collection_rate', { precision: 5, scale: 4 }), // 0.9500 = 95%
  netCollectionRate: decimal('net_collection_rate', { precision: 5, scale: 4 }),
  grossCollectionRate: decimal('gross_collection_rate', { precision: 5, scale: 4 }),

  // Denial metrics
  denialRate: decimal('denial_rate', { precision: 5, scale: 4 }),
  denialOverturnRate: decimal('denial_overturn_rate', { precision: 5, scale: 4 }),
  cleanClaimRate: decimal('clean_claim_rate', { precision: 5, scale: 4 }),

  // Financial metrics
  totalCharges: decimal('total_charges', { precision: 12, scale: 2 }),
  totalCollections: decimal('total_collections', { precision: 12, scale: 2 }),
  totalAdjustments: decimal('total_adjustments', { precision: 12, scale: 2 }),
  totalWriteOffs: decimal('total_write_offs', { precision: 12, scale: 2 }),

  // Operational metrics
  claimsSubmitted: integer('claims_submitted'),
  claimsPaid: integer('claims_paid'),
  claimsDenied: integer('claims_denied'),
  claimsPending: integer('claims_pending'),

  // Cost metrics
  costToCollect: decimal('cost_to_collect', { precision: 8, scale: 4 }), // cost per dollar collected

  // Metadata
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  calculatedBy: uuid('calculated_by').references(() => teamMembers.id),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('revenue_cycle_metrics_org_idx').on(table.organizationId),
  reportingPeriodIdx: index('revenue_cycle_metrics_reporting_period_idx').on(table.reportingPeriod),
  periodTypeIdx: index('revenue_cycle_metrics_period_type_idx').on(table.periodType),
  calculatedAtIdx: index('revenue_cycle_metrics_calculated_at_idx').on(table.calculatedAt),
}));

// Organization invitations (team functionality moved to organization level)
export const organizationInvitations = pgTable('organization_invitation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Invitation details
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  clerkInvitationId: varchar('clerk_invitation_id', { length: 255 }), // Links to Clerk invitation events

  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, expired, cancelled
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  invitedBy: uuid('invited_by').references(() => teamMembers.id).notNull(),
}, (table) => ({
  orgIdx: index('org_invitation_org_idx').on(table.organizationId),
  emailIdx: index('org_invitation_email_idx').on(table.email),
  tokenIdx: index('org_invitation_token_idx').on(table.token),
  statusIdx: index('org_invitation_status_idx').on(table.status),
}));

// System Settings - Application configuration
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // Setting details
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: text('setting_value'),
  settingType: varchar('setting_type', { length: 20 }).notNull(), // string, number, boolean, json

  // Scope
  scope: varchar('scope', { length: 20 }).default('organization'), // global, organization, user
  userId: uuid('user_id').references(() => teamMembers.id),

  // Metadata
  description: text('description'),
  isReadonly: boolean('is_readonly').default(false),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('system_settings_org_idx').on(table.organizationId),
  keyIdx: index('system_settings_key_idx').on(table.settingKey),
  scopeIdx: index('system_settings_scope_idx').on(table.scope),
  userIdx: index('system_settings_user_idx').on(table.userId),
  uniqueOrgKey: index('system_settings_unique_org_key').on(table.organizationId, table.settingKey, table.userId),
}));

// ============================================================================
// MISSING ESSENTIAL TABLES
// ============================================================================

export const claimAttachments = pgTable('claim_attachment', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimId: uuid('claim_id').references(() => claims.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileSize: integer('file_size').notNull(),
  s3Key: varchar('s3_key', { length: 255 }).notNull(),
  description: text('description'),
  isRequired: boolean('is_required').default(false),
  uploadedBy: uuid('uploaded_by').references(() => teamMembers.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const automationRetries = pgTable('automation_retry', {
  id: serial('id').primaryKey(),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  taskId: varchar('task_id', { length: 255 }).notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  maxAttempts: integer('max_attempts').notNull().default(3),
  nextRetryAt: timestamp('next_retry_at'),
  backoffStrategy: retryBackoffStrategyEnum('backoff_strategy').default('exponential'),
  lastError: text('last_error'),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const confidenceThresholds = pgTable('confidence_thresholds', {
  id: serial('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  lowThreshold: decimal('low_threshold', { precision: 5, scale: 4 }).notNull(),
  mediumThreshold: decimal('medium_threshold', { precision: 5, scale: 4 }).notNull(),
  highThreshold: decimal('high_threshold', { precision: 5, scale: 4 }).notNull(),
  autoProcessThreshold: decimal('auto_process_threshold', { precision: 5, scale: 4 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const customFields = pgTable('custom_field', {
  id: serial('id').primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  isRequired: boolean('is_required').default(false),
  defaultValue: text('default_value'),
  validationRules: jsonb('validation_rules'),
  options: jsonb('options'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const customFieldMappings = pgTable('custom_field_mapping', {
  id: serial('id').primaryKey(),
  customFieldId: integer('custom_field_id').references(() => customFields.id),
  ehrSystem: varchar('ehr_system', { length: 100 }).notNull(),
  ehrFieldPath: varchar('ehr_field_path', { length: 500 }).notNull(),
  transformationRules: jsonb('transformation_rules'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const customFieldValues = pgTable('custom_field_value', {
  id: serial('id').primaryKey(),
  customFieldId: integer('custom_field_id').references(() => customFields.id),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  value: text('value'),
  dataSource: dataSourceTypeEnum('data_source').default('manual_entry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const paClinicalCriteria = pgTable('pa_clinical_criteria', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cptCodes: jsonb('cpt_codes'),
  icdCodes: jsonb('icd_codes'),
  drugCodes: jsonb('drug_codes'),
  criteria: jsonb('criteria').notNull(),
  payerId: uuid('payer_id').references(() => payers.id),
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const paRequirementRules = pgTable('pa_requirement_rule', {
  id: serial('id').primaryKey(),
  payerId: uuid('payer_id').references(() => payers.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  conditions: jsonb('conditions').notNull(),
  requiredDocuments: jsonb('required_documents'),
  autoApprovalCriteria: jsonb('auto_approval_criteria'),
  priority: integer('priority').default(0),
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payerOverrideRules = pgTable('payer_override_rule', {
  id: serial('id').primaryKey(),
  payerId: uuid('payer_id').references(() => payers.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priority: integer('priority').default(0),
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payerOverrideConditions = pgTable('payer_override_condition', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').references(() => payerOverrideRules.id),
  field: varchar('field', { length: 255 }).notNull(),
  operator: varchar('operator', { length: 50 }).notNull(),
  value: text('value'),
  logicalOperator: varchar('logical_operator', { length: 10 }).default('AND'),
  createdAt: timestamp('created_at').defaultNow()
});

export const payerOverrideActions = pgTable('payer_override_action', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').references(() => payerOverrideRules.id),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  targetField: varchar('target_field', { length: 255 }),
  newValue: text('new_value'),
  parameters: jsonb('parameters'),
  createdAt: timestamp('created_at').defaultNow()
});

export const ruleConditions = pgTable('rule_condition', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').notNull(),
  ruleType: varchar('rule_type', { length: 100 }).notNull(),
  field: varchar('field', { length: 255 }).notNull(),
  operator: varchar('operator', { length: 50 }).notNull(),
  value: text('value'),
  logicalOperator: varchar('logical_operator', { length: 10 }).default('AND'),
  groupId: varchar('group_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const ruleExecutionLogs = pgTable('rule_execution_log', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').notNull(),
  ruleType: varchar('rule_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  executedAt: timestamp('executed_at').defaultNow(),
  result: varchar('result', { length: 50 }).notNull(),
  conditions: jsonb('conditions'),
  actions: jsonb('actions'),
  executionTime: integer('execution_time'),
  error: text('error'),
  metadata: jsonb('metadata')
});

export const workflowStates = pgTable('workflow_state', {
  id: serial('id').primaryKey(),
  workflowType: varchar('workflow_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  currentState: varchar('current_state', { length: 100 }).notNull(),
  previousState: varchar('previous_state', { length: 100 }),
  stateData: jsonb('state_data'),
  transitions: jsonb('transitions'),
  assignedTo: uuid('assigned_to').references(() => teamMembers.id),
  dueAt: timestamp('due_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const paymentVariances = pgTable('payment_variance', {
  id: serial('id').primaryKey(),
  paymentId: uuid('payment_id').references(() => paymentDetails.id),
  claimId: uuid('claim_id').references(() => claims.id),
  varianceType: varianceTypeEnum('variance_type').notNull(),
  expectedAmount: decimal('expected_amount', { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 10, scale: 2 }).notNull(),
  varianceAmount: decimal('variance_amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('pending'),
  resolvedBy: uuid('resolved_by').references(() => teamMembers.id),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Type exports for new tables
export type BusinessRuleCondition = InferSelectModel<typeof businessRuleConditions>;
export type NewBusinessRuleCondition = InferInsertModel<typeof businessRuleConditions>;

export type EhrSystem = InferSelectModel<typeof ehrSystems>;
export type NewEhrSystem = InferInsertModel<typeof ehrSystems>;

export type AutomationEvent = InferSelectModel<typeof automationEvents>;
export type NewAutomationEvent = InferInsertModel<typeof automationEvents>;

export type ClaimStateHistory = InferSelectModel<typeof claimStateHistory>;
export type NewClaimStateHistory = InferInsertModel<typeof claimStateHistory>;

export type PaymentPostingActivity = InferSelectModel<typeof paymentPostingActivity>;
export type NewPaymentPostingActivity = InferInsertModel<typeof paymentPostingActivity>;

export type RevenueCycleMetrics = InferSelectModel<typeof revenueCycleMetrics>;
export type NewRevenueCycleMetrics = InferInsertModel<typeof revenueCycleMetrics>;

export type OrganizationInvitation = InferSelectModel<typeof organizationInvitations>;
export type NewOrganizationInvitation = InferInsertModel<typeof organizationInvitations>;

export type SystemSettings = InferSelectModel<typeof systemSettings>;
export type NewSystemSettings = InferInsertModel<typeof systemSettings>;

export type ClaimAttachment = InferSelectModel<typeof claimAttachments>;
export type NewClaimAttachment = InferInsertModel<typeof claimAttachments>;

export type AutomationRetry = InferSelectModel<typeof automationRetries>;
export type NewAutomationRetry = InferInsertModel<typeof automationRetries>;

export type ConfidenceThreshold = InferSelectModel<typeof confidenceThresholds>;
export type NewConfidenceThreshold = InferInsertModel<typeof confidenceThresholds>;

export type CustomField = InferSelectModel<typeof customFields>;
export type NewCustomField = InferInsertModel<typeof customFields>;

export type CustomFieldMapping = InferSelectModel<typeof customFieldMappings>;
export type NewCustomFieldMapping = InferInsertModel<typeof customFieldMappings>;

export type CustomFieldValue = InferSelectModel<typeof customFieldValues>;
export type NewCustomFieldValue = InferInsertModel<typeof customFieldValues>;

export type PaClinicalCriteria = InferSelectModel<typeof paClinicalCriteria>;
export type NewPaClinicalCriteria = InferInsertModel<typeof paClinicalCriteria>;

export type PaRequirementRule = InferSelectModel<typeof paRequirementRules>;
export type NewPaRequirementRule = InferInsertModel<typeof paRequirementRules>;

export type PayerOverrideRule = InferSelectModel<typeof payerOverrideRules>;
export type NewPayerOverrideRule = InferInsertModel<typeof payerOverrideRules>;

export type PayerOverrideCondition = InferSelectModel<typeof payerOverrideConditions>;
export type NewPayerOverrideCondition = InferInsertModel<typeof payerOverrideConditions>;

export type PayerOverrideAction = InferSelectModel<typeof payerOverrideActions>;
export type NewPayerOverrideAction = InferInsertModel<typeof payerOverrideActions>;

export type RuleCondition = InferSelectModel<typeof ruleConditions>;
export type NewRuleCondition = InferInsertModel<typeof ruleConditions>;

export type RuleExecutionLog = InferSelectModel<typeof ruleExecutionLogs>;
export type NewRuleExecutionLog = InferInsertModel<typeof ruleExecutionLogs>;

export type WorkflowState = InferSelectModel<typeof workflowStates>;
export type NewWorkflowState = InferInsertModel<typeof workflowStates>;

export type PaymentVariance = InferSelectModel<typeof paymentVariances>;
export type NewPaymentVariance = InferInsertModel<typeof paymentVariances>;

// ============================================================================
// ADDITIONAL TABLES
// ============================================================================

// API Version tracking
export const apiVersions = pgTable('api_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Version details
  serviceName: varchar('service_name', { length: 100 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  releaseDate: date('release_date').notNull(),

  // Status
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, deprecated, sunset
  isBackwardCompatible: boolean('is_backward_compatible').default(true),

  // Deprecation
  deprecationDate: date('deprecation_date'),
  sunsetDate: date('sunset_date'),
  migrationGuide: text('migration_guide'),

  // Metadata
  releaseNotes: text('release_notes'),
  breakingChanges: text('breaking_changes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('api_version_org_idx').on(table.organizationId),
  serviceIdx: index('api_version_service_idx').on(table.serviceName),
  versionIdx: index('api_version_version_idx').on(table.version),
  statusIdx: index('api_version_status_idx').on(table.status),
}));

// EM Time Rules for E/M coding
export const emTimeRules = pgTable('em_time_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Rule details
  cptCode: varchar('cpt_code', { length: 10 }).notNull(),
  serviceCategory: varchar('service_category', { length: 50 }).notNull(), // office_visit, consult, hospital

  // Time thresholds
  minTime: integer('min_time').notNull(), // minutes
  maxTime: integer('max_time'), // minutes
  typicalTime: integer('typical_time'), // minutes

  // Rule conditions
  requiresCounselingCoordination: boolean('requires_counseling_coordination').default(false),
  counselingThresholdPercent: integer('counseling_threshold_percent'), // >50% for time-based billing

  // Documentation requirements
  timeDocumentationRequired: boolean('time_documentation_required').default(true),
  startEndTimeRequired: boolean('start_end_time_required').default(false),

  // Status
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('em_time_rule_org_idx').on(table.organizationId),
  cptCodeIdx: index('em_time_rule_cpt_code_idx').on(table.cptCode),
  serviceCategoryIdx: index('em_time_rule_service_category_idx').on(table.serviceCategory),
  activeIdx: index('em_time_rule_active_idx').on(table.isActive),
}));

// FHIR Resource tracking
export const fhirResources = pgTable('fhir_resource', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // FHIR details
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // Patient, Claim, etc.
  resourceId: varchar('resource_id', { length: 100 }).notNull(),
  version: varchar('version', { length: 10 }).default('R4'),

  // Source system
  sourceSystem: varchar('source_system', { length: 100 }).notNull(),
  sourceId: varchar('source_id', { length: 100 }),

  // Resource content
  resourceData: jsonb('resource_data').notNull(),
  lastModified: timestamp('last_modified').notNull(),

  // Sync status
  syncStatus: varchar('sync_status', { length: 20 }).default('pending'), // pending, synced, error
  syncError: text('sync_error'),
  lastSyncAt: timestamp('last_sync_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('fhir_resource_org_idx').on(table.organizationId),
  resourceTypeIdx: index('fhir_resource_type_idx').on(table.resourceType),
  resourceIdIdx: index('fhir_resource_id_idx').on(table.resourceId),
  sourceSystemIdx: index('fhir_resource_source_system_idx').on(table.sourceSystem),
  syncStatusIdx: index('fhir_resource_sync_status_idx').on(table.syncStatus),
  lastModifiedIdx: index('fhir_resource_last_modified_idx').on(table.lastModified),
}));

// Field Mapping Templates for EHR integration
export const fieldMappingTemplates = pgTable('field_mapping_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Template details
  templateName: varchar('template_name', { length: 100 }).notNull(),
  description: text('description'),
  sourceSystem: varchar('source_system', { length: 100 }).notNull(),
  targetSystem: varchar('target_system', { length: 100 }).notNull(),

  // Entity mapping
  sourceEntity: varchar('source_entity', { length: 100 }).notNull(), // patient, claim, etc.
  targetEntity: varchar('target_entity', { length: 100 }).notNull(),

  // Field mappings
  fieldMappings: jsonb('field_mappings').notNull(), // Array of field mappings
  transformationRules: jsonb('transformation_rules'), // Data transformation rules
  validationRules: jsonb('validation_rules'), // Data validation rules

  // Template metadata
  version: varchar('version', { length: 20 }).default('1.0'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),

  // Usage tracking
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('field_mapping_template_org_idx').on(table.organizationId),
  templateNameIdx: index('field_mapping_template_name_idx').on(table.templateName),
  sourceSystemIdx: index('field_mapping_template_source_system_idx').on(table.sourceSystem),
  targetSystemIdx: index('field_mapping_template_target_system_idx').on(table.targetSystem),
  activeIdx: index('field_mapping_template_active_idx').on(table.isActive),
}));

// Patient Quality Measures
export const patientQualityMeasures = pgTable('patient_quality_measure', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  qualityMeasureId: uuid('quality_measure_id').references(() => qualityMeasures.id).notNull(),

  // Measurement details
  measurementDate: date('measurement_date').notNull(),
  reportingPeriod: varchar('reporting_period', { length: 20 }).notNull(), // 2024Q1, 2024

  // Patient eligibility
  isEligible: boolean('is_eligible').notNull(),
  eligibilityReason: text('eligibility_reason'),

  // Performance status
  meetsNumerator: boolean('meets_numerator').default(false),
  meetsDenominator: boolean('meets_denominator').default(false),
  isExcluded: boolean('is_excluded').default(false),
  exclusionReason: text('exclusion_reason'),

  // Clinical data
  clinicalDataElements: jsonb('clinical_data_elements'), // Supporting clinical data
  evidenceSources: jsonb('evidence_sources'), // Where the data came from

  // Risk adjustment
  riskFactors: jsonb('risk_factors'),
  riskScore: decimal('risk_score', { precision: 8, scale: 4 }),

  // Performance score
  performanceScore: decimal('performance_score', { precision: 5, scale: 4 }),

  // Quality improvement opportunities
  improvementOpportunities: text('improvement_opportunities'),
  recommendedActions: text('recommended_actions'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  calculatedBy: uuid('calculated_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('patient_quality_measure_org_idx').on(table.organizationId),
  patientIdx: index('patient_quality_measure_patient_idx').on(table.patientId),
  qualityMeasureIdx: index('patient_quality_measure_quality_measure_idx').on(table.qualityMeasureId),
  measurementDateIdx: index('patient_quality_measure_measurement_date_idx').on(table.measurementDate),
  reportingPeriodIdx: index('patient_quality_measure_reporting_period_idx').on(table.reportingPeriod),
  isEligibleIdx: index('patient_quality_measure_is_eligible_idx').on(table.isEligible),
  meetsNumeratorIdx: index('patient_quality_measure_meets_numerator_idx').on(table.meetsNumerator),
}));

// Payer Portal Credentials
export const payerPortalCredentials = pgTable('payer_portal_credential', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Portal details
  portalName: varchar('portal_name', { length: 100 }).notNull(),
  portalUrl: text('portal_url').notNull(),
  portalType: varchar('portal_type', { length: 50 }), // provider_portal, claim_portal, auth_portal

  // Credentials (encrypted)
  username: varchar('username', { length: 100 }).notNull(),
  encryptedPassword: text('encrypted_password').notNull(),

  // Additional auth
  securityQuestions: jsonb('security_questions'), // Encrypted security Q&A
  twoFactorSecret: varchar('two_factor_secret', { length: 100 }), // Encrypted 2FA secret

  // Session management
  sessionTimeout: integer('session_timeout').default(30), // minutes
  lastLoginAt: timestamp('last_login_at'),
  sessionToken: text('session_token'),

  // Credential status
  isActive: boolean('is_active').default(true),
  credentialStatus: varchar('credential_status', { length: 20 }).default('active'), // active, expired, locked, invalid
  lastValidated: timestamp('last_validated'),

  // Automation settings
  autoLoginEnabled: boolean('auto_login_enabled').default(false),
  lastAutoLogin: timestamp('last_auto_login'),
  loginFrequency: varchar('login_frequency', { length: 20 }), // daily, weekly, as_needed

  // Security
  passwordLastChanged: timestamp('password_last_changed'),
  passwordExpiryDate: date('password_expiry_date'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lastFailedLogin: timestamp('last_failed_login'),

  // Notes
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('payer_portal_credential_org_idx').on(table.organizationId),
  payerIdx: index('payer_portal_credential_payer_idx').on(table.payerId),
  portalNameIdx: index('payer_portal_credential_portal_name_idx').on(table.portalName),
  usernameIdx: index('payer_portal_credential_username_idx').on(table.username),
  activeIdx: index('payer_portal_credential_active_idx').on(table.isActive),
  credentialStatusIdx: index('payer_portal_credential_status_idx').on(table.credentialStatus),
}));

// Payer Submission Configuration
export const payerSubmissionConfigs = pgTable('payer_submission_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),

  // Submission method configuration
  submissionMethod: varchar('submission_method', { length: 30 }).notNull(), // electronic, portal, paper
  clearinghouseId: uuid('clearinghouse_id').references(() => clearinghouseConnections.id),

  // Electronic submission settings
  submitterTaxId: varchar('submitter_tax_id', { length: 20 }),
  submitterNpi: varchar('submitter_npi', { length: 10 }),
  receiverId: varchar('receiver_id', { length: 50 }),

  // Batch settings
  maxClaimsPerBatch: integer('max_claims_per_batch').default(100),
  batchSubmissionTimes: jsonb('batch_submission_times'), // Array of submission times

  // File formats
  fileFormat: varchar('file_format', { length: 20 }), // X12_837, FHIR, proprietary
  fileVersion: varchar('file_version', { length: 10 }),
  characterSet: varchar('character_set', { length: 20 }).default('UTF-8'),

  // Portal-specific settings
  portalCredentialId: uuid('portal_credential_id').references(() => payerPortalCredentials.id),
  portalSubmissionPath: text('portal_submission_path'),

  // Validation settings
  preSubmissionValidation: boolean('pre_submission_validation').default(true),
  validationRules: jsonb('validation_rules'),

  // Response handling
  acknowledgmentRequired: boolean('acknowledgment_required').default(true),
  acknowledgmentTimeout: integer('acknowledgment_timeout').default(72), // hours
  autoProcessAcknowledgment: boolean('auto_process_acknowledgment').default(true),

  // Retry settings
  retryOnFailure: boolean('retry_on_failure').default(true),
  maxRetryAttempts: integer('max_retry_attempts').default(3),
  retryDelay: integer('retry_delay').default(60), // minutes

  // Tracking
  trackSubmissionStatus: boolean('track_submission_status').default(true),
  statusCheckFrequency: integer('status_check_frequency').default(24), // hours

  // Status
  isActive: boolean('is_active').default(true),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('payer_submission_config_org_idx').on(table.organizationId),
  payerIdx: index('payer_submission_config_payer_idx').on(table.payerId),
  submissionMethodIdx: index('payer_submission_config_submission_method_idx').on(table.submissionMethod),
  clearinghouseIdx: index('payer_submission_config_clearinghouse_idx').on(table.clearinghouseId),
  activeIdx: index('payer_submission_config_active_idx').on(table.isActive),
}));

// Payer Response Messages
export const payerResponseMessages = pgTable('payer_response_message', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),
  claimId: uuid('claim_id').references(() => claims.id),

  // Message details
  messageType: varchar('message_type', { length: 50 }).notNull(), // acknowledgment, rejection, payment, denial
  messageId: varchar('message_id', { length: 100 }),
  responseCode: varchar('response_code', { length: 20 }),

  // Content
  rawMessage: text('raw_message').notNull(),
  parsedData: jsonb('parsed_data'),

  // Processing
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'), // pending, processed, error
  processedAt: timestamp('processed_at'),
  processingError: text('processing_error'),

  // Related entities
  remittanceAdviceId: uuid('remittance_advice_id').references(() => remittanceAdvice.id),
  batchId: uuid('batch_id'),

  // Message metadata
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  messageSize: integer('message_size'),
  messageFormat: varchar('message_format', { length: 20 }), // X12_835, JSON, XML

  // Actions taken
  actionsTaken: jsonb('actions_taken'), // Array of automated actions
  requiresManualReview: boolean('requires_manual_review').default(false),
  reviewedBy: uuid('reviewed_by').references(() => teamMembers.id),
  reviewedAt: timestamp('reviewed_at'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('payer_response_message_org_idx').on(table.organizationId),
  payerIdx: index('payer_response_message_payer_idx').on(table.payerId),
  claimIdx: index('payer_response_message_claim_idx').on(table.claimId),
  messageTypeIdx: index('payer_response_message_type_idx').on(table.messageType),
  processingStatusIdx: index('payer_response_message_processing_status_idx').on(table.processingStatus),
  receivedAtIdx: index('payer_response_message_received_at_idx').on(table.receivedAt),
  requiresManualReviewIdx: index('payer_response_message_requires_manual_review_idx').on(table.requiresManualReview),
}));

// Portal Automation Tasks
export const portalAutomationTasks = pgTable('portal_automation_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  payerId: uuid('payer_id').references(() => payers.id).notNull(),
  portalCredentialId: uuid('portal_credential_id').references(() => payerPortalCredentials.id).notNull(),

  // Task details
  taskType: varchar('task_type', { length: 50 }).notNull(), // check_claims, submit_auth, download_era
  taskName: varchar('task_name', { length: 100 }).notNull(),
  description: text('description'),

  // Scheduling
  isScheduled: boolean('is_scheduled').default(false),
  scheduleExpression: varchar('schedule_expression', { length: 100 }), // cron expression
  nextRunTime: timestamp('next_run_time'),
  lastRunTime: timestamp('last_run_time'),

  // Task configuration
  taskParameters: jsonb('task_parameters'), // Task-specific configuration
  automationSteps: jsonb('automation_steps'), // Array of automation steps

  // Execution tracking
  status: varchar('status', { length: 20 }).default('active'), // active, paused, disabled, error
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),

  // Last execution details
  lastExecutionStatus: varchar('last_execution_status', { length: 20 }), // success, failure, partial
  lastExecutionDuration: integer('last_execution_duration'), // seconds
  lastExecutionError: text('last_execution_error'),
  lastExecutionLog: text('last_execution_log'),

  // Performance metrics
  averageExecutionTime: integer('average_execution_time'), // seconds
  successRate: decimal('success_rate', { precision: 5, scale: 4 }), // 0.9500 = 95%

  // Retry configuration
  retryOnFailure: boolean('retry_on_failure').default(true),
  maxRetries: integer('max_retries').default(3),
  retryDelay: integer('retry_delay').default(300), // seconds

  // Monitoring
  enableAlerts: boolean('enable_alerts').default(true),
  alertThreshold: integer('alert_threshold').default(3), // consecutive failures
  lastAlertSent: timestamp('last_alert_sent'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('portal_automation_task_org_idx').on(table.organizationId),
  payerIdx: index('portal_automation_task_payer_idx').on(table.payerId),
  portalCredentialIdx: index('portal_automation_task_portal_credential_idx').on(table.portalCredentialId),
  taskTypeIdx: index('portal_automation_task_type_idx').on(table.taskType),
  statusIdx: index('portal_automation_task_status_idx').on(table.status),
  nextRunTimeIdx: index('portal_automation_task_next_run_time_idx').on(table.nextRunTime),
  isScheduledIdx: index('portal_automation_task_is_scheduled_idx').on(table.isScheduled),
}));

// Sync Jobs for EHR integration
export const syncJobs = pgTable('sync_job', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  ehrSystemId: uuid('ehr_system_id').references(() => ehrSystems.id).notNull(),

  // Job details
  jobName: varchar('job_name', { length: 100 }).notNull(),
  jobType: varchar('job_type', { length: 50 }).notNull(), // patient_sync, appointment_sync, document_sync
  direction: varchar('direction', { length: 10 }).notNull(), // inbound, outbound, bidirectional

  // Sync configuration
  syncFrequency: varchar('sync_frequency', { length: 20 }), // real_time, hourly, daily, weekly
  syncSchedule: varchar('sync_schedule', { length: 100 }), // cron expression

  // Entity configuration
  entityType: varchar('entity_type', { length: 50 }).notNull(), // patient, appointment, document
  fieldMappingTemplateId: uuid('field_mapping_template_id').references(() => fieldMappingTemplates.id),

  // Filter criteria
  syncFilters: jsonb('sync_filters'), // Filters for which records to sync
  dataRange: jsonb('data_range'), // Date ranges, record limits, etc.

  // Status tracking
  status: syncStatusEnum('status').default('pending').notNull(),
  isActive: boolean('is_active').default(true),

  // Execution tracking
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  lastSyncDuration: integer('last_sync_duration'), // seconds

  // Performance metrics
  totalRecordsProcessed: integer('total_records_processed').default(0),
  recordsCreated: integer('records_created').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsSkipped: integer('records_skipped').default(0),
  recordsErrored: integer('records_errored').default(0),

  // Error tracking
  lastSyncError: text('last_sync_error'),
  errorCount: integer('error_count').default(0),
  consecutiveErrors: integer('consecutive_errors').default(0),

  // Rate limiting
  rateLimitPerMinute: integer('rate_limit_per_minute').default(60),
  batchSize: integer('batch_size').default(100),

  // Monitoring
  enableAlertsOnFailure: boolean('enable_alerts_on_failure').default(true),
  alertAfterConsecutiveFailures: integer('alert_after_consecutive_failures').default(3),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('sync_job_org_idx').on(table.organizationId),
  ehrSystemIdx: index('sync_job_ehr_system_idx').on(table.ehrSystemId),
  jobTypeIdx: index('sync_job_type_idx').on(table.jobType),
  entityTypeIdx: index('sync_job_entity_type_idx').on(table.entityType),
  statusIdx: index('sync_job_status_idx').on(table.status),
  activeIdx: index('sync_job_active_idx').on(table.isActive),
  nextSyncAtIdx: index('sync_job_next_sync_at_idx').on(table.nextSyncAt),
}));

// Trading Partners (EDI)
export const tradingPartners = pgTable('trading_partner', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

  // Partner details
  partnerName: varchar('partner_name', { length: 100 }).notNull(),
  partnerType: varchar('partner_type', { length: 50 }).notNull(), // clearinghouse, payer, vendor, bank
  businessType: varchar('business_type', { length: 50 }), // healthcare, financial, technology

  // EDI identification
  ediId: varchar('edi_id', { length: 50 }),
  isaSenderId: varchar('isa_sender_id', { length: 15 }),
  isaReceiverId: varchar('isa_receiver_id', { length: 15 }),
  gsApplicationSenderId: varchar('gs_application_sender_id', { length: 15 }),
  gsApplicationReceiverId: varchar('gs_application_receiver_id', { length: 15 }),

  // Contact information
  contactName: varchar('contact_name', { length: 100 }),
  contactEmail: varchar('contact_email', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  technicalContactName: varchar('technical_contact_name', { length: 100 }),
  technicalContactEmail: varchar('technical_contact_email', { length: 100 }),
  technicalContactPhone: varchar('technical_contact_phone', { length: 20 }),

  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),

  // Communication settings
  preferredCommunicationMethod: varchar('preferred_communication_method', { length: 20 }), // edi, ftp, sftp, as2, email
  connectionType: varchar('connection_type', { length: 20 }), // direct, vas, clearinghouse

  // Transaction capabilities
  supportedTransactions: jsonb('supported_transactions'), // Array of transaction types (837, 835, 277, etc.)
  testingCapabilities: jsonb('testing_capabilities'),
  productionCapabilities: jsonb('production_capabilities'),

  // Compliance and certification
  hipaaCompliant: boolean('hipaa_compliant').default(true),
  certifications: jsonb('certifications'), // Array of certifications
  complianceNotes: text('compliance_notes'),

  // Service level agreements
  slaDocumentPath: text('sla_document_path'),
  responseTimeGuarantee: integer('response_time_guarantee'), // hours
  uptimeGuarantee: decimal('uptime_guarantee', { precision: 5, scale: 4 }), // 0.9999 = 99.99%
  supportHours: varchar('support_hours', { length: 100 }),

  // Financial terms
  feeStructure: jsonb('fee_structure'),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  autoRenewal: boolean('auto_renewal').default(false),

  // Status and relationship
  partnershipStatus: varchar('partnership_status', { length: 20 }).default('active'), // active, inactive, testing, suspended
  relationshipStartDate: date('relationship_start_date'),

  // Performance tracking
  totalTransactionsProcessed: integer('total_transactions_processed').default(0),
  averageResponseTime: integer('average_response_time'), // minutes
  lastActivityDate: timestamp('last_activity_date'),

  // Notes
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => teamMembers.id),
}, (table) => ({
  orgIdx: index('trading_partner_org_idx').on(table.organizationId),
  partnerNameIdx: index('trading_partner_name_idx').on(table.partnerName),
  partnerTypeIdx: index('trading_partner_type_idx').on(table.partnerType),
  ediIdIdx: index('trading_partner_edi_id_idx').on(table.ediId),
  statusIdx: index('trading_partner_status_idx').on(table.partnershipStatus),
  isaSenderIdIdx: index('trading_partner_isa_sender_id_idx').on(table.isaSenderId),
  isaReceiverIdIdx: index('trading_partner_isa_receiver_id_idx').on(table.isaReceiverId),
}));

// ============================================================================
// TYPE EXPORTS FOR ADDITIONAL TABLES
// ============================================================================

export type ApiVersion = InferSelectModel<typeof apiVersions>;
export type NewApiVersion = InferInsertModel<typeof apiVersions>;

export type EmTimeRule = InferSelectModel<typeof emTimeRules>;
export type NewEmTimeRule = InferInsertModel<typeof emTimeRules>;

export type FhirResource = InferSelectModel<typeof fhirResources>;
export type NewFhirResource = InferInsertModel<typeof fhirResources>;

export type FieldMappingTemplate = InferSelectModel<typeof fieldMappingTemplates>;
export type NewFieldMappingTemplate = InferInsertModel<typeof fieldMappingTemplates>;

export type PatientQualityMeasure = InferSelectModel<typeof patientQualityMeasures>;
export type NewPatientQualityMeasure = InferInsertModel<typeof patientQualityMeasures>;

export type PayerPortalCredential = InferSelectModel<typeof payerPortalCredentials>;
export type NewPayerPortalCredential = InferInsertModel<typeof payerPortalCredentials>;

export type PayerSubmissionConfig = InferSelectModel<typeof payerSubmissionConfigs>;
export type NewPayerSubmissionConfig = InferInsertModel<typeof payerSubmissionConfigs>;

export type PayerResponseMessage = InferSelectModel<typeof payerResponseMessages>;
export type NewPayerResponseMessage = InferInsertModel<typeof payerResponseMessages>;

export type PortalAutomationTask = InferSelectModel<typeof portalAutomationTasks>;
export type NewPortalAutomationTask = InferInsertModel<typeof portalAutomationTasks>;

export type SyncJob = InferSelectModel<typeof syncJobs>;
export type NewSyncJob = InferInsertModel<typeof syncJobs>;

export type TradingPartner = InferSelectModel<typeof tradingPartners>;
export type NewTradingPartner = InferInsertModel<typeof tradingPartners>;

// ===================================
// DATABASE LOGGING AND MONITORING
// ===================================

// Database connection logs
export const databaseConnectionLogs = pgTable('database_connection_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // Connection details
  connectionId: varchar('connection_id', { length: 255 }),
  userId: varchar('user_id', { length: 255 }),
  databaseName: varchar('database_name', { length: 100 }),
  applicationName: varchar('application_name', { length: 255 }),

  // Connection event
  eventType: varchar('event_type', { length: 50 }).notNull(), // connect, disconnect, authenticate, error
  connectionState: varchar('connection_state', { length: 50 }), // active, idle, failed, terminated

  // Authentication details
  authenticationMethod: varchar('authentication_method', { length: 50 }), // password, certificate, iam
  authenticationSuccess: boolean('authentication_success'),
  authenticationError: text('authentication_error'),

  // Network details
  clientIpAddress: varchar('client_ip_address', { length: 45 }), // IPv6 support
  clientPort: integer('client_port'),
  serverPort: integer('server_port'),
  protocol: varchar('protocol', { length: 20 }).default('tcp'),

  // Session details
  sessionId: varchar('session_id', { length: 255 }),
  sessionStartTime: timestamp('session_start_time'),
  sessionEndTime: timestamp('session_end_time'),
  sessionDuration: integer('session_duration'), // milliseconds

  // Performance metrics
  connectionTime: integer('connection_time'), // milliseconds to establish connection
  queryCount: integer('query_count').default(0),
  transactionCount: integer('transaction_count').default(0),
  bytesTransferred: bigint('bytes_transferred', { mode: 'number' }).default(0),

  // Connection pool metrics
  poolName: varchar('pool_name', { length: 100 }),
  activeConnections: integer('active_connections'),
  waitingClients: integer('waiting_clients'),
  poolUtilization: decimal('pool_utilization', { precision: 5, scale: 2 }),

  // Error tracking
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('db_connection_log_org_idx').on(table.organizationId),
  userIdx: index('db_connection_log_user_idx').on(table.userId),
  eventTypeIdx: index('db_connection_log_event_type_idx').on(table.eventType),
  clientIpIdx: index('db_connection_log_client_ip_idx').on(table.clientIpAddress),
  sessionIdx: index('db_connection_log_session_idx').on(table.sessionId),
  createdAtIdx: index('db_connection_log_created_at_idx').on(table.createdAt),
  authSuccessIdx: index('db_connection_log_auth_success_idx').on(table.authenticationSuccess),
  connectionStateIdx: index('db_connection_log_connection_state_idx').on(table.connectionState),
}));

// Database query performance logs
export const databaseQueryLogs = pgTable('database_query_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // Query identification
  queryId: varchar('query_id', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),
  transactionId: varchar('transaction_id', { length: 255 }),

  // Query details
  queryText: text('query_text'),
  queryHash: varchar('query_hash', { length: 64 }), // SHA256 hash for query similarity
  queryType: varchar('query_type', { length: 50 }), // SELECT, INSERT, UPDATE, DELETE, etc.
  queryParameters: jsonb('query_parameters'),

  // Performance metrics
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration').notNull(), // milliseconds
  planningTime: integer('planning_time'), // milliseconds
  executionTime: integer('execution_time'), // milliseconds

  // Resource usage
  rowsReturned: bigint('rows_returned', { mode: 'number' }),
  rowsAffected: bigint('rows_affected', { mode: 'number' }),
  blocksRead: bigint('blocks_read', { mode: 'number' }),
  blocksWritten: bigint('blocks_written', { mode: 'number' }),
  memoryUsed: bigint('memory_used', { mode: 'number' }), // bytes
  tempFilesUsed: integer('temp_files_used'),

  // Query classification
  isSlowQuery: boolean('is_slow_query').default(false),
  complexityScore: decimal('complexity_score', { precision: 10, scale: 2 }),

  // Lock information
  locksAcquired: integer('locks_acquired'),
  lockWaitTime: integer('lock_wait_time'), // milliseconds
  deadlockDetected: boolean('deadlock_detected').default(false),

  // Connection context
  userId: varchar('user_id', { length: 255 }),
  databaseName: varchar('database_name', { length: 100 }),
  applicationName: varchar('application_name', { length: 255 }),
  clientIpAddress: varchar('client_ip_address', { length: 45 }),

  // Error tracking
  errorOccurred: boolean('error_occurred').default(false),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('db_query_log_org_idx').on(table.organizationId),
  sessionIdx: index('db_query_log_session_idx').on(table.sessionId),
  queryTypeIdx: index('db_query_log_query_type_idx').on(table.queryType),
  durationIdx: index('db_query_log_duration_idx').on(table.duration),
  startTimeIdx: index('db_query_log_start_time_idx').on(table.startTime),
  slowQueryIdx: index('db_query_log_slow_query_idx').on(table.isSlowQuery),
  errorIdx: index('db_query_log_error_idx').on(table.errorOccurred),
  userIdx: index('db_query_log_user_idx').on(table.userId),
  clientIpIdx: index('db_query_log_client_ip_idx').on(table.clientIpAddress),
  queryHashIdx: index('db_query_log_query_hash_idx').on(table.queryHash),
}));

// Database authentication events
export const databaseAuthenticationLogs = pgTable('database_authentication_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // Authentication attempt details
  attemptId: varchar('attempt_id', { length: 255 }),
  username: varchar('username', { length: 255 }),
  databaseName: varchar('database_name', { length: 100 }),

  // Authentication method and result
  authenticationMethod: varchar('authentication_method', { length: 50 }).notNull(),
  authenticationResult: varchar('authentication_result', { length: 50 }).notNull(), // success, failed, denied
  failureReason: varchar('failure_reason', { length: 255 }),

  // Network context
  clientIpAddress: varchar('client_ip_address', { length: 45 }).notNull(),
  clientPort: integer('client_port'),
  userAgent: text('user_agent'),
  connectionProtocol: varchar('connection_protocol', { length: 20 }),

  // Security context
  sslUsed: boolean('ssl_used'),
  sslCipher: varchar('ssl_cipher', { length: 100 }),
  certificateUsed: boolean('certificate_used'),
  certificateSubject: text('certificate_subject'),

  // Session context
  sessionId: varchar('session_id', { length: 255 }),
  applicationName: varchar('application_name', { length: 255 }),

  // Risk assessment
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  riskFactors: jsonb('risk_factors'),
  isAnomalous: boolean('is_anomalous').default(false),

  // Geographic context
  geoLocation: jsonb('geo_location'), // IP geolocation data
  timeZone: varchar('time_zone', { length: 50 }),

  // Rate limiting
  attemptsInWindow: integer('attempts_in_window'),
  isBlocked: boolean('is_blocked').default(false),
  blockReason: varchar('block_reason', { length: 255 }),

  // Metadata
  eventTime: timestamp('event_time').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('db_auth_log_org_idx').on(table.organizationId),
  usernameIdx: index('db_auth_log_username_idx').on(table.username),
  clientIpIdx: index('db_auth_log_client_ip_idx').on(table.clientIpAddress),
  resultIdx: index('db_auth_log_result_idx').on(table.authenticationResult),
  eventTimeIdx: index('db_auth_log_event_time_idx').on(table.eventTime),
  riskScoreIdx: index('db_auth_log_risk_score_idx').on(table.riskScore),
  anomalousIdx: index('db_auth_log_anomalous_idx').on(table.isAnomalous),
  blockedIdx: index('db_auth_log_blocked_idx').on(table.isBlocked),
  sessionIdx: index('db_auth_log_session_idx').on(table.sessionId),
  methodIdx: index('db_auth_log_method_idx').on(table.authenticationMethod),
}));

export type UserProfile = InferSelectModel<typeof userProfiles>;

// Export types for the new logging tables
export type DatabaseConnectionLog = InferSelectModel<typeof databaseConnectionLogs>;
export type NewDatabaseConnectionLog = InferInsertModel<typeof databaseConnectionLogs>;

export type DatabaseQueryLog = InferSelectModel<typeof databaseQueryLogs>;
export type NewDatabaseQueryLog = InferInsertModel<typeof databaseQueryLogs>;

