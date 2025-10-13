"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  MoreHorizontal,
  ShieldCheck,
  X,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
// import { supabase } from "@/lib/supabase/client";
import {
  type Claim,
  STATUS_LABELS,
  REVIEW_STATUSES,
  STATUS_FILTER_OPTIONS,
  PA_STATUS_FILTER_OPTIONS,
  type StatusFilterValue,
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
} from "@/data/claims";
import { ClaimsFilters, type ClaimFilters } from "@/components/filters";
import { ClaimDetailSheet } from "@/components/claims/claim-details";

const sortClaims = (claims: Claim[]) =>
  [...claims].sort((a, b) => {
    const statusDiff =
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

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
  const [submittingClaims, setSubmittingClaims] = useState<Set<string>>(new Set());
  const [dollarFirst, setDollarFirst] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [needsActionFieldValues, setNeedsActionFieldValues] = useState<Record<string, string>>({});
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [noteClaimId, setNoteClaimId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleSaveAndContinue = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    // Get all fields that need action
    const fieldsNeedingAction = [
      // Fields below confidence threshold
      ...Object.entries(claim.field_confidences || {})
        .filter(([, confidence]) => confidence < threshold)
        .map(([field]) => field),
      // Missing fields (no confidence data)
      ...claim.suggested_fixes
        .filter(fix => !fix.applied && !claim.field_confidences?.[fix.field])
        .map(fix => fix.field)
    ];

    // Check if all required fields have values and proper format
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    for (const field of fieldsNeedingAction) {
      const confidenceKey = `${claimId}-${field}`;
      const missingKey = `${claimId}-missing-${field}`;
      const value = needsActionFieldValues[confidenceKey] || needsActionFieldValues[missingKey];

      if (!value || value.trim() === '') {
        missingFields.push(field);
        return;
      }

      // Validate field format for submission (stricter than editing validation)
      const trimmedValue = value.trim();

      if (field.includes("icd") && !/^[A-Z]\d{2,3}(\.\d{1,4})?$/i.test(trimmedValue)) {
        invalidFields.push(field);
      } else if (field.includes("npi") && !/^\d{10}$/.test(trimmedValue)) {
        invalidFields.push(field);
      } else if (field.includes("cpt") && !/^\d{5}$/.test(trimmedValue)) {
        invalidFields.push(field);
      } else if (field.includes("pos") && !/^\d{2}$/.test(trimmedValue)) {
        invalidFields.push(field);
      } else if (field.includes("ssn") && !/^\d{3}-\d{2}-\d{4}$/.test(trimmedValue)) {
        invalidFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => getDescriptiveFieldName(field)).join(', ');
      toast.error(`Please fill in all required fields: ${fieldNames}`);
      return;
    }

    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map(field => getDescriptiveFieldName(field)).join(', ');
      toast.error(`Please enter valid format for: ${fieldNames}. ICD-10 codes must be complete (e.g., Z79.899).`);
      return;
    }

    // Get all field values for this claim
    const claimFieldValues = Object.entries(needsActionFieldValues)
      .filter(([key]) => key.startsWith(`${claimId}-`))
      .reduce((acc, [key, value]) => {
        const fieldKey = key.replace(`${claimId}-`, '').replace('missing-', '');
        acc[fieldKey] = value;
        return acc;
      }, {} as Record<string, string>);

    // Update the claim with the new field values
    setClaims(prevClaims =>
      prevClaims.map(claim => {
        if (claim.id === claimId) {
          const updatedClaim = {
            ...claim,
            state_history: [
              ...claim.state_history,
              {
                state: claim.status,
                at: new Date().toISOString(),
                by: 'Current User',
                note: `Updated fields: ${Object.keys(claimFieldValues).join(', ')}`
              }
            ]
          };
          return updatedClaim;
        }
        return claim;
      })
    );

    // Clear the field values for this claim
    setNeedsActionFieldValues(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(prev)) {
        if (key.startsWith(`${claimId}-`)) {
          delete updated[key];
        }
      }
      return updated;
    });

    // Trigger the actual submission process
    toast.success('Fields updated! Submitting claim...');
    triggerSubmit(claimId, false);
  };

  const handleAddNote = (claimId: string) => {
    setNoteClaimId(claimId);
    setShowAddNoteDialog(true);
  };

  const handleSaveNote = () => {
    if (!noteText.trim() || !noteClaimId) return;

    // Add note to claim history
    setClaims(prevClaims =>
      prevClaims.map(claim => {
        if (claim.id === noteClaimId) {
          return {
            ...claim,
            state_history: [
              ...claim.state_history,
              {
                state: claim.status,
                at: new Date().toISOString(),
                by: 'Current User',
                note: noteText.trim()
              }
            ]
          };
        }
        return claim;
      })
    );

    // Close dialog and reset state
    setShowAddNoteDialog(false);
    setNoteClaimId(null);
    setNoteText('');

    toast.success('Note added successfully!');
  };

  const handleCancelNote = () => {
    setShowAddNoteDialog(false);
    setNoteClaimId(null);
    setNoteText('');
  };

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
    // First, find the fix to get the suggested value
    const claim = claims.find(c => c.id === id);
    if (!claim) return;

    const fix = claim.suggested_fixes.find((candidate) => candidate.field === field);
    if (!fix) return;

    // Update the needs action field values with the suggested value
    setNeedsActionFieldValues(prev => {
      const updates: Record<string, string> = {};

      // Handle both confidence-based fields and missing fields
      const confidenceKey = `${id}-${field}`;
      const missingKey = `${id}-missing-${field}`;

      // Check if this field has confidence data (low confidence) or is missing
      if (claim.field_confidences?.[field] !== undefined) {
        // This is a confidence-based field
        updates[confidenceKey] = fix.value;
      } else {
        // This is a missing field
        updates[missingKey] = fix.value;
      }

      return { ...prev, ...updates };
    });

    // Then apply the fix to the claim
    updateClaim(id, (claim) => {
      return applyFixToClaim(claim, fix, "Suggestion applied");
    });

    toast.success(`Applied AI suggestion for ${getDescriptiveFieldName(field)}`);
  }, [updateClaim, claims, setNeedsActionFieldValues]);

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
      for (const id of ids) triggerSubmit(id, auto, options);
    },
    [triggerSubmit]
  );

  const resubmitClaims = useCallback(
    (ids: string[]) => {
      for (const id of ids) triggerSubmit(id, false, { resubmitting: true });
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
    for (const claim of claims) {
      if (claim.status === 'denied' && !processedClaimIds.current.has(claim.id)) {
        const wasProcessed = handleDenialViaPlaybook(claim);
        if (wasProcessed || !mockValidationSettings.denialPlaybook.autoRetryEnabled) {
          processedClaimIds.current.add(claim.id);
        }
      }
    }
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
  //   for (const claim of claims) {
  //     if (
  //       claim.status === "built" &&
  //       getBlockingIssueCount(claim) === 0 &&
  //       claim.confidence >= threshold &&
  //       !claim.auto_submitted
  //     ) {
  //       triggerSubmit(claim.id, true);
  //     }
  //   }
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
      // Dollar-first mode: prioritize needs_review status first, then sort by amount within each status group
      filtered.sort((a, b) => {
        // First, prioritize status (needs_review comes first)
        const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        // Within the same status, sort by amount descending (highest first)
        const amountDiff = b.total_amount - a.total_amount;
        if (amountDiff !== 0) {
          return amountDiff;
        }
        // For equal amounts and status, fall back to date ordering
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
      <ClaimsFilters
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={STATUS_FILTER_OPTIONS}
        paStatusOptions={PA_STATUS_FILTER_OPTIONS}
        payers={payers}
        states={states}
        visitTypes={visitTypes}
        dollarFirst={dollarFirst}
        onDollarFirstChange={setDollarFirst}
      />

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
        needsActionFieldValues={needsActionFieldValues}
        setNeedsActionFieldValues={setNeedsActionFieldValues}
        onSaveAndContinue={handleSaveAndContinue}
        onAddNote={handleAddNote}
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

      {/* Add Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note to Claim {noteClaimId}</DialogTitle>
            <DialogDescription>
              Add a note that will be recorded in the claim&apos;s audit timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-text">Note</Label>
              <Textarea
                id="note-text"
                placeholder="Enter your note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelNote}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteText.trim()}
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
