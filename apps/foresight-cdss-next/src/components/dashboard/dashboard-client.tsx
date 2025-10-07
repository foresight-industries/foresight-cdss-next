'use client';

import { ActionsNeededCard } from '@/components/dashboard/actions-needed';
import { AnalyticsOverview } from '@/components/dashboard/dashboard-charts';
import { AuditTrail, type AuditEntry } from '@/components/dashboard/audit-trail';
import type { StatusDistribution as StatusDistributionType } from '@/types/pa.types';
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
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <ActionsNeededCard epaItems={epaItems} claimItems={claimItems} />
        <AnalyticsOverview statusDistribution={statusDistribution} />
        <AuditTrail entries={auditEntries} />
      </div>
    </div>
  );
}
