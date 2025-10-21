/**
 * Prior Authorization Partial Automation
 * 
 * Provides intelligent pre-population and automation for common prior auth scenarios
 * while maintaining human oversight for clinical decisions.
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  diagnosisCodes: string[];
  currentMedications: string[];
  allergies: string[];
  medicalHistory: string[];
  insuranceInfo?: {
    payerId: string;
    memberId: string;
    groupNumber: string;
  };
}

export interface ProviderData {
  id: string;
  firstName: string;
  lastName: string;
  npi: string;
  specialties: string[];
  dosespotProviderId?: number;
}

export interface PayerData {
  id: string;
  name: string;
  requiresDoseSpot: boolean;
  commonRequirements: string[];
  typicalProcessingDays: number;
}

export interface AutomationResult {
  canAutoSubmit: boolean;
  preFilled: Record<string, any>;
  requiresManualInput: string[];
  riskFactors: string[];
  estimatedApprovalChance: number;
  recommendations: string[];
}

export interface DosespotRequirements {
  requiresQuestionnaire: boolean;
  hasExistingCase: boolean;
  needsNewCase: boolean;
  estimatedQuestions: number;
}

// Medication categories that commonly require prior auth
const HIGH_RISK_MEDICATIONS = [
  'weight loss',
  'ozempic',
  'wegovy',
  'mounjaro',
  'specialty',
  'biologics',
  'immunosuppressants'
];

// Diagnosis codes that typically require additional documentation
const COMPLEX_DIAGNOSES = [
  'E11', // Type 2 diabetes
  'E66', // Obesity
  'F32', // Major depressive disorder
  'M79.3', // Panniculitis
];

// ============================================================================
// AUTOMATION LOGIC
// ============================================================================

export class PriorAuthAutomation {
  /**
   * Analyze prior auth request and determine automation potential
   */
  static async analyzePriorAuth(
    patientData: PatientData,
    providerData: ProviderData,
    payerData: PayerData,
    requestedService: string,
    diagnosisCodes: string[]
  ): Promise<AutomationResult> {
    const riskFactors: string[] = [];
    const requiresManualInput: string[] = [];
    const recommendations: string[] = [];
    let estimatedApprovalChance = 75; // Base approval chance

    // Analyze medication complexity
    const isHighRiskMedication = HIGH_RISK_MEDICATIONS.some(med => 
      requestedService.toLowerCase().includes(med.toLowerCase())
    );

    if (isHighRiskMedication) {
      riskFactors.push('High-risk medication requiring additional documentation');
      requiresManualInput.push('medical_necessity_justification');
      requiresManualInput.push('treatment_alternatives_tried');
      estimatedApprovalChance -= 15;
    }

    // Analyze diagnosis complexity
    const hasComplexDiagnosis = diagnosisCodes.some(code => 
      COMPLEX_DIAGNOSES.some(complex => code.startsWith(complex))
    );

    if (hasComplexDiagnosis) {
      riskFactors.push('Complex diagnosis requiring clinical documentation');
      requiresManualInput.push('clinical_notes');
      requiresManualInput.push('lab_results');
      estimatedApprovalChance -= 10;
    }

    // Check provider specialization alignment
    const medicationCategory = this.categorizeMedication(requestedService);
    const providerSpecialtyMatch = providerData.specialties.some(specialty => 
      this.isSpecialtyRelevant(specialty, medicationCategory)
    );

    if (!providerSpecialtyMatch) {
      riskFactors.push('Provider specialty may not align with medication category');
      requiresManualInput.push('specialist_referral_justification');
      estimatedApprovalChance -= 5;
    }

    // Generate pre-filled data
    const preFilled = this.generatePreFilledData(
      patientData,
      providerData,
      payerData,
      requestedService,
      diagnosisCodes
    );

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(
      riskFactors,
      payerData,
      isHighRiskMedication
    ));

    // Determine if can auto-submit (low risk, all data available)
    const canAutoSubmit = riskFactors.length === 0 && 
                         requiresManualInput.length === 0 &&
                         !payerData.requiresDoseSpot;

    return {
      canAutoSubmit,
      preFilled,
      requiresManualInput,
      riskFactors,
      estimatedApprovalChance: Math.max(estimatedApprovalChance, 20),
      recommendations
    };
  }

  /**
   * Check DoseSpot requirements for the prior auth
   */
  static async checkDosespotRequirements(
    payerData: PayerData,
    requestedService: string,
    existingCaseId?: number
  ): Promise<DosespotRequirements> {
    const requiresQuestionnaire = payerData.requiresDoseSpot;
    const hasExistingCase = !!existingCaseId;
    const needsNewCase = requiresQuestionnaire && !hasExistingCase;
    
    // Estimate number of questions based on medication type
    let estimatedQuestions = 0;
    if (requiresQuestionnaire) {
      const medicationCategory = this.categorizeMedication(requestedService);
      estimatedQuestions = this.estimateQuestionCount(medicationCategory);
    }

    return {
      requiresQuestionnaire,
      hasExistingCase,
      needsNewCase,
      estimatedQuestions
    };
  }

  /**
   * Generate pre-filled form data based on patient and provider information
   */
  private static generatePreFilledData(
    patientData: PatientData,
    providerData: ProviderData,
    payerData: PayerData,
    requestedService: string,
    diagnosisCodes: string[]
  ): Record<string, any> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    return {
      // Basic information
      requestDate: today,
      effectiveDate: today,
      expirationDate: futureDate.toISOString().split('T')[0],
      
      // Clinical data
      diagnosisCodes: JSON.stringify(diagnosisCodes),
      requestedService,
      
      // Provider information
      submissionMethod: payerData.requiresDoseSpot ? 'portal' : 'fax',
      
      // Auto-generated clinical notes template
      clinicalNotes: this.generateClinicalNotesTemplate(
        patientData,
        requestedService,
        diagnosisCodes
      ),
      
      // Medical necessity template based on diagnosis
      medicalNecessity: this.generateMedicalNecessityTemplate(
        diagnosisCodes,
        requestedService
      )
    };
  }

  /**
   * Generate clinical notes template
   */
  private static generateClinicalNotesTemplate(
    patientData: PatientData,
    requestedService: string,
    diagnosisCodes: string[]
  ): string {
    const age = this.calculateAge(patientData.dateOfBirth);
    const primaryDiagnosis = diagnosisCodes[0] || 'See diagnosis codes';
    
    return `Patient: ${patientData.firstName} ${patientData.lastName}, Age: ${age}

Primary Diagnosis: ${primaryDiagnosis}
Requested Treatment: ${requestedService}

Clinical History:
- [Please review and update patient's medical history]
- Current medications: ${patientData.currentMedications.join(', ') || 'None listed'}
- Known allergies: ${patientData.allergies.join(', ') || 'NKDA'}

Treatment Plan:
- [Please provide clinical justification for requested treatment]
- [Document any contraindications or special considerations]

[This is an auto-generated template. Please review and modify as appropriate.]`;
  }

  /**
   * Generate medical necessity template
   */
  private static generateMedicalNecessityTemplate(
    diagnosisCodes: string[],
    requestedService: string
  ): string {
    const isDiabetes = diagnosisCodes.some(code => code.startsWith('E11'));
    const isObesity = diagnosisCodes.some(code => code.startsWith('E66'));
    
    if (isDiabetes && requestedService.toLowerCase().includes('ozempic')) {
      return `Medical necessity for ${requestedService}:

1. Diagnosed with Type 2 Diabetes Mellitus (${diagnosisCodes.find(c => c.startsWith('E11'))})
2. Inadequate glycemic control with current medications
3. GLP-1 agonist therapy indicated for improved glucose management
4. Patient meets criteria for medication approval per clinical guidelines

[Please verify and expand based on individual patient circumstances]`;
    }

    if (isObesity && requestedService.toLowerCase().includes('weight loss')) {
      return `Medical necessity for ${requestedService}:

1. Diagnosed with Obesity (${diagnosisCodes.find(c => c.startsWith('E66'))})
2. BMI >30 (or >27 with comorbidities)
3. Failed conservative weight management approaches
4. Medication therapy indicated for weight management per clinical guidelines

[Please verify BMI and document previous weight loss attempts]`;
    }

    return `Medical necessity for ${requestedService}:

1. Clinical indication: ${diagnosisCodes.join(', ')}
2. [Provide clinical justification for treatment]
3. [Document medical necessity criteria]
4. [Include relevant clinical guidelines or protocols]

[This is an auto-generated template. Please customize for specific case.]`;
  }

  /**
   * Generate recommendations based on risk factors
   */
  private static generateRecommendations(
    riskFactors: string[],
    payerData: PayerData,
    isHighRiskMedication: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (riskFactors.length > 0) {
      recommendations.push('Consider gathering additional documentation before submission');
    }

    if (isHighRiskMedication) {
      recommendations.push('Include peer-reviewed literature supporting treatment choice');
      recommendations.push('Document failure of formulary alternatives if applicable');
    }

    if (payerData.requiresDoseSpot) {
      recommendations.push('This payer requires DoseSpot submission - questions may need to be answered');
    }

    if (payerData.typicalProcessingDays > 5) {
      recommendations.push(`This payer typically takes ${payerData.typicalProcessingDays} days to process - plan accordingly`);
    }

    recommendations.push('Review all auto-generated content before submission');

    return recommendations;
  }

  /**
   * Categorize medication for processing logic
   */
  private static categorizeMedication(requestedService: string): string {
    const service = requestedService.toLowerCase();
    
    if (service.includes('ozempic') || service.includes('semaglutide')) return 'glp1_diabetes';
    if (service.includes('wegovy') || service.includes('weight loss')) return 'glp1_obesity';
    if (service.includes('mounjaro') || service.includes('tirzepatide')) return 'gip_glp1';
    if (service.includes('specialty') || service.includes('biologic')) return 'specialty';
    
    return 'standard';
  }

  /**
   * Check if provider specialty is relevant to medication category
   */
  private static isSpecialtyRelevant(specialty: string, medicationCategory: string): boolean {
    const specialtyLower = specialty.toLowerCase();
    
    switch (medicationCategory) {
      case 'glp1_diabetes':
      case 'gip_glp1':
        return specialtyLower.includes('endocrin') || 
               specialtyLower.includes('diabetes') || 
               specialtyLower.includes('internal medicine') ||
               specialtyLower.includes('family medicine');
      
      case 'glp1_obesity':
        return specialtyLower.includes('endocrin') || 
               specialtyLower.includes('obesity') || 
               specialtyLower.includes('bariatric') ||
               specialtyLower.includes('internal medicine') ||
               specialtyLower.includes('family medicine');
      
      case 'specialty':
        return true; // Specialty meds can be prescribed by various specialists
      
      default:
        return true; // Standard medications can be prescribed by most providers
    }
  }

  /**
   * Estimate question count for DoseSpot based on medication category
   */
  private static estimateQuestionCount(medicationCategory: string): number {
    switch (medicationCategory) {
      case 'glp1_diabetes':
      case 'gip_glp1':
        return 8; // Diabetes-related questions
      
      case 'glp1_obesity':
        return 6; // Weight loss questions
      
      case 'specialty':
        return 12; // More complex specialty questions
      
      default:
        return 4; // Standard medication questions
    }
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine if a prior auth case can be automatically submitted
 */
export function canAutoSubmitPriorAuth(
  analysisResult: AutomationResult,
  dosespotRequirements: DosespotRequirements
): boolean {
  return analysisResult.canAutoSubmit && 
         !dosespotRequirements.requiresQuestionnaire &&
         analysisResult.estimatedApprovalChance >= 70;
}

/**
 * Get submission strategy based on automation analysis
 */
export function getSubmissionStrategy(
  analysisResult: AutomationResult,
  dosespotRequirements: DosespotRequirements
): 'auto' | 'manual' | 'guided' {
  if (canAutoSubmitPriorAuth(analysisResult, dosespotRequirements)) {
    return 'auto';
  }
  
  if (dosespotRequirements.requiresQuestionnaire || analysisResult.requiresManualInput.length > 3) {
    return 'manual';
  }
  
  return 'guided';
}

/**
 * Generate submission summary for UI display
 */
export function generateSubmissionSummary(
  analysisResult: AutomationResult,
  dosespotRequirements: DosespotRequirements
): string {
  const strategy = getSubmissionStrategy(analysisResult, dosespotRequirements);
  
  switch (strategy) {
    case 'auto':
      return `Ready for automatic submission (${analysisResult.estimatedApprovalChance}% approval confidence)`;
    
    case 'guided':
      return `Ready for guided submission - ${analysisResult.requiresManualInput.length} field(s) need review`;
    
    case 'manual':
      if (dosespotRequirements.requiresQuestionnaire) {
        return `Manual submission required - DoseSpot questions needed (~${dosespotRequirements.estimatedQuestions} questions)`;
      }
      return `Manual submission required - ${analysisResult.requiresManualInput.length} field(s) need completion`;
    
    default:
      return 'Review required before submission';
  }
}