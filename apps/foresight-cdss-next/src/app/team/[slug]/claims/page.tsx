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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/lib/supabase/client";
import {
  type Claim,
  STATUS_LABELS,
  REVIEW_STATUSES,
  STATUS_FILTER_OPTIONS,
  PA_STATUS_FILTER_OPTIONS,
  type StatusFilterValue,
  type ClaimFilters,
  type SortField,
  type SortConfig,
  STATUS_BADGE_VARIANTS,
  initialClaims,
  formatCurrency,
  formatRelativeTime,
  getBlockingIssueCount,
  getConfidenceTone,
  issueSummary,
  applyFixToClaim,
  applyAllFixesToClaim,
  STATUS_ORDER,
} from "@/data/claims";

const sortClaims = (claims: Claim[]) =>
  [...claims].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

const ClaimDetailSheet: React.FC<{
  claim: Claim | null;
  open: boolean;
  onClose: () => void;
  threshold: number;
  onApplyAllFixes: (id: string) => void;
  onSubmit: (id: string) => void;
  onResubmit: (id: string) => void;
  onApplySuggestion: (id: string, field: string) => void;
  submittingClaims: Set<string>;
}> = ({
  claim,
  open,
  onClose,
  threshold,
  onApplyAllFixes,
  onSubmit,
  onResubmit,
  onApplySuggestion,
  submittingClaims,
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full xs:min-w-[600px] lg:min-w-[600px] max-w-[80vw] xs:max-w-[80vw] lg:max-w-[45vw] flex flex-col p-0" side="right">
        <SheetHeader className="flex-shrink-0 space-y-6 p-8 pb-6 border-b">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl font-semibold text-foreground">
                  {claim.id}
                </SheetTitle>
                <Badge className={cn("text-xs", STATUS_BADGE_VARIANTS[claim.status])}>
                  {STATUS_LABELS[claim.status]}
                </Badge>
                {claim.auto_submitted && claim.status === "accepted_277ca" && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Auto-submitted
                  </span>
                )}
              </div>
              <SheetDescription className="flex flex-wrap items-center gap-3 text-sm">
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
              </SheetDescription>
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
              disabled={blockingIssues > 0 || claim.status === "submitted" || submittingClaims.has(claim.id)}
            >
              {submittingClaims.has(claim.id) ? "Submitting..." : "Submit & Listen"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onResubmit(claim.id)}
              disabled={!(claim.status === "rejected_277ca" || claim.status === "denied") || submittingClaims.has(claim.id)}
            >
              {submittingClaims.has(claim.id) ? "Submitting..." : "Resubmit corrected"}
            </Button>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 h-full overflow-y-auto px-8">
          <div className="space-y-10 p-8">
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

            {/* Clearinghouse Errors Section */}
            {claim.status === "rejected_277ca" && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" /> Clearinghouse Errors
                </h3>
                <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <div className="space-y-3">
                    {/* Mock clearinghouse errors to demonstrate real data display */}
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                      <div className="flex-1">
                        <div className="font-medium text-destructive">Missing Provider NPI</div>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Field: billing_provider.npi | Error Code: 277CA-001
                        </p>
                        <p className="text-sm text-muted-foreground">
                          The billing provider NPI is required but missing from the claim. Please verify the provider information and resubmit.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                      <div className="flex-1">
                        <div className="font-medium text-destructive">Invalid Diagnosis Code</div>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Field: diagnosis_codes[0] | Error Code: 277CA-045
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Diagnosis code &quot;Z00.00&quot; is not valid for the service date. Please review and correct the primary diagnosis.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded bg-muted/50 border border-muted">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> These are example clearinghouse errors. Real errors will be populated from the scrubbing_result table when backend integration with Claim.MD is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

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
      </SheetContent>
    </Sheet>
  );
};

export default function ClaimsPage() {
  const [threshold] = useState(0.88);
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
  const [showFilters, setShowFilters] = useState(false);
  const [submittingClaims, setSubmittingClaims] = useState<Set<string>>(new Set());

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
    async (claimId: string, auto = false, options?: { resubmitting?: boolean }) => {
      try {
        // Track submission loading state
        setSubmittingClaims(prev => new Set(prev).add(claimId));

        // Get current user for audit trail
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Call the submit-claim-batch Supabase function
        const { data, error } = await supabase.functions.invoke("submit-claim-batch", {
          body: {
            claimIds: [claimId],
            clearinghouseId: "CLAIM_MD",
            userId: currentUserId
          }
        });

        if (error) {
          console.error("Submission failed:", error);
          alert(`Submission failed: ${error.message}`);
          return;
        }

        if (!data?.success) {
          console.error("Submission failed:", data?.error);
          alert(`Submission failed: ${data?.error}`);
          return;
        }

        // Show success feedback
        if (data.claims?.[0]?.status === "accepted_277ca") {
          alert("Claim submitted successfully and accepted by clearinghouse.");
        } else if (data.claims?.[0]?.status === "rejected_277ca") {
          alert("Claim was rejected by clearinghouse. See errors highlighted below.");
        } else {
          alert("Claim submitted successfully.");
        }

        // Refresh claims data to get updated status from backend
        // The backend will have updated the claim status and external IDs
        setClaims((prev) => {
          // Remove optimistic updates - let the data refresh show real status
          return prev.map(claim =>
            claim.id === claimId
              ? { ...claim, auto_submitted: auto ? true : claim.auto_submitted }
              : claim
          );
        });

        // Trigger a refresh of the claims data from the backend
        // This will fetch the updated status set by the backend function
        // TODO: This would ideally integrate with React Query to invalidate and refetch
        console.log("Submission successful:", data);

      } catch (error) {
        console.error("Submission error:", error);
        alert(`Submission error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        // Remove loading state
        setSubmittingClaims(prev => {
          const newSet = new Set(prev);
          newSet.delete(claimId);
          return newSet;
        });
      }
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
      ids.forEach((id) => triggerSubmit(id, false, { resubmitting: true }));
    },
    [triggerSubmit]
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
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Claims Workbench</h1>
        <p>
          Automation-first queue that surfaces only claims requiring human attention.
        </p>
      </header>

      {/* Search and Filters */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search patients, claims, encounters, payers, codes..."
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`cursor-pointer${showFilters ? ' bg-accent' : ' '} ${hasActiveFilters() ? 'border-primary text-primary' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {[filters.status !== 'needs_review', filters.payer !== 'all', filters.state !== 'all',
                        filters.visit !== 'all', filters.dateFrom, filters.dateTo, !filters.onlyNeedsReview,
                        filters.claimId, filters.patientName, filters.payerName, filters.provider,
                        filters.visitType, filters.claimState, filters.search]
                        .filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
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
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground mb-3">Quick Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: value as StatusFilterValue,
                        }))
                      }
                    >
                      <SelectTrigger id="status-select">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[180px]">
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer-select">Payer</Label>
                    <Select
                      value={filters.payer}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, payer: value }))
                      }
                    >
                      <SelectTrigger id="payer-select">
                        <SelectValue placeholder="All Payers" />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state-select">State</Label>
                    <Select
                      value={filters.state}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, state: value }))
                      }
                    >
                      <SelectTrigger id="state-select">
                        <SelectValue placeholder="All States" />
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visit-select">Visit Type</Label>
                    <Select
                      value={filters.visit}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, visit: value }))
                      }
                    >
                      <SelectTrigger id="visit-select">
                        <SelectValue placeholder="All Visit Types" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[160px]">
                        <SelectItem value="all">All visit types</SelectItem>
                        {visitTypes.map((visit) => (
                          <SelectItem key={visit} value={visit}>
                            {visit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-from"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : "Select date"}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-to"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : "Select date"}
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
                  <Label htmlFor="only-review" className="text-sm leading-none self-center">
                    Show only Needs Review & Rejections
                  </Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Queue Table */}
      <Card className="border shadow-xs mt-8">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Work Queue
          </CardTitle>
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
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
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

      <ClaimDetailSheet
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
