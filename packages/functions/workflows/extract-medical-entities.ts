import { 
  ComprehendMedicalClient, 
  DetectEntitiesV2Command,
  InferICD10CMCommand,
  InferRxNormCommand,
  InferSNOMEDCTCommand
} from '@aws-sdk/client-comprehendmedical';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

interface MedicalEntity {
  id: number;
  text: string;
  category: string;
  type: string;
  score: number;
  begin_offset: number;
  end_offset: number;
  attributes: Array<{
    type: string;
    score: number;
    relationship_score: number;
    id: number;
    begin_offset: number;
    end_offset: number;
    text: string;
  }>;
  traits: Array<{
    name: string;
    score: number;
  }>;
}

interface ICD10Inference {
  icd10cm_concepts: Array<{
    description: string;
    code: string;
    score: number;
  }>;
}

interface RxNormInference {
  rx_norm_concepts: Array<{
    description: string;
    code: string;
    score: number;
  }>;
}

interface ValidationIssue {
  field: string;
  issue: string;
  confidence: number;
  auto_correctable: boolean;
  suggested_fix?: string;
}

interface ExtractedMedicalData {
  priorAuthId: string;
  document_text: string;
  medical_entities: MedicalEntity[];
  extracted_codes: {
    icd10_codes: Array<{ code: string; description: string; confidence: number; }>;
    cpt_codes: Array<{ code: string; description: string; confidence: number; }>;
    rx_norm_codes: Array<{ code: string; description: string; confidence: number; }>;
    snomed_codes: Array<{ code: string; description: string; confidence: number; }>;
  };
  validation_issues: ValidationIssue[];
  validation_issues_count: number;
  medical_necessity_indicators: {
    symptoms_mentioned: boolean;
    diagnosis_supported: boolean;
    treatment_necessity_score: number;
    prior_treatments_mentioned: boolean;
  };
}

const comprehendMedical = new ComprehendMedicalClient({ 
  region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' 
});
const rdsClient = new RDSDataClient({ region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' });

export const handler = async (event: any): Promise<ExtractedMedicalData> => {
  console.log('Extracting medical entities from PA:', JSON.stringify(event, null, 2));

  try {
    const { priorAuthId, document_text } = event;
    
    if (!document_text || document_text.trim().length < 10) {
      return {
        priorAuthId,
        document_text: document_text || '',
        medical_entities: [],
        extracted_codes: {
          icd10_codes: [],
          cpt_codes: [],
          rx_norm_codes: [],
          snomed_codes: []
        },
        validation_issues: [{
          field: 'document_text',
          issue: 'Insufficient document text for medical entity extraction',
          confidence: 100,
          auto_correctable: false
        }],
        validation_issues_count: 1,
        medical_necessity_indicators: {
          symptoms_mentioned: false,
          diagnosis_supported: false,
          treatment_necessity_score: 0,
          prior_treatments_mentioned: false
        }
      };
    }

    const validationIssues: ValidationIssue[] = [];
    
    // Step 1: Extract medical entities using AWS Comprehend Medical
    console.log('Detecting medical entities...');
    const entitiesResponse = await comprehendMedical.send(new DetectEntitiesV2Command({
      Text: document_text
    }));

    const medicalEntities: MedicalEntity[] = (entitiesResponse.Entities || []).map((entity, index) => ({
      id: index,
      text: entity.Text || '',
      category: entity.Category || '',
      type: entity.Type || '',
      score: entity.Score || 0,
      begin_offset: entity.BeginOffset || 0,
      end_offset: entity.EndOffset || 0,
      attributes: (entity.Attributes || []).map((attr, attrIndex) => ({
        type: attr.Type || '',
        score: attr.Score || 0,
        relationship_score: attr.RelationshipScore || 0,
        id: attrIndex,
        begin_offset: attr.BeginOffset || 0,
        end_offset: attr.EndOffset || 0,
        text: attr.Text || ''
      })),
      traits: (entity.Traits || []).map(trait => ({
        name: trait.Name || '',
        score: trait.Score || 0
      }))
    }));

    console.log(`Extracted ${medicalEntities.length} medical entities`);

    // Step 2: Infer ICD-10-CM codes
    console.log('Inferring ICD-10-CM codes...');
    let icd10Codes: Array<{ code: string; description: string; confidence: number; }> = [];
    
    try {
      const icd10Response = await comprehendMedical.send(new InferICD10CMCommand({
        Text: document_text
      }));

      icd10Codes = (icd10Response.Entities || []).flatMap(entity => 
        (entity.ICD10CMConcepts || []).map(concept => ({
          code: concept.Code || '',
          description: concept.Description || '',
          confidence: (concept.Score || 0) * 100
        }))
      ).filter(code => code.confidence > 50); // Only keep high-confidence codes

    } catch (icd10Error) {
      console.warn('ICD-10-CM inference failed:', icd10Error);
      validationIssues.push({
        field: 'icd10_extraction',
        issue: 'Failed to extract ICD-10-CM codes automatically',
        confidence: 75,
        auto_correctable: false
      });
    }

    // Step 3: Infer RxNorm codes (medications)
    console.log('Inferring RxNorm codes...');
    let rxNormCodes: Array<{ code: string; description: string; confidence: number; }> = [];
    
    try {
      const rxNormResponse = await comprehendMedical.send(new InferRxNormCommand({
        Text: document_text
      }));

      rxNormCodes = (rxNormResponse.Entities || []).flatMap(entity =>
        (entity.RxNormConcepts || []).map(concept => ({
          code: concept.Code || '',
          description: concept.Description || '',
          confidence: (concept.Score || 0) * 100
        }))
      ).filter(code => code.confidence > 50);

    } catch (rxError) {
      console.warn('RxNorm inference failed:', rxError);
    }

    // Step 4: Infer SNOMED-CT codes
    console.log('Inferring SNOMED-CT codes...');
    let snomedCodes: Array<{ code: string; description: string; confidence: number; }> = [];
    
    try {
      const snomedResponse = await comprehendMedical.send(new InferSNOMEDCTCommand({
        Text: document_text
      }));

      snomedCodes = (snomedResponse.Entities || []).flatMap(entity =>
        (entity.SNOMEDCTConcepts || []).map(concept => ({
          code: concept.Code || '',
          description: concept.Description || '',
          confidence: (concept.Score || 0) * 100
        }))
      ).filter(code => code.confidence > 50);

    } catch (snomedError) {
      console.warn('SNOMED-CT inference failed:', snomedError);
    }

    // Step 5: Extract CPT codes from medical entities
    const cptCodes: Array<{ code: string; description: string; confidence: number; }> = [];
    
    // Look for procedure-related entities and common CPT code patterns
    const procedureEntities = medicalEntities.filter(entity => 
      entity.category === 'MEDICAL_CONDITION' || 
      entity.category === 'TREATMENT' ||
      entity.type === 'PROCEDURE_NAME'
    );

    // Check against common CPT codes in database
    if (procedureEntities.length > 0) {
      try {
        for (const entity of procedureEntities.slice(0, 5)) { // Limit to avoid too many queries
          const cptQuery = `
            SELECT code, description, MATCH(description) AGAINST(:searchTerm) as relevance_score
            FROM cpt_codes 
            WHERE MATCH(description) AGAINST(:searchTerm IN NATURAL LANGUAGE MODE)
            ORDER BY relevance_score DESC
            LIMIT 3
          `;

          const cptResult = await rdsClient.send(new ExecuteStatementCommand({
            resourceArn: process.env.DATABASE_CLUSTER_ARN,
            secretArn: process.env.DATABASE_SECRET_ARN,
            database: process.env.DATABASE_NAME,
            sql: cptQuery,
            parameters: [
              { name: 'searchTerm', value: { stringValue: entity.text } }
            ]
          }));

          if (cptResult.records) {
            for (const record of cptResult.records) {
              const code = record[0]?.stringValue || '';
              const description = record[1]?.stringValue || '';
              const relevanceScore = record[2]?.doubleValue || 0;
              
              if (relevanceScore > 0.5) { // Minimum relevance threshold
                cptCodes.push({
                  code,
                  description,
                  confidence: Math.min(relevanceScore * 100, 85) // Cap at 85% for inferred codes
                });
              }
            }
          }
        }
      } catch (cptError) {
        console.warn('CPT code inference failed:', cptError);
      }
    }

    // Step 6: Analyze medical necessity indicators
    const medicalNecessityIndicators = {
      symptoms_mentioned: false,
      diagnosis_supported: false,
      treatment_necessity_score: 0,
      prior_treatments_mentioned: false
    };

    // Check for symptoms
    const symptomEntities = medicalEntities.filter(entity => 
      entity.category === 'MEDICAL_CONDITION' && 
      (entity.type === 'DX_NAME' || entity.traits.some(trait => trait.name === 'SYMPTOM'))
    );
    medicalNecessityIndicators.symptoms_mentioned = symptomEntities.length > 0;

    // Check for diagnosis support
    const diagnosisEntities = medicalEntities.filter(entity => 
      entity.category === 'MEDICAL_CONDITION' && entity.type === 'DX_NAME'
    );
    medicalNecessityIndicators.diagnosis_supported = diagnosisEntities.length > 0 && icd10Codes.length > 0;

    // Calculate treatment necessity score based on various factors
    let necessityScore = 0;
    if (symptomEntities.length > 0) necessityScore += 25;
    if (diagnosisEntities.length > 0) necessityScore += 25;
    if (icd10Codes.length > 0) necessityScore += 20;
    if (cptCodes.length > 0) necessityScore += 15;
    
    // Check for treatment history keywords
    const treatmentKeywords = ['previous', 'prior', 'failed', 'unsuccessful', 'tried', 'attempted'];
    const hasHistoryMention = treatmentKeywords.some(keyword => 
      document_text.toLowerCase().includes(keyword)
    );
    if (hasHistoryMention) {
      necessityScore += 15;
      medicalNecessityIndicators.prior_treatments_mentioned = true;
    }

    medicalNecessityIndicators.treatment_necessity_score = Math.min(necessityScore, 100);

    // Step 7: Validate extracted codes against database
    
    // Validate ICD-10 codes
    for (const icdCode of icd10Codes) {
      if (icdCode.code && !/^[A-Z]\d{2}(\.\d{1,4})?$/.test(icdCode.code)) {
        validationIssues.push({
          field: 'extracted_icd10',
          issue: `Extracted ICD-10 code "${icdCode.code}" has invalid format`,
          confidence: 90,
          auto_correctable: true,
          suggested_fix: 'Verify code format against ICD-10-CM standards'
        });
      }
    }

    // Validate CPT codes
    for (const cptCode of cptCodes) {
      if (cptCode.code && !/^\d{5}$/.test(cptCode.code)) {
        validationIssues.push({
          field: 'extracted_cpt',
          issue: `Extracted CPT code "${cptCode.code}" has invalid format`,
          confidence: 85,
          auto_correctable: true,
          suggested_fix: 'Verify code format against CPT standards'
        });
      }
    }

    // Step 8: Check for missing critical information
    if (icd10Codes.length === 0) {
      validationIssues.push({
        field: 'diagnosis_codes',
        issue: 'No valid diagnosis codes could be extracted from documentation',
        confidence: 80,
        auto_correctable: false
      });
    }

    if (cptCodes.length === 0) {
      validationIssues.push({
        field: 'procedure_codes',
        issue: 'No valid procedure codes could be extracted from documentation',
        confidence: 75,
        auto_correctable: false
      });
    }

    if (medicalNecessityIndicators.treatment_necessity_score < 50) {
      validationIssues.push({
        field: 'medical_necessity',
        issue: 'Documentation may not clearly support medical necessity',
        confidence: 70,
        auto_correctable: false
      });
    }

    const result: ExtractedMedicalData = {
      priorAuthId,
      document_text,
      medical_entities: medicalEntities,
      extracted_codes: {
        icd10_codes: icd10Codes,
        cpt_codes: cptCodes,
        rx_norm_codes: rxNormCodes,
        snomed_codes: snomedCodes
      },
      validation_issues: validationIssues,
      validation_issues_count: validationIssues.length,
      medical_necessity_indicators: medicalNecessityIndicators
    };

    console.log('Medical entity extraction completed:', {
      priorAuthId,
      entitiesExtracted: medicalEntities.length,
      icd10Codes: icd10Codes.length,
      cptCodes: cptCodes.length,
      necessityScore: medicalNecessityIndicators.treatment_necessity_score,
      validationIssues: validationIssues.length
    });

    return result;

  } catch (error) {
    console.error('Medical entity extraction error:', error);
    
    return {
      priorAuthId: event.priorAuthId,
      document_text: event.document_text || '',
      medical_entities: [],
      extracted_codes: {
        icd10_codes: [],
        cpt_codes: [],
        rx_norm_codes: [],
        snomed_codes: []
      },
      validation_issues: [{
        field: 'system',
        issue: `Medical entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 100,
        auto_correctable: false
      }],
      validation_issues_count: 1,
      medical_necessity_indicators: {
        symptoms_mentioned: false,
        diagnosis_supported: false,
        treatment_necessity_score: 0,
        prior_treatments_mentioned: false
      }
    };
  }
};