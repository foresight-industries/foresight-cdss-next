import { BaseSpecialtyWorkflowService, ValidationResult, PriorAuthData } from './base-specialty-workflow';

export class InternalMedicineWorkflowService extends BaseSpecialtyWorkflowService {
  constructor() {
    super('INTERNAL_MEDICINE', {
      necessityCriteria: {
        'CLINICAL_INDICATION': [
          'Clear medical indication documented',
          'Appropriate diagnosis code provided',
          'Treatment plan aligns with condition'
        ],
        'CONSERVATIVE_TREATMENT': [
          'Conservative measures attempted',
          'First-line therapies tried',
          'Step therapy protocol followed'
        ]
      },
      requiredDocuments: [
        'medical_record',
        'diagnosis_documentation',
        'treatment_history'
      ],
      autoApprovalThresholds: {
        score: 0.7
      },
      specializedValidations: [
        'validateClinicalIndication',
        'validateConservativeTreatment'
      ],
      timeoutMinutes: 20,
      requiresManualReview: false
    });
  }

  async validateMedicalNecessity(data: PriorAuthData): Promise<ValidationResult> {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;

    // Validate clinical indication
    const clinicalResult = this.validateClinicalIndication(data);
    if (clinicalResult.passed) {
      score += 0.5;
      reasons.push('Clinical indication documented');
    } else {
      missingRequirements.push('Clear clinical indication');
      reasons.push(clinicalResult.reason);
    }

    // Validate conservative treatment attempts
    const conservativeResult = this.validateConservativeTreatment(data);
    if (conservativeResult.passed) {
      score += 0.3;
      reasons.push('Conservative treatment attempts documented');
    } else {
      missingRequirements.push('Conservative treatment documentation');
      reasons.push(conservativeResult.reason);
    }

    // Factor in urgency
    if (data.urgency === 'URGENT' || data.urgency === 'EMERGENT') {
      score += 0.2;
      reasons.push('Urgent medical need');
    }

    const isValid = score >= 0.6 && missingRequirements.length === 0;

    return {
      isValid,
      score,
      reasons,
      missingRequirements,
      autoApproval: score >= 0.8 && missingRequirements.length === 0,
      recommendedAction: isValid ? 'APPROVE' : 'REQUEST_ADDITIONAL_INFO'
    };
  }

  async validateSpecialtySpecificCriteria(data: PriorAuthData): Promise<ValidationResult> {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;

    // Age appropriateness
    if (data.patientAge >= 18 && data.patientAge <= 100) {
      score += 0.2;
      reasons.push('Age appropriate for internal medicine care');
    } else {
      reasons.push('Age may require specialized care consideration');
    }

    // Diagnosis code validation
    if (data.diagnosisCodes && data.diagnosisCodes.length > 0) {
      score += 0.3;
      reasons.push('Diagnosis codes provided');
    } else {
      missingRequirements.push('Diagnosis codes');
    }

    // Clinical rationale quality
    if (data.clinicalRationale && data.clinicalRationale.length > 50) {
      score += 0.3;
      reasons.push('Adequate clinical rationale provided');
    } else {
      missingRequirements.push('Detailed clinical rationale');
    }

    // Procedure appropriateness
    if (data.procedureCodes && data.procedureCodes.length > 0) {
      score += 0.2;
      reasons.push('Procedure codes documented');
    }

    const isValid = score >= 0.6;

    return {
      isValid,
      score,
      reasons,
      missingRequirements,
      autoApproval: score >= 0.8 && missingRequirements.length === 0,
      recommendedAction: isValid ? 'APPROVE' : 'REQUEST_ADDITIONAL_INFO'
    };
  }

  async calculateApprovalProbability(data: PriorAuthData): Promise<number> {
    let probability = this.calculateBaseScore(data);

    // Internal medicine specific factors
    if (data.diagnosisCodes && data.diagnosisCodes.length > 0) {
      probability += 0.2;
    }

    if (data.priorTreatments && data.priorTreatments.length > 0) {
      probability += 0.1;
    }

    // Factor in clinical rationale quality
    if (data.clinicalRationale && data.clinicalRationale.length > 100) {
      probability += 0.1;
    }

    return Math.min(0.9, Math.max(0.1, probability));
  }

  getRequiredDocuments(data: PriorAuthData): string[] {
    const baseDocuments = [...this.config.requiredDocuments];
    
    // Add age-specific documents
    if (data.patientAge >= 65) {
      baseDocuments.push('geriatric_assessment');
    }

    // Add condition-specific documents based on diagnosis codes
    if (data.diagnosisCodes?.some(code => code.startsWith('E'))) {
      baseDocuments.push('endocrine_evaluation');
    }

    return baseDocuments;
  }

  private validateClinicalIndication(data: PriorAuthData): { passed: boolean; reason: string } {
    const hasRationale = data.clinicalRationale && data.clinicalRationale.length > 20;
    const hasDiagnosis = data.diagnosisCodes && data.diagnosisCodes.length > 0;
    
    if (hasRationale && hasDiagnosis) {
      return { passed: true, reason: 'Clinical indication well documented' };
    } else if (hasRationale) {
      return { passed: false, reason: 'Clinical rationale provided but diagnosis codes missing' };
    } else if (hasDiagnosis) {
      return { passed: false, reason: 'Diagnosis codes provided but clinical rationale insufficient' };
    } else {
      return { passed: false, reason: 'Missing clinical indication and diagnosis documentation' };
    }
  }

  private validateConservativeTreatment(data: PriorAuthData): { passed: boolean; reason: string } {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const priorTreatments = data.priorTreatments?.map(t => t.toLowerCase()) || [];
    
    const conservativeKeywords = [
      'conservative', 'medication', 'therapy', 'lifestyle', 'diet',
      'exercise', 'physical therapy', 'observation', 'monitoring'
    ];
    
    const hasConservativeAttempts = conservativeKeywords.some(keyword => 
      clinicalText.includes(keyword) || priorTreatments.some(t => t.includes(keyword))
    );

    if (data.urgency === 'EMERGENT') {
      return { passed: true, reason: 'Emergency situation - conservative treatment not required' };
    }

    if (hasConservativeAttempts || priorTreatments.length > 0) {
      return { passed: true, reason: 'Conservative treatment attempts documented' };
    } else {
      return { passed: false, reason: 'No conservative treatment attempts documented' };
    }
  }
}