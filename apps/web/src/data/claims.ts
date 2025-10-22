export const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export type ClaimStatus =
  | "needs_review"
  | "built"
  | "submitted"
  | "awaiting_277ca"
  | "accepted_277ca"
  | "rejected_277ca"
  | "paid"
  | "denied";

export type PAStatus =
  | "needs-review"
  | "auto-processing"
  | "auto-approved"
  | "auto-denied"
  | "denied"
  | "error";

export type ClaimIssueSeverity = "pass" | "warn" | "fail";
export type FixProvenance = "rule" | "llm";
export type SubmissionOutcome = "accept" | "reject";

export interface ClaimIssue {
  field: string;
  code: string;
  severity: ClaimIssueSeverity;
  message: string;
}

export interface SuggestedFix {
  field: string;
  label: string;
  value: string;
  provenance: FixProvenance;
  confidence: number;
  reason: string;
  auto?: boolean;
  applied?: boolean;
  requiresConfirmation?: boolean;
}

export interface ValidationResult {
  field?: string;
  rule: string;
  severity: ClaimIssueSeverity;
  message: string;
}

interface ChartSegment {
  text: string;
  highlight?: boolean;
}

export interface ClaimChartNote {
  provider: string;
  paragraphs: ChartSegment[][];
}

export interface ClaimStateEntry {
  state: ClaimStatus;
  at: string;
  note?: string;
}

export interface PayerResponse {
  type: "277CA" | "835";
  accepted?: boolean;
  carc?: string;
  rarc?: string;
  message: string;
}

export interface ClaimCodes {
  icd10: string[];
  cpt: { code: string; description: string; amount: number; modifiers?: string[] }[];
  pos: string;
  hcpcs?: string[];
}

export interface ClaimAttachment {
  id: string;
  name: string;
  type: string;
}

export interface Payment {
  id: string;
  claim_id: string;
  amount: number;
  date: string;
  payer: string; // Who paid: "insurance" | "patient" | string
  reference?: string; // Check number or EFT trace
  note?: string;
  created_at: string;
  created_by?: string; // User who recorded the payment
}

export interface ScrubResult {
  id: string;
  entity_id: string;
  entity_type: string;
  severity: "error" | "warning" | "info";
  message: string;
  field_path?: string;
  error_code?: string;
  auto_fixable: boolean;
  fixed: boolean;
  fixed_at?: string;
  created_at: string;
}

export interface Claim {
  id: string;
  encounter_id: string;
  patient: { id: number; name: string };
  payer: { id: number; name: string };
  dos: string;
  visit_type: string;
  state: string;
  total_amount: number;
  status: ClaimStatus;
  pa_status?: PAStatus;
  confidence: number;
  issues: ClaimIssue[];
  suggested_fixes: SuggestedFix[];
  validation_results: ValidationResult[];
  field_confidences: Record<string, number>;
  auto_submitted: boolean;
  attempt_count: number;
  state_history: ClaimStateEntry[];
  payer_response?: PayerResponse;
  rejection_response?: PayerResponse;
  chart_note: ClaimChartNote;
  codes: ClaimCodes;
  member_id?: string;
  provider: string;
  eligibility_note?: string;
  attachments?: ClaimAttachment[];
  scrubbing_result?: ScrubResult[];
  payments?: Payment[]; // Payment records for this claim
  updatedAt: string;
  submissionOutcome?: SubmissionOutcome;
}

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  needs_review: "Needs Review",
  built: "Ready to Submit",
  submitted: "Submitted",
  awaiting_277ca: "Awaiting 277CA",
  accepted_277ca: "Accepted",
  rejected_277ca: "Rejected",
  paid: "Paid",
  denied: "Denied",
};

export const REVIEW_STATUSES = new Set<ClaimStatus>([
  "needs_review",
  "rejected_277ca",
  "denied",
]);

export const STATUS_FILTER_OPTIONS = [
  { value: "needs_review", label: "Needs Review" },
  { value: "built", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "awaiting_277ca", label: "Awaiting 277CA" },
  { value: "accepted_277ca", label: "Accepted" },
  { value: "rejected_277ca", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "denied", label: "Denied" },
] as const;

export const PA_STATUS_FILTER_OPTIONS = [
  { value: "needs-review", label: "Needs Review" },
  { value: "auto-processing", label: "Auto Processing" },
  { value: "auto-approved", label: "Auto Approved" },
  { value: "auto-denied", label: "Auto Denied" },
  { value: "denied", label: "Denied" },
  { value: "error", label: "Error" },
] as const;

export type StatusFilterValue = ClaimStatus | "all";

export interface ClaimFilters {
  search: string;
  status: StatusFilterValue;
  paStatuses: PAStatus[];
  payer: string;
  state: string;
  visit: string;
  dateFrom: string;
  dateTo: string;
  onlyNeedsReview: boolean;
  // Column-specific filters
  claimId: string;
  patientName: string;
  payerName: string;
  provider: string;
  visitType: string;
  claimState: string;
}

export type SortField = 'id' | 'patient.name' | 'payer.name' | 'total_amount' | 'status' | 'confidence' | 'updatedAt' | 'dos';
export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export const CONFIDENCE_COLORS = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-red-600",
};

export const STATUS_BADGE_VARIANTS: Record<ClaimStatus, string> = {
  needs_review: "bg-amber-50 text-amber-700 border border-amber-200",
  built: "bg-blue-50 text-blue-700 border border-blue-200",
  submitted: "bg-slate-50 text-slate-700 border border-slate-200",
  awaiting_277ca: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  accepted_277ca: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected_277ca: "bg-red-50 text-red-700 border border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  denied: "bg-red-50 text-red-700 border border-red-200",
};

export const initialClaims: Claim[] = [
  {
    id: "CLM-3201",
    encounter_id: "ENC-3201",
    patient: { id: 6001, name: "Darius Cole" },
    payer: { id: 2, name: "MI Medicaid" },
    dos: "2025-09-20",
    visit_type: "Telehealth",
    state: "MI",
    total_amount: 112,
    status: "denied",
    pa_status: "needs-review",
    confidence: 0.82,
    issues: [
      {
        field: "pos",
        code: "POS_MISMATCH",
        severity: "fail" as ClaimIssueSeverity,
        message: "POS must be 10 for telehealth.",
      },
      {
        field: "modifiers",
        code: "MOD_95_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Modifier 95 required for synchronous telehealth.",
      },
    ],
    suggested_fixes: [
      {
        field: "pos",
        label: "Place of Service",
        value: "10",
        provenance: "rule",
        confidence: 0.99,
        reason: "Telehealth visits submit with POS 10.",
        applied: true,
      },
      {
        field: "modifiers",
        label: "Modifiers",
        value: "95",
        provenance: "rule",
        confidence: 0.98,
        reason: "Add modifier 95 for live video.",
      },
    ],
    validation_results: [
      {
        field: "pos",
        rule: "Telehealth POS check",
        severity: "fail" as ClaimIssueSeverity,
        message: "POS must be 10 when visit type is Telehealth.",
      },
      {
        field: "modifiers",
        rule: "Telehealth modifier",
        severity: "fail" as ClaimIssueSeverity,
        message: "Modifier 95 is required for MI Medicaid telehealth.",
      },
      {
        field: "eligibility",
        rule: "Eligibility verified",
        severity: "pass" as ClaimIssueSeverity,
        message: "Member active for DOS.",
      },
    ],
    field_confidences: { cpt: 0.94, modifiers: 0.52, pos: 0.51 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "needs_review",
        at: minutesAgo(190),
        note: "Claim built for review",
      },
    ],
    chart_note: {
      provider: "Dr. Larkin",
      paragraphs: [
        [
          { text: "Video", highlight: true },
          { text: " follow-up for " },
          { text: "OUD on Suboxone", highlight: true },
          { text: ". Time today: " },
          { text: "21 minutes", highlight: true },
          { text: " with counseling." },
        ],
        [
          { text: "Focused on cravings and adherence; patient stable without withdrawal." },
        ],
      ],
    },
    codes: {
      icd10: ["F11.20"],
      cpt: [
        {
          code: "99213",
          description: "Established patient visit",
          amount: 112,
          modifiers: [],
        },
      ],
      pos: "02",
    },
    member_id: "MI123456",
    provider: "Dr. Elaine Larkin",
    eligibility_note: "Eligibility confirmed within last 30 days.",
    attachments: [
      { id: "att-1", name: "Telehealth consent.pdf", type: "pdf" },
    ],
    payments: [
      {
        id: "PAY-ABC123",
        claim_id: "CLM-3201",
        amount: 50.0,
        date: minutesAgo(120),
        payer: "MI Medicaid",
        reference: "EFT-789123",
        note: "Partial payment from insurance",
        created_at: minutesAgo(120),
        created_by: "system"
      }
    ],
    payer_response: {
      type: "835",
      carc: "N620",
      message: "Missing/incomplete/invalid place of service"
    },
    updatedAt: minutesAgo(45),
    submissionOutcome: "accept",
  },
  {
    id: "CLM-3205",
    encounter_id: "ENC-3205",
    patient: { id: 6005, name: "P. Nguyen" },
    payer: { id: 5, name: "Sunshine (FL Medicaid)" },
    dos: "2025-09-24",
    visit_type: "Telehealth",
    state: "FL",
    total_amount: 134.2,
    status: "built",
    pa_status: "auto-approved",
    confidence: 0.94,
    issues: [
      {
        field: "quality",
        code: "DOC_OK",
        severity: "pass" as ClaimIssueSeverity,
        message: "Documentation complete.",
      },
    ],
    suggested_fixes: [],
    validation_results: [
      {
        field: "eligibility",
        rule: "Eligibility verified",
        severity: "pass" as ClaimIssueSeverity,
        message: "Coverage active.",
      },
      {
        field: "telehealth",
        rule: "Telehealth attestations",
        severity: "pass" as ClaimIssueSeverity,
        message: "Consent and location captured.",
      },
    ],
    field_confidences: { cpt: 0.96, modifiers: 0.91, pos: 0.93 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(160),
        note: "Claim generated by automation",
      },
    ],
    chart_note: {
      provider: "Dr. Sterling",
      paragraphs: [
        [
          { text: "Telehealth follow-up for chronic care management with stable vitals." },
        ],
        [
          { text: "Patient confirms home location in Florida; consent on file." },
        ],
      ],
    },
    codes: {
      icd10: ["I10"],
      cpt: [
        {
          code: "99214",
          description: "Established patient visit",
          amount: 134.2,
          modifiers: ["95"],
        },
      ],
      pos: "10",
    },
    member_id: "FL0088123",
    provider: "Dr. Ash Sterling",
    eligibility_note: "Auto-eligible via batch verification.",
    attachments: [],
    payments: [
      {
        id: "PAY-DEF456",
        claim_id: "CLM-3205",
        amount: 80.0,
        date: minutesAgo(90),
        payer: "insurance",
        reference: "CHECK-456789",
        note: "Insurance payment - partial coverage",
        created_at: minutesAgo(90),
        created_by: "auto"
      },
      {
        id: "PAY-GHI789",
        claim_id: "CLM-3205",
        amount: 25.0,
        date: minutesAgo(60),
        payer: "patient",
        reference: "COPAY-001",
        note: "Patient copayment",
        created_at: minutesAgo(60),
        created_by: "front_desk"
      }
    ],
    updatedAt: minutesAgo(30),
    submissionOutcome: "accept",
  },
  {
    id: "CLM-2141",
    encounter_id: "ENC-2141",
    patient: { id: 6010, name: "Marisa Rivera" },
    payer: { id: 8, name: "BCBSM" },
    dos: "2025-09-18",
    visit_type: "Telehealth",
    state: "MI",
    total_amount: 78.4,
    status: "rejected_277ca",
    pa_status: "denied",
    confidence: 0.74,
    issues: [
      {
        field: "modifiers",
        code: "MODIFIER_MISMATCH",
        severity: "fail" as ClaimIssueSeverity,
        message: "Modifier 95 missing for home video visit.",
      },
    ],
    suggested_fixes: [
      {
        field: "modifiers",
        label: "Modifiers",
        value: "95",
        provenance: "rule",
        confidence: 0.97,
        reason: "Add modifier 95 per payer rejection.",
      },
      {
        field: "pos",
        label: "Place of Service",
        value: "10",
        provenance: "llm",
        confidence: 0.71,
        reason: "Consider updating POS to 10 based on telehealth location.",
        requiresConfirmation: true,
      },
    ],
    validation_results: [
      {
        field: "modifiers",
        rule: "Telehealth modifier",
        severity: "fail" as ClaimIssueSeverity,
        message: "Modifier 95 required when patient is at home.",
      },
      {
        field: "auth",
        rule: "Authorization",
        severity: "warn" as ClaimIssueSeverity,
        message: "Auth number optional for BCBSM telehealth.",
      },
    ],
    field_confidences: { cpt: 0.9, modifiers: 0.48, pos: 0.63 },
    auto_submitted: false,
    attempt_count: 2,
    state_history: [
      {
        state: "built",
        at: minutesAgo(540),
        note: "Claim corrected and resubmitted",
      },
      {
        state: "submitted",
        at: minutesAgo(520),
      },
      {
        state: "awaiting_277ca",
        at: minutesAgo(510),
      },
      {
        state: "rejected_277ca",
        at: minutesAgo(480),
        note: "CARC 197/N620",
      },
    ],
    chart_note: {
      provider: "Dr. Abrams",
      paragraphs: [
        [
          { text: "Video", highlight: true },
          { text: " visit for chronic back pain." },
        ],
        [
          { text: "Patient at home; instructed on home exercise progression." },
        ],
      ],
    },
    codes: {
      icd10: ["M54.50"],
      cpt: [
        {
          code: "98941",
          description: "Chiropractic manipulation",
          amount: 78.4,
          modifiers: [],
        },
      ],
      pos: "02",
    },
    member_id: "BC1230990",
    provider: "Dr. Nila Abrams",
    eligibility_note: "Eligibility verified via 270/271 response.",
    attachments: [
      { id: "att-5", name: "Appeal letter draft.docx", type: "docx" },
    ],
    scrubbing_result: [
      {
        id: "scrub-1",
        entity_id: "CLM-2141",
        entity_type: "claim",
        severity: "error",
        message: "Provider NPI is missing or invalid",
        field_path: "provider.npi",
        error_code: "AAE-44",
        auto_fixable: false,
        fixed: false,
        created_at: minutesAgo(480),
      },
      {
        id: "scrub-2",
        entity_id: "CLM-2141",
        entity_type: "claim",
        severity: "error",
        message: "Modifier 95 required for home video visits",
        field_path: "serviceLine.modifiers",
        error_code: "AAE-95",
        auto_fixable: false,
        fixed: false,
        created_at: minutesAgo(480),
      },
    ],
    updatedAt: minutesAgo(20),
    submissionOutcome: "accept",
    payer_response: {
      type: "277CA",
      accepted: false,
      carc: "197",
      rarc: "N620",
      message: "POS inconsistent — home video visit missing Mod 95.",
    },
  },
  {
    id: "CLM-2136",
    encounter_id: "ENC-2136",
    patient: { id: 6015, name: "Ravi Patel" },
    payer: { id: 12, name: "Superior (TX Medicaid)" },
    dos: "2025-09-23",
    visit_type: "Telehealth",
    state: "TX",
    total_amount: 112,
    status: "denied",
    pa_status: "auto-denied",
    confidence: 0.69,
    issues: [
      {
        field: "authorization",
        code: "AUTH_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Authorization number required for 99213.",
      },
    ],
    suggested_fixes: [
      {
        field: "authorization",
        label: "Authorization",
        value: "AUTH-44721",
        provenance: "llm",
        confidence: 0.62,
        reason: "Suggested auth reference from referral note.",
        requiresConfirmation: true,
      },
    ],
    validation_results: [
      {
        field: "authorization",
        rule: "Authorization",
        severity: "fail" as ClaimIssueSeverity,
        message: "No authorization number on file.",
      },
      {
        field: "documentation",
        rule: "Documentation",
        severity: "warn" as ClaimIssueSeverity,
        message: "Consider attaching plan of care.",
      },
    ],
    field_confidences: { cpt: 0.88, modifiers: 0.81, pos: 0.77, authorization: 0.4 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "submitted",
        at: minutesAgo(1440),
      },
      {
        state: "awaiting_277ca",
        at: minutesAgo(1420),
      },
      {
        state: "accepted_277ca",
        at: minutesAgo(1380),
        note: "Forwarded to payer",
      },
      {
        state: "denied",
        at: minutesAgo(1200),
        note: "ERA denial CARC 197/N700",
      },
    ],
    chart_note: {
      provider: "Dr. K. Olsen",
      paragraphs: [
        [
          { text: "Telehealth" },
          { text: " visit addressing asthma control and medication refills." },
        ],
        [
          { text: "Patient advised to continue inhaled steroids; follow-up in 4 weeks." },
        ],
      ],
    },
    codes: {
      icd10: ["J45.40"],
      cpt: [
        {
          code: "99213",
          description: "Established patient visit",
          amount: 112,
          modifiers: ["95"],
        },
      ],
      pos: "10",
    },
    member_id: "TX778812",
    provider: "Dr. Karin Olsen",
    eligibility_note: "Eligibility confirmed; auth pending.",
    attachments: [
      { id: "att-8", name: "Treatment plan.pdf", type: "pdf" },
    ],
    updatedAt: minutesAgo(10),
    submissionOutcome: "accept",
    payer_response: {
      type: "835",
      accepted: false,
      carc: "197",
      rarc: "N700",
      message: "Precert/authorization required.",
    },
  },
  {
    id: "CLM-3220",
    encounter_id: "ENC-3220",
    patient: { id: 6020, name: "Kevin Lee" },
    payer: { id: 15, name: "Anthem BCBS" },
    dos: "2025-09-22",
    visit_type: "In-Person",
    state: "KY",
    total_amount: 156.5,
    status: "needs_review",
    pa_status: "auto-processing",
    confidence: 0.9,
    issues: [
      {
        field: "coding",
        code: "DX_GAP",
        severity: "warn" as ClaimIssueSeverity,
        message: "Consider adding Z79.899 for long-term drug therapy.",
      },
    ],
    suggested_fixes: [
      {
        field: "icd10",
        label: "Diagnosis codes",
        value: "Z79.899",
        provenance: "llm",
        confidence: 0.68,
        reason: "Medication management documented in note.",
        requiresConfirmation: true,
        applied: true,
      },
    ],
    validation_results: [
      {
        field: "documentation",
        rule: "Documentation",
        severity: "pass" as ClaimIssueSeverity,
        message: "Vitals and ROS completed.",
      },
      {
        field: "coding",
        rule: "Risk adjustment opportunities",
        severity: "warn" as ClaimIssueSeverity,
        message: "Consider HCC capture for medication management.",
      },
    ],
    field_confidences: { cpt: 0.93, modifiers: 0.88, pos: 0.9, icd10: 0.72 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "needs_review",
        at: minutesAgo(75),
        note: "Auto-paused for coding review",
      },
    ],
    chart_note: {
      provider: "Dr. Quinn",
      paragraphs: [
        [
          { text: "In-person" },
          { text: " follow-up for hypertension and medication reconciliation." },
        ],
        [
          { text: "Metoprolol renewed; discussion on adherence documented." },
        ],
      ],
    },
    codes: {
      icd10: ["I10"],
      cpt: [
        {
          code: "99214",
          description: "Established patient visit",
          amount: 156.5,
          modifiers: [],
        },
      ],
      pos: "11",
    },
    member_id: "KY880022",
    provider: "Dr. Jamie Quinn",
    eligibility_note: "Commercial PPO verified.",
    attachments: [],
    updatedAt: minutesAgo(12),
    submissionOutcome: "accept",
  },
  // Additional demo claims for submission pipeline metrics
  {
    id: "CLM-4001",
    encounter_id: "ENC-4001",
    patient: { id: 7001, name: "Maria Rodriguez" },
    payer: { id: 5, name: "Anthem Blue Cross" },
    dos: "2025-10-08",
    visit_type: "Office Visit",
    state: "CA",
    total_amount: 245,
    status: "needs_review",
    confidence: 0.45,
    issues: [
      {
        field: "patient_dob",
        code: "DOB_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Patient date of birth is required but missing.",
      },
      {
        field: "member_id",
        code: "MEMBER_ID_INVALID",
        severity: "fail" as ClaimIssueSeverity,
        message: "Member ID format is invalid or missing.",
      },
      {
        field: "diagnosis",
        code: "PRIMARY_DX_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Primary diagnosis code is required.",
      },
    ],
    suggested_fixes: [],
    validation_results: [
      {
        field: "patient_dob",
        rule: "Required field validation",
        severity: "fail" as ClaimIssueSeverity,
        message: "Patient DOB must be provided for claim submission.",
      },
      {
        field: "member_id",
        rule: "Member ID format",
        severity: "fail" as ClaimIssueSeverity,
        message: "Invalid member ID format for Anthem Blue Cross.",
      },
    ],
    field_confidences: { cpt: 0.88, diagnosis: 0.32, member_id: 0.15 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "needs_review",
        at: minutesAgo(145),
        note: "Missing required patient information",
      },
    ],
    chart_note: {
      provider: "Dr. Sarah Kim",
      paragraphs: [
        [
          { text: "Patient presents with " },
          { text: "chronic fatigue", highlight: true },
          { text: " and joint pain. Unable to verify insurance information at time of visit." },
        ],
      ],
    },
    codes: {
      icd10: ["M79.89", "R53.83"],
      cpt: [
        { code: "99213", description: "Office visit, established patient", amount: 245 },
      ],
      pos: "11",
    },
    provider: "Dr. Sarah Kim",
    eligibility_note: "Unable to verify - missing member information.",
    attachments: [],
    updatedAt: minutesAgo(145),
  },
  {
    id: "CLM-4002",
    encounter_id: "ENC-4002",
    patient: { id: 7002, name: "James Patterson" },
    payer: { id: 3, name: "UnitedHealthcare" },
    dos: "2025-10-07",
    visit_type: "Preventive Care",
    state: "TX",
    total_amount: 320,
    status: "needs_review",
    confidence: 0.38,
    issues: [
      {
        field: "authorization",
        code: "AUTH_REQUIRED",
        severity: "fail" as ClaimIssueSeverity,
        message: "Prior authorization required but not obtained.",
      },
      {
        field: "npi",
        code: "PROVIDER_NPI_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Provider NPI number is missing or invalid.",
      },
      {
        field: "tax_id",
        code: "TAX_ID_MISMATCH",
        severity: "fail" as ClaimIssueSeverity,
        message: "Provider tax ID does not match payer records.",
      },
    ],
    suggested_fixes: [],
    validation_results: [
      {
        field: "authorization",
        rule: "Prior auth requirement",
        severity: "fail" as ClaimIssueSeverity,
        message: "UHC requires prior authorization for this procedure.",
      },
    ],
    field_confidences: { cpt: 0.91, authorization: 0.22, npi: 0.33 },
    auto_submitted: false,
    attempt_count: 2,
    state_history: [
      {
        state: "needs_review",
        at: minutesAgo(180),
        note: "Missing authorization and provider credentials",
      },
    ],
    chart_note: {
      provider: "Dr. Michael Chen",
      paragraphs: [
        [
          { text: "Annual " },
          { text: "preventive physical exam", highlight: true },
          { text: " with comprehensive metabolic panel and lipid screening." },
        ],
      ],
    },
    codes: {
      icd10: ["Z00.00"],
      cpt: [
        { code: "99396", description: "Preventive visit, established patient", amount: 320 },
      ],
      pos: "11",
    },
    provider: "Dr. Michael Chen",
    eligibility_note: "Active member - prior auth verification pending.",
    attachments: [],
    updatedAt: minutesAgo(180),
  },
  {
    id: "CLM-4003",
    encounter_id: "ENC-4003",
    patient: { id: 7003, name: "Lisa Thompson" },
    payer: { id: 4, name: "Cigna" },
    dos: "2025-10-06",
    visit_type: "Specialty Consultation",
    state: "FL",
    total_amount: 450,
    status: "rejected_277ca",
    confidence: 0.72,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.89, diagnosis: 0.78, pos: 0.85 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(240),
        note: "Claim auto-built and submitted",
      },
      {
        state: "submitted",
        at: minutesAgo(235),
        note: "Submitted to clearinghouse",
      },
      {
        state: "rejected_277ca",
        at: minutesAgo(220),
        note: "Rejected by scrubber - invalid provider credentials",
      },
    ],
    payer_response: {
      type: "277CA",
      accepted: false,
      message: "Provider not enrolled with payer for this specialty",
    },
    rejection_response: {
      type: "277CA",
      accepted: false,
      carc: "CO-16",
      message: "Provider not credentialed for cardiology services with Cigna",
    },
    chart_note: {
      provider: "Dr. Robert Williams",
      paragraphs: [
        [
          { text: "Cardiology consultation for " },
          { text: "chest pain", highlight: true },
          { text: " evaluation. ECG and echocardiogram performed." },
        ],
      ],
    },
    codes: {
      icd10: ["R06.02", "I25.119"],
      cpt: [
        { code: "99244", description: "Office consultation", amount: 280 },
        { code: "93306", description: "Echocardiography", amount: 170 },
      ],
      pos: "11",
    },
    provider: "Dr. Robert Williams",
    eligibility_note: "Active member - specialty coverage verified.",
    attachments: [],
    updatedAt: minutesAgo(220),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4004",
    encounter_id: "ENC-4004",
    patient: { id: 7004, name: "David Garcia" },
    payer: { id: 6, name: "Molina Healthcare" },
    dos: "2025-10-05",
    visit_type: "Emergency Department",
    state: "NV",
    total_amount: 1250,
    status: "rejected_277ca",
    confidence: 0.68,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.82, diagnosis: 0.71, pos: 0.90 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(300),
        note: "Emergency claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(295),
        note: "Submitted to clearinghouse",
      },
      {
        state: "rejected_277ca",
        at: minutesAgo(280),
        note: "Rejected - invalid facility NPI",
      },
    ],
    payer_response: {
      type: "277CA",
      accepted: false,
      message: "Facility NPI not found in payer database",
    },
    rejection_response: {
      type: "277CA",
      accepted: false,
      carc: "CO-11",
      message: "The diagnosis is inconsistent with the procedure",
    },
    chart_note: {
      provider: "Dr. Amanda Foster",
      paragraphs: [
        [
          { text: "Emergency department visit for " },
          { text: "acute abdominal pain", highlight: true },
          { text: ". CT scan performed, appendicitis ruled out." },
        ],
      ],
    },
    codes: {
      icd10: ["R10.9", "Z51.11"],
      cpt: [
        { code: "99284", description: "Emergency department visit", amount: 580 },
        { code: "74177", description: "CT abdomen/pelvis with contrast", amount: 670 },
      ],
      pos: "23",
    },
    provider: "Dr. Amanda Foster",
    eligibility_note: "Emergency coverage verified.",
    attachments: [],
    updatedAt: minutesAgo(280),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4005",
    encounter_id: "ENC-4005",
    patient: { id: 7005, name: "Jennifer Lee" },
    payer: { id: 7, name: "Kaiser Permanente" },
    dos: "2025-10-04",
    visit_type: "Lab Services",
    state: "CA",
    total_amount: 180,
    status: "needs_review",
    confidence: 0.41,
    issues: [
      {
        field: "physician_order",
        code: "ORDER_MISSING",
        severity: "fail" as ClaimIssueSeverity,
        message: "Physician order required for lab services.",
      },
      {
        field: "lab_results",
        code: "RESULTS_ATTACHMENT_REQUIRED",
        severity: "fail" as ClaimIssueSeverity,
        message: "Lab results must be attached for reimbursement.",
      },
      {
        field: "referral",
        code: "REFERRAL_EXPIRED",
        severity: "fail" as ClaimIssueSeverity,
        message: "Referral has expired and needs renewal.",
      },
    ],
    suggested_fixes: [],
    validation_results: [
      {
        field: "physician_order",
        rule: "Lab order requirement",
        severity: "fail" as ClaimIssueSeverity,
        message: "All lab services require valid physician order.",
      },
    ],
    field_confidences: { cpt: 0.95, order: 0.18, referral: 0.25 },
    auto_submitted: false,
    attempt_count: 1,
    state_history: [
      {
        state: "needs_review",
        at: minutesAgo(200),
        note: "Missing required documentation for lab services",
      },
    ],
    chart_note: {
      provider: "Quest Diagnostics",
      paragraphs: [
        [
          { text: "Comprehensive metabolic panel and " },
          { text: "lipid screening", highlight: true },
          { text: " ordered for routine monitoring." },
        ],
      ],
    },
    codes: {
      icd10: ["E11.9", "Z13.220"],
      cpt: [
        { code: "80053", description: "Comprehensive metabolic panel", amount: 85 },
        { code: "80061", description: "Lipid panel", amount: 95 },
      ],
      pos: "11",
    },
    provider: "Quest Diagnostics",
    eligibility_note: "HMO member - referral verification required.",
    attachments: [],
    updatedAt: minutesAgo(200),
  },
  // Additional demo claims with various denial reasons
  {
    id: "CLM-4006",
    encounter_id: "ENC-4006",
    patient: { id: 7006, name: "Robert Wilson" },
    payer: { id: 1, name: "Aetna" },
    dos: "2025-10-03",
    visit_type: "Surgical Procedure",
    state: "TX",
    total_amount: 2800,
    status: "denied",
    confidence: 0.85,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.92, diagnosis: 0.88, authorization: 0.15 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(360),
        note: "Surgical claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(355),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(340),
        note: "Denied - authorization required",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      carc: "197",
      rarc: "N700",
      message: "Precertification/authorization required for surgical procedures",
    },
    chart_note: {
      provider: "Dr. Jessica Martinez",
      paragraphs: [
        [
          { text: "Surgical removal of " },
          { text: "benign skin lesions", highlight: true },
          { text: " - multiple sites. Patient tolerated procedure well." },
        ],
      ],
    },
    codes: {
      icd10: ["D23.9", "Z98.890"],
      cpt: [
        { code: "11404", description: "Excision benign lesion", amount: 1200 },
        { code: "11401", description: "Excision benign lesion", amount: 800 },
        { code: "12031", description: "Layer closure", amount: 800 },
      ],
      pos: "11",
    },
    provider: "Dr. Jessica Martinez",
    eligibility_note: "Surgical benefits verified - authorization required.",
    attachments: [],
    updatedAt: minutesAgo(340),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4007",
    encounter_id: "ENC-4007",
    patient: { id: 7007, name: "Michelle Brown" },
    payer: { id: 2, name: "Blue Cross Blue Shield" },
    dos: "2025-10-02",
    visit_type: "Physical Therapy",
    state: "CA",
    total_amount: 420,
    status: "denied",
    confidence: 0.76,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.90, diagnosis: 0.65, modifiers: 0.40 },
    auto_submitted: true,
    attempt_count: 2,
    state_history: [
      {
        state: "built",
        at: minutesAgo(400),
        note: "PT claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(395),
        note: "Initial submission",
      },
      {
        state: "denied",
        at: minutesAgo(380),
        note: "Denied - incorrect modifiers",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      carc: "CO-11",
      rarc: "N620",
      message: "Incorrect modifiers applied for therapy services",
    },
    chart_note: {
      provider: "Advanced Physical Therapy",
      paragraphs: [
        [
          { text: "Physical therapy session for " },
          { text: "lower back pain rehabilitation", highlight: true },
          { text: ". Patient showing improved range of motion." },
        ],
      ],
    },
    codes: {
      icd10: ["M54.5", "G89.29"],
      cpt: [
        { code: "97110", description: "Therapeutic exercise", amount: 140 },
        { code: "97112", description: "Neuromuscular reeducation", amount: 140 },
        { code: "97140", description: "Manual therapy", amount: 140 },
      ],
      pos: "11",
    },
    provider: "Advanced Physical Therapy",
    eligibility_note: "PT benefits active - modifier requirements apply.",
    attachments: [],
    updatedAt: minutesAgo(380),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4008",
    encounter_id: "ENC-4008",
    patient: { id: 7008, name: "Kevin Davis" },
    payer: { id: 5, name: "Anthem Blue Cross" },
    dos: "2025-10-01",
    visit_type: "Diagnostic Imaging",
    state: "NV",
    total_amount: 850,
    status: "denied",
    confidence: 0.81,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.95, diagnosis: 0.45, authorization: 0.20 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(450),
        note: "Imaging claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(445),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(420),
        note: "Denied - missing indication details",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      message: "Missing indication detail - clinical justification required",
    },
    chart_note: {
      provider: "Radiology Associates",
      paragraphs: [
        [
          { text: "MRI scan of " },
          { text: "lumbar spine", highlight: true },
          { text: " performed. Patient complaining of persistent back pain." },
        ],
      ],
    },
    codes: {
      icd10: ["M54.5"],
      cpt: [
        { code: "72148", description: "MRI lumbar spine w/o contrast", amount: 850 },
      ],
      pos: "11",
    },
    provider: "Radiology Associates",
    eligibility_note: "Imaging benefits verified - indication required.",
    attachments: [],
    updatedAt: minutesAgo(420),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4009",
    encounter_id: "ENC-4009",
    patient: { id: 7009, name: "Angela Johnson" },
    payer: { id: 3, name: "UnitedHealthcare" },
    dos: "2025-09-30",
    visit_type: "Specialist Consultation",
    state: "FL",
    total_amount: 650,
    status: "denied",
    confidence: 0.72,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.88, eligibility: 0.25, authorization: 0.10 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(500),
        note: "Specialist claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(495),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(480),
        note: "Denied - eligibility not verified",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      message: "Eligibility not verified at time of service",
    },
    chart_note: {
      provider: "Dr. Mark Thompson",
      paragraphs: [
        [
          { text: "Endocrinology consultation for " },
          { text: "diabetes management", highlight: true },
          { text: ". Patient requires medication adjustment and lifestyle counseling." },
        ],
      ],
    },
    codes: {
      icd10: ["E11.9", "Z79.4"],
      cpt: [
        { code: "99244", description: "Consultation, comprehensive", amount: 650 },
      ],
      pos: "11",
    },
    provider: "Dr. Mark Thompson",
    eligibility_note: "Eligibility verification failed at time of service.",
    attachments: [],
    updatedAt: minutesAgo(480),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4010",
    encounter_id: "ENC-4010",
    patient: { id: 7010, name: "Steven Clark" },
    payer: { id: 4, name: "Cigna" },
    dos: "2025-09-29",
    visit_type: "Emergency Department",
    state: "TX",
    total_amount: 1850,
    status: "denied",
    confidence: 0.78,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.85, diagnosis: 0.55, authorization: 0.05 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(550),
        note: "Emergency claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(545),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(530),
        note: "Denied - expired authorization",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      message: "Expired authorization - services provided after expiration date",
    },
    chart_note: {
      provider: "Dr. Lisa Rodriguez",
      paragraphs: [
        [
          { text: "Emergency department visit for " },
          { text: "chest pain evaluation", highlight: true },
          { text: ". EKG and cardiac enzymes performed. Ruled out MI." },
        ],
      ],
    },
    codes: {
      icd10: ["R06.02", "Z87.891"],
      cpt: [
        { code: "99284", description: "ED visit, detailed", amount: 580 },
        { code: "93005", description: "EKG interpretation", amount: 85 },
        { code: "80053", description: "Comprehensive metabolic panel", amount: 85 },
        { code: "82550", description: "Cardiac enzymes", amount: 120 },
      ],
      pos: "23",
    },
    provider: "Dr. Lisa Rodriguez",
    eligibility_note: "Emergency authorization expired prior to service.",
    attachments: [],
    updatedAt: minutesAgo(530),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4011",
    encounter_id: "ENC-4011",
    patient: { id: 7011, name: "Patricia Miller" },
    payer: { id: 1, name: "Aetna" },
    dos: "2025-09-28",
    visit_type: "Laboratory Services",
    state: "CA",
    total_amount: 320,
    status: "denied",
    confidence: 0.67,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.92, diagnosis: 0.35, modifiers: 0.45 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(600),
        note: "Lab claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(595),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(580),
        note: "Denied - incorrect POS/modifiers",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      message: "Incorrect place of service and modifier combination for laboratory services",
    },
    chart_note: {
      provider: "LabCorp",
      paragraphs: [
        [
          { text: "Laboratory testing for " },
          { text: "annual wellness screening", highlight: true },
          { text: ". Complete blood count and lipid panel performed." },
        ],
      ],
    },
    codes: {
      icd10: ["Z00.00", "Z13.220"],
      cpt: [
        { code: "85025", description: "Complete blood count", amount: 85 },
        { code: "80061", description: "Lipid panel", amount: 95 },
        { code: "84703", description: "HbA1c", amount: 65 },
        { code: "82947", description: "Glucose", amount: 75 },
      ],
      pos: "11",
    },
    provider: "LabCorp",
    eligibility_note: "Lab benefits verified - correct POS required.",
    attachments: [],
    updatedAt: minutesAgo(580),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4012",
    encounter_id: "ENC-4012",
    patient: { id: 7012, name: "Christopher Lee" },
    payer: { id: 2, name: "Blue Cross Blue Shield" },
    dos: "2025-09-27",
    visit_type: "Telemedicine",
    state: "NY",
    total_amount: 280,
    status: "rejected_277ca",
    confidence: 0.84,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.90, diagnosis: 0.82, modifiers: 0.25 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(650),
        note: "Telehealth claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(645),
        note: "Submitted to clearinghouse",
      },
      {
        state: "rejected_277ca",
        at: minutesAgo(640),
        note: "Rejected - missing telehealth modifier",
      },
    ],
    rejection_response: {
      type: "277CA",
      accepted: false,
      carc: "N620",
      message: "Missing modifier 95 for telehealth services",
    },
    chart_note: {
      provider: "Dr. Nancy White",
      paragraphs: [
        [
          { text: "Telehealth consultation for " },
          { text: "follow-up diabetes care", highlight: true },
          { text: ". Patient medication compliance reviewed via video call." },
        ],
      ],
    },
    codes: {
      icd10: ["E11.9", "Z79.4"],
      cpt: [
        { code: "99213", description: "Office visit, established patient", amount: 280 },
      ],
      pos: "02",
    },
    provider: "Dr. Nancy White",
    eligibility_note: "Telehealth benefits verified - modifier 95 required.",
    attachments: [],
    updatedAt: minutesAgo(640),
    submissionOutcome: "reject",
  },
  {
    id: "CLM-4013",
    encounter_id: "ENC-4013",
    patient: { id: 7013, name: "Laura Taylor" },
    payer: { id: 6, name: "Molina Healthcare" },
    dos: "2025-09-26",
    visit_type: "Mental Health",
    state: "AZ",
    total_amount: 450,
    status: "denied",
    confidence: 0.73,
    issues: [],
    suggested_fixes: [],
    validation_results: [],
    field_confidences: { cpt: 0.87, diagnosis: 0.78, authorization: 0.15 },
    auto_submitted: true,
    attempt_count: 1,
    state_history: [
      {
        state: "built",
        at: minutesAgo(700),
        note: "Mental health claim auto-built",
      },
      {
        state: "submitted",
        at: minutesAgo(695),
        note: "Submitted to payer",
      },
      {
        state: "denied",
        at: minutesAgo(680),
        note: "Denied - authorization expired",
      },
    ],
    payer_response: {
      type: "835",
      accepted: false,
      message: "Mental health authorization expired - renewal required",
    },
    chart_note: {
      provider: "Dr. James Wilson",
      paragraphs: [
        [
          { text: "Psychiatric evaluation for " },
          { text: "anxiety and depression", highlight: true },
          { text: ". Patient responding well to current medication regimen." },
        ],
      ],
    },
    codes: {
      icd10: ["F41.1", "F32.9"],
      cpt: [
        { code: "90791", description: "Psychiatric evaluation", amount: 450 },
      ],
      pos: "11",
    },
    provider: "Dr. James Wilson",
    eligibility_note: "Mental health benefits verified - authorization expired.",
    attachments: [],
    updatedAt: minutesAgo(680),
    submissionOutcome: "reject",
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

export const formatRelativeTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes <= 0) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const appendHistory = (
  history: ClaimStateEntry[],
  state: ClaimStatus,
  note?: string,
  at?: string
): ClaimStateEntry[] => {
  const timestamp = at ?? new Date().toISOString();
  const last = history[history.length - 1];
  if (last && last.state === state) {
    if (note && last.note !== note) {
      return [...history.slice(0, -1), { ...last, note }];
    }
    return history;
  }
  return [...history, { state, at: timestamp, note }];
};

export const getBlockingIssueCount = (claim: Claim) =>
  claim.issues.filter((issue) => issue.severity === "fail").length;

export const getConfidenceTone = (confidence: number) => {
  if (confidence >= 0.9) return CONFIDENCE_COLORS.high;
  if (confidence >= 0.75) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
};

export const issueSummary = (claim: Claim) =>
  claim.issues
    .filter((issue) => issue.severity !== "pass")
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join("\n");

export const applyFixToClaim = (
  claim: Claim,
  fix: SuggestedFix,
  note?: string
): Claim => {
  if (fix.applied) {
    return claim;
  }
  const now = new Date().toISOString();
  const updatedFixes = claim.suggested_fixes.map((candidate) =>
    candidate.field === fix.field
      ? { ...candidate, applied: true }
      : candidate
  );

  const updatedIssues = claim.issues.map((issue) =>
    issue.field === fix.field && issue.severity === "fail"
      ? { ...issue, severity: "pass" as ClaimIssueSeverity, message: `${issue.message} (resolved)` }
      : issue
  );

  const updatedValidation = claim.validation_results.map((result) =>
    result.field === fix.field && result.severity !== "pass"
      ? { ...result, severity: "pass" as ClaimIssueSeverity, message: `${result.message} — resolved` }
      : result
  );

  const updatedCodes: ClaimCodes = (() => {
    if (fix.field === "pos") {
      return { ...claim.codes, pos: fix.value };
    }
    if (fix.field === "modifiers") {
      return {
        ...claim.codes,
        cpt: claim.codes.cpt.map((line) => ({
          ...line,
          modifiers: line.modifiers
            ? Array.from(new Set([...line.modifiers, fix.value]))
            : [fix.value],
        })),
      };
    }
    if (fix.field === "icd10") {
      return {
        ...claim.codes,
        icd10: Array.from(new Set([...claim.codes.icd10, fix.value])),
      };
    }
    return claim.codes;
  })();

  const failCount = updatedIssues.filter((issue) => issue.severity === "fail").length;
  const nextStatus: ClaimStatus =
    failCount === 0 && claim.status === "needs_review"
      ? "built"
      : claim.status;

  const history =
    nextStatus !== claim.status
      ? appendHistory(
          claim.state_history,
          nextStatus,
          note ?? "Validation cleared",
          now
        )
      : claim.state_history;

  return {
    ...claim,
    suggested_fixes: updatedFixes,
    issues: updatedIssues,
    validation_results: updatedValidation,
    codes: updatedCodes,
    status: nextStatus,
    updatedAt: now,
    state_history: history,
  };
};

export const applyAllFixesToClaim = (claim: Claim): Claim => {
  return claim.suggested_fixes.reduce((acc, fix) => {
    const currentFix = acc.suggested_fixes.find(
      (candidate) => candidate.field === fix.field
    );
    if (currentFix && !currentFix.applied) {
      return applyFixToClaim(acc, currentFix, "All fixes applied");
    }
    return acc;
  }, claim);
};

// Denial Playbook Integration Types
export interface DenialRule {
  id: string;
  code: string;
  description: string;
  strategy: 'auto_resubmit' | 'manual_review' | 'notify';
  enabled: boolean;
  autoFix: boolean;
}

export interface DenialPlaybookConfig {
  autoRetryEnabled: boolean;
  maxRetryAttempts: number;
  customRules: DenialRule[];
}

// Extract denial reason code from claim
export const getDenialReasonCode = (claim: Claim): string | null => {
  // Check for CARC code in payer_response first (835 responses)
  if (claim.payer_response?.carc) {
    return claim.payer_response.carc;
  }

  // Check for CARC code in rejection_response (277CA responses)
  if (claim.rejection_response?.carc) {
    return claim.rejection_response.carc;
  }

  // Check for RARC code as fallback
  if (claim.payer_response?.rarc) {
    return claim.payer_response.rarc;
  }

  if (claim.rejection_response?.rarc) {
    return claim.rejection_response.rarc;
  }

  return null;
};

// Find matching denial rule for a claim
export const findMatchingDenialRule = (
  claim: Claim,
  playbook: DenialPlaybookConfig
): DenialRule | null => {
  const denialCode = getDenialReasonCode(claim);
  if (!denialCode) return null;

  return playbook.customRules.find(
    rule => rule.enabled && rule.code === denialCode
  ) || null;
};

// Check if claim is eligible for auto-resubmission
export const isEligibleForAutoResubmit = (
  claim: Claim,
  playbook: DenialPlaybookConfig
): boolean => {
  if (!playbook.autoRetryEnabled) return false;
  if (claim.attempt_count >= playbook.maxRetryAttempts) return false;
  if (claim.status !== 'denied') return false;

  const rule = findMatchingDenialRule(claim, playbook);
  return rule !== null && rule.strategy === 'auto_resubmit';
};

// Create state history entry for denial playbook actions
export const createDenialPlaybookHistoryEntry = (
  action: string,
  ruleCode?: string,
  note?: string
): ClaimStateEntry => {
  const timestamp = new Date().toISOString();
  const baseNote = ruleCode ? `${action} (rule: ${ruleCode})` : action;
  const fullNote = note ? `${baseNote} - ${note}` : baseNote;

  return {
    state: 'built', // Status after auto-resubmit preparation
    at: timestamp,
    note: fullNote
  };
};

export const STATUS_ORDER: ClaimStatus[] = [
  "needs_review",
  "rejected_277ca",
  "denied",
  "built",
  "submitted",
  "awaiting_277ca",
  "accepted_277ca",
  "paid",
];

// Payment utility functions
export const generatePaymentId = (): string => {
  return `PAY-${Date.now().toString(36).toUpperCase()}`;
};

export const calculateClaimBalance = (claim: Claim): number => {
  if (!claim.payments || claim.payments.length === 0) {
    return claim.total_amount;
  }
  
  const totalPaid = claim.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, claim.total_amount - totalPaid);
};

export const isClaimFullyPaid = (claim: Claim): boolean => {
  return calculateClaimBalance(claim) === 0;
};

export const addPaymentToClaim = (
  claim: Claim,
  amount: number,
  payer: string,
  reference?: string,
  note?: string,
  createdBy?: string
): Claim => {
  const now = new Date().toISOString();
  
  const payment: Payment = {
    id: generatePaymentId(),
    claim_id: claim.id,
    amount,
    date: now,
    payer,
    reference,
    note,
    created_at: now,
    created_by: createdBy
  };

  const updatedPayments = [...(claim.payments || []), payment];
  const remainingBalance = claim.total_amount - updatedPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Update claim status based on payment
  const newStatus: ClaimStatus = remainingBalance <= 0 ? 'paid' : claim.status;
  
  // Add payment entry to state history
  const paymentNote = `Payment received: ${formatCurrency(amount)} from ${payer}${reference ? ` (${reference})` : ''}`;
  const updatedHistory = appendHistory(
    claim.state_history,
    newStatus,
    paymentNote,
    now
  );

  return {
    ...claim,
    payments: updatedPayments,
    status: newStatus,
    state_history: updatedHistory,
    updatedAt: now
  };
};

