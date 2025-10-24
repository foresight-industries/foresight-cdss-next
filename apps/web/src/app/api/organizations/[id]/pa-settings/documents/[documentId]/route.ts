import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { teamMembers } from '@foresight-cdss-next/db';
import { and, eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const PA_DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET_NAME || 'foresight-pa-documents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId, documentId } = await params;

    // Verify user has access to this organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        isActive: teamMembers.isActive
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.organizationId, organizationId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'download' or 'preview'

    // Construct S3 key pattern for this organization
    const s3KeyPattern = `organizations/${organizationId}/pa-documents/${documentId}.`;

    // Try to find the document by looking for the S3 key pattern
    // In a real implementation, you might want to store document metadata in a database
    let s3Key: string | null = null;
    const possibleExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];

    for (const ext of possibleExtensions) {
      const testKey = `${s3KeyPattern}${ext}`;
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: PA_DOCUMENTS_BUCKET,
          Key: testKey,
        });
        await s3Client.send(headCommand);
        s3Key = testKey;
        break;
      } catch (error) {
        // Document with this extension doesn't exist, continue searching
        continue;
      }
    }

    if (!s3Key) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (action === 'download') {
      // Generate signed URL for direct download
      const getObjectCommand = new GetObjectCommand({
        Bucket: PA_DOCUMENTS_BUCKET,
        Key: s3Key,
        ResponseContentDisposition: 'attachment', // Force download
      });

      const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: 3600, // 1 hour
      });

      return NextResponse.json({
        success: true,
        data: { downloadUrl: signedUrl }
      });
    } else {
      // Generate signed URL for preview/viewing
      const getObjectCommand = new GetObjectCommand({
        Bucket: PA_DOCUMENTS_BUCKET,
        Key: s3Key,
        ResponseContentDisposition: 'inline', // Open in browser
      });

      const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: 3600, // 1 hour
      });

      return NextResponse.json({
        success: true,
        data: { viewUrl: signedUrl }
      });
    }

  } catch (error) {
    console.error('Error accessing document:', error);
    return NextResponse.json(
      { error: 'Failed to access document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId, documentId } = await params;

    // Verify user has access to this organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        isActive: teamMembers.isActive
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.organizationId, organizationId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Check if user has permission to delete documents
    if (!['Administrator', 'PA Coordinator'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete documents' },
        { status: 403 }
      );
    }

    // Find and delete the document from S3
    const s3KeyPattern = `organizations/${organizationId}/pa-documents/${documentId}.`;
    const possibleExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];

    let documentDeleted = false;
    for (const ext of possibleExtensions) {
      const testKey = `${s3KeyPattern}${ext}`;
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: PA_DOCUMENTS_BUCKET,
          Key: testKey,
        });
        await s3Client.send(headCommand);

        // Document exists, delete it
        const deleteCommand = new DeleteObjectCommand({
          Bucket: PA_DOCUMENTS_BUCKET,
          Key: testKey,
        });
        await s3Client.send(deleteCommand);
        documentDeleted = true;
        break;
      } catch (error) {
        // Document with this extension doesn't exist, continue searching
        continue;
      }
    }

    if (!documentDeleted) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
