import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { patients, documents } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const s3Client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadSchema = z.object({
  patientId: z.uuid(),
  organizationId: z.uuid(),
  cardSide: z.enum(['front', 'back']).optional().default('front'),
});

interface UploadResponse {
  success: boolean;
  uploadId: string;
  s3Key: string;
  processingStatus: 'initiated' | 'validating' | 'processing';
  message: string;
}

function getStatusMessage(status: string, errorMessage?: string | null): string {
  switch (status) {
    case 'uploaded':
      return 'File uploaded successfully, waiting for processing to begin';
    case 'validating':
      return 'Validating document format and quality';
    case 'processing':
      return 'Extracting data from insurance card using OCR';
    case 'completed':
      return 'Processing completed successfully';
    case 'failed':
      return errorMessage || 'Processing failed';
    default:
      return 'Unknown status';
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | { error: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const organizationId = formData.get('organizationId') as string;
    const cardSide = formData.get('cardSide') as string || 'front';

    // Validate input
    const validation = UploadSchema.safeParse({ patientId, organizationId, cardSide });
    if (!validation.success) {
      return NextResponse.json(
        { error: `Invalid parameters: ${validation.error.issues.map(i => i.message).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Verify patient exists and user has access
    const { db } = await createAuthenticatedDatabaseClient();
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, validation.data.patientId))
      .limit(1);

    if (patient.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Generate unique upload ID and S3 key
    const uploadId = crypto.randomUUID();
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const s3Key = `insurance-cards/${validation.data.patientId}/${validation.data.organizationId}/${validation.data.cardSide}-${timestamp}-${uploadId}.${fileExtension}`;

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
        patientId: validation.data.patientId,
        organizationId: validation.data.organizationId,
        cardSide: validation.data.cardSide,
        userId,
        originalFileName: file.name,
        uploadTimestamp: timestamp.toString(),
      },
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(putObjectCommand);

    // Record upload in database for tracking
    await db.insert(documents).values({
      uploadId,
      organizationId: validation.data.organizationId,
      patientId: validation.data.patientId,
      fileName: file.name,
      originalFileName: file.name,
      s3Key,
      s3Bucket: process.env.DOCUMENTS_BUCKET_NAME!,
      mimeType: file.type,
      fileSize: file.size,
      documentType: 'insurance_card',
      description: `Insurance card - ${validation.data.cardSide} side`,
      processingStatus: 'uploaded',
      uploadedBy: userId,
    });

    console.log(`Insurance card uploaded successfully: ${s3Key}`);

    // Return success response
    // Note: The S3 upload will automatically trigger the Lambda processing pipeline
    return NextResponse.json({
      success: true,
      uploadId,
      s3Key,
      processingStatus: 'initiated',
      message: 'Insurance card uploaded successfully. Processing will begin automatically.',
    });

  } catch (error) {
    console.error('Insurance card upload error:', error);
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
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
    }

    // Query the document record
    const { db } = await createAuthenticatedDatabaseClient();
    const upload = await db
      .select()
      .from(documents)
      .where(eq(documents.uploadId, uploadId))
      .limit(1);

    if (upload.length === 0) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const uploadRecord = upload[0];

    // Calculate processing time if applicable
    const processingDuration = uploadRecord.processingStartedAt && uploadRecord.processingCompletedAt
      ? new Date(uploadRecord.processingCompletedAt).getTime() - new Date(uploadRecord.processingStartedAt).getTime()
      : null;

    return NextResponse.json({
      uploadId,
      status: uploadRecord.processingStatus || 'uploaded',
      documentType: uploadRecord.documentType,
      description: uploadRecord.description,
      originalFileName: uploadRecord.originalFileName,
      uploadedAt: uploadRecord.createdAt,
      processingStartedAt: uploadRecord.processingStartedAt,
      processingCompletedAt: uploadRecord.processingCompletedAt,
      processingDuration: processingDuration ? `${Math.round(processingDuration / 1000)}s` : null,
      validationResult: uploadRecord.validationResult,
      extractedData: uploadRecord.extractedData,
      errorMessage: uploadRecord.errorMessage,
      retryCount: uploadRecord.retryCount || 0,
      message: getStatusMessage(uploadRecord.processingStatus || 'uploaded', uploadRecord.errorMessage),
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
