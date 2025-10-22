import { Suspense } from 'react';
import { getPreEncountersData } from '@/lib/pre-encounters-data';
import PreEncountersClient from '@/components/pre-encounters/pre-encounters-client';
import { PreEncountersSkeleton } from '@/components/pre-encounters/pre-encounters-skeleton';

export default async function PreEncountersPage() {
  const preEncountersData = await getPreEncountersData();

  return (
    <Suspense fallback={<PreEncountersSkeleton />}>
      <PreEncountersClient data={preEncountersData} />
    </Suspense>
  );
}
