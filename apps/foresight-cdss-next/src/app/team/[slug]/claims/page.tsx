import { Suspense } from 'react';
import { getClaimsData } from '@/lib/claims-data';
import { ClaimsClient } from '@/components/claims/claims-client';
import { ClaimsSkeleton } from '@/components/claims/claims-skeleton';


export default async function ClaimsPage() {
  // Pre-compute claims data on the server
  const claimsData = await getClaimsData();

  return (
    <Suspense fallback={<ClaimsSkeleton />}>
      <ClaimsClient data={claimsData} />
    </Suspense>
  );
}
