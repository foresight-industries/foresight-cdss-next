'use client';

import { ActionsNeededCard } from '@/components/dashboard/actions-needed';
import { AnalyticsOverview } from '@/components/dashboard/dashboard-charts';
import { AuditTrail, type AuditEntry } from '@/components/dashboard/audit-trail';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AgingBucketsCard } from '@/components/dashboard/aging-buckets-card';
import { calculateRCMMetrics } from '@/utils/dashboard';
import type { StatusDistribution as StatusDistributionType, DashboardMetric } from '@/types/pa.types';
import type { EpaQueueItem } from '@/data/epa-queue';
import type { Claim } from '@/data/claims';

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
  // Calculate RCM metrics from claims data
  const rcmMetrics = calculateRCMMetrics(claimItems);

  // Prepare Days in A/R metric for MetricCard with trend indicator
  const daysInARMetric: DashboardMetric = {
    label: "Days in A/R",
    value: rcmMetrics.daysInAR !== null ? rcmMetrics.daysInAR.toString() : "N/A",
    change: rcmMetrics.daysInAR !== null ? {
      value: "2.1",
      trend: "down",
      positive: true // Downtrend is positive for Days in AR
    } : undefined,
    target: "<40"
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-8">
        {/* Top row with Actions needed and KPI tiles */}
        <div className="grid w-full gap-4 md:grid-cols-3 items-stretch">
          {/* Column 1: Actions needed (span 2 on desktop) */}
          <div className="md:col-span-2 flex flex-col">
            <ActionsNeededCard epaItems={epaItems} claimItems={claimItems} />
          </div>

          {/* Column 2: KPI tiles (stacked) */}
          <div className="flex flex-col gap-4">
            <MetricCard metric={daysInARMetric} />
            <AgingBucketsCard
              buckets={rcmMetrics.agingBuckets}
              totalOutstandingAR={rcmMetrics.totalOutstandingAR}
            />
          </div>
        </div>

        {/* Analytics and Audit sections below */}
        <AnalyticsOverview statusDistribution={statusDistribution} />
        <AuditTrail entries={auditEntries} />
      </div>
    </div>
  );
}
