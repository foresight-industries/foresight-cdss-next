import { epaQueueItems } from '@/data/epa-queue';

export interface QueueData {
  items: typeof epaQueueItems;
  statusCounts: {
    [key: string]: number;
  };
  payerCounts: {
    [key: string]: number;
  };
  medicationCounts: {
    [key: string]: number;
  };
  totalItems: number;
}

export async function getQueueData(): Promise<QueueData> {
  // Pre-compute queue analytics on the server
  const items = epaQueueItems;
  
  // Calculate status distribution
  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate payer distribution
  const payerCounts = items.reduce((acc, item) => {
    acc[item.payer] = (acc[item.payer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate medication distribution
  const medicationCounts = items.reduce((acc, item) => {
    acc[item.medication] = (acc[item.medication] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    items,
    statusCounts,
    payerCounts,
    medicationCounts,
    totalItems: items.length
  };
}