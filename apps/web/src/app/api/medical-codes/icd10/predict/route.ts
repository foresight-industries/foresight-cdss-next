import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getMedicalCodeCache } from '@/lib/services/medical-code-cache.service';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Input validation schema
const PredictionRequestSchema = z.object({
  requestId: z.string().optional(),
  data: z.object({
    // Patient demographics
    patientAge: z.number().optional(),
    patientSex: z.enum(['M', 'F', 'O']).optional(),

    // Clinical information
    chiefComplaint: z.string().optional(),
    presentingSymptoms: z.array(z.string()).optional(),
    clinicalHistory: z.string().optional(),
    physicalExamFindings: z.string().optional(),
    vitalSigns: z.object({
      temperature: z.string().optional(),
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      respiratoryRate: z.string().optional(),
      oxygenSaturation: z.string().optional(),
    }).optional(),

    // Diagnostic information
    labResults: z.array(z.object({
      testName: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      referenceRange: z.string().optional(),
    })).optional(),
    imagingResults: z.array(z.object({
      studyType: z.string(),
      findings: z.string(),
    })).optional(),

    // Treatment context
    treatmentSetting: z.enum(['inpatient', 'outpatient', 'emergency', 'urgent_care']).optional(),
    departmentSpecialty: z.string().optional(),

    // Prior authorization specific
    requestedProcedure: z.string().optional(),
    requestedMedication: z.string().optional(),
    medicalNecessityJustification: z.string().optional(),

    // Additional context
    relevantMedicalHistory: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
  }),
});

// Response validation schema
const ICD10PredictionSchema = z.object({
  code: z.string(),
  description: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
  additionalCodes: z.array(z.object({
    code: z.string(),
    description: z.string(),
    relationship: z.string(),
  })).optional(),
});

type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
type ICD10Prediction = z.infer<typeof ICD10PredictionSchema>;

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const validatedRequest = PredictionRequestSchema.parse(body);

    const cacheService = getMedicalCodeCache();

    // Create cache key based on the request data
    const cacheKey = `icd10:prediction:${JSON.stringify(validatedRequest.data).replace(/\s+/g, '').substring(0, 100)}`;

    // Check cache first
    const cachedResult = await cacheService.getPredictionFromCache<{
      prediction: ICD10Prediction;
      confidence: number;
      dbValidation: any;
    }>(cacheKey);

    if (cachedResult) {
      return Response.json(cachedResult);
    }

    // Prepare clinical context for AI
    const clinicalContext = buildClinicalContext(validatedRequest.data);

    // Generate ICD-10 prediction using OpenAI
    const prediction = await generateICD10Prediction(clinicalContext);

    // Validate against database and calculate confidence
    const dbValidation = await validateAgainstDatabase(prediction.code, cacheService);
    const finalConfidence = calculateFinalConfidence(prediction.confidence, dbValidation);

    const result = {
      prediction: {
        ...prediction,
        confidence: finalConfidence,
      },
      confidence: finalConfidence,
      dbValidation,
      requestId: validatedRequest.requestId,
      timestamp: new Date().toISOString(),
    };

    // Cache the result
    await cacheService.setPredictionCache(cacheKey, result, 3600); // 1 hour TTL

    return Response.json(result);

  } catch (error) {
    console.error('ICD-10 prediction error:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to generate ICD-10 prediction' },
      { status: 500 }
    );
  }
}

function buildClinicalContext(data: PredictionRequest['data']): string {
  const context = [];

  if (data.patientAge) {
    context.push(`Patient Age: ${data.patientAge} years`);
  }

  if (data.patientSex) {
    context.push(`Patient Sex: ${data.patientSex}`);
  }

  if (data.chiefComplaint) {
    context.push(`Chief Complaint: ${data.chiefComplaint}`);
  }

  if (data.presentingSymptoms?.length) {
    context.push(`Presenting Symptoms: ${data.presentingSymptoms.join(', ')}`);
  }

  if (data.clinicalHistory) {
    context.push(`Clinical History: ${data.clinicalHistory}`);
  }

  if (data.physicalExamFindings) {
    context.push(`Physical Exam Findings: ${data.physicalExamFindings}`);
  }

  if (data.vitalSigns) {
    const vitals = Object.entries(data.vitalSigns)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    if (vitals) {
      context.push(`Vital Signs: ${vitals}`);
    }
  }

  if (data.labResults?.length) {
    const labs = data.labResults
      .map(lab => `${lab.testName}: ${lab.value}${lab.unit ? ` ${lab.unit}` : ''}`)
      .join(', ');
    context.push(`Lab Results: ${labs}`);
  }

  if (data.imagingResults?.length) {
    const imaging = data.imagingResults
      .map(img => `${img.studyType}: ${img.findings}`)
      .join(', ');
    context.push(`Imaging Results: ${imaging}`);
  }

  if (data.treatmentSetting) {
    context.push(`Treatment Setting: ${data.treatmentSetting}`);
  }

  if (data.departmentSpecialty) {
    context.push(`Department/Specialty: ${data.departmentSpecialty}`);
  }

  if (data.requestedProcedure) {
    context.push(`Requested Procedure: ${data.requestedProcedure}`);
  }

  if (data.requestedMedication) {
    context.push(`Requested Medication: ${data.requestedMedication}`);
  }

  if (data.medicalNecessityJustification) {
    context.push(`Medical Necessity: ${data.medicalNecessityJustification}`);
  }

  if (data.relevantMedicalHistory?.length) {
    context.push(`Medical History: ${data.relevantMedicalHistory.join(', ')}`);
  }

  if (data.currentMedications?.length) {
    context.push(`Current Medications: ${data.currentMedications.join(', ')}`);
  }

  if (data.allergies?.length) {
    context.push(`Allergies: ${data.allergies.join(', ')}`);
  }

  return context.join('\n');
}

async function generateICD10Prediction(clinicalContext: string): Promise<ICD10Prediction> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
You are a medical coding specialist expert in ICD-10-CM codes. Based on the clinical information provided, determine the most appropriate primary ICD-10 diagnosis code.

Clinical Information:
${clinicalContext}

Your task:
1. Analyze the clinical information thoroughly
2. Identify the primary diagnosis that best represents the patient's condition
3. Select the most specific and accurate ICD-10-CM code
4. Provide clear reasoning for your selection
5. Assign a confidence score (0.0 to 1.0) based on the specificity and clarity of the clinical information

Important guidelines:
- Use the most specific code possible (avoid unspecified codes unless necessary)
- Consider the primary reason for the encounter
- Ensure the code is billable and not just a category header
- If multiple conditions are present, focus on the primary/principal diagnosis
- Use current ICD-10-CM guidelines and conventions

Respond with a single, most appropriate ICD-10 code.
`;

  const result = await generateObject({
    model: openai('gpt-5-pro'),
    schema: ICD10PredictionSchema,
    prompt,
  });

  return result.object;
}

async function validateAgainstDatabase(
  predictedCode: string,
  cacheService: ReturnType<typeof getMedicalCodeCache>
) {
  try {
    // Look up the predicted code in our database
    const codeData = await cacheService.getIcd10Code(predictedCode);

    if (!codeData) {
      return {
        isValid: false,
        reason: 'Code not found in database',
        suggestions: await findSimilarCodes(predictedCode, cacheService),
      };
    }

    if (!codeData.isActive) {
      return {
        isValid: false,
        reason: 'Code is inactive',
        codeData,
      };
    }

    if (!codeData.isBillable) {
      return {
        isValid: false,
        reason: 'Code is not billable (category header)',
        codeData,
        suggestions: await findBillableAlternatives(predictedCode, cacheService),
      };
    }

    return {
      isValid: true,
      codeData,
      category: codeData.category,
      description: codeData.description,
    };

  } catch (error) {
    console.error('Database validation error:', error);
    return {
      isValid: false,
      reason: 'Database validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function findSimilarCodes(
  code: string,
  cacheService: ReturnType<typeof getMedicalCodeCache>
): Promise<Array<{ code: string; description: string }>> {
  try {
    const suggestions: Array<{ code: string; description: string }> = [];

    // Get the ICD-10 code prefix patterns
    const threeDigitPrefix = code.substring(0, 3); // Category (e.g., "J44")
    const fourDigitPrefix = code.substring(0, 4); // Subcategory (e.g., "J44.")
    // const fiveDigitPrefix = code.substring(0, 5); // More specific (e.g., "J44.0")

    // Strategy 1: Find codes with same 3-digit prefix (same category)
    if (threeDigitPrefix.length >= 3) {
      const categoryPattern = `${threeDigitPrefix}%`;
      const categoryCodes = await searchCodesByPattern(categoryPattern, cacheService);
      suggestions.push(...categoryCodes.slice(0, 3)); // Limit to top 3
    }

    // Strategy 2: Find codes with similar 4-digit prefix (same subcategory)
    if (fourDigitPrefix.length >= 4) {
      const subcategoryPattern = `${fourDigitPrefix}%`;
      const subcategoryCodes = await searchCodesByPattern(subcategoryPattern, cacheService);
      suggestions.push(...subcategoryCodes.slice(0, 3));
    }

    // Strategy 3: Try variations of the last digit for more specific codes
    if (code.length >= 5) {
      const baseCode = code.substring(0, code.length - 1);
      for (let i = 0; i <= 9; i++) {
        const variantCode = `${baseCode}${i}`;
        if (variantCode !== code) {
          const variant = await cacheService.getIcd10Code(variantCode);
          if (variant && variant.isActive && variant.isBillable) {
            suggestions.push({
              code: variant.code,
              description: variant.description
            });
          }
        }
      }
    }

    // Strategy 4: Look for parent codes (less specific versions)
    const parentCandidates = [];
    if (code.length > 3) {
      // Try removing the last character progressively
      for (let len = code.length - 1; len >= 3; len--) {
        const parentCode = code.substring(0, len);
        parentCandidates.push(parentCode);
      }
    }

    for (const parentCode of parentCandidates) {
      const parent = await cacheService.getIcd10Code(parentCode);
      if (parent && parent.isActive && parent.isBillable) {
        suggestions.push({
          code: parent.code,
          description: parent.description
        });
      }
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((item, index, self) =>
        index === self.findIndex(t => t.code === item.code)
      )
      .slice(0, 8); // Limit to 8 suggestions

    return uniqueSuggestions;

  } catch (error) {
    console.error('Error finding similar codes:', error);
    return [];
  }
}

async function searchCodesByPattern(
  pattern: string,
  cacheService: ReturnType<typeof getMedicalCodeCache>
): Promise<Array<{ code: string; description: string }>> {
  try {
    // Since the cache service doesn't have a direct pattern search,
    // we'll try to find codes by category if it's a 3-digit pattern
    const prefix = pattern.replace('%', '');

    if (prefix.length >= 3) {
      // Try to get one code from this category to determine the category name
      const sampleCode = await cacheService.getIcd10Code(prefix);
      if (sampleCode?.category) {
        // Get codes from the same category
        const categoryCodes = await cacheService.getIcd10CodesByCategory(sampleCode.category);
        return categoryCodes
          .filter(code => code.code.startsWith(prefix) && code.isBillable)
          .map(code => ({
            code: code.code,
            description: code.description
          }))
          .slice(0, 5); // Limit results
      }
    }

    return [];
  } catch (error) {
    console.error('Error searching codes by pattern:', error);
    return [];
  }
}

async function findBillableAlternatives(
  code: string,
  cacheService: ReturnType<typeof getMedicalCodeCache>
): Promise<Array<{ code: string; description: string }>> {
  try {
    const alternatives: Array<{ code: string; description: string }> = [];

    // Get the original code data to understand its category
    const originalCode = await cacheService.getIcd10Code(code);
    if (!originalCode) {
      return await findSimilarCodes(code, cacheService);
    }

    // Strategy 1: Find billable codes in the same category
    if (originalCode.category) {
      const categoryCodes = await cacheService.getIcd10CodesByCategory(originalCode.category);
      const billableCodes = categoryCodes
        .filter(c => c.isBillable && c.isActive && c.code !== code)
        .slice(0, 5);

      alternatives.push(...billableCodes.map(c => ({
        code: c.code,
        description: c.description
      })));
    }

    // Strategy 2: Look for more specific versions of the code
    const basePrefix = code.length >= 4 ? code.substring(0, 4) : code.substring(0, 3);

    // Try adding common ICD-10 suffixes for more specificity
    const commonSuffixes = ['0', '1', '2', '9', 'A', 'D', 'S'];
    for (const suffix of commonSuffixes) {
      const specificCode = `${basePrefix}${suffix}`;
      if (specificCode !== code && specificCode.length <= 7) {
        const specific = await cacheService.getIcd10Code(specificCode);
        if (specific && specific.isActive && specific.isBillable) {
          alternatives.push({
            code: specific.code,
            description: specific.description
          });
        }
      }
    }

    // Strategy 3: Try adding a decimal point and common endings for ICD-10
    if (!code.includes('.') && code.length >= 3) {
      const withDecimal = `${code.substring(0, 3)}.${code.substring(3)}`;
      const decimalCode = await cacheService.getIcd10Code(withDecimal);
      if (decimalCode && decimalCode.isActive && decimalCode.isBillable) {
        alternatives.push({
          code: decimalCode.code,
          description: decimalCode.description
        });
      }

      // Try common decimal endings
      const decimalEndings = ['0', '1', '9'];
      for (const ending of decimalEndings) {
        const decimalVariant = `${code.substring(0, 3)}.${ending}`;
        const variant = await cacheService.getIcd10Code(decimalVariant);
        if (variant && variant.isActive && variant.isBillable && variant.code !== code) {
          alternatives.push({
            code: variant.code,
            description: variant.description
          });
        }
      }
    }

    // Remove duplicates and limit results
    return alternatives
      .filter((item, index, self) =>
        index === self.findIndex(t => t.code === item.code)
      )
      .slice(0, 8);

  } catch (error) {
    console.error('Error finding billable alternatives:', error);
    return [];
  }
}

function calculateFinalConfidence(aiConfidence: number, dbValidation: any): number {
  let finalConfidence = aiConfidence;

  // Adjust confidence based on database validation
  if (!dbValidation.isValid) {
    finalConfidence *= 0.3; // Significantly reduce confidence for invalid codes
  } else if (!dbValidation.codeData?.isBillable) {
    finalConfidence *= 0.6; // Reduce confidence for non-billable codes
  } else if (dbValidation.codeData?.requiresAdditionalDigit) {
    finalConfidence *= 0.8; // Slightly reduce for codes that might need more specificity
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, finalConfidence));
}
