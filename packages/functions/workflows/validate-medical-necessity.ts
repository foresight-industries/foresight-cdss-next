import {
  ComprehendMedicalClient,
  DetectEntitiesV2Command
} from '@aws-sdk/client-comprehendmedical';
import { BaseSpecialtyWorkflowService, PriorAuthData } from '../../db/src/services/specialties/base-specialty-workflow';
import { WeightLossWorkflowService } from '../../db/src/services/specialties/weight-loss-workflow';
import { InternalMedicineWorkflowService } from '../../db/src/services/specialties/internal-medicine-workflow';

interface MedicalNecessityCheck {
  criterion: string;
  meets_criterion: boolean;
  confidence: number;
  evidence: string[];
  reasoning: string;
}

interface TreatmentGuideline {
  guideline_source: string;
  guideline_text: string;
  relevance_score: number;
  supports_necessity: boolean;
}

interface MedicalNecessityResult {
  priorAuthId: string;
  overall_medical_necessity_score: number;
  meets_medical_necessity: boolean;
  necessity_checks: MedicalNecessityCheck[];
  treatment_guidelines: TreatmentGuideline[];
  risk_factors: {
    severity_indicators: string[];
    urgency_indicators: string[];
    contraindications: string[];
  };
  alternative_treatments: {
    tried_and_failed: string[];
    contraindicated: string[];
    insufficient: string[];
  };
  supporting_documentation: {
    clinical_notes_quality: number;
    diagnostic_evidence: string[];
    treatment_history: string[];
    physician_justification: string;
  };
  recommendations: string[];
  // Additional fields for workflow integration
  specialty_validation_result?: any;
  approval_probability?: number;
  required_documents?: string[];
  auto_approval_eligible?: boolean;
  workflow_recommendation?: string;
}

const comprehendMedical = new ComprehendMedicalClient({
  region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1'
});

// Medical necessity criteria for common procedures/treatments
const MEDICAL_NECESSITY_CRITERIA = {
  'DIAGNOSTIC_IMAGING': [
    'Clinical signs and symptoms support need for imaging',
    'Conservative treatment attempted without resolution',
    'Imaging results will change treatment plan',
    'Patient history indicates medical necessity'
  ],
  'SURGICAL_PROCEDURE': [
    'Conservative treatments have failed or are contraindicated',
    'Patient condition poses significant health risk without intervention',
    'Procedure is evidence-based for the documented condition',
    'Patient is appropriate candidate for the procedure'
  ],
  'SPECIALIST_CONSULTATION': [
    'Primary care management insufficient for condition complexity',
    'Specialist expertise required for diagnosis or treatment',
    'Condition requires specialized knowledge or procedures',
    'Referral follows established clinical guidelines'
  ],
  'MEDICATION_THERAPY': [
    'Medication is FDA-approved for documented indication',
    'First-line treatments tried or contraindicated',
    'Documented medical condition supports medication use',
    'Benefits outweigh risks for this patient'
  ],
  'PHYSICAL_THERAPY': [
    'Functional limitations documented and measurable',
    'Potential for improvement with therapy',
    'Therapy is evidence-based for condition',
    'Patient can participate in and benefit from therapy'
  ]
};

export const handler = async (event: any): Promise<MedicalNecessityResult> => {
  console.log('Validating medical necessity with specialty workflow:', JSON.stringify(event, null, 2));

  try {
    const {
      priorAuthId,
      document_text,
      extracted_codes = {},
      service_code,
      diagnosis_code,
      specialty = 'INTERNAL_MEDICINE',
      specialtyConfig = {},
      workflowConfig = {},
      organizationId,
      payerId,
      procedureCodes = [],
      diagnosisCodes = [],
      clinicalRationale = document_text,
      patientAge = 0,
      patientGender = '',
      urgency = 'ROUTINE',
      priorTreatments = [],
      supportingDocuments = []
    } = event;

    if (!document_text || document_text.trim().length < 20) {
      return createMinimalResult(priorAuthId, 'Insufficient documentation for medical necessity evaluation');
    }

    // Step 1: Create specialty-specific workflow service
    let workflowService: BaseSpecialtyWorkflowService;

    if (specialty === 'WEIGHT_LOSS') {
      workflowService = new WeightLossWorkflowService();
    } else if (specialty === 'INTERNAL_MEDICINE') {
      workflowService = new InternalMedicineWorkflowService();
    } else {
      // Use internal medicine as default for unknown specialties
      workflowService = new InternalMedicineWorkflowService();
    }

    // Step 2: Prepare prior auth data for specialty service
    const priorAuthData: PriorAuthData = {
      diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : (diagnosis_code ? [diagnosis_code] : []),
      procedureCodes: procedureCodes.length > 0 ? procedureCodes : (service_code ? [service_code] : []),
      clinicalRationale: clinicalRationale || document_text,
      patientAge: patientAge || 0,
      patientGender: patientGender || '',
      urgency: urgency as 'ROUTINE' | 'URGENT' | 'EMERGENT',
      priorTreatments: priorTreatments || [],
      supportingDocuments: supportingDocuments || [],
      organizationId: organizationId || '',
      payerId: payerId || '',
      // Additional fields for backward compatibility
      document_text,
      extracted_codes,
      service_code,
      diagnosis_code
    };

    // Step 3: Process with specialty-specific workflow
    console.log('Processing with specialty-specific workflow service...');
    const specialtyResult = await workflowService.processWorkflow(priorAuthData);

    // Step 4: Extract medical entities for additional analysis (maintaining existing functionality)
    console.log('Extracting medical entities for enhanced analysis...');
    const entitiesResponse = await comprehendMedical.send(new DetectEntitiesV2Command({
      Text: document_text
    }));

    const medicalEntities = entitiesResponse.Entities || [];

    // Step 5: Combine specialty-specific validation with existing medical necessity checks
    const procedureCategory = await determineProcedureCategory(service_code, document_text);
    const fallbackCriteria = MEDICAL_NECESSITY_CRITERIA[procedureCategory] || MEDICAL_NECESSITY_CRITERIA['SURGICAL_PROCEDURE'];

    // Get specialty-specific criteria from workflow config or fall back to generic
    const applicableCriteria = workflowConfig?.necessityCriteria ?
      Object.values(workflowConfig.necessityCriteria).flat() :
      fallbackCriteria;

    const necessityChecks: MedicalNecessityCheck[] = [];

    for (const criterion of applicableCriteria) {
      const check = await evaluateNecessityCriterion(
        criterion,
        document_text,
        medicalEntities,
        extracted_codes,
        diagnosis_code
      );
      necessityChecks.push(check);
    }

    // Step 6: Enhanced analysis using existing functions
    const alternativeTreatments = await analyzeAlternativeTreatments(
      document_text,
      medicalEntities,
      diagnosis_code
    );

    const supportingDocumentation = await assessDocumentationQuality(
      document_text,
      medicalEntities
    );

    const riskFactors = await identifyRiskFactors(document_text, medicalEntities);

    const treatmentGuidelines = await fetchTreatmentGuidelines(
      diagnosis_code,
      service_code,
      procedureCategory
    );

    // Step 7: Combine specialty workflow score with traditional scoring
    const traditionalScore = calculateMedicalNecessityScore(
      necessityChecks,
      alternativeTreatments,
      supportingDocumentation,
      riskFactors,
      treatmentGuidelines
    );

    // Weight the specialty-specific score more heavily
    const combinedScore = Math.round((specialtyResult.score * 0.7) + (traditionalScore * 0.3));

    // Step 8: Enhanced recommendations combining both approaches
    const baseRecommendations = generateRecommendations(
      necessityChecks,
      alternativeTreatments,
      supportingDocumentation,
      combinedScore
    );

    const enhancedRecommendations = [
      ...baseRecommendations,
      ...specialtyResult.reasons,
      `Specialty: ${specialty}`,
      `Recommended Action: ${specialtyResult.recommendedAction}`,
      ...(specialtyResult.missingRequirements.length > 0 ?
        [`Missing Requirements: ${specialtyResult.missingRequirements.join(', ')}`] : [])
    ];

    const result: MedicalNecessityResult = {
      priorAuthId,
      overall_medical_necessity_score: combinedScore,
      meets_medical_necessity: specialtyResult.isValid && combinedScore >= 70,
      necessity_checks: necessityChecks,
      treatment_guidelines: treatmentGuidelines,
      risk_factors: riskFactors,
      alternative_treatments: alternativeTreatments,
      supporting_documentation: supportingDocumentation,
      recommendations: enhancedRecommendations,
      // Additional fields for workflow integration
      specialty_validation_result: specialtyResult,
      approval_probability: await workflowService.calculateApprovalProbability(priorAuthData),
      required_documents: workflowService.getRequiredDocuments(priorAuthData),
      auto_approval_eligible: specialtyResult.autoApproval,
      workflow_recommendation: specialtyResult.recommendedAction
    };

    console.log('Enhanced medical necessity validation completed:', {
      priorAuthId,
      specialty,
      combinedScore,
      specialtyScore: specialtyResult.score,
      traditionalScore,
      meetsCriteria: result.meets_medical_necessity,
      recommendedAction: specialtyResult.recommendedAction,
      autoApprovalEligible: specialtyResult.autoApproval
    });

    return result;

  } catch (error) {
    console.error('Medical necessity validation error:', error);
    return createMinimalResult(
      event.priorAuthId,
      `Medical necessity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

async function determineProcedureCategory(serviceCode: string, documentText: string): Promise<string> {
  if (!serviceCode) {
    // Analyze document text for procedure type
    const text = documentText.toLowerCase();
    if (text.includes('imaging') || text.includes('mri') || text.includes('ct') || text.includes('x-ray')) {
      return 'DIAGNOSTIC_IMAGING';
    }
    if (text.includes('surgery') || text.includes('surgical') || text.includes('operation')) {
      return 'SURGICAL_PROCEDURE';
    }
    if (text.includes('consultation') || text.includes('specialist') || text.includes('referral')) {
      return 'SPECIALIST_CONSULTATION';
    }
    if (text.includes('therapy') || text.includes('rehabilitation')) {
      return 'PHYSICAL_THERAPY';
    }
    return 'SURGICAL_PROCEDURE'; // Default
  }

  // Categorize based on CPT code ranges
  const cptCode = parseInt(serviceCode);
  if (cptCode >= 70000 && cptCode <= 79999) return 'DIAGNOSTIC_IMAGING';
  if (cptCode >= 10000 && cptCode <= 69999) return 'SURGICAL_PROCEDURE';
  if (cptCode >= 99200 && cptCode <= 99499) return 'SPECIALIST_CONSULTATION';
  if (cptCode >= 97000 && cptCode <= 97799) return 'PHYSICAL_THERAPY';

  return 'SURGICAL_PROCEDURE';
}

async function evaluateNecessityCriterion(
  criterion: string,
  documentText: string,
  medicalEntities: any[],
  extractedCodes: any,
  diagnosisCode: string
): Promise<MedicalNecessityCheck> {
  const text = documentText.toLowerCase();
  let meetsCriterion = false;
  let confidence = 0;
  const evidence: string[] = [];
  let reasoning = '';

  switch (criterion) {
    case 'Clinical signs and symptoms support need for imaging':
    case 'Patient condition poses significant health risk without intervention':
      // Look for symptom and condition entities
      const symptoms = medicalEntities.filter(e =>
        e.Category === 'MEDICAL_CONDITION' &&
        (e.Type === 'DX_NAME' || e.Traits?.some((t: any) => t.Name === 'SYMPTOM'))
      );

      if (symptoms.length > 0) {
        meetsCriterion = true;
        confidence = Math.min(symptoms.length * 25, 95);
        evidence.push(...symptoms.map(s => s.Text));
        reasoning = 'Clinical symptoms and conditions documented support medical necessity';
      }
      break;

    case 'Conservative treatment attempted without resolution':
    case 'Conservative treatments have failed or are contraindicated':
    case 'First-line treatments tried or contraindicated':
      // Look for evidence of prior treatments
      const treatmentKeywords = ['previous', 'prior', 'failed', 'unsuccessful', 'tried', 'attempted', 'conservative', 'medication', 'therapy'];
      const foundTreatments = treatmentKeywords.filter(keyword => text.includes(keyword));

      if (foundTreatments.length >= 2) {
        meetsCriterion = true;
        confidence = Math.min(foundTreatments.length * 20, 90);
        evidence.push(`Prior treatments mentioned: ${foundTreatments.join(', ')}`);
        reasoning = 'Documentation indicates conservative treatments have been attempted';
      }
      break;

    case 'Medication is FDA-approved for documented indication':
    case 'Procedure is evidence-based for the documented condition':
      // Check if diagnosis code supports the procedure
      if (diagnosisCode && extractedCodes.icd10_codes?.length > 0) {
        meetsCriterion = true;
        confidence = 80;
        evidence.push(`Diagnosis code ${diagnosisCode} documented`);
        reasoning = 'Documented diagnosis supports medical necessity of requested treatment';
      }
      break;

    case 'Functional limitations documented and measurable':
      // Look for functional assessment language
      const functionalKeywords = ['difficulty', 'unable', 'limitation', 'impaired', 'restricted', 'pain', 'mobility'];
      const foundLimitations = functionalKeywords.filter(keyword => text.includes(keyword));

      if (foundLimitations.length >= 2) {
        meetsCriterion = true;
        confidence = Math.min(foundLimitations.length * 15, 85);
        evidence.push(`Functional limitations documented: ${foundLimitations.join(', ')}`);
        reasoning = 'Functional limitations are documented and support need for intervention';
      }
      break;

    default:
      // Generic evaluation based on medical entities and documentation quality
      if (medicalEntities.length > 3 && text.length > 100) {
        meetsCriterion = true;
        confidence = 60;
        evidence.push('Comprehensive medical documentation provided');
        reasoning = 'General medical necessity supported by documentation';
      }
  }

  return {
    criterion,
    meets_criterion: meetsCriterion,
    confidence,
    evidence,
    reasoning
  };
}

async function analyzeAlternativeTreatments(
  documentText: string,
  medicalEntities: any[],
  diagnosisCode: string
): Promise<{
  tried_and_failed: string[];
  contraindicated: string[];
  insufficient: string[];
}> {
  const text = documentText.toLowerCase();
  const triedAndFailed: string[] = [];
  const contraindicated: string[] = [];
  const insufficient: string[] = [];

  // Look for medications and treatments in entities
  const treatments = medicalEntities.filter(e =>
    e.Category === 'MEDICATION' ||
    e.Category === 'TREATMENT' ||
    e.Type === 'PROCEDURE_NAME'
  );

  // Analyze text for treatment outcomes
  for (const treatment of treatments) {
    const treatmentText = treatment.Text.toLowerCase();

    if (text.includes(`${treatmentText} failed`) ||
        text.includes(`unsuccessful ${treatmentText}`) ||
        text.includes(`ineffective ${treatmentText}`)) {
      triedAndFailed.push(treatment.Text);
    }

    if (text.includes(`contraindicated`) ||
        text.includes(`allergic to ${treatmentText}`) ||
        text.includes(`cannot tolerate ${treatmentText}`)) {
      contraindicated.push(treatment.Text);
    }

    if (text.includes(`insufficient`) || text.includes(`inadequate`)) {
      insufficient.push(treatment.Text);
    }
  }

  return {
    tried_and_failed: triedAndFailed,
    contraindicated: contraindicated,
    insufficient: insufficient
  };
}

async function assessDocumentationQuality(
  documentText: string,
  medicalEntities: any[]
): Promise<{
  clinical_notes_quality: number;
  diagnostic_evidence: string[];
  treatment_history: string[];
  physician_justification: string;
}> {
  let qualityScore = 0;
  const diagnosticEvidence: string[] = [];
  const treatmentHistory: string[] = [];
  let physicianJustification = '';

  // Assess clinical notes quality based on various factors
  const textLength = documentText.length;
  if (textLength > 500) qualityScore += 20;
  if (textLength > 1000) qualityScore += 10;

  const entityCount = medicalEntities.length;
  if (entityCount > 5) qualityScore += 20;
  if (entityCount > 10) qualityScore += 10;

  // Look for diagnostic evidence
  const diagnosticEntities = medicalEntities.filter(e =>
    e.Category === 'TEST_TREATMENT_PROCEDURE' ||
    e.Type === 'TEST_NAME'
  );
  diagnosticEvidence.push(...diagnosticEntities.map(e => e.Text));
  if (diagnosticEvidence.length > 0) qualityScore += 20;

  // Look for treatment history
  const treatmentEntities = medicalEntities.filter(e =>
    e.Category === 'TREATMENT' || e.Category === 'MEDICATION'
  );
  treatmentHistory.push(...treatmentEntities.map(e => e.Text));
  if (treatmentHistory.length > 0) qualityScore += 15;

  // Look for physician justification
  const text = documentText.toLowerCase();
  if (text.includes('medically necessary') ||
      text.includes('clinically indicated') ||
      text.includes('physician recommends')) {
    qualityScore += 15;
    physicianJustification = 'Physician medical necessity statement present';
  }

  return {
    clinical_notes_quality: Math.min(qualityScore, 100),
    diagnostic_evidence: diagnosticEvidence,
    treatment_history: treatmentHistory,
    physician_justification: physicianJustification
  };
}

async function identifyRiskFactors(
  documentText: string,
  medicalEntities: any[]
): Promise<{
  severity_indicators: string[];
  urgency_indicators: string[];
  contraindications: string[];
}> {
  const text = documentText.toLowerCase();
  const severityIndicators: string[] = [];
  const urgencyIndicators: string[] = [];
  const contraindications: string[] = [];

  // Look for severity indicators
  const severityKeywords = ['severe', 'acute', 'chronic', 'progressive', 'worsening', 'deteriorating'];
  severityKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      severityIndicators.push(keyword);
    }
  });

  // Look for urgency indicators
  const urgencyKeywords = ['urgent', 'immediate', 'emergency', 'critical', 'rapid', 'expedited'];
  urgencyKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      urgencyIndicators.push(keyword);
    }
  });

  // Look for contraindications
  if (text.includes('contraindicated') || text.includes('allergy') || text.includes('adverse reaction')) {
    contraindications.push('Treatment contraindications documented');
  }

  return {
    severity_indicators: severityIndicators,
    urgency_indicators: urgencyIndicators,
    contraindications: contraindications
  };
}

async function fetchTreatmentGuidelines(
  diagnosisCode: string,
  serviceCode: string,
  procedureCategory: string
): Promise<TreatmentGuideline[]> {
  // This would ideally fetch from a medical guidelines database
  // For now, return mock guidelines based on common scenarios
  const guidelines: TreatmentGuideline[] = [];

  if (diagnosisCode) {
    guidelines.push({
      guideline_source: 'American Medical Association',
      guideline_text: `Treatment guidelines support intervention for diagnosis ${diagnosisCode}`,
      relevance_score: 85,
      supports_necessity: true
    });
  }

  if (procedureCategory === 'DIAGNOSTIC_IMAGING') {
    guidelines.push({
      guideline_source: 'American College of Radiology',
      guideline_text: 'Imaging is appropriate when clinical symptoms support medical necessity',
      relevance_score: 90,
      supports_necessity: true
    });
  }

  return guidelines;
}

function calculateMedicalNecessityScore(
  necessityChecks: MedicalNecessityCheck[],
  alternativeTreatments: any,
  supportingDocumentation: any,
  riskFactors: any,
  treatmentGuidelines: TreatmentGuideline[]
): number {
  let totalScore = 0;
  let weightedSum = 0;

  // Criteria checks (40% of total score)
  const criteriaWeight = 0.4;
  const metCriteria = necessityChecks.filter(c => c.meets_criterion);
  const criteriaScore = metCriteria.length > 0 ?
    (metCriteria.reduce((sum, c) => sum + c.confidence, 0) / metCriteria.length) : 0;
  totalScore += criteriaScore * criteriaWeight;

  // Documentation quality (25% of total score)
  const docWeight = 0.25;
  totalScore += supportingDocumentation.clinical_notes_quality * docWeight;

  // Alternative treatments (20% of total score)
  const altWeight = 0.2;
  const altScore = (alternativeTreatments.tried_and_failed.length * 30) +
                   (alternativeTreatments.contraindicated.length * 25);
  totalScore += Math.min(altScore, 100) * altWeight;

  // Risk factors and urgency (10% of total score)
  const riskWeight = 0.1;
  const riskScore = (riskFactors.severity_indicators.length * 20) +
                    (riskFactors.urgency_indicators.length * 30);
  totalScore += Math.min(riskScore, 100) * riskWeight;

  // Guidelines support (5% of total score)
  const guidelineWeight = 0.05;
  const supportiveGuidelines = treatmentGuidelines.filter(g => g.supports_necessity);
  const guidelineScore = supportiveGuidelines.length > 0 ? 90 : 0;
  totalScore += guidelineScore * guidelineWeight;

  return Math.round(Math.min(totalScore, 100));
}

function generateRecommendations(
  necessityChecks: MedicalNecessityCheck[],
  alternativeTreatments: any,
  supportingDocumentation: any,
  overallScore: number
): string[] {
  const recommendations: string[] = [];

  if (overallScore >= 70) {
    recommendations.push('Medical necessity is well-supported by documentation');
  } else {
    recommendations.push('Medical necessity documentation needs strengthening');
  }

  const failedChecks = necessityChecks.filter(c => !c.meets_criterion);
  if (failedChecks.length > 0) {
    recommendations.push(`Address the following criteria: ${failedChecks.map(c => c.criterion).join(', ')}`);
  }

  if (supportingDocumentation.clinical_notes_quality < 60) {
    recommendations.push('Enhance clinical documentation with more detailed notes and evidence');
  }

  if (alternativeTreatments.tried_and_failed.length === 0) {
    recommendations.push('Document any prior treatments attempted and their outcomes');
  }

  if (!supportingDocumentation.physician_justification) {
    recommendations.push('Include explicit physician statement regarding medical necessity');
  }

  return recommendations;
}

function createMinimalResult(priorAuthId: string, error: string): MedicalNecessityResult {
  return {
    priorAuthId,
    overall_medical_necessity_score: 0,
    meets_medical_necessity: false,
    necessity_checks: [],
    treatment_guidelines: [],
    risk_factors: {
      severity_indicators: [],
      urgency_indicators: [],
      contraindications: []
    },
    alternative_treatments: {
      tried_and_failed: [],
      contraindicated: [],
      insufficient: []
    },
    supporting_documentation: {
      clinical_notes_quality: 0,
      diagnostic_evidence: [],
      treatment_history: [],
      physician_justification: ''
    },
    recommendations: [error]
  };
}
