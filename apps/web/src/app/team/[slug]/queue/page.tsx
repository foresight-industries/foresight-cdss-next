import QueueClient from "@/components/queue/queue-client";
import { Suspense } from "react";
import { QueueSkeleton } from "@/components/queue/queue-skeleton";
import { getQueueData } from "@/lib/queue-data";
import { auth } from '@clerk/nextjs/server';

export default async function QueuePage() {
  // Get current user and organization
  const { orgId: organizationId } = await auth();
  
  // Pre-compute queue data on the server
  const queueData = await getQueueData(organizationId || undefined);

  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueClient data={queueData} />
    </Suspense>
  );
}
