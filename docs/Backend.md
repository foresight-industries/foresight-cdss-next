# Backend Architecture Documentation

## Overview

The backend consists of a Supabase database with comprehensive tables for managing claims, validations, and related entities, along with Supabase Edge Functions for business logic processing.

## Database Tables

### Core Claims Tables

#### `claim`
Primary table storing claim header information.

**Key Fields:**
- `id` (string): Primary key
- `status` (enum): Current claim status (draft, submitted, accepted, denied, appealing, etc.)
- `encounter_id` (string): Links to encounter
- `payer_id` (number): References payer table
- `claim_number` (string): External claim identifier
- `submitted_at` (timestamp): When claim was submitted to clearinghouse
- `accepted_at` (timestamp): When claim was accepted by payer
- `attempt_count` (number): Number of submission attempts
- `confidence` (number): AI confidence score for claim accuracy
- `auto_submitted` (boolean): Whether claim was auto-submitted
- `team_id` (string): Owning team
- `created_at`, `updated_at`: Audit timestamps

#### `claim_line`
Individual procedures/line items within a claim.

**Key Fields:**
- `id` (string): Primary key
- `claim_id` (string): References claim table
- `line_number` (number): Position within claim
- `cpt_code` (string): Procedure code
- `charge_amount` (number): Billed amount
- `allowed_amount` (number): Payer-allowed amount
- `adjustment_amount` (number): Write-off amount
- `diagnosis_pointers` (number[]): Links to diagnosis codes

#### `claim_validation`
Stores validation results from internal claim scrubbing.

**Key Fields:**
- `id` (string): Primary key
- `claim_id` (string): References claim table
- `team_id` (string): Owning team
- `confidence_score` (number): Overall validation confidence (0-100)
- `overall_status` (string): Validation result summary
- `errors` (JSON): Array of validation errors
- `rules_evaluated` (JSON): Details of validation rules applied
- `auto_fixed` (JSON): Automatically corrected issues

#### `claim_state_history`
Audit trail for claim status changes.

**Key Fields:**
- `id` (string): Primary key
- `claim_id` (string): References claim table
- `actor` (string): User or system that made the change
- `at` (timestamp): When change occurred
- `state` (string): New status
- `details` (JSON): Additional context about the change

#### `scrubbing_result`
Results from clearinghouse scrubbing and acknowledgment responses.

**Key Fields:**
- `id` (string): Primary key
- `entity_id` (string): References claim or other entity
- `entity_type` (string): Type of entity being scrubbed
- `severity` (enum): Error, warning, or info
- `message` (string): Human-readable description
- `auto_fixable` (boolean): Whether issue can be auto-corrected
- `fixed` (boolean): Whether issue has been resolved
- `field_path` (string): Specific field that triggered the issue

#### `denial_tracking`
Records payer denial reasons and appeal workflows.

**Key Fields:**
- `id` (string): Primary key
- `claim_id` (string): References claim table
- `team_id` (string): Owning team
- `denial_date` (timestamp): When denial occurred
- `denial_reason` (string): Payer-provided reason
- `denial_type` (enum): Category of denial
- `carc_code` (string): Claim Adjustment Reason Code
- `appealable` (boolean): Whether denial can be appealed
- `appeal_deadline` (timestamp): Last date to file appeal
- `assigned_to` (string): Team member handling appeal

### Supporting Tables

#### `claim_attachment`
File attachments associated with claims.

#### `claim_submission_batch` 
Groups claims submitted together to clearinghouses.

### Views and Functions

#### Database Views
- `active_claims`: Filtered view of non-deleted claims with computed fields
- `claim_dashboard`: Aggregated metrics by status and team
- `claim_field_confidence_view`: AI confidence scores by field
- `denial_analytics`: Denial trending and analysis

#### Database Functions
- `get_claim_readiness_score(p_claim_id)`: Returns readiness score and blocking issues
- `get_claim_age_days(p_claim_id)`: Calculates aging in days
- `get_ar_aging_summary(p_team_id, p_as_of_date)`: AR aging buckets
- `flag_claims_for_followup()`: Automated follow-up flagging

## Supabase Edge Functions

### `validate-claim`
**File:** `supabase/functions/validate-claim/index.ts`

Runs comprehensive validation rules against a claim and populates the `claim_validation` table.

**Validation Rules:**
- NPI validation
- Taxonomy code verification
- Timely filing compliance
- Duplicate claim detection
- Authorization requirements
- Medical necessity checks
- Coding compliance

**Output:** Stores validation results with confidence scores and detailed error/warning lists.

### `submit-claim-batch`
**File:** `supabase/functions/submit-claim-batch/index.ts`

**Current Status:** Stub implementation for future Claim.MD integration.

**Intended Flow:**
1. Validates claims are ready for submission using `get_claim_readiness_score`
2. Generates 837P EDI file format
3. Submits to clearinghouse via Claim.MD API
4. Updates claim statuses to "submitted"

**Current Implementation:** Updates claim status directly without external submission.

### `phi-access-log`
**File:** `supabase/functions/phi-access-log/index.ts`

Logs access to Protected Health Information (PHI) for HIPAA compliance.

### Other Functions
Additional functions exist for:
- `generate-appeal-letter`: Automated appeal letter generation
- `process-era`: Electronic Remittance Advice processing
- `verify-eligibility`: Insurance eligibility verification
- `sync-ehr`: EHR system synchronization
- `nightly-batch`: Automated batch processing

## Current Limitations

### Claim Submission
- **Not Fully Implemented**: Claims are marked as "submitted" in the database, but no actual transmission to clearinghouses occurs
- **Missing Integration**: Claim.MD API integration is stubbed but not functional
- **No 837P Generation**: EDI file generation is referenced but not implemented
- **No Response Handling**: No processing of clearinghouse acknowledgments or rejections

### Environment Configuration
The `submit-claim-batch` function expects a `CLAIM_MD_API_KEY` environment variable, indicating preparation for Claim.MD integration.

## Data Flow

1. **Claim Creation**: Claims are created from encounters with patient and payer information
2. **Validation**: `validate-claim` function runs validation rules and stores results
3. **Submission**: Frontend calls submission workflow (currently just status update)
4. **Tracking**: Status changes are logged in `claim_state_history`
5. **Denial Processing**: Denials are tracked in `denial_tracking` with appeal workflows

## Security and Auditing

- Row Level Security (RLS) policies control data access by team membership
- PHI access is logged via `phi-access-log` function
- All state changes are tracked in history tables
- Soft deletion pattern used (deleted_at field) for data retention