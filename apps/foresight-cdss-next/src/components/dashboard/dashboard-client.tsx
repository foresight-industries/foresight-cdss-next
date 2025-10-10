'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ActionsNeededCard } from '@/components/dashboard/actions-needed';
import { AnalyticsOverview } from '@/components/dashboard/dashboard-charts';
import { AuditTrail, type AuditEntry } from '@/components/dashboard/audit-trail';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AgingBucketsCard } from '@/components/dashboard/aging-buckets-card';
import { calculateRCMMetrics, calculateSubmissionPipelineMetrics } from '@/utils/dashboard';
import type { StatusDistribution as StatusDistributionType, DashboardMetric } from '@/types/pa.types';
import type { EpaQueueItem } from '@/data/epa-queue';
import type { Claim } from '@/data/claims';
import { mockPreEncounterIssues } from '@/data/pre-encounter';

interface DashboardClientProps {
  epaItems: EpaQueueItem[];
  claimItems: Claim[];
  statusDistribution: StatusDistributionType;
  auditEntries: AuditEntry[];
}

export default function DashboardClient({
  epaItems,
  claimItems,
  statusDistribution,
  auditEntries,
}: Readonly<DashboardClientProps>) {
  const params = useParams();
  const teamSlug = params?.slug as string;

  // Calculate RCM metrics from claims data
  const rcmMetrics = calculateRCMMetrics(claimItems);

  // Calculate submission pipeline metrics
  const submissionMetrics = calculateSubmissionPipelineMetrics(claimItems);

  // Prepare Days in A/R metric for MetricCard with trend indicator and enhanced info
  const avgDays = rcmMetrics.daysInAR;
  const maxDays = rcmMetrics.maxDaysOutstanding;

  const daysInARMetric: DashboardMetric = {
    label: "Days in A/R",
    value: avgDays !== null ? `${avgDays} days` : "N/A",
    change: avgDays !== null ? {
      value: "2.1",
      trend: "down",
      positive: true // Downtrend is positive for Days in AR
    } : undefined,
    target: "<40",
    tooltip: avgDays !== null && maxDays !== null
      ? `Average: ${avgDays} days • Max outstanding: ${maxDays} days • Target: under 40 days`
      : "Average number of days claims remain in accounts receivable before payment"
  };

  // Calculate total dollar amount awaiting review
  const claimsAwaitingReview = claimItems.filter(claim => claim.status === 'needs_review');
  const totalAwaitingReview = claimsAwaitingReview.reduce((sum, claim) => sum + claim.total_amount, 0);

  // Prepare submission pipeline metrics for MetricCards
  const claimsMissingInfoMetric: DashboardMetric = {
    label: "🔎 Claims Missing Info",
    value: submissionMetrics.claimsMissingInfo.toString(),
    change: {
      value: "2",
      trend: "up",
      positive: false // More missing info claims is negative
    },
    target: "0",
    tooltip: "These claims require additional data before submission"
  };

  const scrubberRejectsMetric: DashboardMetric = {
    label: "🔎 Scrub Rejects",
    value: submissionMetrics.claimsScrubberRejects.toString(),
    change: {
      value: "1",
      trend: "down",
      positive: true // Fewer scrub rejects is positive
    },
    target: "0",
    tooltip: "Claims that failed initial validation and received no claim ID"
  };

  // Add total dollars awaiting review metric
  const totalAwaitingReviewMetric: DashboardMetric = {
    label: "💰 $ Awaiting Review",
    value: totalAwaitingReview > 0 ? `$${(totalAwaitingReview / 1000).toFixed(1)}k` : "$0",
    change: {
      value: "5.2",
      trend: "down",
      positive: true // Less money awaiting review is positive
    },
    target: "<$10k",
    tooltip: `Total value: ${totalAwaitingReview.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} across ${claimsAwaitingReview.length} claims requiring review`
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-8">
        {/* Actions needed - full width row */}
        <ActionsNeededCard epaItems={epaItems} claimItems={claimItems} preEncounterIssues={mockPreEncounterIssues} />

        {/* AR KPI tiles row */}
        <div className="grid w-full gap-4 md:grid-cols-2">
          <Link href={teamSlug ? `/team/${teamSlug}/analytics#ar-details` : "/analytics#ar-details"} className="block h-full group">
            <div className={`h-full ${avgDays !== null && avgDays > 40 ? 'text-red-600' : ''}`}>
              <MetricCard metric={daysInARMetric} />
            </div>
          </Link>
          <AgingBucketsCard
            buckets={rcmMetrics.agingBuckets}
            counts={rcmMetrics.agingCounts}
            totalOutstandingAR={rcmMetrics.totalOutstandingAR}
            tooltip="Breakdown of outstanding receivables by age groups to track collection efficiency"
          />
        </div>

        {/* Submission Pipeline Metrics row */}
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

        {/* Analytics and Audit sections below */}
        <AnalyticsOverview statusDistribution={statusDistribution} claimItems={claimItems} />
        <AuditTrail entries={auditEntries} />
      </div>
    </div>
  );
}
