import { Suspense } from 'react';
import { getAnalyticsData } from '@/lib/analytics-data';
import { AnalyticsClient } from '@/components/analytics/analytics-client';
import { AnalyticsSkeleton } from '@/components/analytics/analytics-skeleton';

export default async function AnalyticsPage() {
  // Pre-compute analytics data on the server
  const analyticsData = await getAnalyticsData();

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsClient data={analyticsData} />
    </Suspense>
  );
}
