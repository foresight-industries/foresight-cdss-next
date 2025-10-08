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