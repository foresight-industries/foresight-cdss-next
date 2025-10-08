# Frontend Architecture Documentation

## Overview

The frontend is built with Next.js 14 using the App Router, TypeScript, TailwindCSS, and shadcn/ui components. It provides a comprehensive claims management interface with real-time data synchronization.

## Claims Management Interface

### Claims Workbench
**Route:** `/team/[slug]/claims`
**File:** `src/app/team/[slug]/claims/page.tsx`

The main claims list interface displaying encounters and claims with:

- **Data Grid**: Sortable table showing claim details (patient, DOS, payer, status, amounts)
- **Filtering**: Status-based filtering (needs review, rejections, all)
- **Search**: Real-time search across claim data
- **Actions**: Submit, view details, and bulk operations
- **Status Indicators**: Visual status badges and confidence scores

**Current Data Source:** Uses React Query to fetch from Supabase with some mock data for demonstration.

### Claim Detail Sheet
Sliding panel that opens from the claims list showing:
- Patient demographics and insurance information
- Claim lines with procedure codes and amounts  
- Validation results and confidence scores
- State history and denial tracking
- Action buttons for submission and appeals

## State Management

### Zustand Store - ClaimSlice
**File:** `src/stores/entities/claimStore.ts`

Centralized state management for claims-related data with the following structure:

**State Properties:**
- `claims[]`: Array of claim records
- `selectedClaim`: Currently selected claim
- `claimLines{}`: Keyed by claim ID, stores procedure lines
- `claimAttachments{}`: File attachments by claim ID
- `claimValidations{}`: Validation results by claim ID
- `claimStateHistory{}`: Status change history by claim ID
- `scrubberResults{}`: Clearinghouse feedback by claim ID
- `denialTracking{}`: Denial and appeal records by claim ID

**Key Actions:**
- `submitClaim(claimId, userId)`: Updates claim status to "submitted"
- `resubmitClaim(claimId, userId)`: Updates status to "appealing" 
- `fetchClaims()`: Loads claims from Supabase
- CRUD operations for all related entities

**Current Behavior:**
- Submit actions only update database status fields
- State history entries are added to local state but not persisted to database
- No actual external submission occurs

### React Query Integration
**File:** `src/hooks/claims/useClaimWorkflow.ts`

Provides reactive data fetching and caching with:

**`useClaimWorkflow(claimId)` Hook:**
- Fetches complete claim data with related entities (patient, payer, lines, validations, denials)
- Returns optimistically updated submission mutation
- Implements proper error handling and rollback

**Query Structure:**
```typescript
claim.select(`
  *,
  encounter:encounter_id (
    *,
    patient:patient_id (
      id, profile_id,
      patient_profile!inner (first_name, last_name, birth_date),
      insurance_policy (*)
    )
  ),
  payer:payer_id (id, name, external_payer_id),
  claim_line (*),
  claim_validation (*),
  denial_tracking (*)
`)
```

## User Workflow - Claim Submission

### Current Implementation
1. **Validation Check**: Calls `get_claim_readiness_score` RPC to verify claim is ready
2. **Readiness Requirement**: Score must be ≥95% to proceed
3. **Optimistic Update**: Immediately updates UI to show "submitted" status  
4. **Database Update**: Updates claim record with:
   - `status = "submitted"`
   - `submitted_at = current_timestamp`
   - `attempt_count += 1`
5. **State Management**: Updates local Zustand store
6. **History Tracking**: Adds entry to local state history (not persisted)

### Code Flow
**Submit Button Click:**
1. `useClaimWorkflow.ts` - `submitClaim.mutate()` called
2. Validation via `supabase.rpc("get_claim_readiness_score")`
3. Database update via `supabase.from("claim").update()`
4. Optimistic UI update via React Query cache manipulation
5. Store update via `claimStore.submitClaim()`

**Error Handling:**
- Validation failures throw "Claim not ready for submission"
- Database errors trigger optimistic update rollback
- UI shows error messages and reverts to previous state

### Updated Implementation (Phase 5 - Backend Integration)

**New Submission Flow:**
The frontend now calls the `submit-claim-batch` Supabase Edge Function instead of direct database updates:

1. **Function Call**: `supabase.functions.invoke("submit-claim-batch")` with claim IDs and user context
2. **Backend Processing**: Server handles validation, claim file generation, and submission logic
3. **Real Status Updates**: Backend sets appropriate status (`awaiting_277ca`, `accepted_277ca`, `rejected_277ca`)
4. **Data Refresh**: React Query invalidates queries to fetch updated claim data
5. **Error Display**: Clearinghouse errors from `scrubbing_result` table displayed in UI

**Key Changes:**
- **Removed optimistic updates**: UI waits for real backend response
- **Removed frontend validation**: Backend handles all validation logic  
- **Added error sections**: Clearinghouse errors displayed in claim detail sheet
- **Enhanced status handling**: New clearinghouse-specific statuses properly styled
- **Real-time updates**: Claims reflect actual submission outcomes

**Error Display:**
- **Clearinghouse Errors**: Shows rejection reasons for `rejected_277ca` status claims
- **Validation Errors**: Pre-submission validation issues from `claim_validation` table
- **Submission Failures**: Network and function call errors displayed to user

## Component Architecture

### Key Components
- **Claims Table**: Server-rendered data grid with sorting and filtering
- **Claim Detail Sheet**: Comprehensive claim information panel
- **Status Badges**: Visual indicators for claim states
- **Action Buttons**: Context-aware submission and management controls
- **Filter Controls**: Status and date range filtering interface

### UI Library
Built on **shadcn/ui** components providing:
- Consistent design system
- Accessible form controls
- Pre-built data table components
- Modal and sheet overlays
- Button and badge variants

## Data Fetching Patterns

### React Query Keys
**File:** `src/lib/query/keys.ts`

Structured query key factory for:
- `claims.list()`: All claims for a team
- `claims.detail(id)`: Individual claim with relations
- `claims.validations(id)`: Validation results
- `claims.history(id)`: State change history

### Optimistic Updates
Submit mutations use optimistic updates to provide immediate feedback:
1. Cancel ongoing queries
2. Store current data as rollback point
3. Immediately update cache with expected new state
4. Execute actual mutation
5. Rollback on error or invalidate on success

### Mock Data Integration
For development and demo purposes, some endpoints return mock data mixed with real database queries.

## Status Management and Display

### Enhanced Status Values
The UI now handles expanded claim status values to support Claim.MD integration workflow:

**Clearinghouse Status Values:**
- `accepted_277ca`: Displayed as "Accepted" with green styling - indicates claim was accepted by clearinghouse and forwarded to payer
- `rejected_277ca`: Displayed as "Rejected" with red styling - indicates clearinghouse found issues preventing payer submission
- `awaiting_277ca`: Displayed as "Awaiting 277CA" with indigo styling - waiting for clearinghouse acknowledgment

**Status Display Implementation:**
- **STATUS_LABELS**: Maps status enum values to user-friendly display text
- **STATUS_BADGE_VARIANTS**: Defines color schemes for each status (green for accepted, red for rejected/denied)
- **Status Logic**: UI components already handle the new statuses correctly:
  - `accepted_277ca` treated as success state (green)
  - `rejected_277ca` treated as error state (red) 
  - Both statuses enable "Resubmit corrected" button functionality

### External ID Fields
The UI is prepared to handle new database fields but does not currently display them:
- `external_claim_id`: Claim.MD claim identifier (not displayed in current UI)
- `batch_id`: Claim.MD batch upload identifier (not displayed in current UI)

These fields are stored in the database and available for future display requirements.

### Scrubbing Results Integration
**Future Implementation:** The UI framework supports displaying scrubbing results from the `scrubbing_result` table:
- Error display patterns already exist for validation issues
- Badge and alert components ready for clearinghouse error messages
- Detailed error views can show field-specific rejection reasons

## Current Limitations

### Actual Claim Submission
- **No External Integration**: Submit actions only update local database
- **Simulated Status Changes**: UI includes timeout-based status progression for demo
- **Missing 837P Generation**: No EDI file creation occurs
- **No Clearinghouse Communication**: No actual transmission to external systems

### State Persistence
- **History Gaps**: State changes added to local store but not always persisted
- **Incomplete Audit Trail**: Database history may be incomplete
- **Manual Status Management**: Statuses are manually set rather than event-driven

### Demo vs Production
- **Mixed Data Sources**: Some mock data mixed with real database queries
- **Simulated Workflows**: Fake timeouts simulate processing delays
- **Test Mode Indicators**: UI may show simulated vs real submission modes

## Future Integration Points

The frontend is structured to easily accommodate Claim.MD integration:
- Submit workflows are abstracted and can be enhanced
- Error handling patterns support external API failures  
- Optimistic updates work with async external operations
- State management supports complex status progressions