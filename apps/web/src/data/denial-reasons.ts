import type { Claim } from './claims';

export interface DenialReason {
  code: string;
  category: string;
  description: string;
  commonCause: string;
  resolution: DenialResolution;
}

export interface DenialResolution {
  title: string;
  description: string;
  steps: string[];
  timeframe: string;
  canAutomate: boolean;
  automaticAction?: string;
  priority: 'high' | 'medium' | 'low';
  preventionTips: string[];
}

export interface DenialReasonAnalysis {
  reason: DenialReason;
  claimCount: number;
  totalAmount: number;
  averageDaysInAR: number;
  payerBreakdown: { payer: string; count: number; amount: number }[];
  claims: Claim[];
}

// Comprehensive denial reasons mapping based on common CARC/RARC codes
export const DENIAL_REASONS: Record<string, DenialReason> = {
  '197': {
    code: '197',
    category: 'Authorization',
    description: 'Precertification/authorization required',
    commonCause: 'Missing or expired prior authorization for services',
    resolution: {
      title: 'Obtain Prior Authorization',
      description: 'Contact payer to obtain required authorization before resubmitting claims',
      steps: [
        'Verify current authorization requirements with payer',
        'Submit prior authorization request with clinical documentation',
        'Wait for approval before resubmitting claims',
        'Update claims with authorization number once approved'
      ],
      timeframe: '7-14 business days',
      canAutomate: false,
      priority: 'high',
      preventionTips: [
        'Verify authorization requirements during scheduling',
        'Set up automated authorization tracking system',
        'Train staff on payer-specific authorization requirements'
      ]
    }
  },
  'CO-16': {
    code: 'CO-16',
    category: 'Provider Credentialing',
    description: 'Claim/service lacking information or has submission/billing error',
    commonCause: 'Provider not credentialed or enrolled with payer for specific services',
    resolution: {
      title: 'Verify Provider Credentialing',
      description: 'Ensure provider is properly credentialed and enrolled with payer',
      steps: [
        'Check provider enrollment status with payer',
        'Verify specialty credentialing for specific services',
        'Submit credentialing application if not enrolled',
        'Resubmit claims once credentialing is complete'
      ],
      timeframe: '30-90 business days',
      canAutomate: false,
      priority: 'high',
      preventionTips: [
        'Maintain current credentialing database',
        'Set up credentialing renewal reminders',
        'Verify provider eligibility before scheduling'
      ]
    }
  },
  'CO-11': {
    code: 'CO-11',
    category: 'Coding',
    description: 'The diagnosis is inconsistent with the procedure',
    commonCause: 'Diagnosis codes do not support medical necessity for procedure codes',
    resolution: {
      title: 'Review and Correct Coding',
      description: 'Verify diagnosis and procedure code alignment for medical necessity',
      steps: [
        'Review clinical documentation for accurate diagnosis',
        'Verify CPT codes match documented procedures',
        'Check ICD-10 to CPT code compatibility',
        'Resubmit with corrected codes or appeal with additional documentation'
      ],
      timeframe: '3-5 business days',
      canAutomate: true,
      automaticAction: 'Run coding validation and suggest corrections',
      priority: 'medium',
      preventionTips: [
        'Implement real-time coding validation',
        'Provide coding education to clinical staff',
        'Use clinical decision support tools'
      ]
    }
  },
  'N620': {
    code: 'N620',
    category: 'Place of Service',
    description: 'Missing/incomplete/invalid place of service',
    commonCause: 'Incorrect or missing place of service code or modifier',
    resolution: {
      title: 'Correct Place of Service Information',
      description: 'Update claims with accurate place of service codes and required modifiers',
      steps: [
        'Verify actual location where service was provided',
        'Check for required modifiers (e.g., Modifier 95 for telehealth)',
        'Update place of service code to match service location',
        'Resubmit with corrected POS and modifiers'
      ],
      timeframe: '1-2 business days',
      canAutomate: true,
      automaticAction: 'Auto-correct POS based on service type and location',
      priority: 'low',
      preventionTips: [
        'Train staff on proper place of service coding',
        'Implement automated POS validation',
        'Create location-specific billing templates'
      ]
    }
  },
  'N700': {
    code: 'N700',
    category: 'Authorization',
    description: 'Authorization number missing or invalid',
    commonCause: 'Valid authorization exists but number was not included or is incorrect',
    resolution: {
      title: 'Add or Correct Authorization Number',
      description: 'Locate correct authorization number and resubmit claims',
      steps: [
        'Look up authorization number in payer portal',
        'Verify authorization is still valid and covers services',
        'Update claims with correct authorization number',
        'Resubmit claims with authorization information'
      ],
      timeframe: '1-3 business days',
      canAutomate: true,
      automaticAction: 'Auto-lookup and populate authorization numbers',
      priority: 'medium',
      preventionTips: [
        'Maintain authorization tracking database',
        'Verify authorization numbers before submission',
        'Set up automated authorization validation'
      ]
    }
  },
  'MISSING_INDICATION': {
    code: 'MISSING_INDICATION',
    category: 'Documentation',
    description: 'Missing indication detail',
    commonCause: 'Clinical documentation lacks sufficient detail for medical necessity',
    resolution: {
      title: 'Obtain Additional Clinical Documentation',
      description: 'Request detailed clinical notes to support medical necessity',
      steps: [
        'Contact provider for additional clinical documentation',
        'Review chart notes for missed indication details',
        'Prepare appeal letter with supporting documentation',
        'Submit appeal with comprehensive clinical justification'
      ],
      timeframe: '5-10 business days',
      canAutomate: false,
      priority: 'high',
      preventionTips: [
        'Educate providers on documentation requirements',
        'Implement clinical documentation improvement program',
        'Use structured data entry templates'
      ]
    }
  },
  'ELIGIBILITY_NOT_VERIFIED': {
    code: 'ELIGIBILITY_NOT_VERIFIED',
    category: 'Eligibility',
    description: 'Eligibility not verified',
    commonCause: 'Patient insurance eligibility was not verified before service',
    resolution: {
      title: 'Verify Patient Eligibility',
      description: 'Confirm patient insurance coverage and benefits',
      steps: [
        'Submit real-time eligibility verification request',
        'Verify patient demographics and insurance information',
        'Check coverage for specific services provided',
        'Resubmit claims if coverage confirmed, or collect from patient if not covered'
      ],
      timeframe: '1-2 business days',
      canAutomate: true,
      automaticAction: 'Run automated eligibility verification',
      priority: 'high',
      preventionTips: [
        'Verify eligibility at every appointment',
        'Implement real-time eligibility checking',
        'Train front desk staff on verification procedures'
      ]
    }
  },
  'INCORRECT_MODIFIERS': {
    code: 'INCORRECT_MODIFIERS',
    category: 'Coding',
    description: 'Incorrect POS/modifiers',
    commonCause: 'Wrong modifiers applied or required modifiers missing',
    resolution: {
      title: 'Review and Correct Modifier Usage',
      description: 'Apply appropriate modifiers based on payer requirements and service details',
      steps: [
        'Review payer-specific modifier requirements',
        'Verify modifier compatibility with CPT codes',
        'Check for required modifiers based on service circumstances',
        'Resubmit with correct modifier combinations'
      ],
      timeframe: '1-2 business days',
      canAutomate: true,
      automaticAction: 'Auto-apply correct modifiers based on service type',
      priority: 'medium',
      preventionTips: [
        'Maintain payer-specific modifier guides',
        'Implement modifier validation rules',
        'Provide regular coding education'
      ]
    }
  },
  'EXPIRED_AUTHORIZATION': {
    code: 'EXPIRED_AUTHORIZATION',
    category: 'Authorization',
    description: 'Expired authorization',
    commonCause: 'Service provided after authorization expiration date',
    resolution: {
      title: 'Renew Authorization or Submit Appeal',
      description: 'Either obtain new authorization or appeal based on original approval',
      steps: [
        'Check if authorization can be retroactively extended',
        'Submit new authorization request if extension not possible',
        'Prepare appeal showing service was within original approved timeframe',
        'Resubmit claims once new authorization obtained or appeal if justified'
      ],
      timeframe: '7-14 business days',
      canAutomate: false,
      priority: 'high',
      preventionTips: [
        'Set up authorization expiration alerts',
        'Monitor authorization dates during scheduling',
        'Implement authorization renewal workflows'
      ]
    }
  }
};

// Extract denial reason from claim data
export const extractDenialReason = (claim: Claim): string | null => {
  // Check CARC codes first
  if (claim.payer_response?.carc) return claim.payer_response.carc;
  if (claim.rejection_response?.carc) return claim.rejection_response.carc;

  // Check RARC codes
  if (claim.payer_response?.rarc) return claim.payer_response.rarc;
  if (claim.rejection_response?.rarc) return claim.rejection_response.rarc;

  // Check for mapped text-based reasons in message
  const message = claim.payer_response?.message || claim.rejection_response?.message || '';
  if (message.toLowerCase().includes('missing indication')) return 'MISSING_INDICATION';
  if (message.toLowerCase().includes('eligibility not verified')) return 'ELIGIBILITY_NOT_VERIFIED';
  if (message.toLowerCase().includes('incorrect') && message.toLowerCase().includes('modifier')) return 'INCORRECT_MODIFIERS';
  if (message.toLowerCase().includes('expired authorization')) return 'EXPIRED_AUTHORIZATION';

  return null;
};

// Get denial reason details
export const getDenialReasonDetails = (code: string): DenialReason | null => {
  return DENIAL_REASONS[code] || null;
};

// Analyze claims by denial reason
export const analyzeDenialReasons = (claims: Claim[]): DenialReasonAnalysis[] => {
  const deniedClaims = claims.filter(claim =>
    claim.status === 'denied' || claim.status === 'rejected_277ca'
  );

  const reasonGroups: Record<string, Claim[]> = {};

  // Group claims by denial reason
  for (const claim of deniedClaims) {
    const reasonCode = extractDenialReason(claim);
    if (reasonCode) {
      if (!reasonGroups[reasonCode]) {
        reasonGroups[reasonCode] = [];
      }
      reasonGroups[reasonCode].push(claim);
    }
  }

  // Create analysis for each denial reason
  const analyses: DenialReasonAnalysis[] = [];

  Object.entries(reasonGroups).forEach(([code, claimsForReason]) => {
    const reason = getDenialReasonDetails(code);
    if (!reason) return;

    const totalAmount = claimsForReason.reduce((sum, claim) => sum + claim.total_amount, 0);
    const averageDaysInAR = Math.round(
      claimsForReason.reduce((sum, claim) => {
        const daysSinceSubmission = Math.floor(
          (Date.now() - new Date(claim.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysSinceSubmission;
      }, 0) / claimsForReason.length
    );

    // Create payer breakdown
    const payerCounts: Record<string, { count: number; amount: number }> = {};
    claimsForReason.forEach(claim => {
      const payerName = claim.payer.name;
      if (!payerCounts[payerName]) {
        payerCounts[payerName] = { count: 0, amount: 0 };
      }
      payerCounts[payerName].count++;
      payerCounts[payerName].amount += claim.total_amount;
    });

    const payerBreakdown = Object.entries(payerCounts)
      .map(([payer, data]) => ({ payer, count: data.count, amount: data.amount }))
      .sort((a, b) => b.count - a.count);

    analyses.push({
      reason,
      claimCount: claimsForReason.length,
      totalAmount,
      averageDaysInAR,
      payerBreakdown,
      claims: claimsForReason
    });
  });

  return analyses.sort((a, b) => b.claimCount - a.claimCount);
};

// Get top denial reasons for dashboard display
export const getTopDenialReasons = (claims: Claim[], limit = 4) => {
  const analyses = analyzeDenialReasons(claims);
  return analyses.slice(0, limit).map(analysis => ({
    reason: analysis.reason.description,
    count: analysis.claimCount,
    code: analysis.reason.code
  }));
};
