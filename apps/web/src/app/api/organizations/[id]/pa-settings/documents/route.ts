import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { teamMembers } from '@foresight-cdss-next/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const uploadDocumentSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  category: z.string().optional(),
  metadata: z.record(z.any(), z.any()).optional(),
});

const deleteDocumentSchema = z.object({
  s3Key: z.string().min(1),
  s3Bucket: z.string().min(1),
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const PA_DOCUMENTS_BUCKET = process.env.PA_DOCUMENTS_S3_BUCKET || 'foresight-pa-documents';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId } = await params;

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

    // Check if user has permission to upload documents
    if (!['Administrator', 'PA Coordinator'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload documents' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        return NextResponse.json(
          { error: 'Invalid metadata format' },
          { status: 400 }
        );
      }
    }

    const validation = uploadDocumentSchema.safeParse({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      metadata,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid file data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload PDF, Word, or image files.' },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const fileExtension = file.name.split('.').pop();
    const documentId = uuidv4();
    const s3Key = `organizations/${organizationId}/pa-documents/${documentId}.${fileExtension}`;

    // Upload file to S3
    const buffer = await file.arrayBuffer();
    const uploadCommand = new PutObjectCommand({
      Bucket: PA_DOCUMENTS_BUCKET,
      Key: s3Key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      Metadata: {
        organizationId,
        uploadedBy: userId,
        originalFileName: file.name,
        ...metadata,
      },
    });

    await s3Client.send(uploadCommand);

    // Return document information
    const documentInfo = {
      id: documentId,
      name: file.name,
      fileType: file.type,
      fileSize: file.size,
      s3Key,
      s3Bucket: PA_DOCUMENTS_BUCKET,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      metadata,
    };

    return NextResponse.json({
      success: true,
      data: { document: documentInfo }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId } = await params;

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

    const body = await request.json();
    const validation = deleteDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { s3Key, s3Bucket } = validation.data;

    // Verify the document belongs to this organization
    if (!s3Key.startsWith(`organizations/${organizationId}/pa-documents/`)) {
      return NextResponse.json(
        { error: 'Document does not belong to this organization' },
        { status: 403 }
      );
    }

    // Delete file from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    });

    await s3Client.send(deleteCommand);

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
