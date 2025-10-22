import type { S3Event, S3Handler } from 'aws-lambda';
import {
  TextractClient,
  AnalyzeDocumentCommand,
  AnalyzeDocumentCommandInput,
  Block,
  Relationship
} from '@aws-sdk/client-textract';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { insurancePolicies, payers } from '@foresight-cdss-next/db/src/schema';
import { eq, and } from 'drizzle-orm';
import { validateDocument, quickValidateDocument } from '../shared/rekognition-validator';

const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'us-east-1' });
const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION || 'us-east-1' });

if (!process.env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME is not defined');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

const db = drizzle(rdsClient, {
  database: process.env.DATABASE_NAME,
  secretArn: process.env.DATABASE_SECRET_ARN,
  resourceArn: process.env.DATABASE_CLUSTER_ARN,
});

interface ExtractedCardData {
  policyNumber?: string;
  groupNumber?: string;
  planName?: string;
  payerName?: string;
  subscriberFirstName?: string;
  subscriberLastName?: string;
  subscriberDob?: string;
  memberName?: string;
  memberId?: string;
  effectiveDate?: string;
  copayPCP?: string;
  copaySpecialist?: string;
  copayER?: string;
  copayUrgentCare?: string;
  deductible?: string;
  outOfPocketMax?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
}

/**
 * Extract key-value pairs from Textract blocks
 */
function extractKeyValuePairs(blocks: Block[]): Record<string, string> {
  const keyValuePairs: Record<string, string> = {};
  const keyMap = new Map<string, Block>();
  const valueMap = new Map<string, Block>();
  const blockMap = new Map<string, Block>();

  // Create block map for relationships
  blocks.forEach(block => {
    if (block.Id) {
      blockMap.set(block.Id, block);
    }
  });

  // Find KEY_VALUE_SET blocks
  blocks.forEach(block => {
    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes?.includes('KEY')) {
        keyMap.set(block.Id!, block);
      } else if (block.EntityTypes?.includes('VALUE')) {
        valueMap.set(block.Id!, block);
      }
    }
  });

  // Match keys with values
  keyMap.forEach((keyBlock, keyId) => {
    const valueRelationship = keyBlock.Relationships?.find(
      rel => rel.Type === 'VALUE'
    );

    if (valueRelationship?.Ids?.[0]) {
      const valueId = valueRelationship.Ids[0];
      const valueBlock = valueMap.get(valueId);

      if (valueBlock) {
        const keyText = getTextFromBlock(keyBlock, blockMap);
        const valueText = getTextFromBlock(valueBlock, blockMap);

        if (keyText && valueText) {
          keyValuePairs[keyText.toLowerCase().trim()] = valueText.trim();
        }
      }
    }
  });

  return keyValuePairs;
}

/**
 * Get text content from a block using its child relationships
 */
function getTextFromBlock(block: Block, blockMap: Map<string, Block>): string {
  if (block.Text) {
    return block.Text;
  }

  const childRelationship = block.Relationships?.find(
    rel => rel.Type === 'CHILD'
  );

  if (childRelationship?.Ids) {
    return childRelationship.Ids
      .map(id => blockMap.get(id))
      .filter(childBlock => childBlock?.BlockType === 'WORD')
      .map(childBlock => childBlock!.Text)
      .join(' ');
  }

  return '';
}

/**
 * Map extracted data to insurance card fields using common field names
 */
function mapExtractedData(keyValuePairs: Record<string, string>): ExtractedCardData {
  const extractedData: ExtractedCardData = {};

  // Policy/Member ID mappings
  const policyKeys = ['policy number', 'policy #', 'member id', 'id number', 'policy id', 'member number'];
  const groupKeys = ['group number', 'group #', 'grp', 'group id'];
  const planKeys = ['plan name', 'plan', 'plan type', 'coverage type'];
  const payerKeys = ['insurance company', 'payer', 'carrier', 'insurer', 'company name'];

  // Subscriber info
  const firstNameKeys = ['first name', 'subscriber first name', 'member first name'];
  const lastNameKeys = ['last name', 'subscriber last name', 'member last name'];
  const dobKeys = ['date of birth', 'dob', 'birth date', 'subscriber dob'];

  // Financial info
  const copayPCPKeys = ['pcp copay', 'primary care copay', 'office visit', 'pcp'];
  const copaySpecKeys = ['specialist copay', 'specialist', 'spec copay'];
  const copayERKeys = ['er copay', 'emergency room', 'emergency', 'er'];
  const deductibleKeys = ['deductible', 'ded', 'annual deductible'];
  const oopKeys = ['out of pocket max', 'oop max', 'maximum out of pocket'];

  // Pharmacy info
  const rxBinKeys = ['bin', 'rx bin', 'pharmacy bin'];
  const rxPcnKeys = ['pcn', 'rx pcn', 'pharmacy pcn'];
  const rxGroupKeys = ['rx group', 'pharmacy group', 'rx grp'];

  // Helper function to find value by multiple key variations
  const findValue = (keyVariations: string[]): string | undefined => {
    for (const key of keyVariations) {
      for (const [extractedKey, value] of Object.entries(keyValuePairs)) {
        if (extractedKey.includes(key) || key.includes(extractedKey)) {
          return value;
        }
      }
    }
    return undefined;
  };

  extractedData.policyNumber = findValue(policyKeys);
  extractedData.groupNumber = findValue(groupKeys);
  extractedData.planName = findValue(planKeys);
  extractedData.payerName = findValue(payerKeys);
  extractedData.subscriberFirstName = findValue(firstNameKeys);
  extractedData.subscriberLastName = findValue(lastNameKeys);
  extractedData.subscriberDob = findValue(dobKeys);
  extractedData.copayPCP = findValue(copayPCPKeys);
  extractedData.copaySpecialist = findValue(copaySpecKeys);
  extractedData.copayER = findValue(copayERKeys);
  extractedData.deductible = findValue(deductibleKeys);
  extractedData.outOfPocketMax = findValue(oopKeys);
  extractedData.rxBin = findValue(rxBinKeys);
  extractedData.rxPcn = findValue(rxPcnKeys);
  extractedData.rxGroup = findValue(rxGroupKeys);

  return extractedData;
}

/**
 * Find or create payer record
 */
async function findOrCreatePayer(payerName: string): Promise<string> {
  // First try to find existing payer
  const existingPayer = await db
    .select()
    .from(payers)
    .where(and(
      eq(payers.name, payerName)
    ))
    .limit(1);

  if (existingPayer.length > 0) {
    return existingPayer[0].id;
  }

  // Create new payer
  const newPayer = await db
    .insert(payers)
    .values({
      name: payerName,
    })
    .returning({ id: payers.id });

  return newPayer[0].id;
}

/**
 * Save extracted insurance card data to database
 */
async function saveInsurancePolicy(
  patientId: string,
  organizationId: string,
  extractedData: ExtractedCardData
): Promise<void> {
  let payerId: string | undefined;

  // Find or create payer if we have payer name
  if (extractedData.payerName) {
    payerId = await findOrCreatePayer(extractedData.payerName);
  }

  // Parse dates
  let effectiveDate: string | undefined;
  let subscriberDob: string | undefined;

  if (extractedData.effectiveDate) {
    const parsed = new Date(extractedData.effectiveDate);
    if (!Number.isNaN(parsed.getTime())) {
      effectiveDate = parsed.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } else {
      console.warn('Invalid effective date format:', extractedData.effectiveDate);
    }
  }

  if (extractedData.subscriberDob) {
    const parsed = new Date(extractedData.subscriberDob);
    if (!Number.isNaN(parsed.getTime())) {
      subscriberDob = parsed.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } else {
      console.warn('Invalid subscriber DOB format:', extractedData.subscriberDob);
    }
  }

  // Check if insurance policy already exists for this patient
  if (extractedData.policyNumber) {
    const existingPolicy = await db
      .select()
      .from(insurancePolicies)
      .where(and(
        eq(insurancePolicies.patientId, patientId),
        eq(insurancePolicies.policyNumber, extractedData.policyNumber)
      ))
      .limit(1);

    if (existingPolicy.length > 0) {
      // Update existing policy
      await db
        .update(insurancePolicies)
        .set({
          ...(payerId && { payerId }),
          ...(extractedData.groupNumber && { groupNumber: extractedData.groupNumber }),
          ...(extractedData.planName && { planName: extractedData.planName }),
          ...(extractedData.subscriberFirstName && { subscriberFirstName: extractedData.subscriberFirstName }),
          ...(extractedData.subscriberLastName && { subscriberLastName: extractedData.subscriberLastName }),
          ...(subscriberDob && { subscriberDob }),
          ...(effectiveDate && { effectiveDate }),
          isVerified: true,
        })
        .where(eq(insurancePolicies.id, existingPolicy[0].id));

      console.log(`Updated existing insurance policy ${existingPolicy[0].id} for patient ${patientId}`);
      return;
    }
  }

  // Create new insurance policy
  if (!extractedData.policyNumber || !payerId) {
    throw new Error('Missing required fields: policy number and payer information');
  }

  await db.insert(insurancePolicies).values({
    patientId,
    payerId,
    policyNumber: extractedData.policyNumber,
    groupNumber: extractedData.groupNumber,
    planName: extractedData.planName,
    subscriberFirstName: extractedData.subscriberFirstName,
    subscriberLastName: extractedData.subscriberLastName,
    subscriberDob,
    effectiveDate,
    coverageType: 'primary', // Default to primary, can be updated later
    subscriberRelationship: 'self', // Default assumption
    isActive: true,
    isVerified: true,
  });

  console.log(`Created new insurance policy for patient ${patientId}`);
}

/**
 * Main Lambda handler for processing insurance cards
 */
export const handler: S3Handler = async (event: S3Event) => {
  console.log('Insurance card processor triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing insurance card: ${bucket}/${key}`);

      // Extract metadata from file key (format: insurance-cards/{patientId}/{organizationId}/filename.ext)
      const pathParts = key.split('/');
      if (pathParts.length < 4 || pathParts[0] !== 'insurance-cards') {
        console.log('Skipping non-insurance-card file:', key);
        continue;
      }

      const patientId = pathParts[1];
      const organizationId = pathParts[2];

      console.log(`Processing for patient: ${patientId}, organization: ${organizationId}`);

      // Step 1: Validate document with Rekognition
      console.log('Starting Rekognition validation...');
      const validationResult = await validateDocument({
        bucket,
        key,
        documentType: 'insurance_card',
        minTextConfidence: 80,
        checkForFaces: false, // Insurance cards may not have faces
        checkForInappropriateContent: true,
        validateDocumentStructure: true
      });

      console.log('Validation result:', {
        isValid: validationResult.isValid,
        confidence: validationResult.confidence,
        issues: validationResult.issues,
        metadata: validationResult.metadata
      });

      // Stop processing if validation fails
      if (!validationResult.isValid) {
        console.error(`Document validation failed for ${key}:`, validationResult.issues);
        throw new Error(`Document validation failed: ${validationResult.issues.join(', ')}`);
      }

      // Log validation metadata for monitoring
      if (validationResult.metadata) {
        console.log('Document quality metrics:', {
          textConfidence: validationResult.metadata.textConfidence,
          documentQuality: validationResult.metadata.documentQuality,
          suspiciousContent: validationResult.metadata.suspiciousContent
        });
      }

      // Step 2: Proceed with Textract analysis only if validation passes
      const analyzeParams: AnalyzeDocumentCommandInput = {
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: key,
          },
        },
        FeatureTypes: ['FORMS', 'TABLES'],
      };

      const textractResponse = await textractClient.send(
        new AnalyzeDocumentCommand(analyzeParams)
      );

      if (!textractResponse.Blocks) {
        console.error('No blocks returned from Textract');
        continue;
      }

      console.log(`Textract returned ${textractResponse.Blocks.length} blocks`);

      // Extract key-value pairs
      const keyValuePairs = extractKeyValuePairs(textractResponse.Blocks);
      console.log('Extracted key-value pairs:', keyValuePairs);

      // Map to insurance card fields
      const extractedData = mapExtractedData(keyValuePairs);
      console.log('Mapped insurance card data:', extractedData);

      // Save to database
      await saveInsurancePolicy(patientId, organizationId, extractedData);

      console.log(`Successfully processed insurance card for patient ${patientId}`);

    } catch (error) {
      console.error('Error processing insurance card:', error);
      // Continue processing other records rather than failing the entire batch
    }
  }
};
