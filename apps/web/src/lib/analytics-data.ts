import { initialClaims } from '@/data/claims';
import { computeStageAnalytics } from '@/utils/stage-analytics';
import { calculateRCMMetrics } from '@/utils/dashboard';

export interface AnalyticsData {
  stageMetrics: ReturnType<typeof computeStageAnalytics>;
  rcmMetrics: ReturnType<typeof calculateRCMMetrics>;
  combinedKPIData: {
    totalItems: number;
    totalClaims: number;
    totalPAs: number;
    overallAutomationRate: number;
    avgProcessingTime: number;
    patientsServed: number;
  };
  combinedPayerData: Array<{
    payerName: string;
    claimsVolume: number;
    claimsAcceptanceRate: number;
    avgClaimsProcessing: number;
    paVolume: number;
    paApprovalRate: number;
    avgPAProcessing: number;
    overallPerformance: number;
  }>;
  realStatusDistribution: {
    claims: {
      needs_review: number;
      built: number;
      submitted: number;
      awaiting_277ca: number;
      accepted_277ca: number;
      rejected_277ca: number;
      paid: number;
      denied: number;
      total: number;
    };
    pas: {
      needsReview: number;
      autoProcessing: number;
      autoApproved: number;
      autoDenied: number;
      denied: number;
      error: number;
      total: number;
    };
  };
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  // Pre-compute all analytics data on the server
  const stageMetrics = computeStageAnalytics(initialClaims);
  const rcmMetrics = calculateRCMMetrics(initialClaims);

  // Compute combined KPI data
  const totalClaims = initialClaims.length;
  const totalPAs = initialClaims.filter(claim => claim.pa_status).length;
  const totalItems = totalClaims + totalPAs;

  const automatedClaims = initialClaims.filter(claim =>
    claim.status === 'submitted' || claim.status === 'accepted_277ca' || claim.status === 'paid'
  ).length;
  const automatedPAs = initialClaims.filter(claim =>
    claim.pa_status === 'auto-approved' || claim.pa_status === 'auto-processing'
  ).length;
  const overallAutomationRate = totalItems > 0 ?
    Math.round(((automatedClaims + automatedPAs) / totalItems) * 100) : 0;

  const avgClaimsProcessingHours = 2.5;
  const avgPAsProcessingHours = 1.8;
  const weightedAvgProcessingTime = totalItems > 0 ?
    ((avgClaimsProcessingHours * totalClaims) + (avgPAsProcessingHours * totalPAs)) / totalItems : 0;

  const uniquePatients = new Set([
    ...initialClaims.map(claim => claim.patient.id),
    ...initialClaims.filter(claim => claim.pa_status).map(claim => claim.patient.id)
  ]);

  const combinedKPIData = {
    totalItems,
    totalClaims,
    totalPAs,
    overallAutomationRate,
    avgProcessingTime: weightedAvgProcessingTime,
    patientsServed: uniquePatients.size
  };

  // Compute combined payer performance data
  const claimsByPayer = initialClaims.reduce((acc, claim) => {
    const payerName = claim.payer.name;
    if (!acc[payerName]) {
      acc[payerName] = {
        claims: [],
        pas: []
      };
    }
    acc[payerName].claims.push(claim);

    if (claim.pa_status) {
      acc[payerName].pas.push(claim);
    }

    return acc;
  }, {} as Record<string, { claims: typeof initialClaims, pas: typeof initialClaims }>);

  const combinedPayerData = Object.entries(claimsByPayer).map(([payerName, data]) => {
    const claimsVolume = data.claims.length;

    const payerPerformance: Record<string, { claimsRate: number; paRate: number }> = {
      'Cigna': { claimsRate: 94, paRate: 91 },
      'Kaiser Permanente': { claimsRate: 92, paRate: 89 },
      'Aetna': { claimsRate: 88, paRate: 86 },
      'UnitedHealthcare': { claimsRate: 84, paRate: 87 },
      'Blue Cross Blue Shield': { claimsRate: 81, paRate: 83 },
      'MI Medicaid': { claimsRate: 79, paRate: 82 },
      'Sunshine (FL Medicaid)': { claimsRate: 77, paRate: 80 },
      'Superior (TX Medicaid)': { claimsRate: 89, paRate: 86 },
      'Anthem BCBS': { claimsRate: 73, paRate: 75 },
      'Anthem Blue Cross': { claimsRate: 69, paRate: 71 },
      'Molina Healthcare': { claimsRate: 66, paRate: 68 },
      'BCBSM': { claimsRate: 63, paRate: 65 }
    };

    const performance = payerPerformance[payerName] || { claimsRate: 75, paRate: 78 };
    const claimsAcceptanceRate = performance.claimsRate;

    const paVolume = data.pas.length;
    const paApprovalRate = performance.paRate;

    const processingTimes: Record<string, { claims: number; pas: number }> = {
      'Cigna': { claims: 1.4, pas: 1.0 },
      'Kaiser Permanente': { claims: 1.5, pas: 1.1 },
      'Aetna': { claims: 1.8, pas: 1.3 },
      'UnitedHealthcare': { claims: 2.0, pas: 1.5 },
      'Blue Cross Blue Shield': { claims: 2.2, pas: 1.6 },
      'MI Medicaid': { claims: 2.4, pas: 1.8 },
      'Sunshine (FL Medicaid)': { claims: 2.6, pas: 2.0 },
      'Superior (TX Medicaid)': { claims: 1.7, pas: 1.4 },
      'Anthem BCBS': { claims: 3.0, pas: 2.3 },
      'Anthem Blue Cross': { claims: 3.3, pas: 2.5 },
      'Molina Healthcare': { claims: 3.5, pas: 2.7 },
      'BCBSM': { claims: 3.8, pas: 2.9 }
    };

    const times = processingTimes[payerName] || { claims: 2.3, pas: 1.7 };
    const avgClaimsProcessing = times.claims;
    const avgPAProcessing = times.pas;

    const totalVolume = claimsVolume + paVolume;
    const overallPerformance = totalVolume > 0 ?
      Math.round(((claimsAcceptanceRate * claimsVolume) + (paApprovalRate * paVolume)) / totalVolume) : 0;

    return {
      payerName,
      claimsVolume,
      claimsAcceptanceRate,
      avgClaimsProcessing,
      paVolume,
      paApprovalRate,
      avgPAProcessing,
      overallPerformance
    };
  }).sort((a, b) => b.overallPerformance - a.overallPerformance);

  // Compute real status distribution
  const claimStatuses = initialClaims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paStatuses = initialClaims
    .filter(claim => claim.pa_status)
    .reduce((acc, claim) => {
      acc[claim.pa_status!] = (acc[claim.pa_status!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const realStatusDistribution = {
    claims: {
      needs_review: claimStatuses.needs_review || 0,
      built: claimStatuses.built || 0,
      submitted: claimStatuses.submitted || 0,
      awaiting_277ca: claimStatuses.awaiting_277ca || 0,
      accepted_277ca: claimStatuses.accepted_277ca || 0,
      rejected_277ca: claimStatuses.rejected_277ca || 0,
      paid: claimStatuses.paid || 0,
      denied: claimStatuses.denied || 0,
      total: initialClaims.length
    },
    pas: {
      needsReview: paStatuses['needs-review'] || 0,
      autoProcessing: paStatuses['auto-processing'] || 0,
      autoApproved: paStatuses['auto-approved'] || 0,
      autoDenied: paStatuses['auto-denied'] || 0,
      denied: paStatuses.denied || 0,
      error: paStatuses.error || 0,
      total: initialClaims.filter(claim => claim.pa_status).length
    }
  };

  return {
    stageMetrics,
    rcmMetrics,
    combinedKPIData,
    combinedPayerData,
    realStatusDistribution
  };
}