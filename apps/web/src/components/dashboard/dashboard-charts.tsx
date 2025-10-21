'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { StatusDistribution as StatusDistributionType, DashboardMetric } from '@/types/pa.types';
import type { Claim, ClaimStatus } from '@/data/claims';
import { calculateSubmissionPipelineMetrics, type AgingBuckets } from '@/utils/dashboard';
import { getTopDenialReasons, analyzeDenialReasons, extractDenialReason, type DenialReasonAnalysis } from '@/data/denial-reasons';
import { DenialReasonDetail } from '@/components/analytics/denial-reason-detail';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AgingBucketsCard } from '@/components/dashboard/aging-buckets-card';
import { ChartErrorBoundary } from '@/components/error-boundaries';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsOverviewProps {
  statusDistribution: StatusDistributionType;
  claimItems?: Claim[];
  className?: string;
  activeTab?: 'all' | 'claims' | 'pas';
  daysInARMetric?: DashboardMetric;
  agingBuckets?: AgingBuckets;
  agingCounts?: AgingBuckets;
  totalOutstandingAR?: number;
  claimsMissingInfoMetric?: DashboardMetric;
  scrubberRejectsMetric?: DashboardMetric;
  totalAwaitingReviewMetric?: DashboardMetric;
}

const volumeTrendData = [
  { month: 'May', epa: 46, claims: 28 },
  { month: 'Jun', epa: 58, claims: 35 },
  { month: 'Jul', epa: 67, claims: 41 },
  { month: 'Aug', epa: 72, claims: 44 },
  { month: 'Sep', epa: 81, claims: 49 },
  { month: 'Oct', epa: 89, claims: 53 },
];

const denialReasons = [
  { reason: 'Missing indication detail', count: 14 },
  { reason: 'Eligibility not verified', count: 9 },
  { reason: 'Incorrect POS/modifiers', count: 7 },
  { reason: 'Expired authorization', count: 5 },
];

const automationQuality = [
  { month: 'May', automation: 82, quality: 92 },
  { month: 'Jun', automation: 85, quality: 93 },
  { month: 'Jul', automation: 87, quality: 94 },
  { month: 'Aug', automation: 88, quality: 95 },
  { month: 'Sep', automation: 90, quality: 95 },
  { month: 'Oct', automation: 91, quality: 96 },
];

export function AnalyticsOverview({
  statusDistribution,
  claimItems = [],
  className = "",
  activeTab = "all",
  daysInARMetric,
  agingBuckets,
  agingCounts,
  totalOutstandingAR,
  claimsMissingInfoMetric,
  scrubberRejectsMetric,
  totalAwaitingReviewMetric,
}: Readonly<AnalyticsOverviewProps>) {
  const [selectedDenialReason, setSelectedDenialReason] =
    useState<DenialReasonAnalysis | null>(null);
  const params = useParams();
  const teamSlug = params?.slug as string;

  // Calculate submission pipeline metrics if claim data is available
  const submissionMetrics =
    claimItems.length > 0
      ? calculateSubmissionPipelineMetrics(claimItems)
      : null;

  // Calculate denial reason analyses from actual claim data
  const denialReasonAnalyses = useMemo(() => {
    return claimItems.length > 0 ? analyzeDenialReasons(claimItems) : [];
  }, [claimItems]);

  // Create merged denial reasons for All/Claims/PAs view
  const mergedDenialReasons = useMemo(() => {
    if (claimItems.length === 0) {
      return denialReasons;
    }

    // Mock PA denial reasons for demo purposes
    const mockPADenials = [
      {
        reason: "Medical necessity not demonstrated",
        count: 8,
        source: "pa" as const,
        code: "PA001",
      },
      {
        reason: "Incomplete clinical documentation",
        count: 6,
        source: "pa" as const,
        code: "PA002",
      },
      {
        reason: "Treatment guidelines not met",
        count: 4,
        source: "pa" as const,
        code: "PA003",
      },
      {
        reason: "Non-formulary medication",
        count: 3,
        source: "pa" as const,
        code: "PA004",
      },
    ];

    // Get claims denial reasons from actual data
    const claimsDenials = getTopDenialReasons(claimItems, 10).map((item) => ({
      ...item,
      source: "claim" as const,
    }));

    // Combine and filter based on activeTab
    let combinedDenials: Array<{
      reason: string;
      count: number;
      source: "claim" | "pa";
      code?: string;
    }> = [];

    if (activeTab === "all") {
      combinedDenials = [...claimsDenials, ...mockPADenials];
    } else if (activeTab === "claims") {
      combinedDenials = claimsDenials;
    } else if (activeTab === "pas") {
      combinedDenials = mockPADenials;
    }

    // Sort by count and take top 4
    return combinedDenials.sort((a, b) => b.count - a.count).slice(0, 4);
  }, [claimItems, activeTab]);

  // Create dynamic volume trend data and config based on active tab
  const { volumeTrend, chartTitle, chartDescription, barElements } =
    useMemo(() => {
      const title =
        activeTab === "all"
          ? "Volume trends (last 6 months)"
          : activeTab === "claims"
          ? "Claims volume trends (last 6 months)"
          : "Prior auth volume trends (last 6 months)";

      const description =
        activeTab === "all"
          ? "Stacked view of ePA and claim throughput"
          : activeTab === "claims"
          ? "Claims volume over time"
          : "Prior auth (ePA) volume over time";

      let bars;
      if (activeTab === "all") {
        bars = [
          <Bar
            key="epa"
            dataKey="epa"
            name="ePA volume"
            stackId="total"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />,
          <Bar
            key="claims"
            dataKey="claims"
            name="Claims volume"
            stackId="total"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />,
        ];
      } else if (activeTab === "claims") {
        bars = [
          <Bar
            key="claims"
            dataKey="claims"
            name="Claims volume"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />,
        ];
      } else {
        bars = [
          <Bar
            key="epa"
            dataKey="epa"
            name="ePA volume"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
          />,
        ];
      }

      return {
        volumeTrend: volumeTrendData,
        chartTitle: title,
        chartDescription: description,
        barElements: bars,
      };
    }, [activeTab]);

  // Prepare dynamic submission outcomes data based on active tab
  const {
    submissionOutcomes,
    submissionChartTitle,
    submissionChartDescription,
  } = useMemo(() => {
    if (!submissionMetrics) {
      return {
        submissionOutcomes: [],
        submissionChartTitle: "",
        submissionChartDescription: "",
      };
    }

    if (activeTab === "all") {
      // Combined submission outcomes - just show combined totals for now
      const mockPAMetrics = {
        totalPAAttempts: 156,
        paApproved: 134,
        paRejected: 18,
        paPending: 4,
      };

      return {
        submissionOutcomes: [
          {
            category: "Successful",
            value:
              submissionMetrics.totalSubmissionAttempts -
              submissionMetrics.claimsScrubberRejects +
              mockPAMetrics.paApproved,
            fill: "var(--color-successful)",
          },
          {
            category: "Rejected",
            value:
              submissionMetrics.claimsScrubberRejects +
              mockPAMetrics.paRejected,
            fill: "var(--color-rejects)",
          },
          {
            category: "Other Issues",
            value:
              submissionMetrics.claimsMissingInfo + mockPAMetrics.paPending,
            fill: "var(--color-missing)",
          },
        ],
        submissionChartTitle: "Combined Submission Outcomes",
        submissionChartDescription:
          "Combined claims and PA submission performance",
      };
    } else if (activeTab === "claims") {
      return {
        submissionOutcomes: [
          {
            category: "Successful",
            value:
              submissionMetrics.totalSubmissionAttempts -
              submissionMetrics.claimsScrubberRejects,
            fill: "var(--color-successful)",
          },
          {
            category: "Scrubber Rejects",
            value: submissionMetrics.claimsScrubberRejects,
            fill: "var(--color-rejects)",
          },
          {
            category: "Missing Info",
            value: submissionMetrics.claimsMissingInfo,
            fill: "var(--color-missing)",
          },
        ],
        submissionChartTitle: "Claims Submission Outcomes",
        submissionChartDescription:
          "Claims pipeline performance with absolute numbers",
      };
    } else {
      // PA-specific outcomes
      const mockPAMetrics = {
        totalPAAttempts: 156,
        paApproved: 134,
        paRejected: 18,
        paPending: 4,
      };

      return {
        submissionOutcomes: [
          {
            category: "Approved",
            value: mockPAMetrics.paApproved,
            fill: "var(--color-pa-approved)",
          },
          {
            category: "Rejected",
            value: mockPAMetrics.paRejected,
            fill: "var(--color-pa-rejected)",
          },
          {
            category: "Pending Review",
            value: mockPAMetrics.paPending,
            fill: "var(--color-pending)",
          },
        ],
        submissionChartTitle: "Prior Auth Outcomes",
        submissionChartDescription:
          "PA submission performance with absolute numbers",
      };
    }
  }, [submissionMetrics, activeTab]);

  const submissionChartConfig = {
    value: {
      label: "Claims",
    },
    successful: {
      label: "Successful",
      color: "hsl(142 76% 36%)",
    },
    rejects: {
      label: "Scrubber Rejects",
      color: "hsl(0 84% 60%)",
    },
    missing: {
      label: "Missing Info",
      color: "hsl(43 96% 56%)",
    },
  } satisfies ChartConfig;

  // Function to count applied fixes for a specific denial reason
  const getAppliedFixesCountForReason = (reasonCode: string) => {
    // Find claims that match this denial reason
    const matchingClaims = claimItems.filter((claim) => {
      const claimDenialCode = extractDenialReason(claim);
      return claimDenialCode === reasonCode;
    });

    // Count total applied fixes across all matching claims
    return matchingClaims.reduce((total, claim) => {
      return total + claim.suggested_fixes.filter((fix) => fix.applied).length;
    }, 0);
  };

  // Create mock PA denial analyses
  const mockPADenialAnalyses = useMemo(() => {
    const paAnalyses: Record<string, DenialReasonAnalysis> = {
      PA001: {
        reason: {
          code: "PA001",
          category: "Clinical Evidence",
          description: "Medical necessity not demonstrated",
          commonCause:
            "Insufficient clinical evidence to support medical necessity of treatment",
          resolution: {
            title: "Provide Comprehensive Clinical Evidence",
            description:
              "Submit detailed clinical documentation supporting medical necessity",
            steps: [
              "Include clinical evidence supporting medical necessity",
              "Attach relevant diagnostic test results",
              "Reference applicable treatment guidelines",
              "Document patient's medical history and symptoms",
            ],
            timeframe: "7-10 business days",
            canAutomate: true,
            automaticAction:
              "Auto-populate medical necessity templates from EMR",
            priority: "high",
            preventionTips: [
              "Auto-populate medical necessity templates",
              "Flag missing clinical documentation before submission",
              "Integrate with EMR for automatic evidence attachment",
            ],
          },
        },
        claimCount: 3,
        totalAmount: 4241.25,
        averageDaysInAR: 15,
        payerBreakdown: [
          { payer: "Aetna", count: 2, amount: 2140.5 },
          { payer: "Cigna", count: 1, amount: 2100.75 },
        ],
        claims: [
          {
            id: "PA-CLM-001",
            patient: { id: 1, name: "John Smith" },
            payer: { id: 1, name: "Aetna" },
            total_amount: 1250.0,
            dos: "2024-01-15",
            updatedAt: "2024-01-15T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-001",
            visit_type: "Office Visit",
            state: "CA",
            confidence: 0.9,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Smith", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Smith",
          },
          {
            id: "PA-CLM-002",
            patient: { id: 2, name: "Sarah Johnson" },
            payer: { id: 1, name: "Aetna" },
            total_amount: 890.5,
            dos: "2024-01-14",
            updatedAt: "2024-01-14T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-002",
            visit_type: "Consultation",
            state: "CA",
            confidence: 0.85,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Johnson", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Johnson",
          },
          {
            id: "PA-CLM-003",
            patient: { id: 3, name: "Mike Brown" },
            payer: { id: 2, name: "Cigna" },
            total_amount: 2100.75,
            dos: "2024-01-13",
            updatedAt: "2024-01-13T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-003",
            visit_type: "Procedure",
            state: "CA",
            confidence: 0.95,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Brown", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Brown",
          },
        ],
      },
      PA002: {
        reason: {
          code: "PA002",
          category: "Documentation",
          description: "Incomplete clinical documentation",
          commonCause:
            "Missing required clinical documentation or incomplete forms",
          resolution: {
            title: "Complete Missing Documentation",
            description:
              "Obtain and submit all required clinical documentation",
            steps: [
              "Complete missing physician notes",
              "Include all required lab results",
              "Attach imaging reports if applicable",
              "Ensure all forms are properly signed",
            ],
            timeframe: "3-5 business days",
            canAutomate: true,
            automaticAction:
              "Auto-validate required fields and create completeness checklist",
            priority: "medium",
            preventionTips: [
              "Create documentation completeness checklist",
              "Auto-validate required fields before submission",
              "Send alerts for missing documentation",
            ],
          },
        },
        claimCount: 2,
        totalAmount: 2125.25,
        averageDaysInAR: 12,
        payerBreakdown: [
          { payer: "BCBS", count: 1, amount: 675.0 },
          { payer: "UnitedHealth", count: 1, amount: 1450.25 },
        ],
        claims: [
          {
            id: "PA-CLM-004",
            patient: { id: 4, name: "Lisa Davis" },
            payer: { id: 3, name: "BCBS" },
            total_amount: 675.0,
            dos: "2024-01-12",
            updatedAt: "2024-01-12T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-004",
            visit_type: "Follow-up",
            state: "TX",
            confidence: 0.8,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Davis", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Davis",
          },
          {
            id: "PA-CLM-005",
            patient: { id: 5, name: "Robert Wilson" },
            payer: { id: 4, name: "UnitedHealth" },
            total_amount: 1450.25,
            dos: "2024-01-11",
            updatedAt: "2024-01-11T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-005",
            visit_type: "Therapy",
            state: "NY",
            confidence: 0.75,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Wilson", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Wilson",
          },
        ],
      },
      PA003: {
        reason: {
          code: "PA003",
          category: "Treatment Guidelines",
          description: "Treatment guidelines not met",
          commonCause:
            "Requested treatment does not follow established clinical guidelines",
          resolution: {
            title: "Align Treatment with Guidelines",
            description:
              "Ensure treatment follows established clinical guidelines or justify deviation",
            steps: [
              "Review current treatment guidelines",
              "Document step therapy completion",
              "Include trial of preferred medications",
              "Justify deviation from standard protocols",
            ],
            timeframe: "5-7 business days",
            canAutomate: true,
            automaticAction:
              "Real-time guideline checking and compliance suggestions",
            priority: "high",
            preventionTips: [
              "Integrate real-time guideline checking",
              "Auto-suggest compliant treatment options",
              "Flag non-compliant requests before submission",
            ],
          },
        },
        claimCount: 2,
        totalAmount: 4150.75,
        averageDaysInAR: 18,
        payerBreakdown: [
          { payer: "Humana", count: 1, amount: 3200.0 },
          { payer: "Aetna", count: 1, amount: 950.75 },
        ],
        claims: [
          {
            id: "PA-CLM-006",
            patient: { id: 6, name: "Jennifer Taylor" },
            payer: { id: 5, name: "Humana" },
            total_amount: 3200.0,
            dos: "2024-01-10",
            updatedAt: "2024-01-10T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-006",
            visit_type: "Specialty Consultation",
            state: "FL",
            confidence: 0.88,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Taylor", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Taylor",
          },
          {
            id: "PA-CLM-007",
            patient: { id: 7, name: "David Anderson" },
            payer: { id: 1, name: "Aetna" },
            total_amount: 950.75,
            dos: "2024-01-09",
            updatedAt: "2024-01-09T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-007",
            visit_type: "Treatment",
            state: "IL",
            confidence: 0.92,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Anderson", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Anderson",
          },
        ],
      },
      PA004: {
        reason: {
          code: "PA004",
          category: "Formulary",
          description: "Non-formulary medication",
          commonCause: "Requested medication is not on the payer's formulary",
          resolution: {
            title: "Address Formulary Requirements",
            description:
              "Submit prior authorization or switch to formulary alternative",
            steps: [
              "Check formulary alternatives",
              "Document medical necessity for non-formulary drug",
              "Include failed trials of formulary options",
              "Submit prior authorization request",
            ],
            timeframe: "10-14 business days",
            canAutomate: true,
            automaticAction:
              "Real-time formulary checking and alternative suggestions",
            priority: "medium",
            preventionTips: [
              "Real-time formulary checking",
              "Auto-suggest formulary alternatives",
              "Streamline prior auth workflows",
            ],
          },
        },
        claimCount: 1,
        totalAmount: 1875.5,
        averageDaysInAR: 8,
        payerBreakdown: [{ payer: "BCBS", count: 1, amount: 1875.5 }],
        claims: [
          {
            id: "PA-CLM-008",
            patient: { id: 8, name: "Michelle Garcia" },
            payer: { id: 3, name: "BCBS" },
            total_amount: 1875.5,
            dos: "2024-01-08",
            updatedAt: "2024-01-08T10:00:00Z",
            status: "needs_review" as ClaimStatus,
            encounter_id: "ENC-008",
            visit_type: "Prescription",
            state: "AZ",
            confidence: 0.85,
            issues: [],
            suggested_fixes: [],
            validation_results: [],
            field_confidences: {},
            auto_submitted: false,
            attempt_count: 1,
            state_history: [],
            chart_note: { provider: "Dr. Garcia", paragraphs: [] },
            codes: { icd10: [], cpt: [], pos: "11" },
            provider: "Dr. Garcia",
          },
        ],
      },
    };
    return paAnalyses;
  }, []);

  const handleDenialReasonClick = (
    reasonCode: string,
    source: "claim" | "pa"
  ) => {
    if (source === "claim") {
      const analysis = denialReasonAnalyses.find(
        (a) => a.reason.code === reasonCode
      );
      if (analysis) {
        setSelectedDenialReason(analysis);
      }
    } else {
      // For PA denials, use the mock analysis data
      const paAnalysis = mockPADenialAnalyses[reasonCode];
      if (paAnalysis) {
        setSelectedDenialReason(paAnalysis);
      }
    }
  };

  const handleAutomateAction = (action: string) => {
    // TODO: Implement automation logic
    console.log("Automating action:", action);
    toast.info(`Automation started: ${action}`);
  };

  // If a denial reason is selected, show the detail view
  if (selectedDenialReason) {
    return (
      <Card className={`bg-card border shadow-xs ${className}`}>
        <CardContent className="p-6">
          <DenialReasonDetail
            analysis={selectedDenialReason}
            onBack={() => setSelectedDenialReason(null)}
            onAutomate={handleAutomateAction}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={`bg-card border shadow-xs ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* AR KPI tiles row - moved from dashboard */}
        {daysInARMetric && agingBuckets && agingCounts && totalOutstandingAR !== undefined && (
          <div className="grid w-full gap-4 md:grid-cols-2">
            <Link href={teamSlug ? `/team/${teamSlug}/analytics#ar-details` : "/analytics#ar-details"} className="block h-full group">
              <div className={`h-full ${typeof daysInARMetric.value === 'string' && daysInARMetric.value.includes('N/A') ? '' : typeof daysInARMetric.value === 'string' && Number.parseInt(daysInARMetric.value) > 40 ? 'text-red-600' : ''}`}>
                <MetricCard metric={daysInARMetric} />
              </div>
            </Link>
            <AgingBucketsCard
              buckets={agingBuckets}
              counts={agingCounts}
              totalOutstandingAR={totalOutstandingAR}
              tooltip="Breakdown of outstanding receivables by age groups to track collection efficiency"
            />
          </div>
        )}
        
        {/* Submission Pipeline Metrics row - moved from dashboard */}
        {claimsMissingInfoMetric && scrubberRejectsMetric && totalAwaitingReviewMetric && (
          <div className="grid w-full gap-4 md:grid-cols-3">
            <Link href={teamSlug ? `/team/${teamSlug}/claims?filter=needs_review` : "/claims?filter=needs_review"} className="block group">
              <MetricCard metric={claimsMissingInfoMetric} />
            </Link>
            <Link href={teamSlug ? `/team/${teamSlug}/claims?filter=rejected_277ca` : "/claims?filter=rejected_277ca"} className="block group">
              <MetricCard metric={scrubberRejectsMetric} />
            </Link>
            <Link href={teamSlug ? `/team/${teamSlug}/claims?filter=needs_review&sort=high_dollar` : "/claims?filter=needs_review&sort=high_dollar"} className="block group">
              <MetricCard metric={totalAwaitingReviewMetric} />
            </Link>
          </div>
        )}
        
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {chartTitle}
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              {chartDescription}
            </p>
            <ChartErrorBoundary chartName="volume trends" height={256}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      stroke="#6b7280"
                    />
                    <YAxis axisLine={false} tickLine={false} stroke="#6b7280" />
                    <Tooltip formatter={(value: number) => `${value} items`} />
                    <Legend />
                    {barElements}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartErrorBoundary>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Top denial reasons -{" "}
              {activeTab === "all"
                ? "Merged View"
                : activeTab === "claims"
                ? "Claims Only"
                : "PAs Only"}
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              {activeTab === "all"
                ? "Combined denial reasons from both Claims and Prior Authorizations"
                : "Click on any reason for detailed analysis and resolution guidance"}
            </p>
            <ul className="space-y-3">
              {mergedDenialReasons.map((item, index) => {
                const hasCode = "code" in item && typeof item.code === "string";
                const hasSource = "source" in item;
                // For claims, check if analysis exists. For PAs, they're always clickable if they have codes
                const isClickable =
                  hasCode &&
                  ((hasSource &&
                    item.source === "claim" &&
                    denialReasonAnalyses.some(
                      (a) => a.reason.code === item.code
                    )) ||
                    (hasSource && item.source === "pa"));
                const appliedFixesCount = hasCode
                  ? getAppliedFixesCountForReason(item.code as string)
                  : 0;
                const handleClick = () => {
                  if (
                    isClickable &&
                    hasCode &&
                    hasSource &&
                    (item.source === "claim" || item.source === "pa")
                  ) {
                    handleDenialReasonClick(item.code as string, item.source);
                  }
                };

                if (isClickable) {
                  return (
                    <li key={`${item.reason}-${index}`}>
                      <button
                        className="w-full flex items-center justify-between text-sm p-2 rounded-md transition-colors border border-transparent hover:bg-muted/50 hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                        onClick={handleClick}
                        aria-label={`View details for ${item.reason}`}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground hover:text-primary">
                              {item.reason}
                            </span>
                            {"source" in item && (
                              <Badge
                                variant="outline"
                                className={
                                  item.source === "claim"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-purple-200 bg-purple-50 text-purple-700"
                                }
                              >
                                {item.source === "claim" ? "Claim" : "PA"}
                              </Badge>
                            )}
                          </div>
                          {appliedFixesCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {appliedFixesCount} fix
                              {appliedFixesCount > 1 ? "es" : ""} applied
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-muted-foreground">
                            {item.count}
                          </span>
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </button>
                    </li>
                  );
                } else {
                  return (
                    <li
                      key={`${item.reason}-${index}`}
                      className="flex items-center justify-between text-sm p-2"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{item.reason}</span>
                          {"source" in item && (
                            <Badge
                              variant="outline"
                              className={
                                item.source === "claim"
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-purple-200 bg-purple-50 text-purple-700"
                              }
                            >
                              {item.source === "claim" ? "Claim" : "PA"}
                            </Badge>
                          )}
                        </div>
                        {appliedFixesCount > 0 && (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            {appliedFixesCount} fix
                            {appliedFixesCount > 1 ? "es" : ""} applied
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-muted-foreground">
                        {item.count}
                      </span>
                    </li>
                  );
                }
              })}
            </ul>
            {denialReasonAnalyses.length === 0 && claimItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 italic">
                No denial patterns found in current data
              </p>
            )}
          </div>
        </div>

        {/* Submission Outcomes Chart */}
        {submissionMetrics && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {submissionChartTitle}
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              {submissionChartDescription}
            </p>
            <ChartErrorBoundary chartName="submission outcomes" height={200}>
              <ChartContainer config={submissionChartConfig}>
                <BarChart
                  accessibilityLayer
                  data={submissionOutcomes}
                  layout="vertical"
                  margin={{ left: 20 }}
                  barCategoryGap="20%"
                >
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={true}
                  />
                  <XAxis type="number" axisLine={true} tickLine={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ChartContainer>
            </ChartErrorBoundary>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              {submissionOutcomes.map((outcome, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`w-3 h-3 rounded ${
                        outcome.category.includes("Successful") ||
                        outcome.category === "Approved"
                          ? "bg-green-500"
                          : outcome.category.includes("Rejected") ||
                            outcome.category.includes("Rejects")
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                    ></div>
                    <span className="font-medium">{outcome.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {outcome.value}{" "}
                    {activeTab === "all"
                      ? "total"
                      : activeTab === "claims"
                      ? "claims"
                      : "pas"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Automation & quality over time
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            Rolling averages for automation rate and documentation quality
          </p>
          <ChartErrorBoundary chartName="automation & quality trends" height={256}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={automationQuality}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                    domain={[70, 100]}
                  />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="automation"
                    name="Automation rate"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    name="Quality score"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartErrorBoundary>
        </div>
      </CardContent>
    </Card>
  );
}
