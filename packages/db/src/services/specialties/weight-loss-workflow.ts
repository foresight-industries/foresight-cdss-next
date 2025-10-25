import { BaseSpecialtyWorkflowService, ValidationResult, PriorAuthData } from './base-specialty-workflow';

export class WeightLossWorkflowService extends BaseSpecialtyWorkflowService {
  constructor() {
    super('WEIGHT_LOSS', {
      necessityCriteria: {
        'BMI_REQUIREMENT': [
          'BMI >= 40',
          'BMI >= 35 with comorbidities',
          'BMI >= 30 with diabetes'
        ],
        'FAILED_ATTEMPTS': [
          '6 months supervised diet program',
          'Exercise program participation',
          'Previous weight loss attempts documented'
        ],
        'PSYCHOLOGICAL_EVALUATION': [
          'Mental health clearance',
          'Eating disorder screening',
          'Psychological readiness assessment'
        ],
        'MEDICAL_CLEARANCE': [
          'Cardiac clearance',
          'Pulmonary function assessment',
          'Endocrine evaluation'
        ]
      },
      requiredDocuments: [
        'medical_history',
        'bmi_documentation',
        'diet_history',
        'psychological_evaluation',
        'cardiac_clearance',
        'insurance_verification'
      ],
      autoApprovalThresholds: {
        score: 0.85,
        bmi: 40,
        comorbidityCount: 2
      },
      specializedValidations: [
        'validateBMICriteria',
        'validateDietHistory',
        'validatePsychologicalClearance',
        'validateMedicalClearances'
      ],
      timeoutMinutes: 45,
      requiresManualReview: true
    });
  }

  async validateMedicalNecessity(data: PriorAuthData): Promise<ValidationResult> {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;

    // Validate BMI criteria
    const bmiResult = this.validateBMICriteria(data);
    if (bmiResult.passed) {
      score += 0.4;
      reasons.push('BMI criteria met');
    } else {
      missingRequirements.push('BMI documentation or criteria not met');
      reasons.push(bmiResult.reason);
    }

    // Validate failed diet attempts
    const dietResult = this.validateDietHistory(data);
    if (dietResult.passed) {
      score += 0.3;
      reasons.push('Diet history requirements met');
    } else {
      missingRequirements.push('Supervised diet program documentation');
      reasons.push(dietResult.reason);
    }

    // Validate psychological evaluation
    const psychResult = this.validatePsychologicalClearance(data);
    if (psychResult.passed) {
      score += 0.2;
      reasons.push('Psychological evaluation completed');
    } else {
      missingRequirements.push('Psychological evaluation');
      reasons.push(psychResult.reason);
    }

    // Validate medical clearances
    const medicalResult = this.validateMedicalClearances(data);
    if (medicalResult.passed) {
      score += 0.1;
      reasons.push('Medical clearances obtained');
    } else {
      missingRequirements.push('Medical specialty clearances');
      reasons.push(medicalResult.reason);
    }

    const isValid = score >= 0.7 && missingRequirements.length === 0;

    return {
      isValid,
      score,
      reasons,
      missingRequirements,
      autoApproval: false, // Weight loss surgery typically requires manual review
      recommendedAction: isValid ? 'MANUAL_REVIEW' : 'REQUEST_ADDITIONAL_INFO'
    };
  }

  async validateSpecialtySpecificCriteria(data: PriorAuthData): Promise<ValidationResult> {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;

    // Age criteria (typically 18-65 for bariatric surgery)
    if (data.patientAge >= 18 && data.patientAge <= 65) {
      score += 0.2;
      reasons.push('Age criteria met for bariatric surgery');
    } else {
      reasons.push(`Patient age ${data.patientAge} outside typical range (18-65)`);
      score += 0.1; // Partial credit, may still be approved with additional review
    }

    // Check for contraindications in clinical rationale
    const contraindications = this.checkContraindications(data);
    if (contraindications.length === 0) {
      score += 0.3;
      reasons.push('No contraindications identified');
    } else {
      reasons.push(`Potential contraindications: ${contraindications.join(', ')}`);
      missingRequirements.push('Contraindication assessment');
    }

    // Procedure-specific criteria
    const procedureResult = this.validateProcedureSpecificCriteria(data);
    score += procedureResult.score;
    reasons.push(...procedureResult.reasons);
    missingRequirements.push(...procedureResult.missingRequirements);

    // Comorbidity documentation
    const comorbidityResult = this.validateComorbidities(data);
    score += comorbidityResult.score;
    reasons.push(...comorbidityResult.reasons);
    if (!comorbidityResult.passed) {
      missingRequirements.push('Comorbidity documentation');
    }

    const isValid = score >= 0.6;

    return {
      isValid,
      score,
      reasons,
      missingRequirements,
      autoApproval: false,
      recommendedAction: isValid ? 'MANUAL_REVIEW' : 'REQUEST_ADDITIONAL_INFO'
    };
  }

  async calculateApprovalProbability(data: PriorAuthData): Promise<number> {
    let probability = this.calculateBaseScore(data);

    // Weight loss specific factors
    const bmiValue = this.extractBMIFromData(data);
    if (bmiValue >= 40) {
      probability += 0.3;
    } else if (bmiValue >= 35) {
      probability += 0.2;
    } else if (bmiValue >= 30) {
      probability += 0.1;
    }

    // Comorbidity count increases approval probability
    const comorbidityCount = this.countComorbidities(data);
    probability += Math.min(0.2, comorbidityCount * 0.05);

    // Previous failed attempts increase approval probability
    const failedAttempts = this.countFailedWeightLossAttempts(data);
    probability += Math.min(0.15, failedAttempts * 0.03);

    // Factor in urgency and medical necessity
    if (data.urgency === 'URGENT' || data.urgency === 'EMERGENT') {
      probability += 0.1;
    }

    return Math.min(0.95, Math.max(0.05, probability));
  }

  getRequiredDocuments(data: PriorAuthData): string[] {
    const baseDocuments = [...this.config.requiredDocuments];
    
    // Add procedure-specific documents
    if (data.procedureCodes.some(code => ['43644', '43775'].includes(code))) {
      baseDocuments.push('surgical_consultation', 'anesthesia_clearance');
    }

    // Add age-specific documents
    if (data.patientAge > 60) {
      baseDocuments.push('geriatric_assessment');
    }

    return baseDocuments;
  }

  private validateBMICriteria(data: PriorAuthData): { passed: boolean; reason: string } {
    const bmi = this.extractBMIFromData(data);
    const comorbidities = this.countComorbidities(data);
    const hasDiabetes = this.hasDiabetes(data);

    if (bmi >= 40) {
      return { passed: true, reason: `BMI ${bmi} meets class III obesity criteria` };
    } else if (bmi >= 35 && comorbidities >= 1) {
      return { passed: true, reason: `BMI ${bmi} with ${comorbidities} comorbidities meets criteria` };
    } else if (bmi >= 30 && hasDiabetes) {
      return { passed: true, reason: `BMI ${bmi} with diabetes meets criteria` };
    } else {
      return { 
        passed: false, 
        reason: `BMI ${bmi} does not meet criteria (need BMI≥40, or BMI≥35 with comorbidities, or BMI≥30 with diabetes)` 
      };
    }
  }

  private validateDietHistory(data: PriorAuthData): { passed: boolean; reason: string } {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const priorTreatments = data.priorTreatments?.map(t => t.toLowerCase()) || [];
    
    const dietKeywords = ['diet', 'nutrition', 'weight loss program', 'supervised', 'dietary'];
    const exerciseKeywords = ['exercise', 'physical activity', 'fitness', 'gym'];
    
    const hasDietHistory = dietKeywords.some(keyword => 
      clinicalText.includes(keyword) || priorTreatments.some(t => t.includes(keyword))
    );
    
    const hasExerciseHistory = exerciseKeywords.some(keyword => 
      clinicalText.includes(keyword) || priorTreatments.some(t => t.includes(keyword))
    );

    if (hasDietHistory && hasExerciseHistory) {
      return { passed: true, reason: 'Documented diet and exercise attempts' };
    } else if (hasDietHistory) {
      return { passed: false, reason: 'Diet history documented but exercise program not documented' };
    } else {
      return { passed: false, reason: 'Supervised diet program not documented' };
    }
  }

  private validatePsychologicalClearance(data: PriorAuthData): { passed: boolean; reason: string } {
    const documents = data.supportingDocuments?.map(d => d.toLowerCase()) || [];
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    
    const psychKeywords = ['psychological', 'mental health', 'psychiatry', 'eating disorder', 'behavioral'];
    
    const hasPsychEval = psychKeywords.some(keyword => 
      clinicalText.includes(keyword) || documents.some(d => d.includes(keyword))
    );

    return {
      passed: hasPsychEval,
      reason: hasPsychEval ? 'Psychological evaluation documented' : 'Psychological evaluation not documented'
    };
  }

  private validateMedicalClearances(data: PriorAuthData): { passed: boolean; reason: string } {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const documents = data.supportingDocuments?.map(d => d.toLowerCase()) || [];
    
    const clearanceKeywords = ['cardiac clearance', 'cardiology', 'pulmonary', 'endocrine'];
    const clearanceCount = clearanceKeywords.reduce((count, keyword) => {
      if (clinicalText.includes(keyword) || documents.some(d => d.includes(keyword))) {
        return count + 1;
      }
      return count;
    }, 0);

    if (clearanceCount >= 2) {
      return { passed: true, reason: `${clearanceCount} medical clearances documented` };
    } else {
      return { passed: false, reason: `Only ${clearanceCount} medical clearances documented, need at least 2` };
    }
  }

  private checkContraindications(data: PriorAuthData): string[] {
    const contraindications: string[] = [];
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    
    const contraindicationKeywords = {
      'active substance abuse': ['substance abuse', 'drug abuse', 'alcohol abuse'],
      'severe mental illness': ['severe depression', 'psychosis', 'severe mental illness'],
      'inflammatory bowel disease': ['crohn', 'ulcerative colitis', 'inflammatory bowel'],
      'pregnancy': ['pregnant', 'pregnancy'],
      'severe cardiac disease': ['severe heart failure', 'severe cardiac', 'unstable angina']
    };

    for (const [condition, keywords] of Object.entries(contraindicationKeywords)) {
      if (keywords.some(keyword => clinicalText.includes(keyword))) {
        contraindications.push(condition);
      }
    }

    return contraindications;
  }

  private validateProcedureSpecificCriteria(data: PriorAuthData): { 
    score: number; 
    reasons: string[]; 
    missingRequirements: string[] 
  } {
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    let score = 0;

    // Check if specific procedure codes are present
    const bariatricCodes = ['43644', '43775', '43659']; // Bypass, sleeve, other
    const hasBariatricCode = data.procedureCodes.some(code => bariatricCodes.includes(code));
    
    if (hasBariatricCode) {
      score += 0.2;
      reasons.push('Appropriate bariatric procedure code documented');
    } else {
      missingRequirements.push('Specific bariatric procedure code');
      reasons.push('Bariatric procedure code not specified');
    }

    // Validate procedure-specific requirements
    if (data.procedureCodes.includes('43644')) { // Gastric bypass
      score += 0.1;
      reasons.push('Gastric bypass procedure - highest success rate');
    } else if (data.procedureCodes.includes('43775')) { // Sleeve gastrectomy
      score += 0.08;
      reasons.push('Sleeve gastrectomy procedure - good success rate');
    }

    return { score, reasons, missingRequirements };
  }

  private validateComorbidities(data: PriorAuthData): { passed: boolean; score: number; reasons: string[] } {
    const comorbidityCount = this.countComorbidities(data);
    const reasons: string[] = [];
    
    if (comorbidityCount >= 2) {
      reasons.push(`${comorbidityCount} obesity-related comorbidities documented`);
      return { passed: true, score: 0.2, reasons };
    } else if (comorbidityCount === 1) {
      reasons.push(`${comorbidityCount} obesity-related comorbidity documented`);
      return { passed: true, score: 0.1, reasons };
    } else {
      reasons.push('No obesity-related comorbidities documented');
      return { passed: false, score: 0, reasons };
    }
  }

  private extractBMIFromData(data: PriorAuthData): number {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    
    // Look for BMI pattern: "BMI 35.2", "BMI: 40", "body mass index 45.7"
    const bmiMatch = clinicalText.match(/(?:bmi|body mass index)[\s:]*(\d+(?:\.\d+)?)/i);
    
    if (bmiMatch) {
      return parseFloat(bmiMatch[1]);
    }

    // Fallback: look in any custom BMI field
    if (data.bmi) {
      return parseFloat(data.bmi.toString());
    }

    return 0; // Unknown BMI
  }

  private countComorbidities(data: PriorAuthData): number {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const diagnosisCodes = data.diagnosisCodes || [];
    
    const comorbidityKeywords = [
      'diabetes', 'hypertension', 'sleep apnea', 'arthritis', 'gerd',
      'fatty liver', 'depression', 'anxiety', 'high cholesterol',
      'cardiovascular disease', 'insulin resistance'
    ];

    const obesityRelatedICD10 = [
      'E11', // Type 2 diabetes
      'I10', // Hypertension
      'G47.33', // Sleep apnea
      'M15', // Arthritis
      'K21', // GERD
      'K76.0' // Fatty liver
    ];

    let count = 0;

    // Count keyword matches
    comorbidityKeywords.forEach(keyword => {
      if (clinicalText.includes(keyword)) {
        count++;
      }
    });

    // Count ICD-10 matches
    obesityRelatedICD10.forEach(code => {
      if (diagnosisCodes.some(d => d.startsWith(code))) {
        count++;
      }
    });

    return count;
  }

  private hasDiabetes(data: PriorAuthData): boolean {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const diagnosisCodes = data.diagnosisCodes || [];
    
    return clinicalText.includes('diabetes') || 
           diagnosisCodes.some(code => code.startsWith('E10') || code.startsWith('E11'));
  }

  private countFailedWeightLossAttempts(data: PriorAuthData): number {
    const clinicalText = data.clinicalRationale?.toLowerCase() || '';
    const priorTreatments = data.priorTreatments?.join(' ').toLowerCase() || '';
    
    const attemptKeywords = [
      'failed diet', 'unsuccessful', 'previous attempt', 'tried', 'attempted',
      'weight watchers', 'jenny craig', 'nutrisystem', 'phentermine'
    ];

    return attemptKeywords.reduce((count, keyword) => {
      if (clinicalText.includes(keyword) || priorTreatments.includes(keyword)) {
        return count + 1;
      }
      return count;
    }, 0);
  }
}