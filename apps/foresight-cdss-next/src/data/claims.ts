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
    status: "needs_review",
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

