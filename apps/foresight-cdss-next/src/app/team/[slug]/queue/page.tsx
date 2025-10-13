export default async function QueuePage() {
  // Pre-compute queue data on the server
  const queueData = await getQueueData();

  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueClient data={queueData} />
    </Suspense>
  );
}
