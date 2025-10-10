"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
  DollarSign,
  Plus,
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
import { toast } from "sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// import { supabase } from "@/lib/supabase/client";
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
  issueSummary,
  applyFixToClaim,
  applyAllFixesToClaim,
  STATUS_ORDER,
  getDenialReasonCode,
  findMatchingDenialRule,
  createDenialPlaybookHistoryEntry,
  appendHistory,
  calculateClaimBalance,
  addPaymentToClaim,
} from "@/data/claims";
import { AddPaymentForm } from "@/components/claims/add-payment-form";

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
  onPrev?: () => void;
  onNext?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  onUpdateClaim: (claimId: string, updater: (claim: Claim) => Claim) => void;
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
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  onUpdateClaim,
}) => {
  const [showSources, setShowSources] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);

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
            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                disabled={disablePrev}
                className="h-8 w-8 p-0"
                aria-label="Previous claim"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={disableNext}
                className="h-8 w-8 p-0"
                aria-label="Next claim"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-center gap-3">
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
                {claim.status === "denied" && claim.state_history.some(entry => entry.note?.includes("playbook")) && (
                  <span className="flex items-center gap-1 text-sm text-blue-600">
                    <Sparkles className="h-4 w-4" /> Denial Playbook Active
                  </span>
                )}
              </div>
              <SheetDescription className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <span>Charge {formatCurrency(claim.total_amount)}</span>
                <span>Attempt #{claim.attempt_count}</span>
              </SheetDescription>
            </div>

            {/* Spacer to balance the layout */}
            <div className="w-20"></div>
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
              disabled={blockingIssues > 0 || claim.status === "submitted" || claim.status === "accepted_277ca" || claim.status === "awaiting_277ca" || submittingClaims.has(claim.id)}
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
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Patient</span>
                    <span className="font-medium text-right">{claim.patient.name}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Encounter</span>
                    <span className="font-medium text-right">{claim.encounter_id}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">State</span>
                    <span className="font-medium text-right">{claim.state}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Provider</span>
                    <span className="font-medium text-right">{claim.provider}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Date of service</span>
                    <span className="font-medium text-right">
                      {new Date(claim.dos).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground flex-shrink-0">Visit type</span>
                    <span className="font-medium text-right">{claim.visit_type}</span>
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
                {(() => {
                  // Check if there are any highlighted segments in the chart note
                  const hasHighlightedSources = claim.chart_note.paragraphs.some(paragraph =>
                    paragraph.some(segment => segment.highlight)
                  );
                  
                  return hasHighlightedSources ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Show sources</span>
                      <Switch
                        checked={showSources}
                        onCheckedChange={(checked) =>
                          setShowSources(checked === true)
                        }
                      />
                    </div>
                  ) : null;
                })()}
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
                    {(() => {
                      const clearinghouseErrors = ((claim as Claim).scrubbing_result ?? []).filter(result => result.severity === 'error');
                      
                      if (clearinghouseErrors.length > 0) {
                        // Display real clearinghouse errors from scrubbing_result
                        return clearinghouseErrors.map((error, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                            <div className="flex-1">
                              <div className="font-medium text-destructive">{error.message}</div>
                              <p className="text-xs text-muted-foreground mt-1 mb-2">
                                {error.field_path && `Field: ${error.field_path}`}
                                {error.error_code && ` | Error Code: ${error.error_code}`}
                              </p>
                            </div>
                          </div>
                        ));
                      } else {
                        // Fallback to demo errors if no real errors found
                        return (
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                            <div className="flex-1">
                              <div className="font-medium text-destructive">Missing Provider NPI</div>
                              <p className="text-xs text-muted-foreground mt-1 mb-2">
                                Field: billing_provider.npi | Error Code: AAE-44
                              </p>
                              <p className="text-sm text-muted-foreground">
                                The billing provider NPI is required but missing from the claim. Please verify the provider information and resubmit.
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </section>
            )}

            {/* Clearinghouse Warnings Section */}
            {(claim.status === "accepted_277ca" || claim.status === "rejected_277ca") && ((claim as Claim).scrubbing_result ?? []).filter(result => result.severity === 'warning').length > 0 && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" /> Clearinghouse Warnings
                </h3>
                <div className="rounded border border-amber-300/40 bg-amber-50/50 p-4 text-sm">
                  <div className="space-y-3">
                    {(claim as Claim).scrubbing_result?.filter(result => result.severity === 'warning').map((warning, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                        <div className="flex-1">
                          <div className="font-medium text-amber-800">{warning.message}</div>
                          <p className="text-xs text-amber-600 mt-1">
                            {warning.field_path && `Field: ${warning.field_path}`}
                            {warning.error_code && ` | Code: ${warning.error_code}`}
                          </p>
                        </div>
                      </div>
                    ))}
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
                  {(claim.payer_response.carc || claim.payer_response.rarc) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-destructive mb-2">
                      {claim.payer_response.carc && (
                        <Badge variant="destructive">CARC {claim.payer_response.carc}</Badge>
                      )}
                      {claim.payer_response.rarc && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          RARC {claim.payer_response.rarc}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-destructive">
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

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <DollarSign className="h-4 w-4" /> Payments
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPayment(true)}
                  disabled={claim.status !== 'accepted_277ca' && claim.status !== 'paid'}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment
                </Button>
              </div>
              
              {/* Current Payment Status */}
              <div className="p-3 bg-muted/20 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Claim Total:</span>
                  <span className="font-medium">{formatCurrency(claim.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-medium">
                    {claim.payments && claim.payments.length > 0 
                      ? formatCurrency(claim.payments.reduce((sum, payment) => sum + payment.amount, 0))
                      : formatCurrency(0)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t mt-1">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className={`font-semibold ${calculateClaimBalance(claim) === 0 ? 'text-green-600' : 'text-foreground'}`}>
                    {formatCurrency(calculateClaimBalance(claim))}
                  </span>
                </div>
              </div>

              {/* Payment Records */}
              {claim.payments && claim.payments.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Payment History</h4>
                  <div className="space-y-3">
                    {claim.payments
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-start justify-between rounded border border-border/60 bg-background p-3 text-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(payment.amount)}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                from {payment.payer}
                              </div>
                            </div>
                            {payment.reference && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Ref: {payment.reference}
                              </div>
                            )}
                            {payment.note && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {payment.note}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No payments recorded yet
                </div>
              )}

              {/* Add Payment Form Modal */}
              {showAddPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
                    <AddPaymentForm
                      claim={claim}
                      onPaymentAdded={async (paymentData) => {
                        const updatedClaim = addPaymentToClaim(
                          claim,
                          paymentData.amount,
                          paymentData.payer,
                          paymentData.reference,
                          paymentData.note
                        );
                        
                        onUpdateClaim(claim.id, () => updatedClaim);
                        setShowAddPayment(false);
                      }}
                      onCancel={() => setShowAddPayment(false)}
                    />
                  </div>
                </div>
              )}
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
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [threshold] = useState(0.88);
  const [filters, setFilters] = useState<ClaimFilters>({
    search: "",
    status: "all" as StatusFilterValue,
    paStatuses: [],
    payer: "all",
    state: "all",
    visit: "all",
    dateFrom: "",
    dateTo: "",
    onlyNeedsReview: false,
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
  const [dollarFirst, setDollarFirst] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Function to close claim and remove query parameter
  const handleCloseClaim = useCallback(() => {
    setActiveClaimId(null);
    // Remove the claim query parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('claim');
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Function to open claim and set query parameter
  const handleOpenClaim = useCallback((claimId: string) => {
    setActiveClaimId(claimId);
    // Add the claim query parameter to URL
    const url = new URL(window.location.href);
    url.searchParams.set('claim', claimId);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.search.trim() !== '' ||
      filters.status !== 'all' ||
      filters.paStatuses.length > 0 ||
      filters.payer !== 'all' ||
      filters.state !== 'all' ||
      filters.visit !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.onlyNeedsReview ||
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
    // If dollar-first mode is active, disable it when user tries to manually sort
    if (dollarFirst) {
      setDollarFirst(false);
    }

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
  }, [dollarFirst]);

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
        // const { data: { user } } = await supabase.auth.getUser();
        // const currentUserId = user?.id;
        //
        // // Call the submit-claim-batch Supabase function
        // const { data, error } = await supabase.functions.invoke("submit-claim-batch", {
        //   body: {
        //     claimIds: [claimId],
        //     clearinghouseId: "CLAIM_MD",
        //     userId: currentUserId
        //   }
        // });
        //
        // if (error) {
        //   console.error("Submission failed:", error);
        //   alert(`Submission failed: ${error.message}`);
        //   return;
        // }
        //
        // if (!data?.success) {
        //   console.error("Submission failed:", data?.error);
        //   alert(`Submission failed: ${data?.error}`);
        //   return;
        // }
        //
        // // Show success feedback
        // if (data.claims?.[0]?.status === "accepted_277ca") {
        //   alert("Claim submitted successfully and accepted by clearinghouse.");
        // } else if (data.claims?.[0]?.status === "rejected_277ca") {
        //   alert("Claim was rejected by clearinghouse. See errors highlighted below.");
        // } else {
        //   alert("Claim submitted successfully.");
        // }

        // Create demo response for testing
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Generate demo scenario based on claim data
        const demoResult = (() => {
          // Demo scenarios
          if (Math.random() < 0.3) {
            return {
              status: "rejected_277ca" as const,
              errors: [
                {
                  errorCode: "AAE-44",
                  fieldPath: "provider.npi",
                  message: "Provider NPI is missing or invalid",
                  severity: "error"
                }
              ]
            };
          } else if (Math.random() < 0.2) {
            return {
              status: "accepted_277ca" as const,
              warnings: [
                {
                  errorCode: "AAW-23",
                  fieldPath: "serviceLine.procedureCode",
                  message: "Procedure code should be verified with latest updates",
                  severity: "warning"
                }
              ]
            };
          } else {
            return {
              status: "accepted_277ca" as const
            };
          }
        })();

        // Show demo feedback
        if (demoResult.status === "accepted_277ca") {
          toast.success("Claim submitted successfully and accepted by clearinghouse.");
          // Close the sheet if it's open for this claim
          if (activeClaimId === claimId) {
            setActiveClaimId(null);
          }
        } else if (demoResult.status === "rejected_277ca") {
          toast.error("Claim was rejected by clearinghouse. See errors highlighted below.");
        }

        // Update local state with demo results
        setClaims((prev) => {
          return prev.map(claim => {
            if (claim.id === claimId) {
              // Update claim with demo response data
              const updatedClaim = {
                ...claim,
                status: demoResult.status,
                auto_submitted: auto ? true : claim.auto_submitted,
                attempt_count: claim.attempt_count + 1,
                updatedAt: new Date().toISOString(),
                state_history: [
                  ...claim.state_history,
                  {
                    state: demoResult.status,
                    at: new Date().toISOString(),
                    note: "Submission processed"
                  }
                ]
              } as Claim;

              // Add demo scrubbing results if claim was rejected
              if (demoResult.status === "rejected_277ca" && demoResult.errors?.length > 0) {
                updatedClaim.scrubbing_result = demoResult.errors.map((error: any, index: number) => ({
                  id: `demo-${claimId}-${index}`,
                  entity_id: claimId,
                  entity_type: "claim",
                  severity: error.severity || "error",
                  message: error.message,
                  field_path: error.fieldPath,
                  error_code: error.errorCode,
                  auto_fixable: false,
                  fixed: false,
                  created_at: new Date().toISOString()
                }));
              }

              // Add demo warnings if any
              if (demoResult.warnings && demoResult.warnings.length > 0) {
                const warnings = demoResult.warnings.map((warning: any, index: number) => ({
                  id: `demo-warning-${claimId}-${index}`,
                  entity_id: claimId,
                  entity_type: "claim",
                  severity: warning.severity || "warning",
                  message: warning.message,
                  field_path: warning.fieldPath,
                  error_code: warning.errorCode,
                  auto_fixable: false,
                  fixed: false,
                  created_at: new Date().toISOString()
                }));

                updatedClaim.scrubbing_result = [
                  ...(updatedClaim.scrubbing_result || []),
                  ...warnings
                ];
              }

              return updatedClaim;
            }
            return claim;
          });
        });

        console.log("Submission processed:", demoResult);

      } catch (error) {
        console.error("Submission error:", error);
        toast.error(`Submission error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        // Remove loading state
        setSubmittingClaims(prev => {
          const newSet = new Set(prev);
          newSet.delete(claimId);
          return newSet;
        });
      }
    },
    [activeClaimId, setActiveClaimId]
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

  // Mock validation settings - in real app this would come from settings context
  const mockValidationSettings = {
    denialPlaybook: {
      autoRetryEnabled: true,
      maxRetryAttempts: 3,
      customRules: [
        {
          id: 'rule-1',
          code: '197',
          description: 'POS Inconsistent / Missing Modifier',
          strategy: 'auto_resubmit' as const,
          enabled: true,
          autoFix: true,
        },
        {
          id: 'rule-2',
          code: 'N700',
          description: 'Precert/authorization required',
          strategy: 'manual_review' as const,
          enabled: true,
          autoFix: false,
        },
        {
          id: 'rule-3',
          code: 'CO123',
          description: 'Timeout/System unavailable',
          strategy: 'auto_resubmit' as const,
          enabled: true,
          autoFix: false,
        }
      ]
    }
  };

  // Handle denial via playbook
  const handleDenialViaPlaybook = useCallback((claim: Claim) => {
    const playbook = mockValidationSettings.denialPlaybook;

    if (!playbook.autoRetryEnabled) return false;
    if (claim.attempt_count >= playbook.maxRetryAttempts) return false;
    if (claim.status !== 'denied') return false;

    const denialCode = getDenialReasonCode(claim);
    if (!denialCode) return false;

    const rule = findMatchingDenialRule(claim, playbook);
    if (!rule) return false;

    console.log(`Denial playbook processing claim ${claim.id} with rule ${rule.code} (${rule.strategy})`);

    switch(rule.strategy) {
      case 'auto_resubmit':
        // Apply fixes if autoFix is enabled
        if (rule.autoFix && claim.suggested_fixes.length > 0) {
          updateClaim(claim.id, (currentClaim) => {
            const fixedClaim = applyAllFixesToClaim(currentClaim);
            const historyEntry = createDenialPlaybookHistoryEntry(
              'Auto-applied fixes via playbook',
              rule.code,
              'Applied all available fixes before resubmission'
            );
            return {
              ...fixedClaim,
              state_history: appendHistory(fixedClaim.state_history, 'built', historyEntry.note)
            };
          });
        }

        // Auto-resubmit
        setTimeout(() => {
          updateClaim(claim.id, (currentClaim) => {
            const historyEntry = createDenialPlaybookHistoryEntry(
              'Auto-resubmitted via playbook',
              rule.code,
              `Automatic resubmission attempt #${currentClaim.attempt_count + 1}`
            );
            return {
              ...currentClaim,
              status: 'built',
              auto_submitted: true,
              state_history: appendHistory(currentClaim.state_history, 'built', historyEntry.note)
            };
          });

          // Trigger resubmission
          triggerSubmit(claim.id, true);

          toast.success(`Claim ${claim.id} auto-resubmitted via denial playbook (rule: ${rule.code})`);
        }, 1000);

        return true;

      case 'manual_review':
        updateClaim(claim.id, (currentClaim) => {
          const historyEntry = createDenialPlaybookHistoryEntry(
            'Flagged for manual review via playbook',
            rule.code,
            'Requires manual intervention per playbook rule'
          );
          return {
            ...currentClaim,
            state_history: appendHistory(currentClaim.state_history, 'denied', historyEntry.note)
          };
        });

        toast.info(`Claim ${claim.id} flagged for manual review (rule: ${rule.code})`);
        return true;

      case 'notify':
        updateClaim(claim.id, (currentClaim) => {
          const historyEntry = createDenialPlaybookHistoryEntry(
            'User notified via playbook',
            rule.code,
            'Notification sent per playbook rule'
          );
          return {
            ...currentClaim,
            state_history: appendHistory(currentClaim.state_history, 'denied', historyEntry.note)
          };
        });

        toast.warning(`Notification: Claim ${claim.id} requires attention (rule: ${rule.code})`);
        return true;

      default:
        return false;
    }
  }, [updateClaim, triggerSubmit, mockValidationSettings.denialPlaybook]);

  // Watch for denied claims and automatically process them via playbook
  const processedClaimIds = React.useRef(new Set<string>());

  useEffect(() => {
    claims.forEach(claim => {
      if (claim.status === 'denied' && !processedClaimIds.current.has(claim.id)) {
        const wasProcessed = handleDenialViaPlaybook(claim);
        if (wasProcessed || !mockValidationSettings.denialPlaybook.autoRetryEnabled) {
          processedClaimIds.current.add(claim.id);
        }
      }
    });
  }, [claims, handleDenialViaPlaybook, mockValidationSettings.denialPlaybook.autoRetryEnabled]);

  // Handle claim query parameter to auto-open claim details
  useEffect(() => {
    const claimParam = searchParams.get('claim');
    if (claimParam) {
      // Find the claim by ID
      const claim = claims.find(c => c.id === claimParam);
      if (claim && !activeClaimId) {
        setActiveClaimId(claimParam);
      }
    }
  }, [searchParams, claims]);

  // Auto-submission disabled for demo
  // useEffect(() => {
  //   claims.forEach((claim) => {
  //     if (
  //       claim.status === "built" &&
  //       getBlockingIssueCount(claim) === 0 &&
  //       claim.confidence >= threshold &&
  //       !claim.auto_submitted
  //     ) {
  //       triggerSubmit(claim.id, true);
  //     }
  //   });
  // }, [claims, threshold, triggerSubmit]);

  const filteredClaims = useMemo(() => {
    let filtered = claims.filter((claim) => {
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

    // Apply sorting - prioritize dollar-first if enabled
    if (dollarFirst) {
      // Dollar-first mode: sort by amount descending, then by default sort order for ties
      filtered.sort((a, b) => {
        const amountDiff = b.total_amount - a.total_amount;
        if (amountDiff !== 0) {
          return amountDiff;
        }
        // For equal amounts, fall back to status and date ordering
        const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } else if (sortConfig.field && sortConfig.direction) {
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
    } else {
      // Default sorting
      filtered = sortClaims(filtered);
    }

    return filtered;
  }, [claims, filters, threshold, sortConfig, dollarFirst]);

  useEffect(() => {
    setSelectedClaimIds((prev) =>
      prev.filter((id) => filteredClaims.some((claim) => claim.id === id))
    );
    // Reset focus when filtered claims change
    setFocusedIndex(null);
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
      return getBlockingIssueCount(claim) > 0 || claim.status === "submitted" || claim.status === "accepted_277ca" || claim.status === "awaiting_277ca";
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

  // Keyboard navigation event handler
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Don't handle keyboard navigation if user is typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)) {
        return;
      }

      if (event.key === "Escape" && activeClaimId) {
        event.preventDefault();
        setActiveClaimId(null);
        // Restore focus to the previously opened claim in the list
        const currentIndex = filteredClaims.findIndex(c => c.id === activeClaimId);
        if (currentIndex !== -1) {
          setFocusedIndex(currentIndex);
        }
      } else if ((event.key === "ArrowDown" || event.key === "j") && !activeClaimId) {
        // Move focus down in list
        event.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev === null ? 0 : Math.min(prev + 1, filteredClaims.length - 1);
          return next;
        });
      } else if ((event.key === "ArrowUp" || event.key === "k") && !activeClaimId) {
        // Move focus up in list
        event.preventDefault();
        setFocusedIndex((prev) => {
          if (prev === null) return filteredClaims.length - 1; // Jump to end if none focused
          return Math.max(prev - 1, 0);
        });
      } else if ((event.key === "Enter" || event.key === "o" || event.key === "O") && focusedIndex !== null && !activeClaimId) {
        // Open focused claim
        event.preventDefault();
        const claimToOpen = filteredClaims[focusedIndex];
        if (claimToOpen) {
          handleOpenClaim(claimToOpen.id);
        }
      } else if (event.key === "ArrowDown" && activeClaimId) {
        // If detail open, go to next claim
        event.preventDefault();
        const currentIndex = filteredClaims.findIndex(c => c.id === activeClaimId);
        if (currentIndex !== -1 && currentIndex < filteredClaims.length - 1) {
          const nextClaim = filteredClaims[currentIndex + 1];
          handleOpenClaim(nextClaim.id);
          setFocusedIndex(currentIndex + 1);
        }
      } else if (event.key === "ArrowUp" && activeClaimId) {
        // Go to previous claim if open
        event.preventDefault();
        const currentIndex = filteredClaims.findIndex(c => c.id === activeClaimId);
        if (currentIndex > 0) {
          const prevClaim = filteredClaims[currentIndex - 1];
          handleOpenClaim(prevClaim.id);
          setFocusedIndex(currentIndex - 1);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeClaimId, filteredClaims, focusedIndex]);

  return (
    <TooltipProvider>
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
                <Search className="absolute left-3 top-4 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search patients, claims, encounters, payers, codes..."
                  value={filters.search}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }));
                    // Turn off dollar-first when search is used
                    if (event.target.value.trim() !== '' && dollarFirst) {
                      setDollarFirst(false);
                    }
                  }}
                  className="pl-10"
                />
              </div>


              {/* Filter Toggle */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "cursor-pointer",
                    showFilters && "bg-accent",
                    hasActiveFilters() && "border-primary text-primary"
                  )}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {[filters.status !== 'all', filters.payer !== 'all', filters.state !== 'all',
                        filters.visit !== 'all', filters.dateFrom, filters.dateTo, filters.onlyNeedsReview,
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
                        status: "all" as StatusFilterValue,
                        paStatuses: [],
                        payer: "all",
                        state: "all",
                        visit: "all",
                        dateFrom: "",
                        dateTo: "",
                        onlyNeedsReview: false,
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
                  {filters.status !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {STATUS_FILTER_OPTIONS.find(opt => opt.value === filters.status)?.label || filters.status}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
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
                  {filters.onlyNeedsReview && (
                    <Badge variant="secondary" className="gap-1">
                      Only Needs Review
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => setFilters(prev => ({ ...prev, onlyNeedsReview: false }))}
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
                      onValueChange={(value) => {
                        setFilters((prev) => ({
                          ...prev,
                          status: value as StatusFilterValue,
                        }));
                        // Turn off dollar-first when status filter is used
                        if (value !== 'all' && dollarFirst) {
                          setDollarFirst(false);
                        }
                      }}
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
                      onValueChange={(value) => {
                        setFilters((prev) => ({ ...prev, payer: value }));
                        // Turn off dollar-first when payer filter is used
                        if (value !== 'all' && dollarFirst) {
                          setDollarFirst(false);
                        }
                      }}
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
                      onValueChange={(value) => {
                        setFilters((prev) => ({ ...prev, state: value }));
                        // Turn off dollar-first when state filter is used
                        if (value !== 'all' && dollarFirst) {
                          setDollarFirst(false);
                        }
                      }}
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
                      onValueChange={(value) => {
                        setFilters((prev) => ({ ...prev, visit: value }));
                        // Turn off dollar-first when visit filter is used
                        if (value !== 'all' && dollarFirst) {
                          setDollarFirst(false);
                        }
                      }}
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
                            // Turn off dollar-first when date filter is used
                            if (date && dollarFirst) {
                              setDollarFirst(false);
                            }
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
                            // Turn off dollar-first when date filter is used
                            if (date && dollarFirst) {
                              setDollarFirst(false);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
                            const isAfterToday = date > today;
                            const isBeforeFromDate = fromDate ? date < fromDate : false;
                            return isAfterToday || isBeforeFromDate;
                          }}
                          className="rounded-lg border shadow-xs"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="only-review"
                      checked={filters.onlyNeedsReview}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          onlyNeedsReview: checked === true,
                        }));
                        // Turn off dollar-first when onlyNeedsReview filter is used
                        if (checked && dollarFirst) {
                          setDollarFirst(false);
                        }
                      }}
                    />
                    <Label htmlFor="only-review" className="mt-2 text-sm leading-none self-center">
                      Only show claims needing review
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="dollar-first"
                      checked={dollarFirst}
                      onCheckedChange={(checked) => setDollarFirst(checked === true)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="dollar-first" className="mt-2 text-sm leading-none self-center cursor-pointer">
                          High $ first
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        <p>Sort claims by highest dollar amount first. Automatically turns off when using other filters.</p>
                      </TooltipContent>
                    </Tooltip>
                    {dollarFirst && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Queue Table */}
      <Card className="border shadow-xs mt-8">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Work Queue
            </CardTitle>
            {dollarFirst && (
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                Sorted by High $ First
              </Badge>
            )}
          </div>

          {/* Bulk Action Selection Bar */}
          {selectedClaimIds.length > 0 && (
            <div className="flex items-center justify-between bg-muted/20 border border-border p-3 rounded-lg">
              <span className="text-sm font-medium text-foreground">
                {selectedClaimIds.length} claim{selectedClaimIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={batchApplyDisabled}
                  onClick={() => {
                    applyAllFixes(selectedClaimIds);
                    setSelectedClaimIds([]);
                  }}
                >
                  Apply All Fixes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={batchSubmitDisabled}
                  onClick={() => {
                    submitClaims(selectedClaimIds);
                    setSelectedClaimIds([]);
                  }}
                >
                  Submit & Listen
                </Button>
                <Button
                  size="sm"
                  disabled={batchResubmitDisabled}
                  onClick={() => {
                    resubmitClaims(selectedClaimIds);
                    setSelectedClaimIds([]);
                  }}
                >
                  Resubmit corrected
                </Button>
              </div>
            </div>
          )}
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
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, claimId: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="visit-filter">Filter by Visit Type</Label>
                            <Input
                              id="visit-filter"
                              placeholder="Enter visit type..."
                              value={filters.visitType}
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, visitType: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
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
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, patientName: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
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
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, payerName: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="provider-filter">Filter by Provider</Label>
                            <Input
                              id="provider-filter"
                              placeholder="Enter provider name..."
                              value={filters.provider}
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, provider: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state-filter-column">Filter by State</Label>
                            <Input
                              id="state-filter-column"
                              placeholder="Enter state..."
                              value={filters.claimState}
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, claimState: e.target.value }));
                                // Turn off dollar-first when column filter is used
                                if (e.target.value.trim() !== '' && dollarFirst) {
                                  setDollarFirst(false);
                                }
                              }}
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
                                      // Turn off dollar-first when PA status filter is used
                                      if (checked && dollarFirst) {
                                        setDollarFirst(false);
                                      }
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
              {filteredClaims.map((claim, idx) => {
                const blockingIssues = getBlockingIssueCount(claim);
                const isRowFocused = focusedIndex === idx;
                const rowClasses = cn(
                  claim.status === "rejected_277ca" || claim.status === "denied"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-transparent",
                  "cursor-pointer",
                  isRowFocused && "bg-muted/50 ring-2 ring-primary/20"
                );
                return (
                  <TableRow
                    key={claim.id}
                    className={rowClasses}
                    tabIndex={-1}
                    aria-selected={isRowFocused}
                    onClick={(event) => {
                      const interactive = (event.target as HTMLElement).closest(
                        "button, a, [role=checkbox]"
                      );
                      if (interactive) {
                        return;
                      }
                      handleOpenClaim(claim.id);
                      setFocusedIndex(idx);
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
                      {(() => {
                        const carc = claim.payer_response?.carc || claim.rejection_response?.carc || "";
                        const rarc = claim.payer_response?.rarc || claim.rejection_response?.rarc || "";
                        const hasCode = carc || rarc;
                        
                        return (claim.status === "rejected_277ca" || claim.status === "denied") && hasCode ? (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            {carc}
                            {carc && rarc ? " / " : ""}
                            {rarc}
                          </Badge>
                        ) : null;
                      })()}
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
                          <DropdownMenuItem onClick={() => handleOpenClaim(claim.id)}>
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async (event) => {
                              event.stopPropagation();
                              await navigator.clipboard?.writeText(claim.id);
                              toast.success(`Claim ID ${claim.id} copied to clipboard`);
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
        onClose={handleCloseClaim}
        threshold={threshold}
        onApplyAllFixes={(id) => applyAllFixes([id])}
        onSubmit={(id) => submitClaims([id])}
        onResubmit={(id) => resubmitClaims([id])}
        onApplySuggestion={applySuggestion}
        onUpdateClaim={updateClaim}
        submittingClaims={submittingClaims}
        onPrev={() => {
          const currentIndex = activeClaim ? filteredClaims.findIndex(c => c.id === activeClaim.id) : -1;
          if (currentIndex > 0) {
            const prevClaim = filteredClaims[currentIndex - 1];
            handleOpenClaim(prevClaim.id);
            setFocusedIndex(currentIndex - 1);
          }
        }}
        onNext={() => {
          const currentIndex = activeClaim ? filteredClaims.findIndex(c => c.id === activeClaim.id) : -1;
          if (currentIndex < filteredClaims.length - 1) {
            const nextClaim = filteredClaims[currentIndex + 1];
            handleOpenClaim(nextClaim.id);
            setFocusedIndex(currentIndex + 1);
          }
        }}
        disablePrev={(() => {
          if (!activeClaim) return true;
          const currentIndex = filteredClaims.findIndex(c => c.id === activeClaim.id);
          return currentIndex <= 0;
        })()}
        disableNext={(() => {
          if (!activeClaim) return true;
          const currentIndex = filteredClaims.findIndex(c => c.id === activeClaim.id);
          return currentIndex >= filteredClaims.length - 1;
        })()}
      />
    </div>
    </TooltipProvider>
  );
}
