"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  History,
  ListChecks,
  MoreHorizontal,
  Paperclip,
  ShieldCheck,
  Sparkles,
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

type ClaimStatus =
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

type ClaimIssueSeverity = "pass" | "warn" | "fail";
type FixProvenance = "rule" | "llm";
type SubmissionOutcome = "accept" | "reject";

interface ClaimIssue {
  field: string;
  code: string;
  severity: ClaimIssueSeverity;
  message: string;
}

interface SuggestedFix {
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

interface ValidationResult {
  field?: string;
  rule: string;
  severity: ClaimIssueSeverity;
  message: string;
}

interface ChartSegment {
  text: string;
  highlight?: boolean;
}

interface ClaimChartNote {
  provider: string;
  paragraphs: ChartSegment[][];
}

interface ClaimStateEntry {
  state: ClaimStatus;
  at: string;
  note?: string;
}

interface PayerResponse {
  type: "277CA" | "835";
  accepted?: boolean;
  carc?: string;
  rarc?: string;
  message: string;
}

interface ClaimCodes {
  icd10: string[];
  cpt: { code: string; description: string; amount: number; modifiers?: string[] }[];
  pos: string;
  hcpcs?: string[];
}

interface ClaimAttachment {
  id: string;
  name: string;
  type: string;
}

interface Claim {
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
  updatedAt: string;
  submissionOutcome?: SubmissionOutcome;
}

const STATUS_LABELS: Record<ClaimStatus, string> = {
  needs_review: "Needs Review",
  built: "Ready to Submit",
  submitted: "Submitted",
  awaiting_277ca: "Awaiting 277CA",
  accepted_277ca: "Accepted",
  rejected_277ca: "Rejected",
  paid: "Paid",
  denied: "Denied",
};

const REVIEW_STATUSES = new Set<ClaimStatus>([
  "needs_review",
  "rejected_277ca",
  "denied",
]);

const STATUS_FILTER_OPTIONS = [
  { value: "needs_review", label: "Needs Review" },
  { value: "built", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "awaiting_277ca", label: "Awaiting 277CA" },
  { value: "accepted_277ca", label: "Accepted" },
  { value: "rejected_277ca", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "denied", label: "Denied" },
] as const;

const PA_STATUS_FILTER_OPTIONS = [
  { value: "needs-review", label: "Needs Review" },
  { value: "auto-processing", label: "Auto Processing" },
  { value: "auto-approved", label: "Auto Approved" },
  { value: "auto-denied", label: "Auto Denied" },
  { value: "denied", label: "Denied" },
  { value: "error", label: "Error" },
] as const;

type StatusFilterValue = ClaimStatus | "all";

interface ClaimFilters {
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

type SortField = 'id' | 'patient.name' | 'payer.name' | 'total_amount' | 'status' | 'confidence' | 'updatedAt' | 'dos';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

const CONFIDENCE_COLORS = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-red-600",
};

const STATUS_BADGE_VARIANTS: Record<ClaimStatus, string> = {
  needs_review: "bg-amber-50 text-amber-700 border border-amber-200",
  built: "bg-blue-50 text-blue-700 border border-blue-200",
  submitted: "bg-slate-50 text-slate-700 border border-slate-200",
  awaiting_277ca: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  accepted_277ca: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected_277ca: "bg-red-50 text-red-700 border border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  denied: "bg-red-50 text-red-700 border border-red-200",
};

const initialClaims: Claim[] = [
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const formatRelativeTime = (value: string) => {
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

const appendHistory = (
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

const getBlockingIssueCount = (claim: Claim) =>
  claim.issues.filter((issue) => issue.severity === "fail").length;

const getConfidenceTone = (confidence: number) => {
  if (confidence >= 0.9) return CONFIDENCE_COLORS.high;
  if (confidence >= 0.75) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
};

const issueSummary = (claim: Claim) =>
  claim.issues
    .filter((issue) => issue.severity !== "pass")
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join("\n");

const applyFixToClaim = (
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

const applyAllFixesToClaim = (claim: Claim): Claim => {
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

const STATUS_ORDER: ClaimStatus[] = [
  "needs_review",
  "rejected_277ca",
  "denied",
  "built",
  "submitted",
  "awaiting_277ca",
  "accepted_277ca",
  "paid",
];

const sortClaims = (claims: Claim[]) =>
  [...claims].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

const ClaimDetailDrawer: React.FC<{
  claim: Claim | null;
  onClose: () => void;
  threshold: number;
  onApplyAllFixes: (id: string) => void;
  onSubmit: (id: string) => void;
  onResubmit: (id: string) => void;
  onApplySuggestion: (id: string, field: string) => void;
}> = ({
  claim,
  onClose,
  threshold,
  onApplyAllFixes,
  onSubmit,
  onResubmit,
  onApplySuggestion,
}) => {
  const [showSources, setShowSources] = useState(true);

  useEffect(() => {
    setShowSources(true);
  }, [claim?.id]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!claim) {
    return null;
  }

  const blockingIssues = getBlockingIssueCount(claim);
  const suggestionsToShow = claim.suggested_fixes.filter((fix) => {
    if (fix.applied) {
      return false;
    }
    const fieldConfidence = claim.field_confidences[fix.field] ?? 1;
    return (
      fieldConfidence < threshold ||
      claim.status === "rejected_277ca" ||
      claim.status === "denied"
    );
  });

  return (
    <Drawer open={open} onOpenChange={onClose}>
n      <DrawerContent className="fixed inset-y-0 right-0 h-full w-full max-w-3xl flex flex-col border-l bg-background mt-0 rounded-t-none rounded-l-lg">
        <DrawerHeader className="space-y-1 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <DrawerTitle className="text-2xl font-semibold text-foreground">
                  {claim.id}
                </DrawerTitle>
                <Badge className={cn("text-xs", STATUS_BADGE_VARIANTS[claim.status])}>
                  {STATUS_LABELS[claim.status]}
                </Badge>
                {claim.auto_submitted && claim.status === "accepted_277ca" && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Auto-submitted
                  </span>
                )}
              </div>
              <DrawerDescription className="flex flex-wrap items-center gap-3 text-sm">
                <span>
                  Confidence:
                  <span
                    className={cn(
                      "ml-2 font-medium",
                      getConfidenceTone(claim.confidence)
                    )}
                  >
                    {(claim.confidence * 100).toFixed(0)}%
                  </span>
                </span>
                <span>Charge {formatCurrency(claim.total_amount)}</span>
                <span>Attempt #{claim.attempt_count}</span>
              </DrawerDescription>
            </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onApplyAllFixes(claim.id)}
              disabled={claim.suggested_fixes.every((fix) => fix.applied)}
            >
              Apply All Fixes
            </Button>
            <Button
              onClick={() => onSubmit(claim.id)}
              disabled={blockingIssues > 0 || claim.status === "submitted"}
            >
              Submit & Listen
            </Button>
            <Button
              variant="secondary"
              onClick={() => onResubmit(claim.id)}
              disabled={!(claim.status === "rejected_277ca" || claim.status === "denied")}
            >
              Resubmit corrected
            </Button>
            </div>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-8 pb-10">
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" /> Patient & Encounter
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="font-medium">{claim.patient.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Encounter</span>
                    <span className="font-medium">{claim.encounter_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">State</span>
                    <span className="font-medium">{claim.state}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{claim.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date of service</span>
                    <span className="font-medium">
                      {new Date(claim.dos).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Visit type</span>
                    <span className="font-medium">{claim.visit_type}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <ListChecks className="h-4 w-4" /> Payer & Coverage
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payer</span>
                    <span className="font-medium">{claim.payer.name}</span>
                  </div>
                  {claim.member_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Member ID</span>
                      <span className="font-medium">{claim.member_id}</span>
                    </div>
                  )}
                  {claim.eligibility_note && (
                    <div className="rounded border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-xs text-muted-foreground">
                      {claim.eligibility_note}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Codes
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    ICD-10
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {claim.codes.icd10.map((code) => (
                      <Badge key={code} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    CPT/HCPCS
                  </h4>
                  <div className="space-y-2">
                    {claim.codes.cpt.map((line) => (
                      <div
                        key={line.code}
                        className="flex items-center justify-between rounded border border-border/60 bg-background p-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">{line.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {line.description}
                          </div>
                          {line.modifiers && line.modifiers.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Modifiers: {line.modifiers.join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm font-medium">
                          {formatCurrency(line.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    Place of Service
                  </h4>
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    {claim.codes.pos}
                  </Badge>
                </div>
                {claim.codes.hcpcs && claim.codes.hcpcs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      HCPCS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {claim.codes.hcpcs.map((code) => (
                        <Badge key={code} variant="secondary">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Validation Results
              </h3>
              <div className="space-y-2">
                {claim.validation_results.map((result) => {
                  const Icon =
                    result.severity === "pass"
                      ? ShieldCheck
                      : result.severity === "warn"
                      ? AlertTriangle
                      : X;
                  const color =
                    result.severity === "pass"
                      ? "text-emerald-600"
                      : result.severity === "warn"
                      ? "text-amber-600"
                      : "text-red-600";
                  return (
                    <div
                      key={`${result.rule}-${result.field ?? "general"}`}
                      className="flex items-start gap-3 rounded border border-border/60 bg-muted/20 p-3 text-sm"
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5", color)} />
                      <div>
                        <div className="font-medium">{result.rule}</div>
                        <p className="text-xs text-muted-foreground">
                          {result.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {suggestionsToShow.length > 0 && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-4 w-4" /> AI Suggestions
                </h3>
                <div className="space-y-3">
                  {suggestionsToShow.map((fix) => (
                    <div
                      key={`${claim.id}-${fix.field}`}
                      className="flex flex-col gap-3 rounded border border-dashed border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {fix.label}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {(fix.confidence * 100).toFixed(0)}% confidence • {fix.provenance === "rule" ? "Rule" : "LLM"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fix.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          {fix.value}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => onApplySuggestion(claim.id, fix.field)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" /> Chart Note
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Show sources</span>
                  <Switch
                    checked={showSources}
                    onCheckedChange={(checked) =>
                      setShowSources(checked === true)
                    }
                  />
                </div>
              </div>
              <div className="space-y-3 rounded border border-border/60 bg-muted/10 p-4 text-sm leading-relaxed">
                {claim.chart_note.paragraphs.map((paragraph, index) => (
                  <p key={index} className="space-x-1">
                    {paragraph.map((segment, idx) =>
                      segment.highlight && showSources ? (
                        <mark
                          key={idx}
                          className="rounded bg-amber-100 px-1 py-0.5"
                        >
                          {segment.text}
                        </mark>
                      ) : (
                        <span key={idx}>{segment.text}</span>
                      )
                    )}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground">
                  Attending: {claim.chart_note.provider}
                </p>
              </div>
            </section>

            {claim.payer_response && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" /> Payer Response
                </h3>
                <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-destructive">
                    {claim.payer_response.carc && (
                      <Badge variant="destructive">CARC {claim.payer_response.carc}</Badge>
                    )}
                    {claim.payer_response.rarc && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive">
                        RARC {claim.payer_response.rarc}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-destructive">
                    {claim.payer_response.message}
                  </p>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <History className="h-4 w-4" /> Timeline & Audit
              </h3>
              <div className="space-y-3">
                {claim.state_history
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.at).getTime() - new Date(a.at).getTime()
                  )
                  .map((entry, index) => (
                    <div
                      key={`${entry.state}-${index}`}
                      className="flex items-start justify-between rounded border border-border/60 bg-background p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {STATUS_LABELS[entry.state]}
                        </div>
                        {entry.note && (
                          <div className="text-xs text-muted-foreground">
                            {entry.note}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.at).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {claim.attachments && claim.attachments.length > 0 && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Paperclip className="h-4 w-4" /> Attachments
                </h3>
                <div className="space-y-2">
                  {claim.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded border border-border/60 bg-muted/10 p-3 text-sm"
                    >
                      <span>{attachment.name}</span>
                      <span className="text-xs uppercase text-muted-foreground">
                        {attachment.type}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default function ClaimsPage() {
  const [threshold, setThreshold] = useState(0.88);
  const [filters, setFilters] = useState<ClaimFilters>({
    search: "",
    status: "needs_review" as StatusFilterValue,
    paStatuses: [],
    payer: "all",
    state: "all",
    visit: "all",
    dateFrom: "",
    dateTo: "",
    onlyNeedsReview: true,
    // Column-specific filters
    claimId: "",
    patientName: "",
    payerName: "",
    provider: "",
    visitType: "",
    claimState: "",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });
  const [claims, setClaims] = useState<Claim[]>(() => sortClaims(initialClaims));
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.search.trim() !== '' ||
      filters.status !== 'needs_review' ||
      filters.paStatuses.length > 0 ||
      filters.payer !== 'all' ||
      filters.state !== 'all' ||
      filters.visit !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      !filters.onlyNeedsReview ||
      filters.claimId !== '' ||
      filters.patientName !== '' ||
      filters.payerName !== '' ||
      filters.provider !== '' ||
      filters.visitType !== '' ||
      filters.claimState !== '' ||
      sortConfig.field !== null
    );
  }, [filters, sortConfig]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      // Start with ascending
      return { field, direction: 'asc' };
    });
  }, []);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-4 h-4 text-foreground" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="w-4 h-4 text-foreground" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
  }, [sortConfig]);

  const payers = useMemo(
    () =>
      Array.from(new Map(claims.map((claim) => [claim.payer.id, claim.payer]))).map(
        ([id, payer]) => ({ id, name: payer.name })
      ),
    [claims]
  );

  const states = useMemo(
    () => Array.from(new Set(claims.map((claim) => claim.state))).sort(),
    [claims]
  );

  const visitTypes = useMemo(
    () => Array.from(new Set(claims.map((claim) => claim.visit_type))).sort(),
    [claims]
  );

  const updateClaim = useCallback(
    (id: string, updater: (claim: Claim) => Claim) => {
      setClaims((prev) =>
        sortClaims(
          prev.map((claim) => (claim.id === id ? updater(claim) : claim))
        )
      );
    },
    []
  );

  const applyAllFixes = useCallback((ids: string[]) => {
    setClaims((prev) =>
      sortClaims(
        prev.map((claim) =>
          ids.includes(claim.id)
            ? applyAllFixesToClaim(claim)
            : claim
        )
      )
    );
  }, []);

  const applySuggestion = useCallback((id: string, field: string) => {
    updateClaim(id, (claim) => {
      const fix = claim.suggested_fixes.find((candidate) => candidate.field === field);
      if (!fix) {
        return claim;
      }
      return applyFixToClaim(claim, fix, "Suggestion applied");
    });
  }, [updateClaim]);

  const triggerSubmit = useCallback(
    (claimId: string, auto = false, options?: { resubmitting?: boolean }) => {
      setClaims((prev) => {
        const target = prev.find((claim) => claim.id === claimId);
        if (!target) {
          return prev;
        }
        if (target.status === "submitted" || target.status === "awaiting_277ca") {
          return prev;
        }
        const now = new Date().toISOString();
        const updated = prev.map((claim) => {
          if (claim.id !== claimId) {
            return claim;
          }
          const historyWithSubmission = appendHistory(
            claim.state_history,
            "submitted",
            auto ? "Auto-submitted" : "Submitted",
            now
          );
          return {
            ...claim,
            status: "submitted" as ClaimStatus,
            auto_submitted: auto ? true : claim.auto_submitted,
            attempt_count: options?.resubmitting ? claim.attempt_count + 1 : claim.attempt_count,
            payer_response: options?.resubmitting ? undefined : claim.payer_response,
            updatedAt: now,
            state_history: historyWithSubmission,
          };
        });
        return sortClaims(updated);
      });

      setTimeout(() => {
        setClaims((prev) =>
          sortClaims(
            prev.map((claim) =>
              claim.id === claimId
                ? {
                    ...claim,
                    status: "awaiting_277ca",
                    updatedAt: new Date().toISOString(),
                    state_history: appendHistory(
                      claim.state_history,
                      "awaiting_277ca",
                      "Listening for 277CA"
                    ),
                  }
                : claim
            )
          )
        );
      }, 600);

      setTimeout(() => {
        setClaims((prev) =>
          sortClaims(
            prev.map((claim) => {
              if (claim.id !== claimId) {
                return claim;
              }
              const outcome = claim.submissionOutcome ?? "accept";
              const finalStatus: ClaimStatus =
                outcome === "accept" ? "accepted_277ca" : "rejected_277ca";
              const nextResponse =
                outcome === "reject"
                  ? claim.rejection_response ?? claim.payer_response
                  : claim.payer_response;
              return {
                ...claim,
                status: finalStatus,
                payer_response: outcome === "reject" ? nextResponse : claim.payer_response,
                updatedAt: new Date().toISOString(),
                state_history: appendHistory(
                  claim.state_history,
                  finalStatus,
                  outcome === "accept" ? "Payer accepted" : "Payer rejected"
                ),
              };
            })
          )
        );
      }, 1800);
    },
    []
  );

  const submitClaims = useCallback(
    (ids: string[], auto = false, options?: { resubmitting?: boolean }) => {
      ids.forEach((id) => triggerSubmit(id, auto, options));
    },
    [triggerSubmit]
  );

  const resubmitClaims = useCallback(
    (ids: string[]) => {
      setClaims((prev) =>
        sortClaims(
          prev.map((claim) =>
            ids.includes(claim.id)
              ? {
                  ...claim,
                  status: "built",
                  payer_response: undefined,
                  updatedAt: new Date().toISOString(),
                  state_history: appendHistory(
                    claim.state_history,
                    "built",
                    "Corrected for resubmission"
                  ),
                }
              : claim
          )
        )
      );
      submitClaims(ids, false, { resubmitting: true });
    },
    [submitClaims]
  );

  useEffect(() => {
    claims.forEach((claim) => {
      if (
        claim.status === "built" &&
        getBlockingIssueCount(claim) === 0 &&
        claim.confidence >= threshold &&
        !claim.auto_submitted
      ) {
        triggerSubmit(claim.id, true);
      }
    });
  }, [claims, threshold, triggerSubmit]);

  const filteredClaims = useMemo(() => {
    const filtered = claims.filter((claim) => {
      const matchesSearch = (() => {
        if (!filters.search.trim()) {
          return true;
        }
        const term = filters.search.trim().toLowerCase();
        const corpus = [
          claim.id,
          claim.encounter_id,
          claim.patient.name,
          claim.payer.name,
          claim.visit_type,
          claim.codes.pos,
          claim.member_id ?? "",
          claim.codes.icd10.join(" "),
          claim.codes.cpt.map((line) => line.code).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return corpus.includes(term);
      })();

      if (!matchesSearch) {
        return false;
      }

      if (filters.status !== "all" && claim.status !== filters.status) {
        return false;
      }

      // PA Status filtering
      if (filters.paStatuses.length > 0 && claim.pa_status && !filters.paStatuses.includes(claim.pa_status)) {
        return false;
      }

      if (filters.payer !== "all" && String(claim.payer.id) !== filters.payer) {
        return false;
      }

      if (filters.state !== "all" && claim.state !== filters.state) {
        return false;
      }

      if (filters.visit !== "all" && claim.visit_type !== filters.visit) {
        return false;
      }

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (new Date(claim.dos) < from) {
          return false;
        }
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        if (new Date(claim.dos) > to) {
          return false;
        }
      }

      if (filters.onlyNeedsReview) {
        const shouldHide =
          !REVIEW_STATUSES.has(claim.status) &&
          claim.confidence >= threshold &&
          getBlockingIssueCount(claim) === 0;
        if (shouldHide) {
          return false;
        }
      }

      // Column-specific filters
      if (filters.claimId && !claim.id.toLowerCase().includes(filters.claimId.toLowerCase())) {
        return false;
      }

      if (filters.patientName && !claim.patient.name.toLowerCase().includes(filters.patientName.toLowerCase())) {
        return false;
      }

      if (filters.payerName && !claim.payer.name.toLowerCase().includes(filters.payerName.toLowerCase())) {
        return false;
      }

      if (filters.provider && !claim.provider.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false;
      }

      if (filters.visitType && !claim.visit_type.toLowerCase().includes(filters.visitType.toLowerCase())) {
        return false;
      }

      if (filters.claimState && !claim.state.toLowerCase().includes(filters.claimState.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Apply sorting
    if (sortConfig.field && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // Handle nested properties and special cases
        switch (sortConfig.field) {
          case 'patient.name':
            aValue = a.patient.name.toLowerCase();
            bValue = b.patient.name.toLowerCase();
            break;
          case 'payer.name':
            aValue = a.payer.name.toLowerCase();
            bValue = b.payer.name.toLowerCase();
            break;
          case 'total_amount':
            aValue = a.total_amount;
            bValue = b.total_amount;
            break;
          case 'confidence':
            aValue = a.confidence;
            bValue = b.confidence;
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime();
            bValue = new Date(b.updatedAt).getTime();
            break;
          case 'dos':
            aValue = new Date(a.dos).getTime();
            bValue = new Date(b.dos).getTime();
            break;
          default:
            aValue = String(a[sortConfig.field as keyof Claim] || '').toLowerCase();
            bValue = String(b[sortConfig.field as keyof Claim] || '').toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortClaims(filtered);
  }, [claims, filters, threshold, sortConfig]);

  useEffect(() => {
    setSelectedClaimIds((prev) =>
      prev.filter((id) => filteredClaims.some((claim) => claim.id === id))
    );
  }, [filteredClaims]);

  const activeClaim = useMemo(
    () => claims.find((claim) => claim.id === activeClaimId) ?? null,
    [claims, activeClaimId]
  );

  const toggleSelection = (claimId: string, checked: boolean) => {
    setSelectedClaimIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, claimId]));
      }
      return prev.filter((id) => id !== claimId);
    });
  };

  const allVisibleSelected =
    filteredClaims.length > 0 &&
    filteredClaims.every((claim) => selectedClaimIds.includes(claim.id));

  const someVisibleSelected =
    selectedClaimIds.length > 0 && !allVisibleSelected;

  const headerChecked: boolean | "indeterminate" = filteredClaims.length === 0
    ? false
    : allVisibleSelected
    ? true
    : someVisibleSelected
    ? "indeterminate"
    : false;

  const handleSelectAll = (checked: boolean) => {
    setSelectedClaimIds(checked ? filteredClaims.map((claim) => claim.id) : []);
  };

  const batchApplyDisabled =
    selectedClaimIds.length === 0 ||
    selectedClaimIds.every((id) => {
      const claim = claims.find((item) => item.id === id);
      return !claim || claim.suggested_fixes.every((fix) => fix.applied);
    });

  const batchSubmitDisabled =
    selectedClaimIds.length === 0 ||
    selectedClaimIds.some((id) => {
      const claim = claims.find((item) => item.id === id);
      if (!claim) {
        return true;
      }
      return getBlockingIssueCount(claim) > 0 || claim.status === "submitted";
    });

  const batchResubmitDisabled =
    selectedClaimIds.length === 0 ||
    selectedClaimIds.some((id) => {
      const claim = claims.find((item) => item.id === id);
      if (!claim) {
        return true;
      }
      return !(claim.status === "rejected_277ca" || claim.status === "denied");
    });

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Claims Workbench</h1>
        <p className="text-sm text-muted-foreground">
          Automation-first queue that surfaces only claims requiring human attention.
        </p>
      </header>

      <Card className="border shadow-xs">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Work Queue
          </CardTitle>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              {/* Active Filters Display */}
              {hasActiveFilters() && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-muted-foreground/20">
                  <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {filters.search}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.status !== 'needs_review' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {STATUS_FILTER_OPTIONS.find(opt => opt.value === filters.status)?.label || filters.status}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, status: 'needs_review' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.paStatuses.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      PA Status: {filters.paStatuses.length === 1
                        ? PA_STATUS_FILTER_OPTIONS.find(opt => opt.value === filters.paStatuses[0])?.label
                        : `${filters.paStatuses.length} selected`
                      }
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, paStatuses: [] }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.payer !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Payer: {payers.find(p => String(p.id) === filters.payer)?.name || filters.payer}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, payer: 'all' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.state !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      State: {filters.state}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, state: 'all' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.visit !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Visit: {filters.visit}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, visit: 'all' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <Badge variant="secondary" className="gap-1">
                      Date: {filters.dateFrom || '...'} to {filters.dateTo || '...'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {!filters.onlyNeedsReview && (
                    <Badge variant="secondary" className="gap-1">
                      Show All Claims
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, onlyNeedsReview: true }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {/* Column-specific filters */}
                  {filters.claimId && (
                    <Badge variant="outline" className="gap-1">
                      Claim ID: {filters.claimId}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, claimId: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.patientName && (
                    <Badge variant="outline" className="gap-1">
                      Patient: {filters.patientName}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, patientName: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.payerName && (
                    <Badge variant="outline" className="gap-1">
                      Payer Name: {filters.payerName}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, payerName: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.provider && (
                    <Badge variant="outline" className="gap-1">
                      Provider: {filters.provider}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, provider: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.visitType && (
                    <Badge variant="outline" className="gap-1">
                      Visit Type: {filters.visitType}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, visitType: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.claimState && (
                    <Badge variant="outline" className="gap-1">
                      State Filter: {filters.claimState}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, claimState: '' }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                  {sortConfig.field && (
                    <Badge variant="outline" className="gap-1">
                      Sorted by: {sortConfig.field} ({sortConfig.direction})
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setSortConfig({ field: null, direction: null })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
                <div className="relative lg:col-span-2 xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search patients, claims, encounters, payers, codes"
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: event.target.value,
                      }))
                    }
                    className="pl-10 pr-12 min-w-0 w-full"
                  />
                  {hasActiveFilters() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => {
                        setFilters({
                          search: "",
                          status: "needs_review" as StatusFilterValue,
                          paStatuses: [],
                          payer: "all",
                          state: "all",
                          visit: "all",
                          dateFrom: "",
                          dateTo: "",
                          onlyNeedsReview: true,
                          claimId: "",
                          patientName: "",
                          payerName: "",
                          provider: "",
                          visitType: "",
                          claimState: "",
                        });
                        setSortConfig({ field: null, direction: null });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as StatusFilterValue,
                    }))
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.payer}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, payer: value }))
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Payer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payers</SelectItem>
                    {payers.map((payer) => (
                      <SelectItem key={payer.id} value={String(payer.id)}>
                        {payer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.state}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, state: value }))
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.visit}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, visit: value }))
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Visit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All visit types</SelectItem>
                    {visitTypes.map((visit) => (
                      <SelectItem key={visit} value={visit}>
                        {visit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid gap-2 sm:grid-cols-2 min-w-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal min-w-[140px] truncate cursor-pointer"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : "From date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                        onSelect={(date) => {
                          setFilters((prev) => ({
                            ...prev,
                            dateFrom: date ? date.toISOString().split('T')[0] : '',
                          }));
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date > today;
                        }}
                        className="rounded-lg border shadow-xs"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal min-w-[140px] truncate cursor-pointer"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : "To date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                        onSelect={(date) => {
                          setFilters((prev) => ({
                            ...prev,
                            dateTo: date ? date.toISOString().split('T')[0] : '',
                          }));
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
                          return date > today || (fromDate ? date < fromDate : false);
                        }}
                        className="rounded-lg border shadow-xs"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="only-review"
                    checked={filters.onlyNeedsReview}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({
                        ...prev,
                        onlyNeedsReview: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="only-review" className="text-sm">
                    Show only Needs Review & Rejections
                  </Label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-xs text-muted-foreground">
                    Confidence threshold: {(threshold * 100).toFixed(0)}%
                  </span>
                  <Slider
                    min={0.5}
                    max={1}
                    step={0.01}
                    value={[threshold]}
                    onValueChange={(value) => {
                      const next = Number(value[0]);
                      if (!Number.isNaN(next)) {
                        setThreshold(Number(next.toFixed(2)));
                      }
                    }}
                    className="w-48"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                disabled={batchApplyDisabled}
                onClick={() => applyAllFixes(selectedClaimIds)}
              >
                Apply All Fixes
              </Button>
              <Button
                variant="secondary"
                disabled={batchSubmitDisabled}
                onClick={() => submitClaims(selectedClaimIds)}
              >
                Submit & Listen
              </Button>
              <Button
                disabled={batchResubmitDisabled}
                onClick={() => resubmitClaims(selectedClaimIds)}
              >
                Resubmit corrected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked === true)
                    }
                    aria-label="Select all claims"
                    onClick={(event) => event.stopPropagation()}
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span>Claim</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSort('id')}
                      >
                        {getSortIcon('id')}
                      </Button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Filter className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="claim-filter">Filter by Claim ID</Label>
                            <Input
                              id="claim-filter"
                              placeholder="Enter claim ID..."
                              value={filters.claimId}
                              onChange={(e) => setFilters(prev => ({ ...prev, claimId: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="visit-filter">Filter by Visit Type</Label>
                            <Input
                              id="visit-filter"
                              placeholder="Enter visit type..."
                              value={filters.visitType}
                              onChange={(e) => setFilters(prev => ({ ...prev, visitType: e.target.value }))}
                            />
                          </div>
                          {(filters.claimId || filters.visitType) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, claimId: '', visitType: '' }))}
                              className="w-full"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Claim Filters
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span>Patient</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSort('patient.name')}
                      >
                        {getSortIcon('patient.name')}
                      </Button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Filter className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="patient-filter">Filter by Patient Name</Label>
                            <Input
                              id="patient-filter"
                              placeholder="Enter patient name..."
                              value={filters.patientName}
                              onChange={(e) => setFilters(prev => ({ ...prev, patientName: e.target.value }))}
                            />
                          </div>
                          {filters.patientName && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, patientName: '' }))}
                              className="w-full"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Patient Filter
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span>Payer</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSort('payer.name')}
                      >
                        {getSortIcon('payer.name')}
                      </Button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Filter className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="payer-filter">Filter by Payer Name</Label>
                            <Input
                              id="payer-filter"
                              placeholder="Enter payer name..."
                              value={filters.payerName}
                              onChange={(e) => setFilters(prev => ({ ...prev, payerName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="provider-filter">Filter by Provider</Label>
                            <Input
                              id="provider-filter"
                              placeholder="Enter provider name..."
                              value={filters.provider}
                              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state-filter-column">Filter by State</Label>
                            <Input
                              id="state-filter-column"
                              placeholder="Enter state..."
                              value={filters.claimState}
                              onChange={(e) => setFilters(prev => ({ ...prev, claimState: e.target.value }))}
                            />
                          </div>
                          {(filters.payerName || filters.provider || filters.claimState) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, payerName: '', provider: '', claimState: '' }))}
                              className="w-full"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Payer Filters
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Charge</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSort('total_amount')}
                    >
                      {getSortIcon('total_amount')}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSort('status')}
                      >
                        {getSortIcon('status')}
                      </Button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            filters.paStatuses.length > 0 && "opacity-100 text-primary"
                          )}
                        >
                          <Filter className="w-4 h-4" />
                          {filters.paStatuses.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="start">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">PA Status Filter</Label>
                            <div className="space-y-2">
                              {PA_STATUS_FILTER_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`pa-status-${option.value}`}
                                    checked={filters.paStatuses.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        paStatuses: checked
                                          ? [...prev.paStatuses, option.value]
                                          : prev.paStatuses.filter(status => status !== option.value)
                                      }));
                                    }}
                                  />
                                  <Label
                                    htmlFor={`pa-status-${option.value}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, paStatuses: PA_STATUS_FILTER_OPTIONS.map(opt => opt.value) }))}
                              className="flex-1"
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(prev => ({ ...prev, paStatuses: [] }))}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Confidence</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSort('confidence')}
                    >
                      {getSortIcon('confidence')}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <span>Updated</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleSort('updatedAt')}
                    >
                      {getSortIcon('updatedAt')}
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="text-right">More</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                    Automation handled everything 🎉. Try clearing filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredClaims.map((claim) => {
                const blockingIssues = getBlockingIssueCount(claim);
                const rowClasses = cn(
                  claim.status === "rejected_277ca" || claim.status === "denied"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-transparent",
                  "cursor-pointer"
                );
                return (
                  <TableRow
                    key={claim.id}
                    className={rowClasses}
                    onClick={(event) => {
                      const interactive = (event.target as HTMLElement).closest(
                        "button, a, [role=checkbox]"
                      );
                      if (interactive) {
                        return;
                      }
                      setActiveClaimId(claim.id);
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedClaimIds.includes(claim.id)}
                        onCheckedChange={(checked) =>
                          toggleSelection(claim.id, checked === true)
                        }
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select ${claim.id}`}
                      />
                    </TableCell>
                    <TableCell className="space-y-1">
                      <div className="font-medium text-foreground">
                        {claim.id}
                        <ArrowUpRight className="ml-1 inline h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {claim.encounter_id} • {new Date(claim.dos).toLocaleDateString()} • {claim.visit_type}
                      </div>
                      {(claim.status === "rejected_277ca" || claim.status === "denied") &&
                        claim.payer_response && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            {claim.payer_response.carc ?? ""}
                            {claim.payer_response.carc && claim.payer_response.rarc ? " / " : ""}
                            {claim.payer_response.rarc ?? ""}
                          </Badge>
                        )}
                    </TableCell>
                    <TableCell>{claim.patient.name}</TableCell>
                    <TableCell>{claim.payer.name}</TableCell>
                    <TableCell>{formatCurrency(claim.total_amount)}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_BADGE_VARIANTS[claim.status])}>
                        {STATUS_LABELS[claim.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={claim.confidence * 100} className="h-2 w-24" />
                        <span className={cn("text-sm font-medium", getConfidenceTone(claim.confidence))}>
                          {(claim.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell title={issueSummary(claim)}>
                      {blockingIssues > 0 ? (
                        <Badge variant="destructive">{blockingIssues} blocking</Badge>
                      ) : claim.issues.some((issue) => issue.severity === "warn") ? (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Warn
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Clear
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatRelativeTime(claim.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setActiveClaimId(claim.id)}>
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard?.writeText(claim.id);
                            }}
                          >
                            Copy claim #
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActiveClaimId(claim.id)}>
                            Audit log
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClaimDetailDrawer
        claim={activeClaim}
        open={!!activeClaimId}
        onClose={() => setActiveClaimId(null)}
        threshold={threshold}
        onApplyAllFixes={(id) => applyAllFixes([id])}
        onSubmit={(id) => submitClaims([id])}
        onResubmit={(id) => resubmitClaims([id])}
        onApplySuggestion={applySuggestion}
      />
    </div>
  );
}
