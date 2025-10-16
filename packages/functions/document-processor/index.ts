import { S3Event, S3Handler } from 'aws-lambda';
import {
  TextractClient,
  StartDocumentAnalysisCommand,
  StartDocumentTextDetectionCommand,
  StartDocumentAnalysisCommandInput,
  StartDocumentTextDetectionCommandInput
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

/**
 * This handler is triggered when a document is uploaded to S3.
 * It starts async Textract processing and updates the document status.
 */
export const handler: S3Handler = async (event: S3Event) => {
  console.log('Document upload processor triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing document upload: ${bucket}/${key}`);

      // Extract document ID from file key (format: documents/{documentId}/filename.ext)
      const pathParts = key.split('/');
      if (pathParts.length < 2 || pathParts[0] !== 'documents') {
        console.log('Skipping non-document file:', key);
        continue;
      }

      const documentId = pathParts[1];
      const fileName = pathParts[pathParts.length - 1];

      // Determine if we need full analysis or just text detection
      const needsAnalysis = isComplexDocument(fileName);

      // Update document status to processing
      await updateDocumentStatus(documentId, 'processing', 'Starting Textract processing...');

      // Start appropriate Textract operation
      const jobId = needsAnalysis
        ? await startDocumentAnalysis(bucket, key, documentId)
        : await startTextDetection(bucket, key, documentId);

      console.log(`Started Textract job ${jobId} for document ${documentId}`);

      // Update document with job ID for tracking
      await updateDocumentProcessing(documentId, jobId, needsAnalysis ? 'analysis' : 'detection');

    } catch (error) {
      console.error('Error processing document upload:', error);

      // Update document status to failed
      if (record.s3.object.key.includes('documents/')) {
        const documentId = record.s3.object.key.split('/')[1];
        try {
          await updateDocumentStatus(documentId, 'failed', `Processing error: ${error.message}`);
        } catch (dbError) {
          console.error('Error updating failed document status:', dbError);
        }
      }
    }
  }
};

function isComplexDocument(fileName: string): boolean {
  const extension = fileName.toLowerCase().split('.').pop();

  // PDF files and insurance cards typically need full analysis for form detection
  return extension === 'pdf' || fileName.toLowerCase().includes('insurance') || fileName.toLowerCase().includes('card');
}

async function startDocumentAnalysis(bucket: string, key: string, documentId: string): Promise<string> {
  const params: StartDocumentAnalysisCommandInput = {
    DocumentLocation: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    FeatureTypes: ['FORMS', 'TABLES'],
    NotificationChannel: {
      SNSTopicArn: process.env.TEXTRACT_SNS_TOPIC_ARN!,
      RoleArn: process.env.TEXTRACT_ROLE_ARN!,
    },
    ClientRequestToken: `${documentId}-analysis-${Date.now()}`,
  };

  const command = new StartDocumentAnalysisCommand(params);
  const response = await textractClient.send(command);

  if (!response.JobId) {
    throw new Error('Failed to start document analysis - no job ID returned');
  }

  return response.JobId;
}

async function startTextDetection(bucket: string, key: string, documentId: string): Promise<string> {
  const params: StartDocumentTextDetectionCommandInput = {
    DocumentLocation: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    NotificationChannel: {
      SNSTopicArn: process.env.TEXTRACT_SNS_TOPIC_ARN!,
      RoleArn: process.env.TEXTRACT_ROLE_ARN!,
    },
    ClientRequestToken: `${documentId}-detection-${Date.now()}`,
  };

  const command = new StartDocumentTextDetectionCommand(params);
  const response = await textractClient.send(command);

  if (!response.JobId) {
    throw new Error('Failed to start text detection - no job ID returned');
  }

  return response.JobId;
}

async function updateDocumentStatus(documentId: string, status: string, message: string) {
  try {
    console.log(`Updating document ${documentId} status to: ${status}`);

    await db
      .update(documents)
      .set({
        ocrText: JSON.stringify({
          status,
          message,
          updated_at: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.log('Document status updated successfully');

  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

async function updateDocumentProcessing(documentId: string, jobId: string, jobType: string) {
  try {
    console.log(`Updating document ${documentId} with job ID: ${jobId}`);

    await db
      .update(documents)
      .set({
        ocrText: JSON.stringify({
          status: 'processing',
          job_id: jobId,
          job_type: jobType,
          started_at: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.log('Document processing info updated successfully');

  } catch (error) {
    console.error('Error updating document processing info:', error);
    throw error;
  }
}
