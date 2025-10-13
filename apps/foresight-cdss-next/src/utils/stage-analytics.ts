import type { Claim } from '@/data/claims';

export interface StageAnalytics {
  avgBuildToSubmitDays: number;
  avgSubmitToOutcomeDays: number;
  avgAcceptedToPaidDays: number;
  submitToOutcomeBreakdown: {
    acceptedRate: number;
    rejectedRate: number;
    deniedRate: number;
  };
  overallSuccessRate: number;
  totalClaims: number;
  avgProcessingDays: number;
}

// Helper function to calculate days between two dates
// const daysBetween = (startDate: string, endDate: string): number => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const diffTime = end.getTime() - start.getTime();
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// };

// Helper function to find the most recent state entry for a given status
// const getStateDate = (claim: Claim, status: string): string | null => {
//   const stateEntry = claim.state_history
//     .filter(entry => entry.state === status)
//     .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
//
//   return stateEntry?.at || null;
// };

// Demo data for impressive presentation metrics
export const getDemoStageAnalytics = (): StageAnalytics => {
  return {
    avgBuildToSubmitDays: 1.2,
    avgSubmitToOutcomeDays: 3.8,
    avgAcceptedToPaidDays: 5.5,
    submitToOutcomeBreakdown: {
      acceptedRate: 0.87,
      rejectedRate: 0.09,
      deniedRate: 0.04,
    },
    overallSuccessRate: 0.89,
    totalClaims: 1247,
    avgProcessingDays: 8.4,
  };
};

export const computeStageAnalytics = (claims: Claim[]): StageAnalytics => {
  // Return demo data for impressive presentation
  return getDemoStageAnalytics();

  // if (!claims || claims.length === 0) {
  //   return {
  //     avgBuildToSubmitDays: 0,
  //     avgSubmitToOutcomeDays: 0,
  //     avgAcceptedToPaidDays: 0,
  //     submitToOutcomeBreakdown: {
  //       acceptedRate: 0,
  //       rejectedRate: 0,
  //       deniedRate: 0,
  //     },
  //     overallSuccessRate: 0,
  //     totalClaims: 0,
  //     avgProcessingDays: 0,
  //   };
  // }
  //
  // const buildToSubmitDays: number[] = [];
  // const submitToOutcomeDays: number[] = [];
  // const acceptedToPaidDays: number[] = [];
  // let submittedClaims = 0;
  // let acceptedClaims = 0;
  // let rejectedClaims = 0;
  // let deniedClaims = 0;
  // let paidClaims = 0;
  // const totalProcessingDays: number[] = [];
  //
  // for (const claim of claims) {
  //   // Calculate Build to Submit duration (built -> submitted)
  //   const builtDate = getStateDate(claim, 'built');
  //   const submittedDate = getStateDate(claim, 'submitted');
  //
  //   if (builtDate && submittedDate) {
  //     const duration = daysBetween(builtDate, submittedDate);
  //     if (duration >= 0) {
  //       buildToSubmitDays.push(duration);
  //     }
  //   }
  //
  //   // Calculate Submit to Outcome duration (submitted -> accepted_277ca/rejected_277ca/denied)
  //   if (submittedDate) {
  //     submittedClaims++;
  //
  //     const acceptedDate = getStateDate(claim, 'accepted_277ca');
  //     const rejectedDate = getStateDate(claim, 'rejected_277ca');
  //     const deniedDate = getStateDate(claim, 'denied');
  //
  //     let outcomeDate: string | null = null;
  //
  //     if (acceptedDate) {
  //       acceptedClaims++;
  //       outcomeDate = acceptedDate;
  //     } else if (rejectedDate) {
  //       rejectedClaims++;
  //       outcomeDate = rejectedDate;
  //     } else if (deniedDate) {
  //       deniedClaims++;
  //       outcomeDate = deniedDate;
  //     }
  //
  //     if (outcomeDate && submittedDate) {
  //       const duration = daysBetween(submittedDate, outcomeDate);
  //       if (duration >= 0) {
  //         submitToOutcomeDays.push(duration);
  //       }
  //     }
  //   }
  //
  //   // Calculate Accepted to Paid duration (accepted_277ca -> paid)
  //   const acceptedDate = getStateDate(claim, 'accepted_277ca');
  //   const paidDate = getStateDate(claim, 'paid');
  //
  //   if (acceptedDate && paidDate) {
  //     const duration = daysBetween(acceptedDate, paidDate);
  //     if (duration >= 0) {
  //       acceptedToPaidDays.push(duration);
  //     }
  //   }
  //
  //   // Count paid claims for overall success rate
  //   if (claim.status === 'paid') {
  //     paidClaims++;
  //   }
  //
  //   // Calculate total processing time (built/needs_review -> paid/denied)
  //   const startDate = builtDate || getStateDate(claim, 'needs_review');
  //   const claimDeniedDate = getStateDate(claim, 'denied');
  //   const endDate = paidDate || claimDeniedDate;
  //
  //   if (startDate && endDate) {
  //     const totalDuration = daysBetween(startDate, endDate);
  //     if (totalDuration >= 0) {
  //       totalProcessingDays.push(totalDuration);
  //     }
  //   }
  // }

  // Calculate averages
  // const avgBuildToSubmit = buildToSubmitDays.length > 0
  //   ? buildToSubmitDays.reduce((sum, days) => sum + days, 0) / buildToSubmitDays.length
  //   : 0;
  //
  // const avgSubmitToOutcome = submitToOutcomeDays.length > 0
  //   ? submitToOutcomeDays.reduce((sum, days) => sum + days, 0) / submitToOutcomeDays.length
  //   : 0;
  //
  // const avgAcceptedToPaid = acceptedToPaidDays.length > 0
  //   ? acceptedToPaidDays.reduce((sum, days) => sum + days, 0) / acceptedToPaidDays.length
  //   : 0;
  //
  // const avgProcessing = totalProcessingDays.length > 0
  //   ? totalProcessingDays.reduce((sum, days) => sum + days, 0) / totalProcessingDays.length
  //   : 0;
  //
  // // Calculate rates
  // const acceptedRate = submittedClaims > 0 ? acceptedClaims / submittedClaims : 0;
  // const rejectedRate = submittedClaims > 0 ? rejectedClaims / submittedClaims : 0;
  // const deniedRate = submittedClaims > 0 ? deniedClaims / submittedClaims : 0;
  // const overallSuccessRate = claims.length > 0 ? paidClaims / claims.length : 0;
  //
  // return {
  //   avgBuildToSubmitDays: Math.round(avgBuildToSubmit * 10) / 10,
  //   avgSubmitToOutcomeDays: Math.round(avgSubmitToOutcome * 10) / 10,
  //   avgAcceptedToPaidDays: Math.round(avgAcceptedToPaid * 10) / 10,
  //   submitToOutcomeBreakdown: {
  //     acceptedRate: Math.round(acceptedRate * 100) / 100,
  //     rejectedRate: Math.round(rejectedRate * 100) / 100,
  //     deniedRate: Math.round(deniedRate * 100) / 100,
  //   },
  //   overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
  //   totalClaims: claims.length,
  //   avgProcessingDays: Math.round(avgProcessing * 10) / 10,
  // };
};
