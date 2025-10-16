import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { documents } from '@foresight-cdss-next/db/schema';
import { eq } from 'drizzle-orm';

const rdsClient = new RDSDataClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

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

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // GET /documents/{id}/status - Get document processing status
    if (method === 'GET' && path.match(/\/documents\/([^/]+)\/status$/)) {
      const documentId = event.pathParameters?.id;

      if (!documentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Document ID is required' }),
        };
      }

      const document = await db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          documentType: documents.documentType,
          ocrText: documents.ocrText,
          metadata: documents.metadata,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!document.length) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Document not found' }),
        };
      }

      const doc = document[0];

      // Parse processing status from ocrText and notes
      let processingStatus = 'unknown';
      let extractedData = null;
      let jobInfo = null;

      try {
        if (doc.ocrText) {
          jobInfo = JSON.parse(doc.ocrText);
          processingStatus = jobInfo.status || 'unknown';
        }

        if (doc.metadata) {
          extractedData = doc.metadata;
          if (extractedData.status) {
            processingStatus = extractedData.status;
          }
        }
      } catch (parseError) {
        console.warn('Error parsing document metadata:', parseError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          processingStatus,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          jobInfo,
          extractedData,
        }),
      };
    }

    // GET /documents/{id}/extracted-fields - Get extracted fields
    if (method === 'GET' && path.match(/\/documents\/([^/]+)\/extracted-fields$/)) {
      const documentId = event.pathParameters?.id;

      if (!documentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Document ID is required' }),
        };
      }

      const document = await db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          documentType: documents.documentType,
          metadata: documents.metadata,
        })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!document.length) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Document not found' }),
        };
      }

      const doc = document[0];
      let extractedFields = [];
      let classification = null;

      try {
        if (doc.metadata) {
          const extractedData = doc.metadata;
          extractedFields = extractedData.fields || [];
          classification = {
            type: extractedData.classification,
            confidence: extractedData.confidence,
          };
        }
      } catch (parseError) {
        console.warn('Error parsing extracted data:', parseError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          classification,
          extractedFields: extractedFields.map((field: any) => ({
            category: field.category,
            value: field.value,
            confidence: field.confidence,
            boundingBox: field.boundingBox,
          })),
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error: any) {
    console.error('Error in document status API:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
