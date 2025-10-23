import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { documents } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

function getStatusMessage(status: string, errorMessage?: string | null): string {
  switch (status) {
    case 'uploaded':
      return 'File uploaded successfully, waiting for processing to begin';
    case 'validating':
      return 'Validating document format and quality';
    case 'processing':
      return 'Processing document with OCR and data extraction';
    case 'completed':
      return 'Processing completed successfully';
    case 'failed':
      return errorMessage || 'Processing failed';
    default:
      return 'Unknown status';
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

    // Calculate total time since upload
    const totalDuration = Date.now() - new Date(uploadRecord.createdAt).getTime();

    return NextResponse.json({
      uploadId,
      status: uploadRecord.processingStatus ?? 'uploaded',
      documentType: uploadRecord.documentType,
      description: uploadRecord.description,
      originalFileName: uploadRecord.originalFileName,
      fileSize: uploadRecord.fileSize,
      mimeType: uploadRecord.mimeType,

      // Timing information
      uploadedAt: uploadRecord.createdAt,
      processingStartedAt: uploadRecord.processingStartedAt,
      processingCompletedAt: uploadRecord.processingCompletedAt,
      processingDuration: processingDuration ? `${Math.round(processingDuration / 1000)}s` : null,
      totalDuration: `${Math.round(totalDuration / 1000)}s`,

      // Processing results
      validationResult: uploadRecord.validationResult,
      extractedData: uploadRecord.extractedData,

      // Error information
      errorMessage: uploadRecord.errorMessage,
      errorDetails: uploadRecord.errorDetails,
      retryCount: uploadRecord.retryCount || 0,

      // Status message
      message: getStatusMessage(uploadRecord.processingStatus || 'uploaded', uploadRecord.errorMessage),

      // Organization context
      organizationId: uploadRecord.organizationId,
      patientId: uploadRecord.patientId,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uploadIds } = body;

    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json({ error: 'Upload IDs array required' }, { status: 400 });
    }

    if (uploadIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 upload IDs per request' }, { status: 400 });
    }

    // Query multiple document records
    const { db } = await createAuthenticatedDatabaseClient();

    // For multiple IDs, we'd need to use a more complex query
    // For now, implement single ID lookup and extend as needed
    const results = [];

    for (const uploadId of uploadIds) {
      const upload = await db
        .select()
        .from(documents)
        .where(eq(documents.uploadId, uploadId))
        .limit(1);

      if (upload.length > 0) {
        const uploadRecord = upload[0];
        const processingDuration = uploadRecord.processingStartedAt && uploadRecord.processingCompletedAt
          ? new Date(uploadRecord.processingCompletedAt).getTime() - new Date(uploadRecord.processingStartedAt).getTime()
          : null;

        results.push({
          uploadId,
          status: uploadRecord.processingStatus || 'uploaded',
          documentType: uploadRecord.documentType,
          originalFileName: uploadRecord.originalFileName,
          processingDuration: processingDuration ? `${Math.round(processingDuration / 1000)}s` : null,
          message: getStatusMessage(uploadRecord.processingStatus || 'uploaded', uploadRecord.errorMessage),
          uploadedAt: uploadRecord.createdAt,
          processingCompletedAt: uploadRecord.processingCompletedAt,
        });
      } else {
        results.push({
          uploadId,
          status: 'not_found',
          message: 'Upload not found',
        });
      }
    }

    return NextResponse.json({
      results,
      totalRequested: uploadIds.length,
      found: results.filter(r => r.status !== 'not_found').length,
    });

  } catch (error) {
    console.error('Batch status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
