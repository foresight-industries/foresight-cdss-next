# Frontend Architecture Documentation

## Overview

The frontend is built with Next.js 15 using the App Router, TypeScript, TailwindCSS 4, and shadcn/ui components. It provides a comprehensive claims management and prior authorization interface with real-time data synchronization, keyboard-first workflows, and intelligent automation.

## Table of Contents

1. [Core Features & Routes](#core-features--routes)
2. [Claims Management Interface](#claims-management-interface)
3. [Prior Authorization Queue](#prior-authorization-queue)
4. [Analytics & Insights](#analytics--insights)
5. [Credentialing Tracker](#credentialing-tracker)
6. [State Management](#state-management)
7. [User Workflows](#user-workflows)
8. [Component Architecture](#component-architecture)
9. [Design System](#design-system)
10. [Performance Optimizations](#performance-optimizations)

## Core Features & Routes

### Application Routes

All feature routes are scoped under `/team/[slug]/` for multi-tenancy:

- `/team/[slug]` - Dashboard with EPA queue and claims overview
- `/team/[slug]/claims` - Claims Workbench (main interface)
- `/team/[slug]/queue` - Prior Authorization Queue
- `/team/[slug]/pre-encounters` - Pre-encounter management
- `/team/[slug]/analytics` - Performance analytics and insights
- `/team/[slug]/credentialing` - Credentialing tracker
- `/team/[slug]/billing` - Billing management
- `/team/[slug]/audit-trail` - Audit log viewer
- `/team/[slug]/bulk-ops` - Bulk operations interface
- `/team/[slug]/settings/*` - Configuration pages
  - `/settings` - General settings
  - `/settings/ehr` - EHR integration configuration
  - `/settings/payers` - Payer management
  - `/settings/webhooks` - Webhook configuration
  - `/settings/field-mappings` - Field mapping templates

## Claims Management Interface

### Claims Workbench
**Route:** `/team/[slug]/claims`  
**File:** `apps/web/src/app/team/[slug]/claims/page.tsx`

The main claims processing interface with automation-first design.

#### Key Features

**1. Intelligent Queue Management**
- **Default Sort**: "Requires Review" claims surface first, ordered by impact
- **High $ First Toggle**: Sort by highest charge amount to prioritize cash flow
  - Visual indicator when active with "Active" badge
  - Automatically disables when manual column sorting is used
  - Tooltip: "Sort the queue by highest charge amount first"
- **Filtering**: Status-based (needs review, all, rejections, denials)
- **Search**: Real-time search across patient names, claim numbers, payers
- **Pagination**: Efficient loading for large claim volumes

**2. Keyboard Navigation** (Power User Features)
- **↓ / ↑ (Arrow Keys)**: Navigate through claims list
- **J / K**: Vim-style navigation (down/up)
- **Enter or O**: Open focused claim detail sheet
- **Escape**: Close detail sheet and restore focus
- **Smart Input Protection**: Navigation disabled when typing in search/filters
- **Visual Feedback**: Focused row highlighted with `bg-muted/50` and `ring-2 ring-primary/20`
- **ARIA Support**: `aria-selected="true"` for accessibility
- **Seamless Detail Navigation**: Navigate to next/previous claims while detail is open

**3. Data Grid**
Sortable table displaying:
- Patient name and demographics
- Service date (Date of Service)
- Payer information
- Claim status with color-coded badges
- Total charge amount
- Confidence scores (AI validation)
- Action buttons

**4. Batch Operations**
- Multi-select claims with checkboxes
- Bulk actions: Submit, Validate, Export
- Loading states for concurrent operations
- Progress indicators

**5. Status Indicators**

Color-coded badges for claim status:
```typescript
STATUS_BADGE_VARIANTS = {
  'draft': 'secondary',
  'ready_for_submission': 'default',
  'submitted': 'info',
  'accepted': 'success',
  'rejected': 'destructive',
  'paid': 'success',
  'denied': 'destructive',
  'pending': 'warning',
  'needs_review': 'warning',
  'appeal_required': 'warning',
}
```

Labels (from actual database schema):
- `draft` → "Draft"
- `ready_for_submission` → "Ready to Submit"
- `submitted` → "Submitted"
- `accepted` → "Accepted"
- `rejected` → "Rejected"
- `paid` → "Paid"
- `denied` → "Denied"
- `pending` → "Pending"
- `needs_review` → "Needs Review"
- `appeal_required` → "Appeal Required"

#### Implementation Details

**State Management:**
```typescript
// Focus tracking for keyboard navigation
const [focusedIndex, setFocusedIndex] = useState<number>(-1);

// High-dollar-first toggle
const [dollarFirstMode, setDollarFirstMode] = useState(false);

// Submission loading states
const [submittingClaims, setSubmittingClaims] = useState<Set<string>>(new Set());
```

**Sorting Logic:**
```typescript
const filteredClaims = useMemo(() => {
  let sorted = [...claims];
  
  // Dollar-first mode takes precedence
  if (dollarFirstMode) {
    sorted.sort((a, b) => b.total_amount - a.total_amount);
    return sorted;
  }
  
  // Manual column sorting
  if (sortConfig.key) {
    sorted.sort((a, b) => {
      // Column-specific sorting logic
    });
  }
  
  return sorted;
}, [claims, dollarFirstMode, sortConfig]);
```

**Keyboard Event Handler:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA';
    
    if (isInputFocused) return; // Don't interfere with input
    
    switch(e.key) {
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        // Navigate down logic
        break;
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        // Navigate up logic
        break;
      case 'Enter':
      case 'o':
        // Open detail sheet
        break;
      case 'Escape':
        // Close detail sheet
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [focusedIndex, selectedClaim, claims]);
```

### Claim Detail Modal

Floating modal component that opens in the center-right of the viewport when a claim is selected. The modal takes up the majority of the viewport while respecting the sidebar area.

**File:** `apps/web/src/components/claims/claim-details.tsx`

#### Design & Layout

The modal uses a **Dialog** component positioned to:
- Start from `256px + 2rem` from the left (after the sidebar)
- Extend to within `1.5rem` of the right edge
- Span from `1.5rem` below the top to `1.5rem` above the bottom
- Include custom overlay that respects sidebar positioning
- Feature rounded corners (`rounded-2xl`) and prominent shadow

**Layout Priority:**
1. **Header Section** (sticky): Navigation arrows, claim ID, status badge, action buttons
2. **Needs Action Section** (top priority): Yellow-highlighted fields requiring attention
3. **Patient/Payer Information**: Two-column compact layout
4. **Codes Section**: Single-row layout with ICD-10, CPT/HCPCS, and Place of Service
5. **Validation Results**: Compact card format
6. **Chart Note**: Compact display with source highlighting
7. **Timeline & Payments**: Side-by-side bottom layout

#### Content Sections

**1. Header (Sticky)**
- Navigation arrows (Previous/Next claim)
- Claim number and status badge
- Charge amount and attempt number
- Quick action buttons (Apply All Fixes, Submit & Listen, Resubmit, Close)

**2. Needs Action Section** (Highest Priority)
- Displayed prominently at the top in a yellow-bordered card
- Shows fields requiring attention before submission
- Includes confidence scores and validation badges
- Two-column grid layout for field inputs
- "Save & Continue" and "Add Note" action buttons

**3. Patient & Encounter + Payer & Coverage** (Two-Column Layout)
- **Left Column - Patient & Encounter:**
  - Patient name, encounter ID
  - Provider name and state
  - Date of service, visit type
  - Displayed in a 2x3 grid for compactness
- **Right Column - Payer & Coverage:**
  - Payer name and member ID
  - Eligibility notes in highlighted box
  - Status information

**4. Codes Section** (Single-Row Layout)
- **Grid Layout (12 columns):**
  - ICD-10 (2 cols): Diagnosis codes
  - CPT/HCPCS (8 cols): Procedure codes with descriptions and charges
  - Place of Service (2 cols): Service location code
- All codes visible in one row for quick scanning
- Additional HCPCS codes shown below if present

**5. Validation Results**
- Compact card format with color-coded backgrounds
- Icons indicating pass/warning/error states
- Direct integration of validation header within each result
- Clear, concise messaging

**6. Chart Note**
- Rounded card layout with light background
- Source highlighting toggle (show/hide AI extraction sources)
- Compact display with attending provider
- Yellow highlighting for key medical terms when sources enabled

**7. Timeline & Audit + Payments** (Side-by-Side)
- **Left Column - Timeline:**
  - Most recent 3 state history entries
  - Timestamp with date and time
  - Status label and notes
- **Right Column - Payments:**
  - Claim total prominently displayed
  - Total paid and balance calculations
  - Recent payment history (top 2)
  - "Add Payment" button for authorized users

**8. Additional Sections**
- Clearinghouse errors (for rejected claims)
- Clearinghouse warnings
- Payer response details with CARC/RARC codes
- AI suggestions section
- Attachments list

#### User Experience Improvements

**Space Efficiency:**
- All sections use rounded cards with consistent padding
- Color-coded backgrounds for visual hierarchy
- Compact two-column layouts where appropriate
- Single-row code display reduces scrolling

**Visual Design:**
- Floating modal with prominent shadow effect
- Rounded corners (`rounded-2xl`) for modern look
- Custom overlay starting after sidebar (left: 256px)
- Responsive grid layouts adapt to available space

**Navigation:**
- Previous/Next arrows in header for quick claim switching
- Close button (X) in top-right corner
- Escape key closes modal and restores focus
- Keyboard navigation works seamlessly with modal open

**Priority-Based Layout:**
The "Needs Action" section is moved to the top to ensure users immediately see what requires attention before reviewing other claim details. This reduces cognitive load and speeds up the review process.

### Claim Submission Workflow

**Step-by-Step Process:**

1. **User Initiates Submission**
   - Clicks "Submit & Listen" button in detail sheet or workbench
   - Button immediately shows loading state

2. **Loading State Management**
   ```typescript
   const triggerSubmit = async (claimId: string) => {
     setSubmittingClaims(prev => new Set(prev).add(claimId));
     
     try {
       const { data, error } = await supabase.functions.invoke('submit-claim-batch', {
         body: { 
           claimIds: [claimId], 
           clearinghouseId: 'CLAIM_MD', 
           userId 
         }
       });
       
       if (error) throw error;
       
       // Show success message
       toast.success('Claim submitted successfully');
       
       // Refresh claim data
       await refetchClaims();
     } catch (error) {
       toast.error(`Submission failed: ${error.message}`);
     } finally {
       setSubmittingClaims(prev => {
         const next = new Set(prev);
         next.delete(claimId);
         return next;
       });
     }
   };
   ```

3. **Backend Processing** (see Backend.md for details)
   - Validation check (95% readiness threshold)
   - JSON claim file generation (837P format)
   - Clearinghouse submission (Claim.MD)
   - Database updates with external IDs

4. **Response Handling**
   - Success: Status updates to `submitted` or `accepted` (when backend implemented)
   - Rejection: Status updates to `rejected`, errors displayed
   - Network error: Error message shown, claim remains in previous status
   
   **Note:** Current implementation has basic status updates. Full clearinghouse integration (837P/277CA) planned for future implementation.

5. **UI Updates**
   - React Query invalidates claim cache
   - Status badge updates with new color
   - Detail sheet refreshes with latest data
   - Toast notification confirms outcome

## Prior Authorization Queue

**Route:** `/team/[slug]/queue`  
**File:** `apps/web/src/app/team/[slug]/queue/page.tsx`

### Features

**Queue Display**
- List of pending prior authorization requests
- Patient and provider information
- Medication or procedure requiring auth
- Payer and submission status
- Priority indicators

**ePA Status Tracking**
- Pending: Awaiting payer review
- Approved: Authorization granted
- Denied: Authorization rejected
- Expired: Authorization period ended
- Cancelled: Request withdrawn

**Clinical Q&A Provenance**
- Track whether assessment came from structured data vs LLM extraction
- Show confidence scores for AI-extracted information
- Clear labeling: "From assessment line 1" vs "From clinical notes (AI)"

**Auto-Retry Logic**
- Configurable retry policies (A→B→C strategy)
- Automatic resubmission when denied based on rules
- Attempt tracking and limit enforcement

**Integration Points**
- Gate Rx release in EHR until approval
- Automatic notifications to prescribing provider
- Documentation attachment workflow

### Implementation Status

- ✅ Queue interface implemented
- ✅ Status tracking in database
- 🔄 Provenance tracking UI in progress
- 📋 Auto-retry automation planned
- 📋 EHR gating integration planned

## Analytics & Insights

**Route:** `/team/[slug]/analytics`  
**File:** `apps/web/src/app/team/[slug]/analytics/page.tsx`

### RCM Stage Analytics

**Component:** `apps/web/src/components/analytics/rcm-stage-analytics.tsx`

Visualizes claim processing pipeline performance:

**Key Metrics Cards:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Average Total Processing</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{avgTotalDays} days</div>
    <p className="text-sm text-muted-foreground">
      From build to payment
    </p>
  </CardContent>
</Card>
```

**Stage Duration Chart:**
- Horizontal bar chart showing average days per stage
- Stages: Build → Submit, Submit → Outcome, Accepted → Paid
- Color-coded bars (indigo, green, sky)
- Recharts implementation with responsive design

**Initial Outcomes Pie Chart:**
- Breakdown of submission results (accepted/rejected/denied)
- Percentage and count for each category
- Interactive legend

**Final Collection Rate:**
- Success rate visualization (paid vs unpaid)
- Overall collection percentage
- Visual indicator of financial performance

**Analytics Computation:**
```typescript
// apps/web/src/utils/stage-analytics.ts
export function computeStageAnalytics(claims: ClaimWithHistory[]) {
  // Calculate average durations
  const buildToSubmitDays = calculateAverageDays(
    claims,
    'ready_to_submit',
    'submitted'
  );
  
  const submitToOutcomeDays = calculateAverageDays(
    claims,
    'submitted',
    ['accepted', 'rejected', 'denied']
  );
  
  const acceptedToPaidDays = calculateAverageDays(
    claims,
    'accepted',
    'paid'
  );
  
  // Calculate success rates
  const totalSubmitted = claims.filter(c => 
    c.status !== 'draft' && c.status !== 'ready_for_submission'
  ).length;
  
  const accepted = claims.filter(c => 
    c.status === 'accepted'
  ).length;
  
  const paid = claims.filter(c => 
    c.status === 'paid'
  ).length;
  
  return {
    avgBuildToSubmit: buildToSubmitDays,
    avgSubmitToOutcome: submitToOutcomeDays,
    avgAcceptedToPaid: acceptedToPaidDays,
    avgTotalProcessing: buildToSubmitDays + submitToOutcomeDays + acceptedToPaidDays,
    initialAcceptanceRate: (accepted / totalSubmitted) * 100,
    finalCollectionRate: (paid / totalSubmitted) * 100,
    totalClaims: claims.length,
  };
}
```

### Payer Performance Analysis

**Combined Claims & PA View:**
- Performance metrics across both workflows
- Average claims processing time per payer
- Average PA approval time per payer
- Claims acceptance rate
- PA approval rate
- Overall performance score (Excellent/Good/Needs Attention)

**Visual Components:**
- Performance comparison table
- Volume trend charts (stacked bar chart showing EPA vs Claims volume)
- Success rate indicators with color coding

**Top Denial Reasons:**
- Merged view of denial reasons across all claims
- Count and percentage for each reason
- Financial impact estimates
- Drill-down capability by payer

### Automation & Quality Metrics

**Automation Rate Over Time:**
- Line chart showing percentage of claims auto-handled
- Monthly or weekly granularity
- Quality score overlay (accuracy of automation)

**Processing Time Trends:**
- Week-over-week comparison
- Target vs actual time
- Bottleneck identification

**Volume Trends:**
- Total items processed (EPA + Claims)
- Breakdown by type
- Historical comparison

## Credentialing Tracker

**Route:** `/team/[slug]/credentialing`  
**File:** `apps/web/src/app/team/[slug]/credentialing/page.tsx`

### Features

**State/Payer Status Matrix:**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>State</TableHead>
      <TableHead>Payer</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Next Step</TableHead>
      <TableHead>Contact Method</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {credentialingRecords.map(record => (
      <TableRow key={record.id}>
        <TableCell>{record.state}</TableCell>
        <TableCell>{record.payer}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(record.status)}>
            {record.status}
          </Badge>
        </TableCell>
        <TableCell>{record.nextStep}</TableCell>
        <TableCell>{record.contactMethod}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => updateStatus(record.id)}>
            Update
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Status Values:**
- `Active`: Credentialing complete
- `In Progress`: Pending steps (e.g., awaiting CAQH attestation)
- `Requested`: Submission made, awaiting confirmation
- `Planned`: Future initiative

**Contact Methods:**
- Portal (online submission)
- Email
- Phone
- Rep visit at office

**Summary Cards:**
```typescript
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Active</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{activeCount}</div>
      <p className="text-sm text-muted-foreground">
        Credentialing Complete
      </p>
    </CardContent>
  </Card>
  {/* Repeat for In Progress, Requested, Planned */}
</div>
```

**Filtering & Search:**
- Filter by state
- Filter by payer
- Filter by status
- Search by payer name

## State Management

### Zustand Stores

**Store Architecture:**
```
src/stores/
├── entities/
│   ├── claimStore.ts          # Claims data and actions
│   ├── priorAuthStore.ts      # Prior auth data
│   └── patientStore.ts        # Patient data
├── ui/
│   ├── navigationStore.ts     # UI navigation state
│   └── modalStore.ts          # Modal management
└── index.ts                   # Combined store exports
```

**Claim Store Structure:**
```typescript
// src/stores/entities/claimStore.ts
interface ClaimSlice {
  // State
  claims: Claim[];
  selectedClaim: Claim | null;
  claimLines: Record<string, ClaimLine[]>;
  claimValidations: Record<string, ClaimValidation>;
  claimStateHistory: Record<string, ClaimStateHistory[]>;
  scrubbingResults: Record<string, ScrubbingResult[]>;
  denialTracking: Record<string, DenialTracking>;
  
  // Actions
  setClaims: (claims: Claim[]) => void;
  setSelectedClaim: (claim: Claim | null) => void;
  updateClaimStatus: (claimId: string, status: ClaimStatus) => void;
  addStateHistory: (claimId: string, entry: ClaimStateHistory) => void;
  
  // Async actions
  fetchClaims: (organizationId: string) => Promise<void>;
  submitClaim: (claimId: string, userId: string) => Promise<void>;
  resubmitClaim: (claimId: string, userId: string) => Promise<void>;
}
```

**Store Implementation Pattern:**
```typescript
export const useClaimStore = create<ClaimSlice>((set, get) => ({
  claims: [],
  selectedClaim: null,
  claimLines: {},
  // ... other state
  
  setClaims: (claims) => set({ claims }),
  
  updateClaimStatus: (claimId, status) => set((state) => ({
    claims: state.claims.map(claim =>
      claim.id === claimId ? { ...claim, status } : claim
    ),
  })),
  
  fetchClaims: async (organizationId) => {
    const { data, error } = await supabase
      .from('claim')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (data) {
      set({ claims: data });
    }
  },
}));
```

### React Query Integration

**Query Key Factory:**
```typescript
// src/lib/query/keys.ts
export const queryKeys = {
  claims: {
    all: ['claims'] as const,
    lists: () => [...queryKeys.claims.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.claims.lists(), filters] as const,
    details: () => [...queryKeys.claims.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.claims.details(), id] as const,
    validations: (id: string) => [...queryKeys.claims.detail(id), 'validations'] as const,
    history: (id: string) => [...queryKeys.claims.detail(id), 'history'] as const,
  },
  priorAuths: {
    // Similar structure
  },
};
```

**Custom Hooks:**
```typescript
// src/hooks/claims/useClaimWorkflow.ts
export function useClaimWorkflow(claimId: string) {
  // Fetch claim with all relationships
  const claimQuery = useQuery({
    queryKey: queryKeys.claims.detail(claimId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claim')
        .select(`
          *,
          patient:patient_id (*),
          provider:provider_id (*),
          payer:payer_id (*),
          claim_line (*),
          claim_validation (*),
          claim_state_history (*),
          scrubbing_result (*),
          denial_tracking (*)
        `)
        .eq('id', claimId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      return await supabase.functions.invoke('submit-claim-batch', {
        body: { claimIds: [claimId] },
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(queryKeys.claims.detail(claimId));
      queryClient.invalidateQueries(queryKeys.claims.lists());
    },
  });
  
  return {
    claim: claimQuery.data,
    isLoading: claimQuery.isLoading,
    error: claimQuery.error,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  };
}
```

**Optimistic Updates Pattern:**
```typescript
const updateMutation = useMutation({
  mutationFn: updateClaimFn,
  onMutate: async (updatedClaim) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(queryKeys.claims.detail(claimId));
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.claims.detail(claimId));
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.claims.detail(claimId), updatedClaim);
    
    // Return context for rollback
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(
        queryKeys.claims.detail(claimId),
        context.previous
      );
    }
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries(queryKeys.claims.detail(claimId));
  },
});
```

## User Workflows

### Complete Claim Submission Journey

**1. Discovery & Selection**
- User navigates to `/team/[slug]/claims`
- Views claims sorted by "Needs Review" priority
- Optionally enables "High $ First" for cash flow focus
- Uses search/filters to find specific claims
- Identifies claims with "Ready to Submit" status (green badge)

**2. Claim Review**
- Clicks on claim row or presses Enter/O with keyboard navigation
- ClaimDetailSheet slides in from right
- Reviews patient demographics and insurance
- Examines procedure lines with CPT codes and charges
- Checks validation results and confidence scores
- Reviews AI suggestions if any

**3. Validation Check**
- System automatically shows readiness score (must be ≥95%)
- Validation warnings highlighted in yellow
- Errors highlighted in red with suggestions
- User can apply AI suggestions or manually correct

**4. Submission**
- User clicks "Submit & Listen" button
- Button immediately shows "Submitting..." state
- Backend processes claim (see Backend.md for details)
- User sees loading indicator in both detail sheet and workbench row

**5. Response Handling**

**Success Path:**
- Toast notification: "Claim submitted successfully"
- Status badge updates to green "Accepted"
- Detail sheet refreshes with updated information
- Claim moves down in queue (no longer needs review)

**Rejection Path:**
- Toast notification: "Claim was rejected by clearinghouse"
- Status badge updates to red "Rejected"
- Clearinghouse errors section appears with detailed feedback
- "Resubmit Corrected" button becomes enabled
- User reviews specific error messages with field paths

**6. Error Correction** (if rejected)
- User reviews clearinghouse error messages
- Applies suggested fixes or manually corrects data
- Clicks "Resubmit Corrected"
- System follows same submission flow

**7. Denial Handling** (if payer denies)
- Denial playbook automatically processes based on CARC/RARC code
- Auto-resubmit strategy: Fixes applied and claim resubmitted automatically
- Manual review strategy: User notified to review claim
- Notify strategy: Alert sent, no immediate action required

### Keyboard Navigation Workflow

**Sequential Claim Processing:**
1. Load claims workbench
2. Press ↓ or J to focus first claim
3. Press Enter to open detail sheet
4. Review claim details
5. Press ↓ or J to move to next claim (detail updates in place)
6. Continue reviewing without closing detail
7. Press Escape when done to return to list view
8. Focus restored to last viewed claim

**Benefits:**
- No mouse required for claim processing
- Faster navigation for power users
- Reduced RSI risk from excessive clicking
- Professional workflow similar to email clients

## Component Architecture

### Component Hierarchy

```
<Page>
  <ClaimsWorkbench>
    <Toolbar>
      <SearchInput />
      <FilterSelect />
      <HighDollarToggle />
      <BatchActionButtons />
    </Toolbar>
    
    <DataGrid>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableColumn />
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map(claim => (
            <ClaimRow 
              key={claim.id}
              claim={claim}
              isFocused={focusedIndex === index}
              onClick={handleRowClick}
            />
          ))}
        </TableBody>
      </Table>
    </DataGrid>
    
    <ClaimDetailModal 
      claim={selectedClaim}
      open={!!selectedClaim}
      onClose={() => setSelectedClaim(null)}
    >
      <DialogHeader>
        <NavigationControls />
        <ClaimIdentifier />
        <ActionButtons />
      </DialogHeader>
      
      <ScrollableContent>
        <NeedsActionSection /> {/* Top priority */}
        <PatientPayerGrid /> {/* Two columns */}
        <CodesSection /> {/* Single row layout */}
        <ValidationResults />
        <ChartNote />
        <TimelinePaymentsGrid /> {/* Two columns */}
        <AdditionalSections />
      </ScrollableContent>
    </ClaimDetailModal>
  </ClaimsWorkbench>
</Page>
```

### Reusable Components

**Status Badge:**
```typescript
// src/components/ui/status-badge.tsx
interface StatusBadgeProps {
  status: ClaimStatus | PriorAuthStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const variant = STATUS_BADGE_VARIANTS[status];
  const label = STATUS_LABELS[status];
  
  return (
    <Badge variant={variant} className={cn('', sizeClasses[size])}>
      {label}
    </Badge>
  );
}
```

**Confidence Score Indicator:**
```typescript
// src/components/ui/confidence-indicator.tsx
export function ConfidenceIndicator({ score }: { score: number }) {
  const color = score >= 95 ? 'green' : score >= 85 ? 'yellow' : 'red';
  const label = score >= 95 ? 'High' : score >= 85 ? 'Medium' : 'Low';
  
  return (
    <div className="flex items-center gap-2">
      <Progress value={score} className={`w-20 h-2 ${color}`} />
      <span className="text-sm font-medium">{score}%</span>
      <Badge variant={color}>{label}</Badge>
    </div>
  );
}
```

**Loading States:**
```typescript
// src/components/ui/loading-button.tsx
export function LoadingButton({ 
  isLoading, 
  children, 
  ...props 
}: ButtonProps & { isLoading: boolean }) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

## Design System

### Color Palette

**Status Colors:**
- Success: `green-600` (accepted, paid, approved)
- Warning: `yellow-600` (awaiting, needs review)
- Destructive: `red-600` (rejected, denied)
- Info: `blue-600` (submitted, in progress)
- Secondary: `gray-600` (draft, inactive)

**Chart Colors:**
- Primary: `indigo-600`
- Secondary: `green-600`
- Tertiary: `sky-600`
- Quaternary: `orange-600`
- Quinary: `purple-600`

### Typography

**Font System:**
- **Default**: System font stack (San Francisco, Segoe UI, etc.)
- **Monospace**: For claim numbers, codes, identifiers

**Size Scale:**
- `text-xs`: 12px - Helper text, captions
- `text-sm`: 14px - Secondary text, table cells
- `text-base`: 16px - Body text, form inputs
- `text-lg`: 18px - Section headers
- `text-xl`: 20px - Card titles
- `text-2xl`: 24px - Page headers
- `text-3xl`: 30px - Large metrics

### Spacing

**Consistent Spacing Scale:**
- `gap-1`: 4px
- `gap-2`: 8px
- `gap-4`: 16px
- `gap-6`: 24px
- `gap-8`: 32px
- `gap-12`: 48px

### Component Variants

**Badge Variants:**
- `default`: Neutral gray for standard items
- `success`: Green for positive states
- `warning`: Yellow for attention needed
- `destructive`: Red for errors/denials
- `info`: Blue for informational states
- `secondary`: Muted gray for less important items

**Button Variants:**
- `default`: Primary action button (indigo)
- `secondary`: Secondary action (gray)
- `destructive`: Dangerous actions (red)
- `outline`: Ghost-style button
- `ghost`: Minimal styling
- `link`: Link-styled button

## Performance Optimizations

### Rendering Optimizations

**1. Memoization:**
```typescript
const filteredClaims = useMemo(() => {
  return claims.filter(claim => {
    // Expensive filtering logic
  }).sort((a, b) => {
    // Expensive sorting logic
  });
}, [claims, filterConfig, sortConfig]);
```

**2. Virtualization** (for large lists):
```typescript
// Not yet implemented, but planned for 1000+ claims
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: claims.length,
  getScrollElement: () => tableRef.current,
  estimateSize: () => 50, // Row height
  overscan: 10,
});
```

**3. Code Splitting:**
```typescript
// Heavy components lazy loaded
const ClaimDetailSheet = lazy(() => import('./claim-detail-sheet'));
const AnalyticsDashboard = lazy(() => import('./analytics-dashboard'));
```

### Data Fetching Optimizations

**1. Prefetching:**
```typescript
// Prefetch next claim on hover
const prefetchNextClaim = (claimId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.claims.detail(claimId),
    queryFn: () => fetchClaimDetails(claimId),
  });
};

<ClaimRow 
  onMouseEnter={() => prefetchNextClaim(claim.id)}
/>
```

**2. Stale-While-Revalidate:**
```typescript
const claimsQuery = useQuery({
  queryKey: queryKeys.claims.lists(),
  queryFn: fetchClaims,
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
});
```

**3. Parallel Fetching:**
```typescript
const [claimsQuery, payersQuery, providersQuery] = useQueries({
  queries: [
    { queryKey: ['claims'], queryFn: fetchClaims },
    { queryKey: ['payers'], queryFn: fetchPayers },
    { queryKey: ['providers'], queryFn: fetchProviders },
  ],
});
```

### Bundle Size Optimizations

**Tree Shaking:**
- Import only used components from libraries
- Avoid importing entire icon libraries

**Dynamic Imports:**
```typescript
// Heavy dependencies loaded on demand
const Recharts = dynamic(() => import('recharts'), { ssr: false });
```

**Image Optimization:**
- Next.js Image component with automatic optimization
- WebP format with fallbacks
- Lazy loading below the fold

## Accessibility Features

### ARIA Labels
- All interactive elements have descriptive labels
- Status changes announced to screen readers
- Form validation errors associated with inputs

### Keyboard Accessibility
- Tab order follows visual layout
- Focus visible indicators on all interactive elements
- Keyboard shortcuts documented and accessible
- Skip links for navigation

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Interactive elements have sufficient contrast
- Focus indicators visible at 3:1 contrast ratio

### Screen Reader Support
- Semantic HTML structure
- Landmarks for navigation
- Live regions for dynamic updates
- Descriptive button labels

## Testing Strategy

### Unit Tests (Jest)
- Component rendering tests
- Business logic functions (sorting, filtering, analytics)
- State management actions
- Utility functions

**Example Test:**
```typescript
// apps/web/specs/claims-sorting.spec.ts
describe('High Dollar First Sorting', () => {
  it('sorts claims by total amount in descending order', () => {
    const claims = [
      { id: '1', total_amount: 100 },
      { id: '2', total_amount: 500 },
      { id: '3', total_amount: 250 },
    ];
    
    const sorted = sortClaimsByAmount(claims);
    
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });
});
```

### Integration Tests
- User workflows (claim submission, denial processing)
- Component interactions
- API integration

**Example Test:**
```typescript
// apps/web/specs/denial-playbook-integration.spec.tsx
describe('Denial Playbook Integration', () => {
  it('auto-resubmits claim when matching playbook rule found', async () => {
    const claim = createMockClaim({ status: 'denied' });
    const playbook = createMockPlaybook({ strategy: 'auto_resubmit' });
    
    render(<ClaimsWorkbench claims={[claim]} playbooks={[playbook]} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Auto-resubmitted/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Cypress)
- Complete user journeys
- Cross-browser testing
- Real API interactions

## Future Enhancements

### Planned Features
- **Auto-scroll**: Automatically scroll focused row into view during keyboard navigation
- **Bulk Edit**: Edit multiple claims simultaneously
- **Advanced Filters**: Save and share filter configurations
- **Custom Views**: User-defined column arrangements and sorting
- **Keyboard Shortcuts Panel**: On-screen overlay showing available shortcuts (press ?)
- **Claim Templates**: Pre-fill common claim types
- **Real-time Collaboration**: See other users viewing/editing claims
- **Mobile Responsive**: Optimized interface for tablets and phones

### Performance Improvements
- Virtual scrolling for 10,000+ claims
- Web Workers for heavy computations
- Service Worker for offline support
- Progressive Web App capabilities

### UX Enhancements
- Undo/Redo for claim edits
- Keyboard shortcut customization
- Dark mode support
- Personalized dashboard widgets
- Advanced search with natural language

---

**This frontend architecture provides a modern, accessible, and efficient interface for healthcare RCM workflows, with a focus on automation, keyboard-first design, and user productivity.**
