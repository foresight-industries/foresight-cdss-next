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

### Complete Phase 5 Implementation - Full Backend Integration

**End-to-End Submission Workflow:**
The frontend now provides complete integration with the Claim.MD submission infrastructure:

1. **User Action**: User clicks Submit/Resubmit in Claims workbench or detail view
2. **Loading State**: Button disabled with "Submitting..." text, visual loading indicators
3. **Backend Call**: `supabase.functions.invoke("submit-claim-batch")` with claim IDs and user context
4. **Real-time Processing**: Backend handles validation, claim generation, and clearinghouse submission
5. **Response Handling**: Different feedback based on actual submission outcomes
6. **Status Updates**: Claims show real status (`awaiting_277ca`, `accepted_277ca`, `rejected_277ca`)
7. **Error Display**: Clearinghouse rejections displayed with specific error details

**Complete Implementation Changes:**
- **✅ Loading States**: Set-based state management tracks concurrent submissions
- **✅ User Feedback**: Alert system provides specific success/error messages
- **✅ Backend Integration**: All submission workflows use real backend functions
- **✅ Error Display**: Enhanced clearinghouse error sections with realistic examples
- **✅ Eliminated Simulation**: Removed all fake timeouts and optimistic status updates
- **✅ Pure Backend Calls**: Resubmission logic uses identical backend integration

**Comprehensive Error Handling:**
- **Clearinghouse Errors**: Detailed rejection reasons with field paths and error codes
- **Validation Errors**: Pre-submission validation issues from `claim_validation` table  
- **Network Errors**: Connection and function call failures with retry guidance
- **Loading States**: Visual indicators prevent user confusion during processing

## Complete User Workflow - Claim Submission

### Step-by-Step User Journey

#### 1. Navigation and Claim Discovery
- **Access**: User navigates to `/team/[slug]/claims` workbench
- **Overview**: Data grid displays all claims with status filtering and search
- **Identification**: Users can identify ready-to-submit claims by green "Ready to Submit" badges
- **Selection**: Click on claim row or use bulk selection for multiple claims

#### 2. Claim Detail Review
- **Detail View**: Click claim opens ClaimDetailSheet sliding panel on right
- **Information Display**:
  - Patient demographics and insurance details
  - Provider information and service dates  
  - CPT codes, diagnosis codes, and charge amounts
  - Validation results and confidence scores
  - AI suggestions for improvements (if any)
- **Action Buttons**: "Submit & Listen" and "Resubmit corrected" buttons available

#### 3. Submission Process
- **Initiation**: User clicks "Submit & Listen" button
- **Loading State**: 
  - Button disabled and text changes to "Submitting..."
  - Loading state prevents double-clicks and shows progress
- **Backend Processing**: System calls `submit-claim-batch` function
- **Real-time Feedback**: User sees processing status immediately

#### 4. Response Handling
**Success Scenarios:**
- **Accepted**: Alert shows "Claim submitted successfully and accepted by clearinghouse"
- **Status Update**: Claim badge changes to green "Accepted" in the table
- **Next Steps**: Claim forwarded to payer for review

**Rejection Scenarios:**
- **Rejected**: Alert shows "Claim was rejected by clearinghouse. See errors highlighted below"
- **Status Update**: Claim badge changes to red "Rejected" 
- **Error Display**: Clearinghouse errors section appears with detailed feedback
- **Correction Path**: "Resubmit corrected" button enabled for fixes

**Error Scenarios:**
- **Network Issues**: Alert shows specific network error message
- **Validation Failures**: Alert explains readiness score or missing data issues
- **System Errors**: General error message with guidance to retry

#### 5. Error Review and Correction
- **Error Section**: Clearinghouse errors displayed with:
  - Field-specific error codes (e.g., "277CA-001")
  - Field paths showing exactly what needs fixing
  - Human-readable descriptions for each issue
- **Fix Application**: Users can apply AI suggestions or manually correct data
- **Resubmission**: "Resubmit corrected" uses identical backend workflow

### UI Response Behavior

#### Loading States and Visual Feedback
- **Submit Button**: 
  - Normal: "Submit & Listen" (enabled)
  - Loading: "Submitting..." (disabled, loading indicator)
  - Success: Returns to normal state with updated claim status
- **Status Indicators**: Real-time badge updates reflect actual backend status
- **Progress Tracking**: Multiple concurrent submissions tracked independently

#### Error Display Components
- **Clearinghouse Errors**: 
  - Red-bordered section with warning icons
  - Detailed error list with field paths and codes
  - Clear descriptions for user understanding
- **Validation Warnings**: Pre-submission issues shown in validation section
- **Network Errors**: System-level alerts for connectivity issues

## Component Architecture and Implementation

### Core Components Modified for Phase 5

#### Claims Workbench (`src/app/team/[slug]/claims/page.tsx`)
**Key Enhancements:**
- **`submittingClaims` State**: Set-based tracking of concurrent submissions
- **`triggerSubmit` Function**: Real backend integration with loading management
- **Error Handling**: Comprehensive try/catch with user-friendly alerts
- **Loading Management**: Proper cleanup in finally blocks

**Critical Implementation Details:**
```typescript
const [submittingClaims, setSubmittingClaims] = useState<Set<string>>(new Set());

const triggerSubmit = async (claimId: string, auto = false) => {
  setSubmittingClaims(prev => new Set(prev).add(claimId));
  
  const { data, error } = await supabase.functions.invoke("submit-claim-batch", {
    body: { claimIds: [claimId], clearinghouseId: "CLAIM_MD", userId }
  });
  
  // Handle response and update UI accordingly
};
```

#### ClaimDetailSheet Component
**Enhanced Features:**
- **Loading Props**: Receives `submittingClaims` prop for button states
- **Dynamic Buttons**: Text changes based on submission state
- **Error Sections**: Enhanced clearinghouse error display
- **Action Integration**: Submit/resubmit both use real backend calls

**Visual Enhancements:**
- Submit buttons show "Submitting..." during processing
- Disabled state prevents multiple concurrent submissions
- Error sections appear contextually for rejected claims

#### Status Management Components
- **STATUS_LABELS**: Maps all new clearinghouse statuses to display text
- **STATUS_BADGE_VARIANTS**: Color coding for accepted/rejected states
- **Conditional Logic**: Proper enable/disable for action buttons

### UI Library Integration
Built on **shadcn/ui** components providing:
- Consistent design system for all status indicators
- Accessible form controls for submission actions
- Pre-built data table components with sorting/filtering
- Modal and sheet overlays for claim details
- Button and badge variants with loading states

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

## Production Readiness Status

### Completed Integration (Phase 5)
- **✅ Backend Integration**: All submission workflows use real Supabase Edge Functions
- **✅ Real Status Updates**: Claims reflect actual submission outcomes from backend
- **✅ Comprehensive Error Handling**: Network, validation, and clearinghouse errors properly handled
- **✅ Loading States**: Visual feedback during submission processes
- **✅ User Feedback**: Alert system provides specific success/error messages
- **✅ Eliminated Simulation**: Removed all fake timeouts and optimistic status updates

### Ready for Live Claim.MD Integration
The frontend is fully prepared for live clearinghouse integration:
- **Submit Workflows**: Complete backend function integration ready for live API
- **Error Display**: Framework ready to show real clearinghouse rejection details
- **Status Management**: Handles all Claim.MD-specific status progressions
- **Data Refresh**: React Query invalidation ensures UI shows latest backend state

### Current Limitations

#### Live API Integration
- **HTTP Client**: `submitToClearinghouse` function needs actual Claim.MD HTTP implementation
- **Schema Verification**: JSON structure requires validation against Claim.MD API documentation
- **Response Processing**: Real 277CA acknowledgment processing not yet implemented

#### Production Considerations
- **Error Recovery**: Enhanced retry logic for failed submissions
- **Performance**: Optimization for high-volume concurrent submissions
- **Monitoring**: User-facing status for system health and submission queues

### Next Steps for Full Production

The frontend implementation is complete. **Only the HTTP API call to Claim.MD needs to be implemented** in the backend `submitToClearinghouse` function to enable live claim submission.

**Remaining Work:**
1. Implement actual Claim.MD HTTP client in backend
2. Process real 277CA responses and update claim statuses  
3. Enhanced error mapping from live API responses
4. Production monitoring and alerting setup