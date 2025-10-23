# Backend Architecture Documentation

## Overview

The backend consists of a comprehensive PostgreSQL database with 50+ tables managed via Drizzle ORM, AWS Lambda functions for serverless processing, AWS AppSync for GraphQL API, and a complete integration framework for healthcare interoperability (FHIR, HL7, EDI X12).

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Core Entity Tables](#core-entity-tables)
3. [Claims & Billing Tables](#claims--billing-tables)
4. [Prior Authorization Tables](#prior-authorization-tables)
5. [Clinical Workflow Tables](#clinical-workflow-tables)
6. [Reference Data Tables](#reference-data-tables)
7. [Webhook Infrastructure](#webhook-infrastructure)
8. [Backend Functions](#backend-functions)
9. [Integration Architecture](#integration-architecture)
10. [Business Logic & Rules](#business-logic--rules)
11. [Performance & Caching](#performance--caching)

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL (AWS RDS)
- **ORM**: Drizzle ORM for type-safe operations
- **Migrations**: Drizzle Kit for schema migrations
- **Connections**: Connection pooling via RDS Proxy

### Design Principles
- **Multi-tenancy**: Organization-based data isolation
- **Soft Deletes**: `deleted_at` timestamp on all tables for data retention
- **Audit Trail**: Complete tracking with `created_at`, `updated_at`, `created_by`, `updated_by`
- **Type Safety**: Enums for all status and type fields
- **Indexing Strategy**: Optimized indexes for common query patterns
- **Referential Integrity**: Foreign keys with appropriate CASCADE rules

### Schema Organization

**Files:**
- `packages/db/src/schema.ts` - Main schema (50+ tables, 5500+ lines)
- `packages/db/src/webhook-schema.ts` - Webhook infrastructure
- `packages/db/src/migrations/` - Migration history

**Table Categories:**
1. Core Entities (Users, Organizations, Patients)
2. Claims & Billing
3. Prior Authorization
4. Clinical Workflow
5. Reference Data (CPT, ICD-10, payer rules)
6. Documents & Processing
7. Webhooks & Integration
8. Analytics & Audit

## Core Entity Tables

### `user_profile`
Individual user records, separate from organization membership.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  clerkUserId: text UNIQUE NOT NULL  // Clerk authentication ID
  
  // Profile
  email: text NOT NULL
  firstName: text
  lastName: text
  role: access_level DEFAULT 'read'  // none, read, write, admin, owner
  
  // Status
  isActive: boolean DEFAULT true
  lastSeenAt: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `clerk_user_idx` on `clerkUserId`

**Purpose:** Central user identity across all organizations. Links to Clerk for authentication.

### `organization`
Healthcare provider organizations (practices, hospitals, billing companies).

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  clerkOrgId: text UNIQUE NOT NULL  // Clerk organization ID
  name: text NOT NULL
  slug: text UNIQUE NOT NULL
  
  // Identifiers
  npi: varchar(10)      // National Provider Identifier
  taxId: varchar(20)    // Tax ID / EIN
  
  // Contact
  email: text
  phone: varchar(20)
  website: text
  
  // Address
  addressLine1: text
  addressLine2: text
  city: text
  state: varchar(2)
  zipCode: varchar(10)
  
  // Configuration
  settings: json DEFAULT '{}'
  status: varchar(20) DEFAULT 'active'
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `clerk_org_id_idx` on `clerkOrgId`
- `slug_idx` on `slug`

**Purpose:** Multi-tenant isolation. All data scoped to organization for security and compliance.

### `team_member`
User membership within organizations with role-based access.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  userProfileId: uuid REFERENCES user_profile(id) NOT NULL
  clerkUserId: text REFERENCES user_profile(clerkUserId) NOT NULL
  
  // Permissions
  role: access_level DEFAULT 'read'
  
  // Status
  isActive: boolean DEFAULT true
  lastSeenAt: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `org_user_idx` on `organizationId, userProfileId`
- `user_profile_idx` on `userProfileId`

**Purpose:** Maps users to organizations with specific roles. Supports users belonging to multiple organizations.

### `patient`
Patient demographics and identifiers.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Identifiers
  mrn: varchar(50)              // Medical Record Number
  ssnLast4: varchar(4)           // Last 4 digits of SSN
  dosespotPatientId: integer     // External pharmacy system ID
  
  // Demographics
  firstName: text NOT NULL
  lastName: text NOT NULL
  middleName: text
  dateOfBirth: date
  gender: varchar(1)             // M, F, O
  height: integer                // inches
  weight: integer                // pounds
  
  // Contact
  email: text
  phoneHome: varchar(20)
  phoneMobile: varchar(20)
  phoneWork: varchar(20)
  
  // Status
  isActive: boolean DEFAULT true
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
  createdBy: uuid REFERENCES team_member(id)
  updatedBy: uuid REFERENCES team_member(id)
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `mrn_idx` on `organizationId, mrn`
- `name_idx` on `lastName, firstName`
- `dob_idx` on `dateOfBirth`

**Purpose:** Central patient registry with comprehensive demographics for claims and clinical workflows.

### `address`
Patient addresses (supports multiple addresses per patient).

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  patientId: uuid REFERENCES patient(id) NOT NULL
  
  addressLine1: text NOT NULL
  addressLine2: text
  city: text NOT NULL
  state: varchar(2) NOT NULL
  zipCode: varchar(10) NOT NULL
  
  isPrimary: boolean DEFAULT false
  isVerified: boolean DEFAULT false
  
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `patient_idx` on `patientId`
- `primary_idx` on `patientId, isPrimary`

### `provider`
Healthcare providers (physicians, NPCs, facilities).

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Identifiers
  npi: varchar(10) UNIQUE        // National Provider Identifier
  taxId: varchar(20)
  medicareId: varchar(20)
  medicaidId: varchar(20)
  
  // Profile
  firstName: text
  lastName: text
  suffix: varchar(10)
  specialty: text
  licenseNumber: varchar(50)
  licenseState: varchar(2)
  
  // Contact
  email: text
  phone: varchar(20)
  
  // Status
  isActive: boolean DEFAULT true
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `npi_idx` on `npi`
- `name_idx` on `lastName, firstName`

**Purpose:** Provider registry for claims submission and credentialing tracking.

### `payer`
Insurance companies and payers.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  
  // Identifiers
  payerId: varchar(50) UNIQUE    // Payer ID for EDI transactions
  name: text NOT NULL
  
  // Contact
  address: text
  phone: varchar(20)
  website: text
  
  // Capabilities
  supportsPriorAuth: boolean DEFAULT false
  supportsElectronicClaims: boolean DEFAULT false
  supportsRealTimeEligibility: boolean DEFAULT false
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `payer_id_idx` on `payerId`
- `name_idx` on `name`

**Purpose:** Payer master list for claims and eligibility verification.

### `insurance_policy`
Patient insurance coverage details.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  patientId: uuid REFERENCES patient(id) NOT NULL
  payerId: uuid REFERENCES payer(id) NOT NULL
  
  // Policy details
  policyNumber: text NOT NULL
  groupNumber: text
  planName: text
  
  // Coverage
  coverageType: varchar(20)      // primary, secondary, tertiary
  effectiveDate: date
  terminationDate: date
  
  // Subscriber
  subscriberRelationship: varchar(20)  // self, spouse, child, other
  subscriberFirstName: text
  subscriberLastName: text
  subscriberDob: date
  
  // Status
  isActive: boolean DEFAULT true
  isVerified: boolean DEFAULT false
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `patient_idx` on `patientId`
- `payer_idx` on `payerId`
- `policy_idx` on `policyNumber`

**Purpose:** Links patients to insurance coverage for claims processing and eligibility verification.

## Claims & Billing Tables

### `claim`
Primary claim header table storing claim-level information.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  patientId: uuid REFERENCES patient(id) NOT NULL
  providerId: uuid REFERENCES provider(id) NOT NULL
  payerId: uuid REFERENCES payer(id) NOT NULL
  
  // Identifiers
  claimNumber: varchar(50)
  controlNumber: varchar(50)
  
  // Service details
  serviceDate: date NOT NULL
  serviceDateTo: date
  totalCharges: decimal(10,2) NOT NULL
  totalPaid: decimal(10,2) DEFAULT 0
  totalAdjustments: decimal(10,2) DEFAULT 0
  
  // Status tracking
  status: claim_status DEFAULT 'draft'
  submissionDate: timestamp
  paidDate: timestamp
  
  // Clearinghouse integration
  clearinghouseId: uuid
  batchId: uuid
  externalClaimId: varchar(100)  // Claim.MD claim ID
  externalBatchId: varchar(100)  // Claim.MD batch ID
  
  // AI & Validation
  confidence: decimal(5,2)       // Overall confidence score
  fieldConfidences: jsonb        // Per-field confidence scores
  issues: text[]                 // Current validation issues
  autoSubmitted: boolean DEFAULT false
  
  // Processing
  attemptCount: integer DEFAULT 0
  lastSubmissionAttempt: timestamp
  nextRetryAt: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
  createdBy: uuid REFERENCES team_member(id)
  updatedBy: uuid REFERENCES team_member(id)
}
```

**Status Enum Values:**
```typescript
enum claim_status {
  // Pre-submission
  'draft',                 // Initial state, incomplete
  'ready_to_submit',       // Passed validation, ready for submission
  
  // Clearinghouse workflow
  'submitted',             // Sent to clearinghouse
  'awaiting_277ca',        // Waiting for clearinghouse acknowledgment
  'accepted_277ca',        // Accepted by clearinghouse, forwarded to payer
  'rejected_277ca',        // Rejected by clearinghouse, needs correction
  
  // Payer workflow
  'in_review',             // Under payer review
  'approved',              // Approved by payer but not yet paid
  'paid',                  // Payment received
  'denied',                // Payer denied payment (handled via ERA)
  'partially_paid',        // Partial payment received
  
  // Special states
  'pending',               // General pending state
  'needs_review',          // Requires manual review
  'appeal_required'        // Denial requires appeal
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `patient_idx` on `patientId`
- `provider_idx` on `providerId`
- `payer_idx` on `payerId`
- `status_idx` on `status`
- `service_date_idx` on `serviceDate`
- `submission_date_idx` on `submissionDate`
- `external_claim_id_idx` on `externalClaimId`

**Purpose:** Primary table for claim tracking through entire lifecycle from creation to payment.

### `claim_line`
Individual procedure line items within a claim.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  claimId: uuid REFERENCES claim(id) ON DELETE CASCADE NOT NULL
  
  // Line details
  lineNumber: integer NOT NULL
  
  // Procedure coding
  cptCode: varchar(10) NOT NULL
  cptDescription: text
  modifiers: varchar(2)[]        // CPT modifiers (e.g., ['95', '25'])
  
  // Diagnosis
  diagnosisPointers: integer[]   // References to diagnosis codes (1-based)
  
  // Service details
  serviceDate: date NOT NULL
  serviceDateTo: date
  units: integer DEFAULT 1
  placeOfService: varchar(2)     // POS code (e.g., '11' = office, '02' = telehealth)
  
  // Financial
  chargeAmount: decimal(10,2) NOT NULL
  allowedAmount: decimal(10,2)
  paidAmount: decimal(10,2)
  adjustmentAmount: decimal(10,2)
  deductibleAmount: decimal(10,2)
  coinsuranceAmount: decimal(10,2)
  copayAmount: decimal(10,2)
  
  // Status
  status: varchar(20) DEFAULT 'pending'
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `claim_idx` on `claimId`
- `cpt_code_idx` on `cptCode`
- `service_date_idx` on `serviceDate`

**Purpose:** Detailed procedure line items for claim submission and financial tracking.

### `claim_validation`
Validation results from internal claim scrubbing.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  claimId: uuid REFERENCES claim(id) ON DELETE CASCADE NOT NULL
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Validation results
  confidenceScore: decimal(5,2)  // 0-100 overall confidence
  overallStatus: varchar(20)     // 'valid', 'warning', 'error'
  
  // Detailed results
  errors: jsonb                  // Array of error objects
  warnings: jsonb                // Array of warning objects
  rulesEvaluated: jsonb          // Details of rules applied
  autoFixed: jsonb               // Issues automatically corrected
  
  // Field-level confidence
  fieldScores: jsonb             // Confidence by field
  
  // Processing
  validatedAt: timestamp DEFAULT now()
  validatedBy: varchar(50)       // 'system' or user ID
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Error/Warning Object Structure:**
```json
{
  "field": "provider_npi",
  "code": "NPI_INVALID",
  "severity": "error",
  "message": "Provider NPI is not valid",
  "suggestion": "Verify provider NPI: 1234567890",
  "confidence": 0.95
}
```

**Indexes:**
- `claim_idx` on `claimId`
- `org_idx` on `organizationId`
- `status_idx` on `overallStatus`

**Purpose:** Store validation results for claim readiness assessment and AI suggestion tracking.

### `claim_state_history`
Complete audit trail of claim status changes.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  claimId: uuid REFERENCES claim(id) ON DELETE CASCADE NOT NULL
  
  // State change details
  fromState: claim_status
  toState: claim_status NOT NULL
  
  // Actor
  actor: varchar(100)            // User ID or 'system'
  actorType: varchar(20)         // 'user', 'system', 'automation'
  
  // Context
  reason: text
  details: jsonb                 // Additional context
  
  // Timestamp
  occurredAt: timestamp DEFAULT now()
  
  // Metadata
  ipAddress: varchar(45)
  userAgent: text
}
```

**Indexes:**
- `claim_idx` on `claimId`
- `occurred_at_idx` on `occurredAt`
- `to_state_idx` on `toState`

**Purpose:** Complete audit trail for compliance, debugging, and analytics.

### `scrubbing_result`
Results from clearinghouse scrubbing and 277CA acknowledgments.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Entity reference
  entityId: uuid NOT NULL        // Typically claim ID
  entityType: varchar(50)        // 'claim', 'claim_line', etc.
  
  // Error details
  severity: varchar(20)          // 'error', 'warning', 'info'
  code: varchar(50)              // CARC/RARC code or custom code
  message: text NOT NULL
  fieldPath: text                // e.g., 'provider.npi', 'line[0].cpt_code'
  
  // Resolution
  autoFixable: boolean DEFAULT false
  fixed: boolean DEFAULT false
  fixedAt: timestamp
  fixedBy: uuid REFERENCES team_member(id)
  
  // Processing
  source: varchar(50)            // 'clearinghouse', 'internal', 'payer'
  batchId: uuid
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `entity_idx` on `entityId, entityType`
- `org_idx` on `organizationId`
- `severity_idx` on `severity`
- `fixed_idx` on `fixed`

**Purpose:** Store detailed rejection reasons from Claim.MD and internal validation for correction workflows.

### `denial_tracking`
Tracks payer denials and appeal workflows.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  claimId: uuid REFERENCES claim(id) ON DELETE CASCADE NOT NULL
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Denial details
  denialDate: timestamp NOT NULL
  denialReason: text NOT NULL
  denialType: denial_category
  
  // Denial codes
  carcCode: varchar(10)          // Claim Adjustment Reason Code
  rarcCode: varchar(10)          // Remittance Advice Remark Code
  groupCode: varchar(5)          // OA, CO, PI, PR
  
  // Financial impact
  deniedAmount: decimal(10,2)
  
  // Appealability
  appealable: boolean DEFAULT true
  appealDeadline: date
  appealLevel: appeal_level
  appealStatus: appeal_status
  
  // Assignment
  assignedTo: uuid REFERENCES team_member(id)
  priority: varchar(20) DEFAULT 'medium'
  
  // Resolution
  resolvedAt: timestamp
  resolution: text
  recoveredAmount: decimal(10,2)
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Denial Category Enum:**
```typescript
enum denial_category {
  'authorization',
  'eligibility',
  'coverage',
  'medical_necessity',
  'coding',
  'documentation',
  'duplicate',
  'timely_filing',
  'coordination_of_benefits'
}
```

**Indexes:**
- `claim_idx` on `claimId`
- `org_idx` on `organizationId`
- `denial_date_idx` on `denialDate`
- `carc_code_idx` on `carcCode`
- `assigned_to_idx` on `assignedTo`

**Purpose:** Track denials for appeals, analytics, and denial playbook processing.

### `denial_playbook`
Configurable rules for automated denial handling.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Rule identification
  name: text NOT NULL
  description: text
  isActive: boolean DEFAULT true
  
  // Matching criteria
  carcCodes: varchar(10)[]       // Match these CARC codes
  rarcCodes: varchar(10)[]       // Match these RARC codes
  payerIds: uuid[]               // Specific payers (empty = all)
  denialReasonKeywords: text[]   // Text matching in denial reason
  
  // Action strategy
  strategy: varchar(20)          // 'auto_resubmit', 'manual_review', 'notify'
  priority: integer DEFAULT 5
  
  // Auto-resubmit configuration
  maxRetryAttempts: integer DEFAULT 3
  retryDelayHours: integer DEFAULT 24
  autoFixEnabled: boolean DEFAULT true
  fixInstructions: jsonb         // Structured fix instructions
  
  // Notification configuration
  notifyUsers: uuid[]            // Team members to notify
  notificationTemplate: text
  
  // Analytics
  timesApplied: integer DEFAULT 0
  successRate: decimal(5,2)
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  createdBy: uuid REFERENCES team_member(id)
  updatedBy: uuid REFERENCES team_member(id)
}
```

**Fix Instructions Structure:**
```json
{
  "type": "pos_mismatch",
  "actions": [
    { "field": "placeOfService", "setValue": "10" },
    { "field": "modifiers", "addValue": "95" },
    { "field": "notes", "appendValue": "video visit, 32 min" }
  ]
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `active_idx` on `isActive`
- `strategy_idx` on `strategy`

**Purpose:** Define automated denial handling rules for consistent, fast resolution.

### `claim_submission_batch`
Groups claims submitted together to clearinghouses.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Batch details
  batchNumber: varchar(50)
  clearinghouseId: varchar(50)
  externalBatchId: varchar(100)  // Clearinghouse batch ID
  
  // Status
  status: batch_status DEFAULT 'pending'
  submittedAt: timestamp
  acknowledgedAt: timestamp
  
  // Counts
  totalClaims: integer
  acceptedCount: integer DEFAULT 0
  rejectedCount: integer DEFAULT 0
  
  // File details
  fileName: varchar(255)
  fileSize: integer
  s3Key: text
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  createdBy: uuid REFERENCES team_member(id)
}
```

**Batch Status Enum:**
```typescript
enum batch_status {
  'pending',      // Created but not submitted
  'processing',   // Submitted, awaiting acknowledgment
  'completed',    // Acknowledged with results
  'failed',       // Submission failed
  'cancelled'     // Cancelled before submission
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `status_idx` on `status`
- `submitted_at_idx` on `submittedAt`
- `external_batch_id_idx` on `externalBatchId`

**Purpose:** Track batch submissions and reconciliation with clearinghouse responses.

## Prior Authorization Tables

### `prior_auth`
Prior authorization requests and approvals.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  patientId: uuid REFERENCES patient(id) NOT NULL
  providerId: uuid REFERENCES provider(id) NOT NULL
  payerId: uuid REFERENCES payer(id) NOT NULL
  
  // Authorization details
  authNumber: varchar(50)
  externalAuthId: varchar(100)
  
  // Clinical details
  requestType: varchar(50)       // 'medication', 'procedure', 'dme', 'imaging'
  cptCodes: varchar(10)[]
  icd10Codes: varchar(10)[]
  medicationName: text
  medicationDosage: text
  
  // Status tracking
  status: prior_auth_status DEFAULT 'pending'
  submittedAt: timestamp
  respondedAt: timestamp
  effectiveDate: date
  expirationDate: date
  
  // Authorization details
  approvedUnits: integer
  approvedVisits: integer
  authorizedAmount: decimal(10,2)
  
  // Clinical justification
  clinicalJustification: text
  medicalNecessity: text
  diagnosisSummary: text
  
  // Q&A provenance
  provenanceData: jsonb          // Track data source (assessment vs LLM)
  
  // Processing
  attemptCount: integer DEFAULT 0
  lastSubmissionAttempt: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
  createdBy: uuid REFERENCES team_member(id)
  updatedBy: uuid REFERENCES team_member(id)
}
```

**Prior Auth Status Enum:**
```typescript
enum prior_auth_status {
  'pending',      // Request created, not submitted
  'submitted',    // Sent to payer
  'approved',     // Authorization granted
  'denied',       // Authorization denied
  'expired',      // Authorization period ended
  'cancelled'     // Request withdrawn
}
```

**Provenance Data Structure:**
```json
{
  "diagnosisSource": "assessment_line_1",
  "diagnosisConfidence": 1.0,
  "symptomDurationSource": "llm_extracted",
  "symptomDurationConfidence": 0.87,
  "priorTreatmentsSource": "medication_history",
  "priorTreatmentsConfidence": 1.0
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `patient_idx` on `patientId`
- `provider_idx` on `providerId`
- `payer_idx` on `payerId`
- `status_idx` on `status`
- `auth_number_idx` on `authNumber`
- `expiration_date_idx` on `expirationDate`

**Purpose:** Track prior authorization lifecycle with provenance for data sources.

### `prior_auth_requirement`
Payer-specific rules for when PA is required.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  payerId: uuid REFERENCES payer(id) NOT NULL
  
  // Requirement details
  serviceType: varchar(50)
  cptCode: varchar(10)
  icd10Code: varchar(10)
  
  // Rules
  requiresPA: boolean DEFAULT true
  criteria: jsonb
  
  // Processing times
  standardProcessingDays: integer
  expeditedProcessingDays: integer
  
  // Effective dates
  effectiveDate: date NOT NULL
  terminationDate: date
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `payer_idx` on `payerId`
- `cpt_code_idx` on `cptCode`
- `service_type_idx` on `serviceType`

**Purpose:** Store payer rules for automatic PA requirement detection.

### `clinical_qa_response`
Clinical Q&A responses for PA submissions.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  priorAuthId: uuid REFERENCES prior_auth(id) ON DELETE CASCADE NOT NULL
  
  // Question details
  question: text NOT NULL
  questionCode: varchar(50)
  
  // Response
  answer: text
  answerCode: varchar(50)
  
  // Provenance
  dataSource: varchar(50)        // 'assessment', 'notes', 'llm', 'manual'
  confidence: decimal(5,2)
  extractedFrom: text            // Specific location in record
  
  // Validation
  isValidated: boolean DEFAULT false
  validatedBy: uuid REFERENCES team_member(id)
  validatedAt: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `prior_auth_idx` on `priorAuthId`
- `question_code_idx` on `questionCode`

**Purpose:** Store structured Q&A responses with clear provenance for PA submissions.

### `provenance_rule`
Rules for determining data source reliability.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Rule details
  name: text NOT NULL
  dataType: varchar(50)          // 'diagnosis', 'medication', 'symptom_duration'
  
  // Source priority
  preferredSources: varchar(50)[]    // ['assessment', 'structured_data', 'llm']
  minConfidence: decimal(5,2) DEFAULT 0.85
  
  // Validation rules
  requiresManualReview: boolean DEFAULT false
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Purpose:** Configure provenance tracking rules per organization.

## Clinical Workflow Tables

### `encounter`
Clinical encounters (episodes of care).

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  patientId: uuid REFERENCES patient(id) NOT NULL
  providerId: uuid REFERENCES provider(id) NOT NULL
  appointmentId: uuid REFERENCES appointment(id)
  
  // Encounter details
  encounterNumber: varchar(50)
  encounterType: visit_type NOT NULL
  
  // Timing
  encounterDate: timestamp NOT NULL
  startTime: timestamp
  endTime: timestamp
  duration: integer              // minutes
  
  // Status
  status: encounter_status DEFAULT 'scheduled'
  
  // Location
  locationName: text
  roomNumber: varchar(20)
  
  // Clinical notes
  chiefComplaint: text
  presentIllness: text
  clinicalNotes: text
  assessment: text
  plan: text
  
  // Coding
  primaryDiagnosis: varchar(10)
  secondaryDiagnoses: text       // JSON array of ICD-10 codes
  procedureCodes: text           // JSON array of CPT codes
  
  // Billing
  isChargeable: boolean DEFAULT true
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
  createdBy: uuid REFERENCES team_member(id)
  updatedBy: uuid REFERENCES team_member(id)
}
```

**Visit Type Enum:**
```typescript
enum visit_type {
  'office_visit',
  'telemedicine',
  'emergency',
  'inpatient',
  'outpatient',
  'consultation',
  'procedure',
  'follow_up',
  'annual_physical'
}
```

**Encounter Status Enum:**
```typescript
enum encounter_status {
  'scheduled',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `patient_idx` on `patientId`
- `provider_idx` on `providerId`
- `encounter_date_idx` on `encounterDate`
- `status_idx` on `status`

**Purpose:** Clinical encounter documentation that feeds claim generation.

### `appointment`
Scheduled patient appointments.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  patientId: uuid REFERENCES patient(id) NOT NULL
  providerId: uuid REFERENCES provider(id) NOT NULL
  
  // Appointment details
  scheduledDate: timestamp NOT NULL
  duration: integer NOT NULL     // minutes
  visitType: visit_type NOT NULL
  
  // Status
  status: schedule_status DEFAULT 'scheduled'
  
  // Location
  locationName: text
  roomNumber: varchar(20)
  
  // Reminders
  reminderSent: boolean DEFAULT false
  reminderSentAt: timestamp
  
  // Notes
  notes: text
  cancellationReason: text
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
  createdBy: uuid REFERENCES team_member(id)
}
```

**Schedule Status Enum:**
```typescript
enum schedule_status {
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `patient_idx` on `patientId`
- `provider_idx` on `providerId`
- `scheduled_date_idx` on `scheduledDate`
- `status_idx` on `status`

**Purpose:** Appointment scheduling with encounter linkage.

### `diagnosis`
Diagnosis records (ICD-10 codes) associated with encounters.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  encounterId: uuid REFERENCES encounter(id) ON DELETE CASCADE NOT NULL
  
  // Diagnosis details
  icd10Code: varchar(10) NOT NULL
  description: text
  diagnosisType: varchar(20)     // 'primary', 'secondary', 'admitting'
  
  // Clinical details
  onsetDate: date
  resolutionDate: date
  status: varchar(20)            // 'active', 'resolved', 'chronic'
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `encounter_idx` on `encounterId`
- `icd10_code_idx` on `icd10Code`

**Purpose:** Track diagnoses for claims and clinical reporting.

### `procedure`
Procedures performed (CPT codes) during encounters.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  encounterId: uuid REFERENCES encounter(id) ON DELETE CASCADE NOT NULL
  
  // Procedure details
  cptCode: varchar(10) NOT NULL
  description: text
  modifiers: varchar(2)[]
  
  // Service details
  performedDate: date NOT NULL
  units: integer DEFAULT 1
  
  // Financial
  chargeAmount: decimal(10,2)
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `encounter_idx` on `encounterId`
- `cpt_code_idx` on `cptCode`
- `performed_date_idx` on `performedDate`

**Purpose:** Procedure documentation for claim line generation.

## Reference Data Tables

### `cpt_code_master`
CPT code master list with RVU values and billing rules.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  
  // Code details
  cptCode: varchar(10) NOT NULL
  shortDescription: varchar(100) NOT NULL
  longDescription: text NOT NULL
  
  // Classification
  category: varchar(50)          // E/M, Surgery, Radiology, etc.
  section: varchar(50)
  subsection: varchar(50)
  
  // RVU (Relative Value Units)
  rvuWork: decimal(10,4)
  rvuPracticeExpense: decimal(10,4)
  rvuMalpractice: decimal(10,4)
  rvuTotal: decimal(10,4)
  
  // Billing rules
  bilateralSurgery: boolean DEFAULT false
  assistantSurgeon: boolean DEFAULT false
  coSurgeon: boolean DEFAULT false
  multipleProc: boolean DEFAULT false
  globalPeriod: varchar(10)
  modifier51Exempt: boolean DEFAULT false
  
  // Prior auth
  priorAuthCommonlyRequired: boolean DEFAULT false
  
  // Usage tracking
  usageCount: integer DEFAULT 0
  lastUsedDate: date
  
  // Effective dates
  isActive: boolean DEFAULT true
  effectiveDate: date NOT NULL
  terminationDate: date
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `cpt_code_idx` on `cptCode`
- `active_idx` on `isActive, effectiveDate`
- `category_idx` on `category`
- `usage_count_idx` on `usageCount DESC`

**Purpose:** CPT code reference with billing rules and RVU values for claims.

### `icd10_code_master`
ICD-10 diagnosis code master list.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  
  // Code details
  icd10Code: varchar(10) NOT NULL
  shortDescription: varchar(100) NOT NULL
  longDescription: text NOT NULL
  
  // Classification
  category: varchar(50)
  subcategory: varchar(50)
  
  // Clinical details
  chronicCondition: boolean DEFAULT false
  complexityLevel: integer       // 1-5 scale
  
  // Coding rules
  requiresSeventhCharacter: boolean DEFAULT false
  lateralityRequired: boolean DEFAULT false
  
  // Usage tracking
  usageCount: integer DEFAULT 0
  lastUsedDate: date
  
  // Effective dates
  isActive: boolean DEFAULT true
  effectiveDate: date NOT NULL
  terminationDate: date
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `icd10_code_idx` on `icd10Code`
- `active_idx` on `isActive, effectiveDate`
- `category_idx` on `category`
- `usage_count_idx` on `usageCount DESC`

**Purpose:** ICD-10 code reference for diagnosis coding.

### `adjustment_reason_codes`
CARC/RARC codes for denial management.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  
  // Code details
  code: varchar(10) NOT NULL
  codeType: adjustment_code_type NOT NULL  // 'CARC', 'RARC', 'GROUP'
  description: text NOT NULL
  
  // Classification
  category: adjustment_reason_category
  subcategory: varchar(100)
  
  // Financial impact
  affectsPayment: boolean DEFAULT true
  patientResponsibility: boolean DEFAULT false
  
  // Appealability
  typicallyAppealable: boolean DEFAULT false
  appealSuccessRate: decimal(5,2)
  
  // Resolution guidance
  commonCauses: text[]
  resolutionSteps: text[]
  preventionTips: text[]
  
  // Usage tracking
  usageCount: integer DEFAULT 0
  lastUsedDate: date
  
  // Status
  isActive: boolean DEFAULT true
  effectiveDate: date NOT NULL
  terminationDate: date
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Adjustment Code Type Enum:**
```typescript
enum adjustment_code_type {
  'CARC',           // Claim Adjustment Reason Code
  'RARC',           // Remittance Advice Remark Code
  'GROUP',          // Group code (CO, PR, OA, PI)
  'MOA',            // Medicare Outpatient Adjudication
  'MIA',            // Medicare Inpatient Adjudication
  'CUSTOM',         // Organization-specific
  'PAYER_SPECIFIC'  // Payer-specific code
}
```

**Adjustment Reason Category Enum:**
```typescript
enum adjustment_reason_category {
  'Patient Responsibility',
  'Coverage',
  'Medical Necessity',
  'Benefit Limit',
  'Administrative',
  'Duplicate',
  'Authorization',
  'COB',              // Coordination of Benefits
  'Contractual',
  'Documentation',
  'Eligibility',
  'Timely Filing',
  'Coding Error',
  'Bundling',
  'Appeal Rights',
  'Routing',
  'Informational'
}
```

**Indexes:**
- `code_idx` on `code`
- `code_type_idx` on `codeType`
- `category_idx` on `category`
- `active_idx` on `isActive`

**Purpose:** CARC/RARC code reference for denial playbook and analytics.

### `hot_codes_cache`
Frequently used medical codes for ElastiCache preloading.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id)
  
  // Code details
  codeType: varchar(20)          // 'cpt', 'icd10', 'modifier'
  code: varchar(10) NOT NULL
  description: text
  
  // Usage stats
  usageCount: integer DEFAULT 0
  lastUsedDate: date
  usageFrequency: decimal(5,2)   // Uses per day
  
  // Cache metadata
  cacheKey: varchar(100)
  cacheTTL: integer              // seconds
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `code_type_idx` on `codeType, code`
- `usage_count_idx` on `usageCount DESC`

**Purpose:** Track frequently used codes for Redis caching optimization.

### `payer_rule`
Payer-specific billing and coding rules.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  payerId: uuid REFERENCES payer(id) NOT NULL
  
  // Rule details
  ruleType: varchar(50)          // 'modifier_required', 'bundling', 'place_of_service'
  ruleDescription: text NOT NULL
  
  // Applicability
  cptCodes: varchar(10)[]
  icd10Codes: varchar(10)[]
  placeOfService: varchar(2)[]
  
  // Rule logic
  ruleLogic: jsonb
  autoApply: boolean DEFAULT false
  
  // Effective dates
  effectiveDate: date NOT NULL
  terminationDate: date
  isActive: boolean DEFAULT true
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `payer_idx` on `payerId`
- `rule_type_idx` on `ruleType`
- `active_idx` on `isActive`

**Purpose:** Store payer-specific rules for automated claim scrubbing.

### `modifier_master`
CPT modifier reference.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  
  // Modifier details
  modifierCode: varchar(2) NOT NULL
  description: text NOT NULL
  
  // Usage rules
  applicableProcedures: varchar(10)[]
  reimbursementImpact: decimal(5,2)  // Percentage impact
  
  // Common uses
  usageScenarios: text[]
  
  // Status
  isActive: boolean DEFAULT true
  effectiveDate: date NOT NULL
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `modifier_code_idx` on `modifierCode`
- `active_idx` on `isActive`

**Purpose:** Modifier reference for claim line validation.

## Webhook Infrastructure

### `webhook_config`
Webhook endpoint configuration with HIPAA compliance tracking.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Basic details
  name: text NOT NULL
  url: text NOT NULL
  environment: webhook_environment DEFAULT 'production'
  events: webhook_event_type[] NOT NULL
  
  // API configuration
  apiVersion: varchar(10) DEFAULT 'v1'
  contentType: varchar(50) DEFAULT 'application/json'
  customHeaders: jsonb DEFAULT '{}'
  userAgent: varchar(255) DEFAULT 'Foresight-Webhooks/1.0'
  
  // Retry configuration
  retryCount: integer DEFAULT 3
  maxRetries: integer DEFAULT 5
  timeoutSeconds: integer DEFAULT 30
  retryBackoffMultiplier: decimal(3,2) DEFAULT 2.0
  
  // Security
  signatureVersion: varchar(10) DEFAULT 'v1'
  primarySecretId: uuid           // References webhook_secret
  
  // HIPAA compliance
  phiDataClassification: phi_data_classification DEFAULT 'none'
  hipaaComplianceStatus: hipaa_compliance_status DEFAULT 'non_compliant'
  baaSignedDate: date
  baaExpiryDate: date
  vendorName: varchar(255)
  vendorContact: varchar(255)
  dataRetentionDays: integer DEFAULT 30
  requiresEncryption: boolean DEFAULT true
  
  // Status
  isActive: boolean DEFAULT true
  lastDelivery: timestamp
  lastSuccessfulDelivery: timestamp
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Webhook Environment Enum:**
```typescript
enum webhook_environment {
  'development',
  'staging',
  'production'
}
```

**PHI Data Classification Enum:**
```typescript
enum phi_data_classification {
  'none',      // No PHI data
  'limited',   // Some PHI (dates, zip codes)
  'full'       // Full PHI (names, SSN, detailed medical)
}
```

**HIPAA Compliance Status Enum:**
```typescript
enum hipaa_compliance_status {
  'compliant',      // BAA signed, HIPAA compliant endpoint
  'pending',        // BAA pending review
  'non_compliant'   // No BAA or non-compliant endpoint
}
```

**Webhook Event Type Enum:**
```typescript
enum webhook_event_type {
  // Organization events
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'team_member.added',
  'team_member.updated',
  'team_member.removed',
  
  // Patient events
  'patient.created',
  'patient.updated',
  'patient.deleted',
  
  // Encounter events
  'encounter.created',
  'encounter.updated',
  'encounter.deleted',
  
  // Claim events
  'claim.created',
  'claim.updated',
  'claim.submitted',
  
  // Prior auth events
  'prior_auth.created',
  'prior_auth.updated',
  'prior_auth.submitted',
  'prior_auth.approved',
  'prior_auth.denied',
  'prior_auth.pending',
  'prior_auth.expired',
  'prior_auth.cancelled',
  
  // Document events
  'document.uploaded',
  'document.processed',
  'document.analysis.completed',
  'document.deleted',
  
  // Clinician events
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
  
  // Eligibility events
  'eligibility.checked',
  
  // User events
  'user.deleted',
  
  // Test events
  'webhook.test'
}
```

**Indexes:**
- `org_idx` on `organizationId`
- `active_idx` on `isActive`
- `environment_idx` on `environment`
- `unique_webhook_per_org_env` on `organizationId, environment, name`

**Purpose:** Configure webhook endpoints with HIPAA compliance tracking.

### `webhook_secret`
Webhook signing secrets with rotation support.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  webhookConfigId: uuid REFERENCES webhook_config(id) ON DELETE CASCADE NOT NULL
  
  // Secret details
  secretId: text NOT NULL        // AWS Secrets Manager ARN
  algorithm: varchar(20) DEFAULT 'sha256'
  isActive: boolean DEFAULT true
  expiresAt: timestamp
  rotationToken: text
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
  deletedAt: timestamp
}
```

**Indexes:**
- `config_idx` on `webhookConfigId`
- `active_idx` on `isActive, expiresAt`

**Purpose:** Manage webhook signing secrets with rotation capabilities.

### `webhook_delivery`
Individual webhook delivery attempts with detailed tracking.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  webhookConfigId: uuid REFERENCES webhook_config(id) NOT NULL
  webhookSecretId: uuid REFERENCES webhook_secret(id)
  
  // Event tracking
  eventType: varchar(50) NOT NULL
  eventData: jsonb NOT NULL
  environment: webhook_environment DEFAULT 'production'
  correlationId: uuid DEFAULT random()
  sourceEventId: uuid REFERENCES webhook_event(id)
  
  // Request details
  requestHeaders: jsonb
  requestBodySize: integer
  signatureHeader: text
  userAgent: varchar(255) DEFAULT 'Foresight-Webhooks/1.0'
  
  // Response details
  httpStatus: integer
  responseBody: text
  responseHeaders: jsonb
  responseBodySize: integer
  deliveryLatencyMs: integer
  
  // Retry logic
  attemptCount: integer DEFAULT 1
  deliveredAt: timestamp
  nextRetryAt: timestamp
  
  // Status
  status: varchar(20) DEFAULT 'pending'  // pending, delivered, failed, retrying
  
  // Audit
  createdAt: timestamp DEFAULT now()
  updatedAt: timestamp DEFAULT now()
}
```

**Indexes:**
- `webhook_config_idx` on `webhookConfigId`
- `status_idx` on `status`
- `event_type_idx` on `eventType`
- `next_retry_idx` on `nextRetryAt`
- `created_at_idx` on `createdAt`
- `correlation_idx` on `correlationId`
- `source_event_idx` on `sourceEventId`
- `environment_idx` on `environment`
- `secret_idx` on `webhookSecretId`

**Purpose:** Track individual webhook deliveries with retry management.

### `webhook_hipaa_audit_log`
HIPAA compliance audit logging for webhook PHI transmission.

**Key Fields:**
```typescript
{
  id: uuid PRIMARY KEY
  webhookConfigId: uuid REFERENCES webhook_config(id) NOT NULL
  webhookDeliveryId: uuid REFERENCES webhook_delivery(id)
  organizationId: uuid REFERENCES organization(id) NOT NULL
  
  // Audit event
  auditEventType: varchar(50) NOT NULL
  userId: varchar(255)
  
  // PHI details
  phiDataTypes: jsonb            // Array of PHI types involved
  entityIds: jsonb               // Patient/entity IDs whose PHI was accessed
  dataClassification: phi_data_classification NOT NULL
  
  // Compliance verification
  baaVerified: boolean DEFAULT false
  encryptionVerified: boolean DEFAULT false
  retentionPolicyApplied: boolean DEFAULT false
  
  // Audit metadata
  ipAddress: varchar(45)
  userAgent: varchar(500)
  requestHeaders: jsonb
  
  // Risk assessment
  riskLevel: varchar(20) DEFAULT 'low'
  complianceStatus: varchar(20) DEFAULT 'compliant'
  
  // Audit
  createdAt: timestamp DEFAULT now()
}
```

**Audit Event Types:**
- `phi_accessed` - PHI data accessed for webhook transmission
- `baa_verified` - Business Associate Agreement verified
- `data_transmitted` - PHI data transmitted via webhook
- `retention_policy_applied` - Data retention policy applied

**Indexes:**
- `webhook_config_idx` on `webhookConfigId`
- `audit_event_type_idx` on `auditEventType`
- `org_idx` on `organizationId`
- `created_at_idx` on `createdAt`
- `risk_level_idx` on `riskLevel`
- `compliance_status_idx` on `complianceStatus`

**Purpose:** HIPAA audit trail for PHI transmission compliance.

## Backend Functions

### AWS Lambda Functions

**Location:** `packages/functions/`

#### `submit-claim-batch`
**File:** `packages/functions/workers/submit-claim-batch.ts`

**Purpose:** Generate claim files and submit to Claim.MD clearinghouse.

**Current Status:** ✅ Complete infrastructure, 🔄 API integration pending

**Implementation:**

1. **Input Validation:**
```typescript
{
  claimIds: string[],           // Array of claim IDs to submit
  clearinghouseId: string,      // 'CLAIM_MD'
  userId: string,               // User initiating submission
  organizationId: string        // Organization context
}
```

2. **Readiness Check:**
- Calls `get_claim_readiness_score(claim_id)` for each claim
- Requires ≥95% confidence score
- Returns validation errors if not ready

3. **Claim File Generation:**
```typescript
// Generate 837P-format JSON for Claim.MD
async function generate837P(claimId: string): Promise<ClaimFile> {
  // Comprehensive database joins
  const claim = await db
    .select()
    .from(claims)
    .leftJoin(encounters, eq(claims.encounterId, encounters.id))
    .leftJoin(patients, eq(encounters.patientId, patients.id))
    .leftJoin(providers, eq(encounters.providerId, providers.id))
    .leftJoin(payers, eq(claims.payerId, payers.id))
    .leftJoin(claimLines, eq(claims.id, claimLines.claimId))
    .where(eq(claims.id, claimId))
    .execute();
  
  // Build claim file structure
  return {
    BatchId: uuid(),
    Claims: [{
      ClaimId: claim.id,
      ProviderNPI: provider.npi || process.env.DEFAULT_PROVIDER_NPI,
      ProviderTaxId: provider.taxId || process.env.DEFAULT_PROVIDER_TAX_ID,
      PatientFirstName: patient.firstName,
      PatientLastName: patient.lastName,
      PatientDOB: patient.dateOfBirth,
      PayerId: payer.payerId,
      ServiceDate: claim.serviceDate,
      PlaceOfService: determineP OS(encounter.encounterType),
      ServiceLines: claimLines.map(line => ({
        ProcedureCode: line.cptCode,
        ChargeAmount: line.chargeAmount,
        Units: line.units,
        Modifiers: line.modifiers,
        DiagnosisPointers: line.diagnosisPointers
      })),
      DiagnosisCodes: encounter.diagnoses.map(d => ({
        DiagnosisCode: d.icd10Code,
        Sequence: d.sequence
      }))
    }]
  };
}
```

4. **Clearinghouse Submission:**
```typescript
// Currently stubbed - needs HTTP client implementation
async function submitToClearinghouse(claimFile: ClaimFile): Promise<Response> {
  const response = await fetch(`${CLAIM_MD_BASE_URL}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAIM_MD_API_KEY}`
    },
    body: JSON.stringify(claimFile)
  });
  
  return response.json();
}
```

5. **Database Updates:**
```typescript
// Update claim with external IDs
await db.update(claims)
  .set({
    status: 'awaiting_277ca',
    externalClaimId: response.claimId,
    externalBatchId: response.batchId,
    attemptCount: sql`${claims.attemptCount} + 1`,
    lastSubmissionAttempt: new Date(),
    submissionDate: new Date()
  })
  .where(eq(claims.id, claimId));

// Add state history entry
await db.insert(claimStateHistory).values({
  claimId,
  fromState: 'ready_to_submit',
  toState: 'awaiting_277ca',
  actor: userId,
  actorType: 'user',
  reason: 'Manual submission via UI',
  occurredAt: new Date()
});
```

**Environment Variables:**
```bash
CLAIM_MD_API_KEY=<api_key>
CLAIM_MD_BASE_URL=https://api.claimmd.com
DEFAULT_PROVIDER_NPI=1234567890
DEFAULT_PROVIDER_TAX_ID=12-3456789
```

#### `validate-claim`
**File:** `packages/functions/workers/validate-claim.ts`

**Purpose:** Run comprehensive validation rules against a claim.

**Validation Rules:**
1. **NPI Validation**: Verify provider NPI is valid and active
2. **Taxonomy Verification**: Check provider specialty matches service
3. **Timely Filing**: Ensure claim submitted within filing window
4. **Duplicate Detection**: Check for duplicate claim submissions
5. **Authorization Requirements**: Verify PA when required
6. **Medical Necessity**: Check diagnosis supports procedure
7. **Coding Compliance**: Validate CPT/ICD-10 combinations
8. **Place of Service**: Verify POS matches encounter type
9. **Modifier Requirements**: Check required modifiers present
10. **Licensure Matching**: Verify TX provider → TX patient

**Output:**
```typescript
{
  confidenceScore: 0.96,
  overallStatus: 'valid',
  errors: [],
  warnings: [
    {
      field: 'provider_taxonomy',
      code: 'TAXONOMY_MISMATCH',
      message: 'Provider taxonomy does not match service type',
      severity: 'warning',
      confidence: 0.87
    }
  ],
  rulesEvaluated: 10,
  autoFixed: []
}
```

#### `process-denial`
**File:** `packages/functions/workers/process-denial.ts`

**Purpose:** Process denied claims through denial playbook.

**Workflow:**
1. Extract CARC/RARC codes from ERA
2. Find matching denial playbook rule
3. Execute strategy (auto-resubmit, manual review, notify)
4. Apply fixes if auto-resubmit
5. Update claim status and state history
6. Send notifications as configured

**Strategy Execution:**
```typescript
async function executeDenialPlaybook(claim: Claim, denial: DenialTracking) {
  // Find matching playbook rule
  const rule = await findMatchingRule(denial.carcCode, denial.payerId);
  
  if (!rule) {
    return { action: 'manual_review', reason: 'No matching playbook rule' };
  }
  
  switch (rule.strategy) {
    case 'auto_resubmit':
      if (claim.attemptCount < rule.maxRetryAttempts) {
        await applyFixes(claim, rule.fixInstructions);
        await submitClaim(claim.id);
        return { action: 'auto_resubmitted', attempts: claim.attemptCount + 1 };
      }
      return { action: 'max_attempts_reached', escalate: true };
      
    case 'manual_review':
      await flagForReview(claim);
      await notifyUsers(rule.notifyUsers, claim);
      return { action: 'flagged_for_review' };
      
    case 'notify':
      await notifyUsers(rule.notifyUsers, claim);
      return { action: 'notification_sent' };
  }
}
```

#### `phi-access-log`
**File:** `packages/functions/auth/phi-access-log.ts`

**Purpose:** Log PHI access for HIPAA compliance.

**Logged Events:**
- Claim view/edit
- Patient record access
- Document downloads
- Report generation with PHI
- Webhook transmissions with PHI

**Log Structure:**
```typescript
{
  userId: string,
  action: string,           // 'view', 'edit', 'download', 'transmit'
  entityType: string,       // 'patient', 'claim', 'document'
  entityId: string,
  phiFields: string[],      // Fields accessed
  ipAddress: string,
  userAgent: string,
  timestamp: Date
}
```

### Database Functions (PostgreSQL)

#### `get_claim_readiness_score`
**Purpose:** Calculate claim readiness score for submission.

**SQL:**
```sql
CREATE OR REPLACE FUNCTION get_claim_readiness_score(p_claim_id UUID)
RETURNS TABLE(
  score DECIMAL(5,2),
  is_ready BOOLEAN,
  blocking_issues TEXT[]
) AS $$
DECLARE
  v_score DECIMAL(5,2) := 100.0;
  v_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check required fields
  IF NOT EXISTS (SELECT 1 FROM claim WHERE id = p_claim_id AND patient_id IS NOT NULL) THEN
    v_score := v_score - 20;
    v_issues := array_append(v_issues, 'Missing patient');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM claim WHERE id = p_claim_id AND provider_id IS NOT NULL) THEN
    v_score := v_score - 20;
    v_issues := array_append(v_issues, 'Missing provider');
  END IF;
  
  -- Check validation results
  IF EXISTS (
    SELECT 1 FROM claim_validation 
    WHERE claim_id = p_claim_id 
    AND overall_status = 'error'
  ) THEN
    v_score := v_score - 30;
    v_issues := array_append(v_issues, 'Validation errors present');
  END IF;
  
  RETURN QUERY SELECT 
    v_score,
    v_score >= 95.0,
    v_issues;
END;
$$ LANGUAGE plpgsql;
```

#### `flag_claims_for_followup`
**Purpose:** Automatically flag claims requiring follow-up.

**Criteria:**
- Submitted > 14 days ago without response
- Denied and appealable
- Accepted but not paid after 30 days
- High dollar amount (>$5000) pending

## Integration Architecture

### Claim.MD Integration

**Overview:** Electronic claim submission using JSON format (837P equivalent).

**Submission Flow:**
```
Frontend → Backend Function → Claim File Generation → Claim.MD API → 277CA Response
```

**API Endpoints:**
- `POST /api/v1/claims/submit` - Submit claim batch
- `GET /api/v1/claims/{id}/status` - Check claim status
- `GET /api/v1/batches/{id}` - Get batch details

**Authentication:**
```typescript
headers: {
  'Authorization': `Bearer ${CLAIM_MD_API_KEY}`,
  'Content-Type': 'application/json'
}
```

**Request Format:**
```json
{
  "BatchId": "uuid",
  "Claims": [
    {
      "ClaimId": "claim_123",
      "ProviderNPI": "1234567890",
      "ProviderTaxId": "12-3456789",
      "PatientFirstName": "John",
      "PatientLastName": "Doe",
      "PatientDOB": "1980-01-15",
      "PayerId": "87726",
      "ServiceDate": "2024-10-15",
      "PlaceOfService": "11",
      "ServiceLines": [
        {
          "ProcedureCode": "99213",
          "ChargeAmount": 150.00,
          "Units": 1,
          "Modifiers": [],
          "DiagnosisPointers": [1]
        }
      ],
      "DiagnosisCodes": [
        {
          "DiagnosisCode": "Z00.00",
          "Sequence": 1
        }
      ]
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "batchId": "batch_456",
  "claims": [
    {
      "claimId": "claim_123",
      "externalClaimId": "CLM-789",
      "status": "accepted",
      "message": "Claim accepted for processing"
    }
  ]
}
```

**277CA Acknowledgment Processing:**
```typescript
async function process277CA(acknowledgment: Acknowledgment) {
  for (const claimAck of acknowledgment.claims) {
    if (claimAck.status === 'accepted') {
      await updateClaimStatus(claimAck.claimId, 'accepted_277ca');
    } else if (claimAck.status === 'rejected') {
      await updateClaimStatus(claimAck.claimId, 'rejected_277ca');
      
      // Store rejection reasons
      for (const error of claimAck.errors) {
        await db.insert(scrubbingResults).values({
          entityId: claimAck.claimId,
          entityType: 'claim',
          severity: 'error',
          code: error.code,
          message: error.message,
          fieldPath: error.field,
          source: 'clearinghouse'
        });
      }
    }
  }
}
```

### EHR/EMR Integration (FHIR)

**Standards:** FHIR R4

**Resource Types:**
- Patient
- Practitioner
- Encounter
- Condition (diagnoses)
- Procedure
- Observation
- MedicationRequest
- Coverage (insurance)

**Authentication:** OAuth 2.0 / SMART on FHIR

**Sync Strategy:**
- Real-time: New appointments, encounters
- Batch: Nightly sync for patient demographics
- On-demand: Insurance verification

### Eligibility Verification (270/271)

**Status:** 📋 Planned

**Workflow:**
1. Trigger verification (pre-appointment, pre-claim)
2. Generate 270 request with patient/insurance details
3. Submit to clearinghouse or payer
4. Receive 271 response with coverage details
5. Store eligibility status in database
6. Alert if coverage issues detected

### ERA Processing (835)

**Status:** 📋 Planned

**Workflow:**
1. Receive 835 files from clearinghouse/payer
2. Parse remittance details
3. Match to claims in database
4. Post payments and adjustments
5. Create denial records for denied services
6. Trigger denial playbook for automated handling

## Business Logic & Rules

### Claim Validation Rules

**Implementation:** `packages/functions/workers/validate-claim.ts`

**Rule Categories:**

1. **Required Field Validation:**
- Patient demographics complete
- Provider NPI present and valid
- Payer ID valid
- Service date within acceptable range
- At least one claim line

2. **Business Rule Validation:**
- Place of service matches encounter type
- Modifiers appropriate for CPT code
- Diagnosis supports procedure (medical necessity)
- Units within acceptable range
- Charge amount reasonable for procedure

3. **Payer-Specific Rules:**
- Required modifiers present
- Prior authorization when required
- Timely filing window respected
- Provider credentialed with payer

4. **Compliance Rules:**
- No duplicate claims
- Correct claim frequency code
- Proper diagnosis sequencing
- Valid CPT/ICD-10 combinations

### Denial Playbook Logic

**Implementation:** `apps/web/src/data/claims.ts` + Backend processing

**Rule Matching:**
```typescript
function findMatchingDenialRule(
  carcCode: string,
  payerId: string,
  denialReason: string
): DenialPlaybook | null {
  // Find rules for this payer (or global rules)
  const applicableRules = denialPlaybooks.filter(rule =>
    rule.isActive &&
    (rule.payerIds.length === 0 || rule.payerIds.includes(payerId)) &&
    (rule.carcCodes.includes(carcCode) || rule.rarcCodes.includes(rarcCode))
  );
  
  // Sort by priority and return highest
  return applicableRules.sort((a, b) => b.priority - a.priority)[0] || null;
}
```

**Auto-Fix Execution:**
```typescript
async function applyFixes(claim: Claim, fixInstructions: FixInstructions) {
  for (const action of fixInstructions.actions) {
    switch (action.field) {
      case 'placeOfService':
        await updateClaimLine(claim.id, { placeOfService: action.setValue });
        break;
        
      case 'modifiers':
        await addModifier(claim.id, action.addValue);
        break;
        
      case 'notes':
        await appendNote(claim.id, action.appendValue);
        break;
    }
  }
  
  // Add state history entry
  await addStateHistory(claim.id, {
    action: 'auto_fix_applied',
    details: fixInstructions,
    actor: 'system'
  });
}
```

### Confidence Scoring

**Implementation:** AI model + rule-based scoring

**Scoring Factors:**
- Data source reliability (structured > AI extracted)
- Field completeness
- Validation rule pass rate
- Historical accuracy for similar claims
- Provider/payer-specific patterns

**Confidence Thresholds:**
- ≥95%: Auto-submit eligible
- 85-94%: Recommend review
- <85%: Require manual review

## Performance & Caching

### ElastiCache Redis Strategy

**Cache Layers:**

1. **Medical Code Cache:**
- CPT codes with descriptions and RVUs
- ICD-10 codes with descriptions
- CARC/RARC codes
- TTL: 24 hours

2. **Hot Codes Cache:**
- Frequently used codes per organization
- Updated nightly based on usage stats
- TTL: 12 hours

3. **Payer Rules Cache:**
- Payer-specific validation rules
- Updated on rule changes
- TTL: 1 hour

4. **Session Cache:**
- User sessions and permissions
- TTL: 30 minutes

**Cache Implementation:**
```typescript
// Hot codes preload
async function preloadHotCodes(organizationId: string) {
  const hotCodes = await db
    .select()
    .from(hotCodesCache)
    .where(eq(hotCodesCache.organizationId, organizationId))
    .orderBy(desc(hotCodesCache.usageCount))
    .limit(1000);
  
  for (const code of hotCodes) {
    await redis.set(
      `code:${code.codeType}:${code.code}`,
      JSON.stringify(code),
      'EX',
      43200  // 12 hours
    );
  }
}
```

### Query Optimization

**Indexing Strategy:**
- Composite indexes on frequently joined columns
- Covering indexes for common queries
- Partial indexes for filtered queries

**Query Patterns:**
```sql
-- Optimized claim fetch with relationships
SELECT 
  c.*,
  p.first_name, p.last_name,
  pr.npi, pr.last_name AS provider_name,
  py.name AS payer_name
FROM claim c
JOIN patient p ON c.patient_id = p.id
JOIN provider pr ON c.provider_id = pr.id
JOIN payer py ON c.payer_id = py.id
WHERE c.organization_id = $1
  AND c.deleted_at IS NULL
  AND c.status = ANY($2)
ORDER BY c.service_date DESC
LIMIT 100;
```

**Connection Pooling:**
- RDS Proxy for connection management
- Min pool size: 2
- Max pool size: 25
- Connection timeout: 30s

### Batch Processing

**Strategies:**
1. **Nightly Batches:**
- Hot codes cache update
- Analytics aggregation
- Claim aging calculations
- Eligibility batch checks

2. **Real-time Processing:**
- Claim submission
- Validation execution
- Denial processing
- State updates

3. **Queued Processing:**
- Document OCR/extraction
- Large data imports
- Report generation
- Webhook deliveries

---

**This backend architecture provides a robust, scalable, and compliant foundation for healthcare RCM operations with comprehensive data tracking, automated workflows, and integration readiness.**
