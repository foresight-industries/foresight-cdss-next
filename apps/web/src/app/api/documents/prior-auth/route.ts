import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { priorAuths, documents } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB for medical documents
const MAX_FILES_PER_REQUEST = 10;

const UploadSchema = z.object({
  priorAuthId: z.uuid(),
  organizationId: z.uuid(),
  documentType: z.enum([
    'clinical_notes',
    'lab_results',
    'imaging_reports',
    'physician_letter',
    'medical_records',
    'prescription',
    'treatment_plan',
    'other'
  ]).optional().default('other'),
  description: z.string().max(500).optional(),
});

interface FileUploadResult {
  fileName: string;
  s3Key: string;
  uploadId: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  success: boolean;
  priorAuthId: string;
  uploadedFiles: FileUploadResult[];
  failedFiles: { fileName: string; error: string; }[];
  totalFiles: number;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | { error: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const priorAuthId = formData.get('priorAuthId') as string;
    const organizationId = formData.get('organizationId') as string;
    const documentType = formData.get('documentType') as string || 'other';
    const description = formData.get('description') as string;

    // Validate parameters
    const validation = UploadSchema.safeParse({
      priorAuthId,
      organizationId,
      documentType,
      description
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: `Invalid parameters: ${validation.error.issues.map(i => i.message).join(', ')}` },
        { status: 400 }
      );
    }

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request` },
        { status: 400 }
      );
    }

    // Verify prior auth exists and user has access
    const { db } = await createAuthenticatedDatabaseClient();
    const priorAuth = await db
      .select()
      .from(priorAuths)
      .where(eq(priorAuths.id, validation.data.priorAuthId))
      .limit(1);

    if (priorAuth.length === 0) {
      return NextResponse.json({ error: 'Prior authorization not found' }, { status: 404 });
    }

    const uploadedFiles: FileUploadResult[] = [];
    const failedFiles: { fileName: string; error: string; }[] = [];

    // Process each file
    for (const file of files) {
      try {
        // Validate file
        if (!ALLOWED_FILE_TYPES.has(file.type)) {
          failedFiles.push({
            fileName: file.name,
            error: `Unsupported file type: ${file.type}`
          });
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          failedFiles.push({
            fileName: file.name,
            error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`
          });
          continue;
        }

        if (file.size === 0) {
          failedFiles.push({
            fileName: file.name,
            error: 'Empty file'
          });
          continue;
        }

        // Generate unique upload ID and S3 key
        const uploadId = crypto.randomUUID();
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const s3Key = `prior-auth-docs/${validation.data.priorAuthId}/${validation.data.organizationId}/${validation.data.documentType}/${timestamp}-${uploadId}-${sanitizedFileName}`;

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3
        const putObjectCommand = new PutObjectCommand({
          Bucket: process.env.DOCUMENTS_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            uploadId,
            priorAuthId: validation.data.priorAuthId,
            organizationId: validation.data.organizationId,
            documentType: validation.data.documentType,
            description: validation.data.description || '',
            userId,
            originalFileName: file.name,
            uploadTimestamp: timestamp.toString(),
            processingRequired: 'false', // These are supporting docs, no processing needed
          },
          ServerSideEncryption: 'AES256',
        });

        await s3Client.send(putObjectCommand);

        // Record upload in database for tracking
        await db.insert(documents).values({
          uploadId,
          organizationId: validation.data.organizationId,
          priorAuthId: validation.data.priorAuthId,
          fileName: file.name,
          originalFileName: file.name,
          s3Key,
          s3Bucket: process.env.DOCUMENTS_BUCKET_NAME!,
          mimeType: file.type,
          fileSize: file.size,
          documentType: 'prior_auth',
          description: `${validation.data.documentType} - ${validation.data.description || file.name}`,
          processingStatus: 'completed', // Supporting docs don't need processing
          uploadedBy: userId,
        });

        uploadedFiles.push({
          fileName: file.name,
          s3Key,
          uploadId,
          size: file.size,
          contentType: file.type,
        });

        console.log(`Prior auth document uploaded successfully: ${s3Key}`);

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        failedFiles.push({
          fileName: file.name,
          error: 'Upload failed due to server error'
        });
      }
    }

    // Return results
    const successCount = uploadedFiles.length;
    const failureCount = failedFiles.length;

    return NextResponse.json({
      success: successCount > 0,
      priorAuthId: validation.data.priorAuthId,
      uploadedFiles,
      failedFiles,
      totalFiles: files.length,
      message: `Upload completed: ${successCount} successful, ${failureCount} failed`,
    });

  } catch (error) {
    console.error('Prior auth document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const priorAuthId = searchParams.get('priorAuthId');

    if (!priorAuthId) {
      return NextResponse.json({ error: 'Prior auth ID required' }, { status: 400 });
    }

    // Verify prior auth exists and user has access
    const { db } = await createAuthenticatedDatabaseClient();
    const priorAuth = await db
      .select()
      .from(priorAuths)
      .where(eq(priorAuths.id, priorAuthId))
      .limit(1);

    if (priorAuth.length === 0) {
      return NextResponse.json({ error: 'Prior authorization not found' }, { status: 404 });
    }

    // Query all documents for this prior auth
    const priorAuthDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.priorAuthId, priorAuthId))
      .orderBy(documents.createdAt);

    return NextResponse.json({
      priorAuthId,
      documents: priorAuthDocs.map(doc => ({
        uploadId: doc.uploadId,
        fileName: doc.originalFileName,
        description: doc.description,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.createdAt,
        status: doc.processingStatus || 'completed',
      })),
      totalDocuments: priorAuthDocs.length,
      message: `Found ${priorAuthDocs.length} documents for prior authorization`,
    });

  } catch (error) {
    console.error('Document listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
