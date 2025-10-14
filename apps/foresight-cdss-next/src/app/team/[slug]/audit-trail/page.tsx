import { Suspense } from 'react';
import { allDetailedAuditEntries } from '@/data/audit-trail';
import AuditTrailClient from '@/components/audit-trail/audit-trail-client';
import AuditTrailSkeleton from '@/components/skeletons/audit-trail-skeleton';

export default async function AuditTrailPage() {
  // Pre-compute data on server
  const auditEntries = allDetailedAuditEntries;

  return (
    <Suspense fallback={<AuditTrailSkeleton />}>
      <AuditTrailClient auditEntries={auditEntries} />
    </Suspense>
  );
}
