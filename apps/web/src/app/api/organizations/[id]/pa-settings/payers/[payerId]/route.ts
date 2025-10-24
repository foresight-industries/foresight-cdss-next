import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { organizationPaSettings, teamMembers } from '@foresight-cdss-next/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePayerOverrideSchema = z.object({
  payerName: z.string().min(1).optional(),
  autoAttach: z.boolean().optional(),
  submissionTypes: z.array(z.enum(['epa', 'manual', 'fax'])).optional(),
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    s3Key: z.string(),
    s3Bucket: z.string(),
    uploadedAt: z.string(),
    uploadedBy: z.string(),
    metadata: z.record(z.any(), z.any()).optional(),
  })).optional(),
  settings: z.record(z.any(), z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payerId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId, payerId } = await params;

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

    if (!paSettings) {
      return NextResponse.json(
        { error: 'PA settings not found' },
        { status: 404 }
      );
    }

    const payerOverrides = (paSettings.payerSpecificSettings as Record<string, any>) || {};
    const payerOverride = payerOverrides[payerId];

    if (!payerOverride) {
      return NextResponse.json(
        { error: 'Payer override not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { payerOverride }
    });

  } catch (error) {
    console.error('Error fetching payer override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payerId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId, payerId } = await params;

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

    // Check permissions
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update payer overrides' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updatePayerOverrideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Get current PA settings
    const { data: paSettings } = await safeSingle(async () =>
      db.select()
      .from(organizationPaSettings)
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
    );

    if (!paSettings) {
      return NextResponse.json(
        { error: 'PA settings not found' },
        { status: 404 }
      );
    }

    const currentOverrides = (paSettings.payerSpecificSettings as Record<string, any>) || {};
    
    if (!currentOverrides[payerId]) {
      return NextResponse.json(
        { error: 'Payer override not found' },
        { status: 404 }
      );
    }

    // Transform updates to match schema structure
    const updatedPayerSetting = {
      ...currentOverrides[payerId],
      ...(updates.documents && { defaultDocuments: updates.documents.map(doc => doc.s3Key) }),
      ...(updates.autoAttach !== undefined && { autoAttachEnabled: updates.autoAttach }),
    };

    const updatedOverrides = {
      ...currentOverrides,
      [payerId]: updatedPayerSetting
    };

    // Update the PA settings
    const result = await db.update(organizationPaSettings)
      .set({
        payerSpecificSettings: updatedOverrides,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
      .returning();

    if (!result[0]) {
      throw new Error('Failed to update payer override');
    }

    return NextResponse.json({
      success: true,
      data: { payerOverride: updatedPayerSetting }
    });

  } catch (error) {
    console.error('Error updating payer override:', error);
    return NextResponse.json(
      { error: 'Failed to update payer override' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payerId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { id: organizationId, payerId } = await params;

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

    // Check permissions
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete payer overrides' },
        { status: 403 }
      );
    }

    // Get current PA settings
    const { data: paSettings } = await safeSingle(async () =>
      db.select()
      .from(organizationPaSettings)
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
    );

    if (!paSettings) {
      return NextResponse.json(
        { error: 'PA settings not found' },
        { status: 404 }
      );
    }

    const currentOverrides = (paSettings.payerSpecificSettings as Record<string, any>) || {};
    
    if (!currentOverrides[payerId]) {
      return NextResponse.json(
        { error: 'Payer override not found' },
        { status: 404 }
      );
    }

    // Remove the payer override
    const updatedOverrides = { ...currentOverrides };
    delete updatedOverrides[payerId];

    // Update the PA settings
    const result = await db.update(organizationPaSettings)
      .set({
        payerSpecificSettings: updatedOverrides,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
      .returning();

    if (!result[0]) {
      throw new Error('Failed to delete payer override');
    }

    return NextResponse.json({
      success: true,
      message: 'Payer override deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payer override:', error);
    return NextResponse.json(
      { error: 'Failed to delete payer override' },
      { status: 500 }
    );
  }
}
