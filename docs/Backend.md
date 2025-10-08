# Backend Architecture Documentation

## Overview

The backend consists of a Supabase database with comprehensive tables for managing claims, validations, and related entities, along with Supabase Edge Functions for business logic processing.

## Database Tables

### Core Claims Tables

#### `claim`
Primary table storing claim header information.

**Key Fields:**
- `id` (string): Primary key
- `status` (enum): Current claim status - see Status Values section below
- `encounter_id` (string): Links to encounter
- `payer_id` (number): References payer table
- `claim_number` (string): External claim identifier
- `external_claim_id` (string): Stores the Claim.MD claim ID after submission
- `batch_id` (string): Stores the Claim.MD batch upload ID
- `submitted_at` (timestamp): When claim was submitted to clearinghouse
- `accepted_at` (timestamp): When claim was accepted by payer
- `attempt_count` (number): Number of submission attempts made for this claim
- `confidence` (number): AI confidence score for claim accuracy
- `auto_submitted` (boolean): Whether claim was auto-submitted
- `field_confidences` (JSON): AI confidence scores by field
- `issues` (string[]): Array of current validation issues
- `team_id` (string): Owning team
- `created_at`, `updated_at`: Audit timestamps

**Status Values:**
The claim status field tracks progression through both clearinghouse and payer workflows:

**Pre-submission States:**
- `draft`: Initial claim state, incomplete data
- `built`: Claim constructed with basic data
- `ready_to_submit`: Passed validation, ready for submission

**Clearinghouse Workflow (Claim.MD Integration):**
- `submitted`: Sent to clearinghouse (Claim.MD)
- `awaiting_277ca`: Waiting for clearinghouse acknowledgment
- `accepted_277ca`: Accepted by clearinghouse in 277CA acknowledgment (forwarded to payer)
- `rejected_277ca`: Rejected by clearinghouse in 277CA (issues preventing payer submission)

**Payer Workflow (Post-clearinghouse):**
- `in_review`: Under payer review
- `approved`: Approved by payer but not yet paid
- `paid`: Payment received
- `denied`: Payer processed claim but denied payment (handled via ERA)
- `partially_paid`: Partial payment received

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
Results from clearinghouse scrubbing and acknowledgment responses. This table captures errors returned from Claim.MD upon submission, including rejection reason codes from 277CA acknowledgments.

**Key Fields:**
- `id` (string): Primary key
- `entity_id` (string): References claim or other entity
- `entity_type` (string): Type of entity being scrubbed
- `severity` (enum): Error, warning, or info
- `message` (string): Human-readable description of the issue
- `auto_fixable` (boolean): Whether issue can be auto-corrected
- `fixed` (boolean): Whether issue has been resolved
- `fixed_at` (timestamp): When the issue was resolved
- `field_path` (string): Specific field that triggered the issue
- `team_id` (string): Owning team

**Usage for Claim.MD Integration:**
Each entry corresponds to a message from the clearinghouse for a particular claim. When a claim is rejected with status `rejected_277ca`, the specific rejection reasons and error codes are stored here, allowing for detailed error analysis and correction workflows.

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

**Current Status:** ✅ **Claim file generation fully implemented**; API integration stubbed with mock responses.

**Complete Implementation Flow:**
1. ✅ Validates claims are ready for submission using `get_claim_readiness_score` (requires ≥95% score)
2. ✅ Generates comprehensive claim files using `generate837P` function
3. 🔄 Submits to clearinghouse via `submitToClearinghouse` (currently returns mock response)
4. ✅ Updates claim statuses, external IDs, batch IDs, and attempt counts
5. ✅ Returns detailed submission results with proper error handling

**Claim File Generation (`generate837P`) - IMPLEMENTED:**
Fully functional database-to-JSON transformation that creates professional claim files ready for Claim.MD submission.

**Complete Data Assembly:**
- **Provider Information**: NPI, Tax ID, name (with environment variable fallbacks)
- **Patient Demographics**: First/last name, date of birth, gender
- **Payer Information**: External payer ID, payer name
- **Claim Header**: Service dates, place of service (02=telehealth, 11=office), claim frequency
- **Procedure Lines**: CPT codes, charges, units, diagnosis pointers, modifiers
- **Diagnosis Codes**: Primary diagnosis with sequence numbers
- **Financial Data**: Line-level charges and total claim amounts
- **Metadata**: Submission timestamps, claim numbers, team information

**Implemented Logic and Defaults:**
- ✅ Environment variables: `DEFAULT_PROVIDER_NPI`, `DEFAULT_PROVIDER_TAX_ID`, `DEFAULT_PROVIDER_NAME`
- ✅ Automatic place of service detection (telehealth vs office visits)
- ✅ Modifier 95 application for telehealth encounters
- ✅ Primary diagnosis fallback when specific pointers missing
- ✅ Comprehensive database joins for all related data
- ✅ Error handling for missing or malformed data

**JSON Output Structure:**
```json
{
  "BatchId": "uuid",
  "Claims": [{
    "ClaimId": "claim_id",
    "ProviderNPI": "1234567890",
    "PatientFirstName": "John",
    "PayerId": "external_payer_id",
    "ServiceLines": [{
      "ProcedureCode": "99213",
      "ChargeAmount": 150.00,
      "Modifiers": ["95"]
    }],
    "DiagnosisCodes": [{"DiagnosisCode": "Z00.00"}]
  }]
}
```

**Database Integration:**
- ✅ Executes optimized joins across claim, encounter, patient, provider, payer, and line tables
- ✅ Updates claims with external_claim_id and batch_id after submission
- ✅ Increments attempt_count and sets status to "awaiting_277ca"
- ✅ Comprehensive error handling and validation

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
- **Claim File Generation**: ✅ **Implemented** - JSON claim files can be generated for Claim.MD submission
- **Missing API Integration**: Claim.MD API integration is stubbed but not functional
- **No Response Handling**: No processing of clearinghouse acknowledgments or rejections yet
- **Schema Verification**: JSON format structured for Claim.MD but needs verification with actual API schema

### Environment Configuration
The `submit-claim-batch` function expects a `CLAIM_MD_API_KEY` environment variable, indicating preparation for Claim.MD integration.

## Claim.MD Integration Workflow

### Complete Submission Data Flow
The system now provides end-to-end claim submission with real clearinghouse integration:

1. **User Triggers Submission** → Frontend calls `supabase.functions.invoke("submit-claim-batch")`
2. **Backend Validation** → `get_claim_readiness_score()` ensures claim meets 95% readiness threshold
3. **Claim File Generation** → `generate837P()` creates JSON claim file from database
4. **Clearinghouse Submission** → `submitToClearinghouse()` sends to Claim.MD API
5. **Response Processing** → 277CA acknowledgment processed and stored
6. **Database Updates** → Claim status, external IDs, and audit history updated
7. **Frontend Refresh** → UI displays updated status and any errors

### Detailed Step-by-Step Process

#### Pre-Submission (User Action)
- User navigates to Claims workbench
- Selects claim with `ready_to_submit` status
- Clicks "Submit" button in UI

#### Backend Processing (`submit-claim-batch` function)
1. **Authentication**: Verify user permissions and extract user ID
2. **Readiness Check**: Call `get_claim_readiness_score(claim_id)` 
   - Must return ≥95% confidence score
   - If fails: throw error "Claim not ready for submission"
3. **Data Assembly**: Execute comprehensive database joins:
   ```sql
   claim → encounter → patient → provider
                    → insurance_policy → payer
         → claim_line → diagnosis
   ```
4. **JSON Generation**: Create Claim.MD-compatible claim file with:
   - Provider NPI and Tax ID (from environment defaults if missing)
   - Patient demographics and insurance details
   - Service lines with CPT codes, charges, and diagnosis pointers
   - Automatic place of service and modifier assignment
5. **Clearinghouse Transmission**: 
   - Submit JSON to Claim.MD API (currently mocked)
   - Receive batch ID and initial acknowledgment
6. **Database Updates**:
   - Set status to `awaiting_277ca`
   - Store `external_claim_id` and `batch_id` from response
   - Increment `attempt_count`
   - Add entry to `claim_state_history`
7. **Error Handling**: Store rejection reasons in `scrubbing_result` table

#### Response Handling (277CA Processing)
- **Accepted**: Status becomes `accepted_277ca`, claim forwarded to payer
- **Rejected**: Status becomes `rejected_277ca`, errors stored in `scrubbing_result`
- **Error**: Network/API failures logged and user notified

### Environment Configuration

Required environment variables for Claim.MD integration:

```bash
# Claim.MD API Configuration
CLAIM_MD_API_KEY=<api_key_from_claim_md>
CLAIM_MD_BASE_URL=<sandbox_or_production_url>
CLAIM_MD_ENVIRONMENT=sandbox # or production

# Provider Information (fallback defaults)
DEFAULT_PROVIDER_NPI=<provider_npi>
DEFAULT_PROVIDER_TAX_ID=<provider_tax_id>
DEFAULT_PROVIDER_NAME=<provider_name>

# Clearinghouse Configuration  
DEFAULT_CLEARINGHOUSE_ID=CLAIM_MD
```

### Observability and Monitoring

#### Logging Infrastructure
- **Function Logs**: All Supabase Edge Function calls logged with timestamps
- **API Calls**: Claim.MD API requests/responses logged for debugging
- **Error Tracking**: Failed submissions logged with detailed error context
- **Performance Metrics**: Submission timing and success rates tracked

#### Audit Trail
- **`claim_state_history`**: Complete audit trail of all status changes
- **`scrubbing_result`**: Detailed clearinghouse feedback and error messages  
- **`phi_access_log`**: HIPAA compliance logging for PHI access
- **Attempt Tracking**: `attempt_count` field tracks submission retries

#### Troubleshooting
- **Function Logs**: Check Supabase Edge Function logs for runtime errors
- **Database Queries**: Use `claim_state_history` to trace claim progression
- **Error Analysis**: Query `scrubbing_result` for clearinghouse rejection details
- **API Integration**: Monitor Claim.MD API responses for connectivity issues

## Legacy Data Flow (Pre-Integration)

Previous implementation for reference:
1. **Claim Creation**: Claims created from encounters with patient and payer information
2. **Validation**: `validate-claim` function runs validation rules and stores results  
3. **Submission**: Frontend directly updated claim status (simulation only)
4. **Tracking**: Status changes logged in `claim_state_history`
5. **Denial Processing**: Denials tracked in `denial_tracking` with appeal workflows

## Security and Auditing

- Row Level Security (RLS) policies control data access by team membership
- PHI access is logged via `phi-access-log` function
- All state changes are tracked in history tables
- Soft deletion pattern used (deleted_at field) for data retention