import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeUpdate } from '@/lib/aws/database';
import { organizationPaSettings, teamMembers } from '@foresight-cdss-next/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const documentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  fileType: z.string(),
  fileSize: z.number(),
  s3Key: z.string(),
  s3Bucket: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
  metadata: z.record(z.any(), z.any()).optional(),
});

const payerOverrideSchema = z.object({
  payerId: z.string(),
  payerName: z.string(),
  documents: z.array(documentSchema),
  autoAttach: z.boolean().default(true),
  submissionTypes: z.array(z.enum(['epa', 'manual', 'fax'])).default(['epa', 'manual']),
});

const paSettingsSchema = z.object({
  autoAttachDefaultDocs: z.boolean().default(true),
  requireDocumentReview: z.boolean().default(false),
  documents: z.array(documentSchema).default([]),
  categories: z.record(z.any(), z.array(documentSchema)).default({}),
  payerOverrides: z.array(payerOverrideSchema).default([]),
  settings: z.record(z.any(), z.any()).default({}),
});

export async function GET(
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

    // Get PA settings for the organization
    const { data: paSettings } = await safeSingle(async () =>
      db.select()
      .from(organizationPaSettings)
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
    );

    // Return default settings if none exist
    if (!paSettings) {
      return NextResponse.json({
        success: true,
        data: {
          autoAttachDefaultDocs: true,
          requireDocumentReview: false,
          documents: [],
          categories: {},
          payerOverrides: [],
          settings: {},
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: paSettings.id,
        autoAttachDefaultDocs: paSettings.autoAttachEnabled,
        requireDocumentReview: false, // Not in schema
        documents: paSettings.defaultDocuments || [],
        categories: paSettings.documentCategories || {},
        payerOverrides: [], // Using payerSpecificSettings instead
        settings: paSettings.payerSpecificSettings || {},
        updatedAt: paSettings.updatedAt,
        updatedBy: paSettings.updatedBy,
      }
    });

  } catch (error) {
    console.error('Error fetching PA settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Verify user has access to this organization and can edit settings
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

    // Check if user has permission to edit settings (admin or PA coordinator)
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify PA settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = paSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if settings already exist
    const { data: existingSettings } = await safeSingle(async () =>
      db.select({ id: organizationPaSettings.id })
      .from(organizationPaSettings)
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
    );

    let result: any;

    if (existingSettings) {
      // Update existing settings
      const { data: updateResult } = await safeUpdate(async () =>
        db.update(organizationPaSettings)
        .set({
          autoAttachEnabled: data.autoAttachDefaultDocs,
          defaultDocuments: data.documents.map(doc => doc.s3Key),
          documentCategories: Object.fromEntries(
            Object.entries(data.categories).map(([key, docs]) => [
              key, 
              docs.map(doc => doc.s3Key)
            ])
          ),
          payerSpecificSettings: data.settings,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(organizationPaSettings.id, existingSettings.id))
        .returning()
      );
      result = updateResult?.[0];
    } else {
      // Create new settings
      const { data: insertResult } = await safeInsert(async () =>
        db.insert(organizationPaSettings)
        .values({
          organizationId,
          autoAttachEnabled: data.autoAttachDefaultDocs,
          defaultDocuments: data.documents.map(doc => doc.s3Key),
          documentCategories: Object.fromEntries(
            Object.entries(data.categories).map(([key, docs]) => [
              key, 
              docs.map(doc => doc.s3Key)
            ])
          ),
          payerSpecificSettings: data.settings,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning()
      );
      result = insertResult?.[0];
    }

    if (!result) {
      throw new Error('Failed to save PA settings');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result?.id,
        autoAttachDefaultDocs: result?.autoAttachEnabled || false,
        requireDocumentReview: false,
        documents: result?.defaultDocuments || [],
        categories: result?.documentCategories || {},
        payerOverrides: [],
        settings: result?.payerSpecificSettings || {},
        updatedAt: result?.updatedAt,
        updatedBy: result?.updatedBy,
      }
    });

  } catch (error) {
    console.error('Error saving PA settings:', error);
    return NextResponse.json(
      { error: 'Failed to save PA settings' },
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

    // Verify user has access to this organization and can delete settings
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

    // Only administrators can delete PA settings
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only administrators can delete PA settings' },
        { status: 403 }
      );
    }

    // Soft delete the settings
    const { data: deleteResult } = await safeUpdate(async () =>
      db.update(organizationPaSettings)
      .set({
        isActive: false,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
      .returning()
    );

    if (!deleteResult?.[0]) {
      return NextResponse.json(
        { error: 'PA settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PA settings deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting PA settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete PA settings' },
      { status: 500 }
    );
  }
}
