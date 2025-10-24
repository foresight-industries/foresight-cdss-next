'use client';

import React, { type FC, type Dispatch, type SetStateAction, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  History,
  ListChecks,
  Paperclip,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type Claim,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  formatCurrency,
  getBlockingIssueCount,
  calculateClaimBalance,
  addPaymentToClaim,
} from "@/data/claims";
import { AddPaymentForm } from "@/components/claims/add-payment-form";

const getDescriptiveFieldName = (field: string): string => {
  const fieldMappings: Record<string, string> = {
    // Patient Information
    member_id: "Insurance Member ID",
    patient_id: "Patient ID",
    patient_name: "Patient Full Name",
    patient_dob: "Patient Date of Birth",
    patient_ssn: "Patient Social Security Number",
    patient_gender: "Patient Gender",
    patient_address: "Patient Address",
    patient_phone: "Patient Phone Number",

    // Provider Information
    provider_npi: "Provider NPI Number",
    provider_name: "Provider Name",
    provider_taxonomy: "Provider Taxonomy Code",
    billing_provider_npi: "Billing Provider NPI Number",
    rendering_provider_npi: "Rendering Provider NPI Number",
    referring_provider_npi: "Referring Provider NPI Number",
    npi: "Provider NPI Number",

    // Payer Information
    payer_id: "Insurance Payer ID",
    payer_name: "Insurance Company Name",
    group_number: "Insurance Group Number",
    subscriber_id: "Primary Subscriber ID",

    // Service Information
    diagnosis_code: "Primary Diagnosis Code (ICD-10)",
    diagnosis: "Primary Diagnosis Code (ICD-10)",
    icd10: "ICD-10 Diagnosis Code",
    icd_10: "ICD-10 Diagnosis Code",
    procedure_code: "Procedure Code (CPT/HCPCS)",
    place_of_service: "Place of Service Code",
    service_date: "Date of Service",
    admission_date: "Hospital Admission Date",
    discharge_date: "Hospital Discharge Date",

    // Authorization and Prior Auth
    authorization_number: "Prior Authorization Number",
    authorization: "Prior Authorization Number",
    referral_number: "Referral Authorization Number",
    referral: "Referral Authorization Number",
    precertification_number: "Precertification Number",
    order: "Provider Order Number",
    order_number: "Provider Order Number",

    // Financial Information
    total_amount: "Total Claim Amount",
    copay_amount: "Patient Copay Amount",
    deductible_amount: "Patient Deductible Amount",
    coinsurance_amount: "Patient Coinsurance Amount",
    allowed_amount: "Insurance Allowed Amount",

    // Claim Details
    claim_frequency: "Claim Frequency Type Code",
    accident_indicator: "Accident Related Indicator",
    emergency_indicator: "Emergency Service Indicator",
    units_of_service: "Units of Service Provided",
    modifier: "Procedure Modifier Code",

    // Contact Information
    subscriber_name: "Primary Subscriber Name",
    subscriber_dob: "Primary Subscriber Date of Birth",
    subscriber_gender: "Primary Subscriber Gender",

    // Miscellaneous
    policy_number: "Insurance Policy Number",
    plan_name: "Insurance Plan Name",
    network_status: "Provider Network Status",
  };

  return fieldMappings[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export interface ClaimDetailSheetProps {
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
  needsActionFieldValues: Record<string, string>;
  setNeedsActionFieldValues: Dispatch<SetStateAction<Record<string, string>>>;
  onSaveAndContinue: (claimId: string) => void;
  onAddNote: (claimId: string) => void;
}

export const ClaimDetailSheet: FC<ClaimDetailSheetProps> = ({
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
  needsActionFieldValues,
  setNeedsActionFieldValues,
  onSaveAndContinue,
  onAddNote,
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
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
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
    <>
      {/* Custom overlay that respects sidebar */}
      {open && (
        <div 
          className="fixed inset-0 left-[256px] bg-black/30 z-[49]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="fixed left-[calc(256px+2rem)] top-6 right-6 bottom-6 max-w-none h-auto p-0 flex flex-col rounded-2xl shadow-2xl z-50"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
        <div className="flex-shrink-0 sticky top-0 bg-background z-10 border-b">
          <div className="px-8 py-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              {/* Left side: Navigation arrows */}
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

              {/* Center: Claim ID and Status */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    {claim.id}
                  </DialogTitle>
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
                <div className="flex items-center gap-6 mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Charge {formatCurrency(claim.total_amount)}</span>
                  <span>Attempt #{claim.attempt_count}</span>
                </div>
              </div>

              {/* Right side: Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onApplyAllFixes(claim.id)}
                  disabled={claim.suggested_fixes.every((fix) => fix.applied)}
                  size="sm"
                >
                  Apply All Fixes
                </Button>
                <Button
                  onClick={() => onSubmit(claim.id)}
                  disabled={blockingIssues > 0 || claim.status === "submitted" || claim.status === "accepted_277ca" || claim.status === "awaiting_277ca" || submittingClaims.has(claim.id)}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {submittingClaims.has(claim.id) ? "Submitting..." : "Submit & Listen"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onResubmit(claim.id)}
                  disabled={!(claim.status === "rejected_277ca" || claim.status === "denied") || submittingClaims.has(claim.id)}
                  size="sm"
                >
                  {submittingClaims.has(claim.id) ? "Submitting..." : "Resubmit corrected"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-4">
            {/* Needs Action Section - Moved to Top */}
            {claim.status === "needs_review" && (Object.entries(claim.field_confidences || {}).some(([, confidence]) => confidence < threshold) ||
              claim.suggested_fixes.some(fix => !fix.applied && !claim.field_confidences?.[fix.field])) && (
              <section className="space-y-4">
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-5 space-y-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="h-4 w-4 text-amber-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base mb-1">NEEDS ACTION</h3>
                      <p className="text-sm text-amber-800 font-medium">
                        The following fields require attention before this claim can be submitted:
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                      {/* Show fields that are below confidence threshold */}
                      {Object.entries(claim.field_confidences || {})
                        .filter(([field, confidence]) => confidence < threshold)
                        .map(([field, confidence]) => {
                          const suggestedFix = claim.suggested_fixes.find(fix => fix.field === field);
                          const fieldLabel = getDescriptiveFieldName(field);

                          return (
                            <div key={field} className="flex items-start gap-3 p-3 bg-white rounded border border-amber-200">
                              <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-900">
                                    {fieldLabel}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {suggestedFix && (
                                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                        AI: {(confidence * 100).toFixed(0)}% confidence
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                      Below {(threshold * 100).toFixed(0)}% threshold
                                    </Badge>
                                  </div>
                                </div>
                                {suggestedFix && (
                                  <div className="text-xs text-gray-600 mb-2">
                                    AI suggests: &quot;{suggestedFix.value}&quot; - {suggestedFix.reason}
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <label htmlFor={`field-${field}`} className="block text-xs font-medium text-gray-700">
                                    {suggestedFix ? "Correct or confirm value:" : "Enter correct value:"}
                                  </label>
                                  <input
                                    id={`field-${field}`}
                                    type={(() => {
                                      if (field === "patient_dob") return "date";
                                      if (field.includes("amount") || field.includes("copay") || field.includes("deductible") || field.includes("coinsurance")) return "number";
                                      if (field.includes("phone")) return "tel";
                                      if (field.includes("email")) return "email";
                                      return "text";
                                    })()}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder={suggestedFix ? suggestedFix.value : `Enter ${fieldLabel.toLowerCase()}...`}
                                    value={needsActionFieldValues[`${claim.id}-${field}`] || suggestedFix?.value || ""}
                                    disabled={submittingClaims.has(claim.id)}
                                    onChange={(e) => {
                                      const value = e.target.value;

                                      // Validate based on field type
                                      if (field.includes("npi") && value && !/^\d{0,10}$/.test(value)) {
                                        return; // NPI should be max 10 digits
                                      }

                                      if (field.includes("ssn") && value && !/^\d{0,3}-?\d{0,2}-?\d{0,4}$/.test(value)) {
                                        return; // SSN format
                                      }

                                      if (field.includes("member_id") && value && value.length > 20) {
                                        return; // Member ID reasonable length limit
                                      }

                                      if (field.includes("icd") && value.length > 0 && !/^[A-Z]?(\d{0,3}(\.\d{0,4})?)?$/i.test(value)) {
                                        return; // ICD-10 format: Optional letter + optional digits + optional decimal with digits (allows complete clearing)
                                      }

                                      if (field.includes("cpt") && value && !/^\d{0,5}$/.test(value)) {
                                        return; // CPT codes are 5 digits
                                      }

                                      if (field.includes("pos") && value && !/^\d{0,2}$/.test(value)) {
                                        return; // Place of Service is 2 digits
                                      }

                                      if (field.includes("phone") && value && !/^[\d\-()+\s]{0,20}$/.test(value)) {
                                        return; // Phone number format
                                      }

                                      setNeedsActionFieldValues(prev => ({
                                        ...prev,
                                        [`${claim.id}-${field}`]: value
                                      }));
                                    }}
                                    {...(field.includes("amount") || field.includes("copay") || field.includes("deductible") || field.includes("coinsurance") ? {
                                      min: "0",
                                      step: "0.01"
                                    } : {})}
                                    {...(field.includes("npi") ? {
                                      maxLength: 10,
                                      pattern: "[0-9]{10}"
                                    } : {})}
                                    {...(field.includes("ssn") ? {
                                      maxLength: 11,
                                      pattern: "[0-9]{3}-[0-9]{2}-[0-9]{4}"
                                    } : {})}
                                  />
                                  {suggestedFix && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7"
                                        onClick={() => onApplySuggestion(claim.id, field)}
                                      >
                                        Apply AI Suggestion
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {/* Show fields that are completely missing (no confidence data) */}
                      {claim.suggested_fixes
                        .filter(fix => !fix.applied && !claim.field_confidences?.[fix.field])
                        .map((fix, index) => (
                          <div key={`missing-${index}`} className="flex items-start gap-3 p-3 bg-white rounded border border-red-200">
                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-900">
                                  {getDescriptiveFieldName(fix.field)}
                                </div>
                                <Badge variant="destructive" className="text-xs">
                                  Missing from EHR
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {fix.reason}
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`missing-${index}`} className="block text-xs font-medium text-gray-700">
                                  Enter required value:
                                </label>
                                <input
                                  id={`missing-${index}`}
                                  type={(() => {
                                    if (fix.field === "patient_dob") return "date";
                                    if (fix.field.includes("amount") || fix.field.includes("copay") || fix.field.includes("deductible") || fix.field.includes("coinsurance")) return "number";
                                    if (fix.field.includes("phone")) return "tel";
                                    if (fix.field.includes("email")) return "email";
                                    return "text";
                                  })()}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                  placeholder={fix.value || `Enter ${fix.field.replace(/_/g, ' ')}...`}
                                  value={needsActionFieldValues[`${claim.id}-missing-${fix.field}`] || fix.value || ""}
                                  disabled={submittingClaims.has(claim.id)}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const field = fix.field;

                                    // Apply the same validation rules
                                    if (field.includes("npi") && value && !/^\d{0,10}$/.test(value)) {
                                      return;
                                    }

                                    if (field.includes("ssn") && value && !/^\d{0,3}-?\d{0,2}-?\d{0,4}$/.test(value)) {
                                      return;
                                    }

                                    if (field.includes("member_id") && value && value.length > 20) {
                                      return;
                                    }

                                    if (field.includes("icd") && value.length > 0 && !/^[A-Z]?(\d{0,3}(\.\d{0,4})?)?$/i.test(value)) {
                                      return; // ICD-10 format: Optional letter + optional digits + optional decimal with digits (allows complete clearing)
                                    }

                                    if (field.includes("cpt") && value && !/^\d{0,5}$/.test(value)) {
                                      return;
                                    }

                                    if (field.includes("pos") && value && !/^\d{0,2}$/.test(value)) {
                                      return;
                                    }

                                    if (field.includes("phone") && value && !/^[\d\-()+\s]{0,20}$/.test(value)) {
                                      return;
                                    }

                                    setNeedsActionFieldValues(prev => ({
                                      ...prev,
                                      [`${claim.id}-missing-${fix.field}`]: value
                                    }));
                                  }}
                                  {...(fix.field.includes("amount") || fix.field.includes("copay") || fix.field.includes("deductible") || fix.field.includes("coinsurance") ? {
                                    min: "0",
                                    step: "0.01"
                                  } : {})}
                                  {...(fix.field.includes("npi") ? {
                                    maxLength: 10,
                                    pattern: "[0-9]{10}"
                                  } : {})}
                                  {...(fix.field.includes("ssn") ? {
                                    maxLength: 11,
                                    pattern: "[0-9]{3}-[0-9]{2}-[0-9]{4}"
                                  } : {})}
                                />
                                {fix.value && (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => onApplySuggestion(claim.id, fix.field)}
                                    >
                                      Apply AI Suggestion
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* If no fields need attention, show validation issues */}
                      {Object.entries(claim.field_confidences || {}).filter(([, confidence]) => confidence < threshold).length === 0 &&
                       claim.suggested_fixes.filter(fix => !fix.applied && !claim.field_confidences?.[fix.field]).length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-600">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span>Manual review required</span>
                          </div>
                          <p>This claim requires manual verification before submission. Please review all details and confirm accuracy.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onSaveAndContinue(claim.id)}
                      disabled={submittingClaims.has(claim.id)}
                    >
                      {submittingClaims.has(claim.id) ? "Submitting..." : "Save & Continue"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => onAddNote(claim.id)}
                      disabled={submittingClaims.has(claim.id)}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Patient & Encounter + Payer & Coverage - Two Column Layout */}
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" /> Patient & Encounter
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Patient</div>
                    <div className="font-semibold text-foreground">{claim.patient.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Encounter</div>
                    <div className="font-medium text-foreground">{claim.encounter_id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Provider</div>
                    <div className="font-medium text-foreground">{claim.provider}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">State</div>
                    <div className="font-medium text-foreground">{claim.state}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Date of service</div>
                    <div className="font-medium text-foreground">
                      {new Date(claim.dos).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Visit type</div>
                    <div className="font-medium text-foreground">{claim.visit_type}</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ListChecks className="h-4 w-4" /> Payer & Coverage
                </h3>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Payer</div>
                  <div className="font-semibold text-foreground mb-2">{claim.payer.name}</div>
                  {claim.member_id && (
                    <div className="mb-2">
                      <div className="text-xs text-muted-foreground mb-0.5">Member ID</div>
                      <div className="font-medium text-foreground">{claim.member_id}</div>
                    </div>
                  )}
                  {claim.eligibility_note && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-700 font-medium">{claim.eligibility_note}</div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Codes Section - All in One Row */}
            <section className="bg-muted/20 rounded-xl p-5 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks className="h-4 w-4" /> Codes
              </h3>
              <div className="grid grid-cols-12 gap-4">
                {/* ICD-10 */}
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">ICD-10</div>
                  <div className="flex flex-wrap gap-1">
                    {claim.codes.icd10.map((code) => (
                      <span key={code} className="font-mono font-semibold text-foreground text-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* CPT/HCPCS */}
                <div className="col-span-8">
                  <div className="text-xs text-muted-foreground mb-1">CPT/HCPCS</div>
                  <div className="space-y-2">
                    {claim.codes.cpt.map((line) => (
                      <div
                        key={line.code}
                        className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-semibold text-foreground">{line.code}</div>
                          <div className="text-sm text-muted-foreground">{line.description}</div>
                        </div>
                        <div className="font-bold text-foreground text-lg">{formatCurrency(line.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Place of Service */}
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Place of Service</div>
                  <div className="font-semibold text-foreground">{claim.codes.pos}</div>
                </div>
              </div>
              
              {claim.codes.hcpcs && claim.codes.hcpcs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-1">HCPCS</div>
                  <div className="flex flex-wrap gap-2">
                    {claim.codes.hcpcs.map((code) => (
                      <Badge key={code} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Validation Results - More Compact */}
            <section className="space-y-2">
              {claim.validation_results.map((result) => {
                const Icon =
                  result.severity === "pass"
                    ? ShieldCheck
                    : result.severity === "warn"
                    ? AlertTriangle
                    : X;
                const bgColor =
                  result.severity === "pass"
                    ? "bg-emerald-50 border-emerald-200"
                    : result.severity === "warn"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200";
                const iconColor =
                  result.severity === "pass"
                    ? "text-emerald-600"
                    : result.severity === "warn"
                    ? "text-amber-600"
                    : "text-red-600";
                const textColor =
                  result.severity === "pass"
                    ? "text-emerald-900"
                    : result.severity === "warn"
                    ? "text-amber-900"
                    : "text-red-900";
                return (
                  <div
                    key={`${result.rule}-${result.field ?? "general"}`}
                    className={cn("flex items-start gap-3 rounded-xl border p-4", bgColor)}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
                    <div className="flex-1">
                      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        <AlertTriangle className="h-4 w-4" /> Validation Results
                      </h3>
                      <div className={cn("font-semibold text-sm", textColor)}>{result.rule}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                );
              })}
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

            {/* Chart Note - More Compact */}
            <section className="bg-muted/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-4 w-4" /> Chart Note
                </h3>
                {(() => {
                  // Check if there are any highlighted segments in the chart note
                  const hasHighlightedSources = claim.chart_note.paragraphs.some(paragraph =>
                    paragraph.some(segment => segment.highlight)
                  );

                  return hasHighlightedSources ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Show sources</span>
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
              <div className="bg-background border border-border/60 rounded-lg p-3">
                <div className="space-y-2 text-sm leading-relaxed text-foreground">
                  {claim.chart_note.paragraphs.map((paragraph, index) => (
                    <p key={index} className="space-x-1">
                      {paragraph.map((segment, idx) =>
                        segment.highlight && showSources ? (
                          <mark
                            key={idx}
                            className="rounded bg-amber-100 px-1"
                          >
                            {segment.text}
                          </mark>
                        ) : (
                          <span key={idx}>{segment.text}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Attending: {claim.chart_note.provider}
                </div>
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

            {/* Timeline & Payments - Side by Side */}
            <section className="grid gap-4 lg:grid-cols-2">
              {/* Timeline & Audit */}
              <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <History className="h-4 w-4" /> Timeline & Audit
                </h3>
                <div className="space-y-2">
                  {claim.state_history
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.at).getTime() - new Date(a.at).getTime()
                    )
                    .slice(0, 3)
                    .map((entry, index) => (
                      <div
                        key={`${entry.state}-${index}`}
                        className="flex items-start justify-between gap-3 p-3 bg-background border border-border/60 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">
                            {STATUS_LABELS[entry.state]}
                          </div>
                          {entry.note && (
                            <div className="text-xs text-muted-foreground">
                              {entry.note}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                          {new Date(entry.at).toLocaleDateString()}<br/>
                          {new Date(entry.at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Payments */}
              <div className="bg-muted/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <DollarSign className="h-4 w-4" /> Payments
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPayment(true)}
                    disabled={claim.status !== 'accepted_277ca' && claim.status !== 'paid'}
                    className="flex items-center gap-1 h-7 text-xs text-teal-600 hover:text-teal-700"
                  >
                    <Plus className="w-3 h-3" />
                    Add Payment
                  </Button>
                </div>
                
                <div className="bg-background border border-border/60 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Claim Total:</span>
                    <span className="font-bold text-xl text-foreground">{formatCurrency(claim.total_amount)}</span>
                  </div>
                  {claim.payments && claim.payments.length > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Total Paid:</span>
                        <span className="font-medium">
                          {formatCurrency(claim.payments.reduce((sum, payment) => sum + payment.amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-1 border-t mt-1">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className={`font-semibold ${calculateClaimBalance(claim) === 0 ? 'text-green-600' : 'text-foreground'}`}>
                          {formatCurrency(calculateClaimBalance(claim))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Payment History */}
                {claim.payments && claim.payments.length > 0 && (
                  <div className="space-y-2">
                    {claim.payments
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 2)
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-start justify-between gap-2 p-2 bg-background border border-border/60 rounded-lg text-xs"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-muted-foreground">
                              from {payment.payer}
                            </div>
                          </div>
                          <div className="text-muted-foreground whitespace-nowrap">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>

            {/* Add Payment Form Modal */}
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="sr-only">Add Payment</DialogTitle>
                </DialogHeader>
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
              </DialogContent>
            </Dialog>

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
      </DialogContent>
    </Dialog>
    </>
  );
};
