import QueueClient from "@/components/queue/queue-client";
import { Suspense } from "react";
import { QueueSkeleton } from "@/components/queue/queue-skeleton";
import { getQueueData } from "@/lib/queue-data";

export default async function QueuePage() {
  // Pre-compute queue data on the server
  const queueData = await getQueueData();

  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueClient data={queueData} />
    </Suspense>
  );
}
