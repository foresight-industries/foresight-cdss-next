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

// RCM Metrics Types
export interface AgingBuckets {
  '0-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
}

export interface RCMMetrics {
  daysInAR: number | null;
  maxDaysOutstanding: number | null;
  agingBuckets: AgingBuckets;
  agingCounts: AgingBuckets;
  totalOutstandingAR: number;
}

export interface SubmissionPipelineMetrics {
  claimsMissingInfo: number;
  claimsScrubberRejects: number;
  submissionSuccessRate: number;
  totalSubmissionAttempts: number;
}

// Helper function to calculate days between two dates
const daysBetween = (startDate: string, endDate: Date): number => {
  const start = new Date(startDate);
  const diffTime = endDate.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate RCM metrics from claims data
export const calculateRCMMetrics = (claims: Claim[]): RCMMetrics => {
  // Filter to unpaid/outstanding claims (exclude paid and denied)
  const outstandingClaims = claims.filter(claim => 
    !['paid', 'denied'].includes(claim.status)
  );

  if (outstandingClaims.length === 0) {
    return {
      daysInAR: null,
      maxDaysOutstanding: null,
      agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
      agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
      totalOutstandingAR: 0
    };
  }

  const now = new Date();
  let totalDays = 0;
  let maxDays = 0;
  let totalAmount = 0;
  const buckets: AgingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const counts: AgingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

  outstandingClaims.forEach(claim => {
    // Calculate days since date of service (DOS)
    const daysOld = daysBetween(claim.dos, now);
    totalDays += daysOld;
    totalAmount += claim.total_amount;
    
    // Track maximum days outstanding
    if (daysOld > maxDays) {
      maxDays = daysOld;
    }

    // Add to appropriate aging bucket (both amount and count)
    if (daysOld <= 30) {
      buckets['0-30'] += claim.total_amount;
      counts['0-30'] += 1;
    } else if (daysOld <= 60) {
      buckets['31-60'] += claim.total_amount;
      counts['31-60'] += 1;
    } else if (daysOld <= 90) {
      buckets['61-90'] += claim.total_amount;
      counts['61-90'] += 1;
    } else {
      buckets['90+'] += claim.total_amount;
      counts['90+'] += 1;
    }
  });

  // Calculate average days in AR
  const avgDaysInAR = totalDays / outstandingClaims.length;

  return {
    daysInAR: Math.round(avgDaysInAR),
    maxDaysOutstanding: maxDays,
    agingBuckets: buckets,
    agingCounts: counts,
    totalOutstandingAR: totalAmount
  };
};

// Calculate submission pipeline metrics from claims data
export const calculateSubmissionPipelineMetrics = (claims: Claim[]): SubmissionPipelineMetrics => {
  // Claims missing info: needs_review status with blocking issues (severity "fail")
  const claimsMissingInfo = claims.filter(claim => 
    claim.status === 'needs_review' && 
    claim.issues.some(issue => issue.severity === 'fail')
  ).length;

  // Claims rejected by scrubber: rejected_277ca status (never got claim ID)
  const claimsScrubberRejects = claims.filter(claim => 
    claim.status === 'rejected_277ca'
  ).length;

  // Calculate submission success rate
  // Consider successful submissions as those that made it past scrubbing
  const submissionAttempts = claims.filter(claim => 
    ['submitted', 'awaiting_277ca', 'accepted_277ca', 'rejected_277ca', 'paid', 'denied'].includes(claim.status)
  );
  
  const successfulSubmissions = claims.filter(claim => 
    ['submitted', 'awaiting_277ca', 'accepted_277ca', 'paid'].includes(claim.status)
  );

  const submissionSuccessRate = submissionAttempts.length > 0 
    ? Math.round((successfulSubmissions.length / submissionAttempts.length) * 100)
    : 0;

  return {
    claimsMissingInfo,
    claimsScrubberRejects,
    submissionSuccessRate,
    totalSubmissionAttempts: submissionAttempts.length
  };
};
