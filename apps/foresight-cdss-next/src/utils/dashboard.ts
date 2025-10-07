import type { StatusDistribution } from '@/types/pa.types';
import type { EpaQueueItem } from '@/data/epa-queue';
import type { Claim } from '@/data/claims';

const mapEpaStatusToKey = (status: EpaQueueItem['status']): keyof StatusDistribution => {
  switch (status) {
    case 'needs-review':
      return 'needsReview';
    case 'auto-processing':
      return 'autoProcessing';
    case 'auto-approved':
      return 'autoApproved';
    case 'denied':
    default:
      return 'denied';
  }
};

const mapClaimStatusToKey = (status: Claim['status']): keyof StatusDistribution => {
  switch (status) {
    case 'needs_review':
      return 'needsReview';
    case 'built':
    case 'submitted':
    case 'awaiting_277ca':
      return 'autoProcessing';
    case 'accepted_277ca':
    case 'paid':
      return 'autoApproved';
    case 'rejected_277ca':
    case 'denied':
    default:
      return 'denied';
  }
};

export const combineStatusDistribution = (
  epaItems: EpaQueueItem[],
  claimItems: Claim[]
): StatusDistribution => {
  const distribution: StatusDistribution = {
    needsReview: 0,
    autoProcessing: 0,
    autoApproved: 0,
    denied: 0,
    total: 0,
  };

  epaItems.forEach((item) => {
    const key = mapEpaStatusToKey(item.status);
    distribution[key] += 1;
    distribution.total += 1;
  });

  claimItems.forEach((claim) => {
    const key = mapClaimStatusToKey(claim.status);
    distribution[key] += 1;
    distribution.total += 1;
  });

  return distribution;
};
