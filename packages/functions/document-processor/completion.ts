import { SQSEvent, SQSHandler } from 'aws-lambda';
import {
  TextractClient,
  GetDocumentAnalysisCommand,
  GetDocumentTextDetectionCommand,
  GetDocumentAnalysisCommandInput,
  GetDocumentTextDetectionCommandInput,
  Block
} from '@aws-sdk/client-textract';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { documents } from '@foresight-cdss-next/db/src/schema';
import { eq } from 'drizzle-orm';

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

interface ExtractedField {
  category: string;
  value: string;
  confidence: number;
  boundingBox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

interface DocumentClassification {
  type: 'insurance_card' | 'id_verification' | 'pharmacy_benefits' | 'medical_record' | 'other';
  confidence: number;
  fields: ExtractedField[];
  fullText: string;
}

// Insurance card field patterns
const INSURANCE_PATTERNS = {
  member_id: [
    /member\s*(?:id|#|number|no)[\s:]*([A-Z0-9]{8,20})/i,
    /id[\s#:]*([A-Z0-9]{8,20})/i,
    /\b([A-Z0-9]{9,15})\b/  // Generic alphanumeric pattern
  ],
  group_number: [
    /group\s*(?:number|#|no)[\s:]*([A-Z0-9]{6,15})/i,
    /grp[\s#:]*([A-Z0-9]{6,15})/i
  ],
  rx_bin: [
    /(?:rx\s*)?bin[\s#:]*(\d{6})/i,
    /\bbin\b[\s:]*(\d{6})/i
  ],
  rx_pcn: [
    /(?:rx\s*)?pcn[\s#:]*([A-Z0-9]{2,10})/i,
    /\bpcn\b[\s:]*([A-Z0-9]{2,10})/i
  ],
  payer_id: [
    /payer\s*(?:id|#)[\s:]*([A-Z0-9]{5,15})/i,
    /plan\s*(?:id|#)[\s:]*([A-Z0-9]{5,15})/i
  ],
  effective_date: [
    /effective[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /eff[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i
  ],
  phone: [
    /(?:phone|ph|tel)[\s:]*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i,
    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/
  ]
};

// ID verification patterns
const ID_PATTERNS = {
  license_number: [
    /(?:license|lic|dl)[\s#:]*([A-Z0-9]{8,20})/i,
    /\b[A-Z]\d{7,12}\b/
  ],
  date_of_birth: [
    /(?:dob|date\s*of\s*birth|born)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/
  ],
  expiration_date: [
    /(?:exp|expires|expiration)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i
  ],
  state: [
    /\b(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])\b/
  ]
};

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('Textract completion handler triggered:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      // Parse SNS message from SQS
      const snsMessage = JSON.parse(record.body);
      const textractMessage = JSON.parse(snsMessage.Message);

      console.log('Textract message:', JSON.stringify(textractMessage, null, 2));

      const { Status, JobId, API, JobTag } = textractMessage;

      if (Status !== 'SUCCEEDED') {
        console.error(`Textract job ${JobId} failed with status: ${Status}`);
        await handleJobFailure(JobId, Status);
        results.push({ itemIdentifier: record.messageId });
        continue;
      }

      // Extract document ID from JobTag or ClientRequestToken
      const documentId = extractDocumentId(JobTag || '');
      if (!documentId) {
        console.error('Could not extract document ID from job');
        results.push({ itemIdentifier: record.messageId });
        continue;
      }

      // Get the Textract results
      const classification = API === 'StartDocumentAnalysis'
        ? await processAnalysisResults(JobId)
        : await processTextDetectionResults(JobId);

      // Update document with extracted data
      await updateDocumentWithResults(documentId, classification);

      console.log(`Successfully processed document ${documentId}`);
      results.push({ itemIdentifier: record.messageId });

    } catch (error) {
      console.error('Error processing Textract completion:', error);
      // Return failure to retry the message
      results.push({
        itemIdentifier: record.messageId,
        batchItemFailures: [{ itemIdentifier: record.messageId }]
      });
    }
  }

  return { batchItemFailures: results.filter(r => r.batchItemFailures).map(r => r.batchItemFailures[0]) };
};

function extractDocumentId(jobTag: string): string | null {
  // JobTag format should be: {documentId}-{type}-{timestamp}
  const parts = jobTag.split('-');
  return parts.length >= 3 ? parts[0] : null;
}

async function processAnalysisResults(jobId: string): Promise<DocumentClassification> {
  console.log(`Processing analysis results for job: ${jobId}`);

  const params: GetDocumentAnalysisCommandInput = {
    JobId: jobId,
  };

  let nextToken: string | undefined;
  const allBlocks: Block[] = [];

  // Get all pages of results
  do {
    if (nextToken) {
      params.NextToken = nextToken;
    }

    const command = new GetDocumentAnalysisCommand(params);
    const response = await textractClient.send(command);

    if (response.Blocks) {
      allBlocks.push(...response.Blocks);
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return processBlocks(allBlocks);
}

async function processTextDetectionResults(jobId: string): Promise<DocumentClassification> {
  console.log(`Processing text detection results for job: ${jobId}`);

  const params: GetDocumentTextDetectionCommandInput = {
    JobId: jobId,
  };

  let nextToken: string | undefined;
  const allBlocks: Block[] = [];

  // Get all pages of results
  do {
    if (nextToken) {
      params.NextToken = nextToken;
    }

    const command = new GetDocumentTextDetectionCommand(params);
    const response = await textractClient.send(command);

    if (response.Blocks) {
      allBlocks.push(...response.Blocks);
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return processBlocks(allBlocks);
}

function processBlocks(blocks: Block[]): DocumentClassification {
  // Extract all text from LINE blocks
  const textLines = blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text || '')
    .filter(text => text.trim().length > 0);

  const fullText = textLines.join(' ');
  console.log('Extracted text preview:', fullText.substring(0, 200) + '...');

  // Classify document and extract structured fields
  const classification = classifyDocument(fullText);

  // Enhanced field extraction using form data if available
  const formFields = extractFormFields(blocks);
  classification.fields.push(...formFields);

  // Remove duplicates based on category and value
  classification.fields = removeDuplicateFields(classification.fields);

  classification.fullText = fullText;

  console.log('Classification result:', JSON.stringify(classification, null, 2));

  return classification;
}

function classifyDocument(text: string): DocumentClassification {
  const lowercaseText = text.toLowerCase();

  // Check for insurance card indicators
  const insuranceKeywords = ['member', 'group', 'bin', 'pcn', 'copay', 'deductible', 'premium', 'coverage'];
  const insuranceScore = insuranceKeywords.reduce((score, keyword) => {
    return score + (lowercaseText.includes(keyword) ? 1 : 0);
  }, 0);

  // Check for ID card indicators
  const idKeywords = ['license', 'identification', 'expires', 'state', 'height', 'weight', 'eyes'];
  const idScore = idKeywords.reduce((score, keyword) => {
    return score + (lowercaseText.includes(keyword) ? 1 : 0);
  }, 0);

  // Check for pharmacy benefits indicators
  const pharmacyKeywords = ['pharmacy', 'prescription', 'rx', 'drug', 'formulary'];
  const pharmacyScore = pharmacyKeywords.reduce((score, keyword) => {
    return score + (lowercaseText.includes(keyword) ? 1 : 0);
  }, 0);

  // Determine document type based on scores
  let documentType: DocumentClassification['type'] = 'other';
  let confidence = 0.1;
  let patterns = {};

  if (insuranceScore >= 3) {
    documentType = 'insurance_card';
    confidence = Math.min(0.9, 0.3 + (insuranceScore * 0.15));
    patterns = INSURANCE_PATTERNS;
  } else if (pharmacyScore >= 2) {
    documentType = 'pharmacy_benefits';
    confidence = Math.min(0.9, 0.3 + (pharmacyScore * 0.2));
    patterns = { ...INSURANCE_PATTERNS }; // Pharmacy cards often have similar fields
  } else if (idScore >= 2) {
    documentType = 'id_verification';
    confidence = Math.min(0.9, 0.3 + (idScore * 0.2));
    patterns = ID_PATTERNS;
  }

  // Extract fields based on document type
  const fields = extractFields(text, patterns);

  return {
    type: documentType,
    confidence,
    fields,
    fullText: text,
  };
}

function extractFields(text: string, patterns: Record<string, RegExp[]>): ExtractedField[] {
  const fields: ExtractedField[] = [];

  for (const [category, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const match = text.match(regex);
      if (match && match[1]) {
        fields.push({
          category,
          value: match[1].trim(),
          confidence: 0.8, // Base confidence for regex matches
        });
        break; // Use first match for each category
      }
    }
  }

  return fields;
}

function extractFormFields(blocks: Block[]): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Group blocks by type
  const keyBlocks = blocks.filter(block =>
    block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')
  );
  const valueBlocks = blocks.filter(block =>
    block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('VALUE')
  );

  // Create a map for quick value lookup
  const valueMap = new Map();
  valueBlocks.forEach(block => {
    valueMap.set(block.Id, block);
  });

  // Extract key-value pairs
  keyBlocks.forEach(keyBlock => {
    if (keyBlock.Relationships) {
      const valueRelation = keyBlock.Relationships.find(rel => rel.Type === 'VALUE');
      if (valueRelation && valueRelation.Ids && valueRelation.Ids.length > 0) {
        const valueBlock = valueMap.get(valueRelation.Ids[0]);
        if (valueBlock) {
          const keyText = getBlockText(keyBlock, blocks).toLowerCase();
          const valueText = getBlockText(valueBlock, blocks);

          // Map common form field names to our categories
          const category = mapFieldCategory(keyText);
          if (category && valueText.trim()) {
            fields.push({
              category,
              value: valueText.trim(),
              confidence: keyBlock.Confidence || 0.7,
              boundingBox: keyBlock.Geometry?.BoundingBox ? {
                top: keyBlock.Geometry.BoundingBox.Top,
                left: keyBlock.Geometry.BoundingBox.Left,
                width: keyBlock.Geometry.BoundingBox.Width,
                height: keyBlock.Geometry.BoundingBox.Height,
              } : undefined
            });
          }
        }
      }
    }
  });

  return fields;
}

function getBlockText(block: Block, allBlocks: Block[]): string {
  if (block.Text) return block.Text;

  if (block.Relationships) {
    const childRelation = block.Relationships.find(rel => rel.Type === 'CHILD');
    if (childRelation && childRelation.Ids) {
      const childTexts = childRelation.Ids
        .map(id => allBlocks.find(b => b.Id === id))
        .filter(b => b && b.Text)
        .map(b => b.Text);
      return childTexts.join(' ');
    }
  }

  return '';
}

function mapFieldCategory(fieldName: string): string | null {
  const mapping: Record<string, string> = {
    'member id': 'member_id',
    'member number': 'member_id',
    'id number': 'member_id',
    'subscriber id': 'member_id',
    'group': 'group_number',
    'group number': 'group_number',
    'group no': 'group_number',
    'bin': 'rx_bin',
    'rx bin': 'rx_bin',
    'pcn': 'rx_pcn',
    'rx pcn': 'rx_pcn',
    'payer id': 'payer_id',
    'plan id': 'payer_id',
    'effective': 'effective_date',
    'effective date': 'effective_date',
    'phone': 'phone',
    'telephone': 'phone',
    'date of birth': 'date_of_birth',
    'dob': 'date_of_birth',
    'license': 'license_number',
    'license number': 'license_number',
    'dl': 'license_number',
    'expires': 'expiration_date',
    'expiration': 'expiration_date',
    'exp date': 'expiration_date',
  };

  for (const [key, category] of Object.entries(mapping)) {
    if (fieldName.includes(key)) {
      return category;
    }
  }

  return null;
}

function removeDuplicateFields(fields: ExtractedField[]): ExtractedField[] {
  const seen = new Set();
  return fields.filter(field => {
    const key = `${field.category}:${field.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function handleJobFailure(jobId: string, status: string) {
  console.error(`Handling job failure for ${jobId}: ${status}`);
  // In a real implementation, you might want to update the document status
  // or send notifications about the failure
}

async function updateDocumentWithResults(documentId: string, classification: DocumentClassification) {
  try {
    console.log(`Updating document ${documentId} with classification results`);

    // Map our internal types to schema enum values
    const schemaType = mapToSchemaType(classification.type);

    const extractedData = {
      classification: classification.type,
      confidence: classification.confidence,
      fields: classification.fields,
      full_text: classification.fullText,
      processed_at: new Date().toISOString(),
      status: 'completed'
    };

    await db
      .update(documents)
      .set({
        documentType: schemaType,
        ocrText: JSON.stringify(extractedData),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.log('Document updated successfully');

  } catch (error) {
    console.error('Error updating document record:', error);
    throw error;
  }
}

function mapToSchemaType(classificationType: string): 'insurance_card' | 'id_verification' | 'medical_record' | 'other' {
  switch (classificationType) {
    case 'insurance_card':
    case 'pharmacy_benefits':
      return 'insurance_card';
    case 'id_verification':
      return 'id_verification';
    case 'medical_record':
      return 'medical_record';
    default:
      return 'other';
  }
}
