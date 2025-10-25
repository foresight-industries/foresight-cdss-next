import type { Context } from 'aws-lambda';
import { db } from '@foresight-cdss-next/db';
import { medicalSpecialties, workflowSpecialtyClassifications } from '@foresight-cdss-next/db/schema';
import { eq } from 'drizzle-orm';

interface ClassifySpecialtyEvent {
  priorAuthId: string;
  diagnosisCodes?: string[];
  procedureCodes?: string[];
  clinicalRationale?: string;
  procedureDescription?: string;
  organizationId: string;
  payerId?: string;
}

interface SpecialtyClassificationResult extends ClassifySpecialtyEvent {
  specialty: string;
  confidence: number;
  classificationMethod: string;
  specialtyConfig: any;
  workflowConfig: any;
}

const SPECIALTY_KEYWORDS = {
  WEIGHT_LOSS: [
    'weight loss', 'bariatric', 'obesity', 'BMI', 'gastric bypass', 'sleeve gastrectomy',
    'weight management', 'morbid obesity', 'diet program', 'weight reduction'
  ],
  CARDIOLOGY: [
    'cardiac', 'heart', 'coronary', 'artery', 'angiogram', 'echocardiogram', 'EKG', 'ECG',
    'stent', 'bypass', 'catheterization', 'pacemaker', 'defibrillator', 'valve'
  ],
  ONCOLOGY: [
    'cancer', 'tumor', 'oncology', 'chemotherapy', 'radiation', 'malignant', 'carcinoma',
    'lymphoma', 'leukemia', 'metastasis', 'biopsy', 'oncologist'
  ],
  GASTROENTEROLOGY: [
    'gastro', 'endoscopy', 'colonoscopy', 'digestive', 'bowel', 'stomach', 'intestinal',
    'liver', 'hepatic', 'pancreatic', 'gallbladder', 'bile'
  ],
  ENDOCRINOLOGY: [
    'diabetes', 'thyroid', 'hormone', 'endocrine', 'insulin', 'glucose', 'metabolic',
    'adrenal', 'pituitary', 'testosterone', 'estrogen'
  ],
  DERMATOLOGY: [
    'skin', 'dermatology', 'dermatitis', 'psoriasis', 'eczema', 'melanoma', 'acne',
    'rash', 'lesion', 'mole', 'dermatologist'
  ],
  ORTHOPEDICS: [
    'orthopedic', 'bone', 'joint', 'fracture', 'spine', 'knee', 'hip', 'shoulder',
    'arthritis', 'ligament', 'tendon', 'cartilage'
  ],
  NEUROLOGY: [
    'neurological', 'brain', 'nerve', 'seizure', 'epilepsy', 'migraine', 'stroke',
    'neurologist', 'spinal cord', 'multiple sclerosis'
  ],
  PSYCHIATRY: [
    'mental health', 'psychiatric', 'depression', 'anxiety', 'bipolar', 'schizophrenia',
    'therapy', 'psychiatrist', 'psychological', 'behavioral'
  ],
  RHEUMATOLOGY: [
    'rheumatology', 'arthritis', 'lupus', 'rheumatoid', 'autoimmune', 'inflammatory',
    'joint pain', 'rheumatologist', 'connective tissue'
  ]
};

const ICD_10_SPECIALTY_MAPPING = {
  // Weight Loss / Obesity
  'E66': 'WEIGHT_LOSS', // Overweight and obesity
  'Z68': 'WEIGHT_LOSS', // Body mass index

  // Cardiology
  'I20': 'CARDIOLOGY', // Angina pectoris
  'I21': 'CARDIOLOGY', // Acute myocardial infarction
  'I25': 'CARDIOLOGY', // Chronic ischemic heart disease
  'I50': 'CARDIOLOGY', // Heart failure

  // Oncology
  'C': 'ONCOLOGY', // Malignant neoplasms (all C codes)
  'D': 'ONCOLOGY', // Neoplasms of uncertain behavior

  // Endocrinology
  'E10': 'ENDOCRINOLOGY', // Type 1 diabetes
  'E11': 'ENDOCRINOLOGY', // Type 2 diabetes
  'E03': 'ENDOCRINOLOGY', // Hypothyroidism
  'E05': 'ENDOCRINOLOGY', // Thyrotoxicosis

  // Gastroenterology
  'K': 'GASTROENTEROLOGY', // Diseases of digestive system

  // Dermatology
  'L': 'DERMATOLOGY', // Diseases of skin and subcutaneous tissue

  // Orthopedics
  'M': 'ORTHOPEDICS', // Diseases of musculoskeletal system
  'S7': 'ORTHOPEDICS', // Injuries to knee and lower leg
  'S8': 'ORTHOPEDICS', // Injuries to ankle and foot

  // Neurology
  'G': 'NEUROLOGY', // Diseases of nervous system
  'F': 'PSYCHIATRY', // Mental and behavioral disorders

  // Rheumatology
  'M05': 'RHEUMATOLOGY', // Rheumatoid arthritis
  'M32': 'RHEUMATOLOGY', // Systemic lupus erythematosus
};

const CPT_SPECIALTY_MAPPING = {
  // Weight Loss Surgery
  '43644': 'WEIGHT_LOSS', // Laparoscopic gastric bypass
  '43775': 'WEIGHT_LOSS', // Laparoscopic sleeve gastrectomy
  '43659': 'WEIGHT_LOSS', // Unlisted laparoscopic procedure, stomach

  // Cardiology
  '93000': 'CARDIOLOGY', // Electrocardiogram
  '93307': 'CARDIOLOGY', // Echocardiography
  '93458': 'CARDIOLOGY', // Catheter placement in coronary artery

  // Oncology
  '96365': 'ONCOLOGY', // Intravenous infusion for therapy
  '77301': 'ONCOLOGY', // Radiation therapy dosimetry
  '38220': 'ONCOLOGY', // Bone marrow aspiration

  // Gastroenterology
  '43235': 'GASTROENTEROLOGY', // Esophagogastroduodenoscopy
  '45378': 'GASTROENTEROLOGY', // Colonoscopy
  '43239': 'GASTROENTEROLOGY', // Upper endoscopy with biopsy

  // Orthopedics
  '27447': 'ORTHOPEDICS', // Total knee arthroplasty
  '27130': 'ORTHOPEDICS', // Total hip arthroplasty
  '63030': 'ORTHOPEDICS', // Lumbar laminectomy
};

export const handler = async (
  event: ClassifySpecialtyEvent,
  context: Context
): Promise<SpecialtyClassificationResult> => {
  console.log('Classifying specialty for prior auth:', event.priorAuthId);

  try {
    // First, try classification by diagnosis and procedure codes
    const codeBasedClassification = await classifyByMedicalCodes(
      event.diagnosisCodes || [],
      event.procedureCodes || []
    );

    // If code-based classification has high confidence, use it
    if (codeBasedClassification.confidence >= 0.8) {
      const result = await buildSpecialtyResult(event, codeBasedClassification);
      await saveClassification(event.priorAuthId, codeBasedClassification);
      return result;
    }

    // Otherwise, try text-based classification
    const textToAnalyze = [
      event.clinicalRationale,
      event.procedureDescription
    ].filter(Boolean).join(' ');

    const textBasedClassification = await classifyByText(textToAnalyze);

    // Combine scores if both methods found something
    let finalClassification = textBasedClassification;
    if (codeBasedClassification.specialty && textBasedClassification.specialty) {
      if (codeBasedClassification.specialty === textBasedClassification.specialty) {
        // Both methods agree - boost confidence
        finalClassification = {
          ...textBasedClassification,
          confidence: Math.min(0.95, textBasedClassification.confidence + 0.2),
          classificationMethod: 'COMBINED_CODE_AND_TEXT'
        };
      } else {
        // Methods disagree - use higher confidence or default to code-based
        finalClassification = codeBasedClassification.confidence > textBasedClassification.confidence
          ? codeBasedClassification
          : textBasedClassification;
      }
    } else if (codeBasedClassification.specialty) {
      finalClassification = codeBasedClassification;
    }

    const result = await buildSpecialtyResult(event, finalClassification);
    await saveClassification(event.priorAuthId, finalClassification);
    return result;

  } catch (error) {
    console.error('Error classifying specialty:', error);

    // Fallback to general medicine
    const fallbackClassification = {
      specialty: 'INTERNAL_MEDICINE',
      confidence: 0.1,
      classificationMethod: 'FALLBACK'
    };

    const result = await buildSpecialtyResult(event, fallbackClassification);
    await saveClassification(event.priorAuthId, fallbackClassification);
    return result;
  }
};

async function classifyByMedicalCodes(
  diagnosisCodes: string[],
  procedureCodes: string[]
): Promise<{ specialty: string; confidence: number; classificationMethod: string }> {

  const specialtyVotes: Record<string, number> = {};

  // Check diagnosis codes
  for (const code of diagnosisCodes) {
    for (const [prefix, specialty] of Object.entries(ICD_10_SPECIALTY_MAPPING)) {
      if (code.startsWith(prefix)) {
        specialtyVotes[specialty] = (specialtyVotes[specialty] || 0) + 1;
      }
    }
  }

  // Check procedure codes
  for (const code of procedureCodes) {
    const specialty = CPT_SPECIALTY_MAPPING[code];
    if (specialty) {
      specialtyVotes[specialty] = (specialtyVotes[specialty] || 0) + 2; // Weight procedure codes higher
    }
  }

  if (Object.keys(specialtyVotes).length === 0) {
    return { specialty: '', confidence: 0, classificationMethod: 'CODE_BASED' };
  }

  // Find the specialty with the most votes
  const topSpecialty = Object.entries(specialtyVotes)
    .sort(([,a], [,b]) => b - a)[0];

  const totalCodes = diagnosisCodes.length + procedureCodes.length;
  const confidence = Math.min(0.9, topSpecialty[1] / totalCodes);

  return {
    specialty: topSpecialty[0],
    confidence,
    classificationMethod: 'CODE_BASED'
  };
}

async function classifyByText(text: string): Promise<{ specialty: string; confidence: number; classificationMethod: string }> {
  if (!text || text.trim().length === 0) {
    return { specialty: '', confidence: 0, classificationMethod: 'TEXT_BASED' };
  }

  const lowerText = text.toLowerCase();
  const specialtyScores: Record<string, number> = {};

  // Score each specialty based on keyword matches
  for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      specialtyScores[specialty] = score;
    }
  }

  if (Object.keys(specialtyScores).length === 0) {
    return { specialty: 'INTERNAL_MEDICINE', confidence: 0.3, classificationMethod: 'TEXT_BASED_FALLBACK' };
  }

  // Find the specialty with the highest score
  const topSpecialty = Object.entries(specialtyScores)
    .sort(([,a], [,b]) => b - a)[0];

  // Calculate confidence based on score and text length
  const maxPossibleScore = Math.max(...Object.values(specialtyScores));
  const confidence = Math.min(0.85, topSpecialty[1] / (maxPossibleScore + 1));

  return {
    specialty: topSpecialty[0],
    confidence,
    classificationMethod: 'TEXT_BASED'
  };
}

async function buildSpecialtyResult(
  event: ClassifySpecialtyEvent,
  classification: { specialty: string; confidence: number; classificationMethod: string }
): Promise<SpecialtyClassificationResult> {

  // Load specialty configuration
  const specialtyConfig = await db
    .select()
    .from(medicalSpecialties)
    .where(eq(medicalSpecialties.code, classification.specialty))
    .limit(1)
    .then(results => results[0] || null);

  // Load organization/payer specific overrides if available
  const workflowConfig = await loadWorkflowConfig(
    classification.specialty,
    event.organizationId,
    event.payerId
  );

  return {
    ...event,
    specialty: classification.specialty,
    confidence: classification.confidence,
    classificationMethod: classification.classificationMethod,
    specialtyConfig: specialtyConfig || getDefaultSpecialtyConfig(classification.specialty),
    workflowConfig
  };
}

async function loadWorkflowConfig(specialty: string, organizationId: string, payerId?: string) {
  // This will be implemented when we add the workflow configuration service
  // For now, return basic config
  return {
    timeoutMinutes: 30,
    requiresManualReview: false,
    autoApprovalThresholds: {}
  };
}

function getDefaultSpecialtyConfig(specialty: string) {
  const defaultConfigs = {
    WEIGHT_LOSS: {
      necessityCriteria: {
        'BMI_REQUIREMENT': ['BMI >= 40', 'BMI >= 35 with comorbidities'],
        'FAILED_ATTEMPTS': ['6 months supervised diet', 'Exercise program'],
        'PSYCHOLOGICAL_EVAL': ['Mental health clearance', 'Eating disorder screening']
      },
      requiredDocuments: ['medical_history', 'bmi_documentation', 'diet_history'],
      timeoutMinutes: 45,
      requiresManualReview: true
    },
    CARDIOLOGY: {
      necessityCriteria: {
        'DIAGNOSTIC_TESTING': ['EKG', 'Echocardiogram', 'Stress test'],
        'SYMPTOM_SEVERITY': ['Chest pain', 'Shortness of breath', 'Exercise intolerance']
      },
      requiredDocuments: ['cardiac_testing', 'symptoms_documentation'],
      timeoutMinutes: 30,
      requiresManualReview: false
    }
  };

  return defaultConfigs[specialty] || {
    necessityCriteria: {},
    requiredDocuments: ['medical_record'],
    timeoutMinutes: 30,
    requiresManualReview: true
  };
}

async function saveClassification(
  priorAuthId: string,
  classification: { specialty: string; confidence: number; classificationMethod: string }
) {
  try {
    await db.insert(workflowSpecialtyClassifications).values({
      priorAuthId,
      classifiedSpecialty: classification.specialty as any,
      confidence: classification.confidence.toString(),
      classificationMethod: classification.classificationMethod,
      diagnosisCodes: [],
      procedureCodes: [],
      keywordMatches: [],
      manualOverride: false
    });
  } catch (error) {
    console.error('Error saving classification:', error);
    // Don't throw - classification saving is not critical for workflow continuation
  }
}
