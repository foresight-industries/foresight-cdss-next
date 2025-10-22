import { EventBridgeEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import {
  ComprehendMedicalClient,
  DetectEntitiesV2Command,
  InferICD10CMCommand,
  InferRxNormCommand,
  InferSNOMEDCTCommand,
  Entity,
  ICD10CMEntity,
  RxNormEntity,
  SNOMEDCTEntity
} from '@aws-sdk/client-comprehendmedical';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand } from '@aws-sdk/client-rds-data';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

interface EncounterUpdateEvent {
  encounterId: string;
  organizationId: string;
  clinicalNotes: string;
  changedFields: string[];
}

interface ProcessingSettings {
  maxTextLength: number;
  confidenceThreshold: number;
  onlyPopulateEmptyFields: boolean;
  enablePHIDetection: boolean;
  enableInference: boolean;
}

interface EntityMappingConfig {
  MEDICAL_CONDITION: string[];
  DX_NAME: string[];
  PROCEDURE_NAME: string[];
  TREATMENT: string[];
  MEDICATION: string[];
}

interface ExtractedEntities {
  medicalConditions: Entity[];
  diagnoses: Entity[];
  procedures: Entity[];
  treatments: Entity[];
  medications: Entity[];
  icd10Codes: ICD10CMEntity[];
  rxNormCodes: RxNormEntity[];
  snomedCodes: SNOMEDCTEntity[];
}

interface EncounterUpdate {
  chiefComplaint?: string;
  presentIllness?: string;
  assessment?: string;
  plan?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string;
  procedureCodes?: string;
}

const comprehendMedical = new ComprehendMedicalClient({});
const rdsData = new RDSDataClient({});
const eventBridge = new EventBridgeClient({});

if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

const DATABASE_CLUSTER_ARN = process.env.DATABASE_CLUSTER_ARN;
const DATABASE_SECRET_ARN = process.env.DATABASE_SECRET_ARN;
// const ENVIRONMENT = process.env.ENVIRONMENT ?? 'staging';

// Default configurations
const DEFAULT_SETTINGS: ProcessingSettings = {
  maxTextLength: 20000,
  confidenceThreshold: 0.7,
  onlyPopulateEmptyFields: true,
  enablePHIDetection: true,
  enableInference: true,
};

const DEFAULT_ENTITY_MAPPING: EntityMappingConfig = {
  MEDICAL_CONDITION: ['chiefComplaint', 'presentIllness', 'assessment'],
  DX_NAME: ['primaryDiagnosis', 'secondaryDiagnoses'],
  PROCEDURE_NAME: ['procedureCodes'],
  TREATMENT: ['plan'],
  MEDICATION: ['plan'],
};

export const handler = async (
  event: EventBridgeEvent<string, EncounterUpdateEvent>,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Processing medical entity extraction event:', JSON.stringify(event, null, 2));

  try {
    const { encounterId, organizationId, clinicalNotes } = event.detail;

    if (!clinicalNotes || clinicalNotes.trim().length === 0) {
      console.log('No clinical notes to process');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No clinical notes to process' }),
      };
    }

    // Get processing settings (could be from SSM in production)
    const settings = DEFAULT_SETTINGS;
    const entityMapping = DEFAULT_ENTITY_MAPPING;

    // Truncate text if too long
    const textToProcess = clinicalNotes.length > settings.maxTextLength
      ? clinicalNotes.substring(0, settings.maxTextLength)
      : clinicalNotes;

    console.log(`Processing ${textToProcess.length} characters of clinical notes for encounter ${encounterId}`);

    // Extract entities using Comprehend Medical
    const extractedEntities = await extractMedicalEntities(textToProcess, settings);

    // Get current encounter data to check which fields are empty
    const currentEncounter = await getCurrentEncounter(encounterId);

    if (!currentEncounter) {
      throw new Error(`Encounter ${encounterId} not found`);
    }

    // Generate field updates based on extracted entities
    const updates = generateEncounterUpdates(
      extractedEntities,
      entityMapping,
      currentEncounter,
      settings
    );

    if (Object.keys(updates).length === 0) {
      console.log('No updates needed - all relevant fields already populated');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No updates needed' }),
      };
    }

    // Update the encounter record
    await updateEncounter(encounterId, updates);

    // Publish completion event
    await publishProcessingEvent(encounterId, organizationId, updates, extractedEntities);

    console.log(`Successfully processed medical entities for encounter ${encounterId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Medical entity extraction completed successfully',
        encounterId,
        updatedFields: Object.keys(updates),
        entitiesExtracted: {
          medicalConditions: extractedEntities.medicalConditions.length,
          diagnoses: extractedEntities.diagnoses.length,
          procedures: extractedEntities.procedures.length,
          treatments: extractedEntities.treatments.length,
          medications: extractedEntities.medications.length,
        },
      }),
    };

  } catch (error) {
    console.error('Error processing medical entity extraction:', error);

    // Publish error event for monitoring
    await publishErrorEvent(event.detail.encounterId, event.detail.organizationId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process medical entity extraction',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function extractMedicalEntities(text: string, settings: ProcessingSettings): Promise<ExtractedEntities> {
  const entities: ExtractedEntities = {
    medicalConditions: [],
    diagnoses: [],
    procedures: [],
    treatments: [],
    medications: [],
    icd10Codes: [],
    rxNormCodes: [],
    snomedCodes: [],
  };

  try {
    // Detect medical entities
    const detectCommand = new DetectEntitiesV2Command({ Text: text });
    const detectResult = await comprehendMedical.send(detectCommand);

    if (detectResult.Entities) {
      // Filter entities by confidence threshold and categorize
      for (const entity of detectResult.Entities) {
        if (!entity.Score || entity.Score < settings.confidenceThreshold) {
          continue;
        }

        switch (entity.Category) {
          case 'MEDICAL_CONDITION':
            entities.medicalConditions.push(entity);
            break;
          case 'MEDICATION':
            entities.medications.push(entity);
            break;
          case 'ANATOMY':
            entities.treatments.push(entity);
            break;
          case 'PROTECTED_HEALTH_INFORMATION':
            entities.procedures.push(entity);
            break;
          case 'TEST_TREATMENT_PROCEDURE':
            entities.procedures.push(entity);
            break;
        }

        // Also categorize by type for diagnosis codes
        if (entity.Type === 'DX_NAME') {
          entities.diagnoses.push(entity);
        }
        if (entity.Type === 'PROCEDURE_NAME') {
          entities.procedures.push(entity);
        }
      }
    }

    // Use inference APIs if enabled
    if (settings.enableInference) {
      try {
        // Infer ICD-10-CM codes
        const icd10Command = new InferICD10CMCommand({ Text: text });
        const icd10Result = await comprehendMedical.send(icd10Command);
        if (icd10Result.Entities) {
          entities.icd10Codes = icd10Result.Entities.filter(
            entity => entity.Score && entity.Score >= settings.confidenceThreshold
          );
        }

        // Infer RxNorm codes for medications
        const rxNormCommand = new InferRxNormCommand({ Text: text });
        const rxNormResult = await comprehendMedical.send(rxNormCommand);
        if (rxNormResult.Entities) {
          entities.rxNormCodes = rxNormResult.Entities.filter(
            entity => entity.Score && entity.Score >= settings.confidenceThreshold
          );
        }

        // Infer SNOMED CT codes
        const snomedCommand = new InferSNOMEDCTCommand({ Text: text });
        const snomedResult = await comprehendMedical.send(snomedCommand);
        if (snomedResult.Entities) {
          entities.snomedCodes = snomedResult.Entities.filter(
            entity => entity.Score && entity.Score >= settings.confidenceThreshold
          );
        }
      } catch (inferenceError) {
        console.warn('Error during inference API calls:', inferenceError);
        // Continue processing without inference results
      }
    }

  } catch (error) {
    console.error('Error extracting medical entities:', error);
    throw error;
  }

  return entities;
}

async function getCurrentEncounter(encounterId: string): Promise<any> {
  try {
    const command = new ExecuteStatementCommand({
      resourceArn: DATABASE_CLUSTER_ARN,
      secretArn: DATABASE_SECRET_ARN,
      sql: `
        SELECT
          chief_complaint,
          present_illness,
          assessment,
          plan,
          primary_diagnosis,
          secondary_diagnoses,
          procedure_codes
        FROM encounter
        WHERE id = :encounterId
      `,
      parameters: [
        { name: 'encounterId', value: { stringValue: encounterId } }
      ],
    });

    const result = await rdsData.send(command);

    if (!result.records || result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      chiefComplaint: record[0]?.stringValue || null,
      presentIllness: record[1]?.stringValue || null,
      assessment: record[2]?.stringValue || null,
      plan: record[3]?.stringValue || null,
      primaryDiagnosis: record[4]?.stringValue || null,
      secondaryDiagnoses: record[5]?.stringValue || null,
      procedureCodes: record[6]?.stringValue || null,
    };
  } catch (error) {
    console.error('Error fetching current encounter:', error);
    throw error;
  }
}

function generateEncounterUpdates(
  entities: ExtractedEntities,
  mapping: EntityMappingConfig,
  currentEncounter: any,
  settings: ProcessingSettings
): EncounterUpdate {
  const updates: EncounterUpdate = {};

  // Process medical conditions for chief complaint, present illness, assessment
  if (entities.medicalConditions.length > 0) {
    const conditions = entities.medicalConditions
      .map(entity => entity.Text)
      .filter(text => text && text.length > 0);

    if (conditions.length > 0) {
      // Chief complaint - usually the first/primary condition
      if ((!currentEncounter.chiefComplaint || !settings.onlyPopulateEmptyFields)) {
        updates.chiefComplaint = conditions[0];
      }

      // Present illness - combine multiple conditions
      if ((!currentEncounter.presentIllness || !settings.onlyPopulateEmptyFields)) {
        updates.presentIllness = conditions.slice(0, 3).join('; ');
      }

      // Assessment - more comprehensive view
      if ((!currentEncounter.assessment || !settings.onlyPopulateEmptyFields)) {
        updates.assessment = conditions.join('; ');
      }
    }
  }

  // Process treatments and medications for plan
  if (entities.treatments.length > 0 || entities.medications.length > 0) {
    const planItems = [
      ...entities.treatments.map(entity => entity.Text),
      ...entities.medications.map(entity => entity.Text),
    ].filter(text => text && text.length > 0);

    if (planItems.length > 0 && (!currentEncounter.plan || !settings.onlyPopulateEmptyFields)) {
      updates.plan = planItems.join('; ');
    }
  }

  // Process diagnoses
  if (entities.diagnoses.length > 0 || entities.icd10Codes.length > 0) {
    // Primary diagnosis - use ICD-10 codes if available, otherwise use extracted diagnosis names
    if (!currentEncounter.primaryDiagnosis || !settings.onlyPopulateEmptyFields) {
      const primaryDiagnosis = entities.icd10Codes.length > 0
        ? entities.icd10Codes[0].ICD10CMConcepts?.[0]?.Code
        : entities.diagnoses[0]?.Text;

      if (primaryDiagnosis) {
        updates.primaryDiagnosis = primaryDiagnosis;
      }
    }

    // Secondary diagnoses - combine additional codes/names
    if (!currentEncounter.secondaryDiagnoses || !settings.onlyPopulateEmptyFields) {
      const secondaryDiagnoses: string[] = [];

      // Add additional ICD-10 codes
      if (entities.icd10Codes.length > 1) {
        entities.icd10Codes.slice(1).forEach(entity => {
          entity.ICD10CMConcepts?.forEach(concept => {
            if (concept.Code) {
              secondaryDiagnoses.push(concept.Code);
            }
          });
        });
      }

      // Add additional diagnosis names
      if (entities.diagnoses.length > 1) {
        entities.diagnoses.slice(1).forEach(entity => {
          if (entity.Text) {
            secondaryDiagnoses.push(entity.Text);
          }
        });
      }

      if (secondaryDiagnoses.length > 0) {
        updates.secondaryDiagnoses = JSON.stringify(secondaryDiagnoses);
      }
    }
  }

  // Process procedures
  if (entities.procedures.length > 0) {
    if (!currentEncounter.procedureCodes || !settings.onlyPopulateEmptyFields) {
      const procedures = entities.procedures
        .map(entity => entity.Text)
        .filter(text => text && text.length > 0);

      if (procedures.length > 0) {
        updates.procedureCodes = JSON.stringify(procedures);
      }
    }
  }

  return updates;
}

async function updateEncounter(encounterId: string, updates: EncounterUpdate): Promise<void> {
  if (Object.keys(updates).length === 0) {
    return;
  }

  try {
    const beginTransaction = new BeginTransactionCommand({
      resourceArn: DATABASE_CLUSTER_ARN,
      secretArn: DATABASE_SECRET_ARN,
    });

    const transactionResult = await rdsData.send(beginTransaction);
    const transactionId = transactionResult.transactionId;

    try {
      // Build dynamic SQL update query
      const updateFields: string[] = [];
      const parameters: any[] = [
        { name: 'encounterId', value: { stringValue: encounterId } }
      ];

      Object.entries(updates).forEach(([field, value], index) => {
        const paramName = `value${index}`;
        updateFields.push(`${toSnakeCase(field)} = :${paramName}`);
        parameters.push({
          name: paramName,
          value: { stringValue: value }
        });
      });

      const sql = `
        UPDATE encounter
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = :encounterId
      `;

      const updateCommand = new ExecuteStatementCommand({
        resourceArn: DATABASE_CLUSTER_ARN,
        secretArn: DATABASE_SECRET_ARN,
        sql,
        parameters,
        transactionId,
      });

      await rdsData.send(updateCommand);

      // Commit transaction
      const commitCommand = new CommitTransactionCommand({
        resourceArn: DATABASE_CLUSTER_ARN,
        secretArn: DATABASE_SECRET_ARN,
        transactionId,
      });

      await rdsData.send(commitCommand);

      console.log(`Successfully updated encounter ${encounterId} with fields: ${Object.keys(updates).join(', ')}`);

    } catch (error) {
      // Rollback transaction on error
      console.error('Error updating encounter, rolling back transaction:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error updating encounter:', error);
    throw error;
  }
}

async function publishProcessingEvent(
  encounterId: string,
  organizationId: string,
  updates: EncounterUpdate,
  entities: ExtractedEntities
): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'foresight.comprehend-medical',
          DetailType: 'Medical Entity Extraction Completed',
          Detail: JSON.stringify({
            encounterId,
            organizationId,
            updatedFields: Object.keys(updates),
            entitiesExtracted: {
              medicalConditions: entities.medicalConditions.length,
              diagnoses: entities.diagnoses.length,
              procedures: entities.procedures.length,
              treatments: entities.treatments.length,
              medications: entities.medications.length,
              icd10Codes: entities.icd10Codes.length,
              rxNormCodes: entities.rxNormCodes.length,
              snomedCodes: entities.snomedCodes.length,
            },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await eventBridge.send(command);
  } catch (error) {
    console.error('Error publishing processing completion event:', error);
    // Don't throw - this is not critical for the main operation
  }
}

async function publishErrorEvent(
  encounterId: string,
  organizationId: string,
  error: any
): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'foresight.comprehend-medical',
          DetailType: 'Medical Entity Extraction Failed',
          Detail: JSON.stringify({
            encounterId,
            organizationId,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    await eventBridge.send(command);
  } catch (publishError) {
    console.error('Error publishing error event:', publishError);
    // Don't throw - this is not critical
  }
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
