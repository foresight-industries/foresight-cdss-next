import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeSelect } from '@/lib/aws/database';
import { organizationPaSettings, teamMembers, payers } from '@foresight-cdss-next/db';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const payerOverrideSchema = z.object({
  payerId: z.string().min(1),
  payerName: z.string().min(1),
  autoAttach: z.boolean().default(true),
  submissionTypes: z.array(z.enum(['epa', 'manual', 'fax'])).default(['epa', 'manual']),
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
  })).default([]),
  settings: z.record(z.any(), z.any()).optional(),
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

    if (!paSettings) {
      return NextResponse.json(
        { error: 'PA settings not found' },
        { status: 404 }
      );
    }

    // Get available payers
    const { data: availablePayers } = await safeSelect(async () =>
      db.select({
        id: payers.id,
        name: payers.name,
        payerId: payers.payerId,
        supportsPriorAuth: payers.supportsPriorAuth,
      })
      .from(payers)
      .where(isNull(payers.deletedAt))
    );

    const payerOverrides = paSettings?.payerSpecificSettings || {};

    return NextResponse.json({
      success: true,
      data: {
        payerOverrides,
        availablePayers: availablePayers || [],
      }
    });

  } catch (error) {
    console.error('Error fetching payer overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Check permissions
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage payer overrides' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = payerOverrideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const newOverride = validation.data;

    // Get current PA settings
    const { data: paSettings } = await safeSingle(async () =>
      db.select()
      .from(organizationPaSettings)
      .where(and(
        eq(organizationPaSettings.organizationId, organizationId),
        eq(organizationPaSettings.isActive, true)
      ))
    );

    const currentOverrides = (paSettings?.payerSpecificSettings as Record<string, any>) || {};

    // Transform newOverride to match schema structure
    const payerSetting = {
      defaultDocuments: newOverride.documents.map(doc => doc.s3Key),
      autoAttachEnabled: newOverride.autoAttach,
      documentCategories: {}, // Can be extended based on requirements
    };

    // Update payer-specific settings
    const updatedOverrides = {
      ...currentOverrides,
      [newOverride.payerId]: payerSetting
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
      // If no settings exist, create them
      await db.insert(organizationPaSettings)
        .values({
          organizationId,
          autoAttachEnabled: true,
          defaultDocuments: [],
          documentCategories: {},
          payerSpecificSettings: { [newOverride.payerId]: payerSetting },
          createdBy: userId,
          updatedBy: userId,
        });
    }

    return NextResponse.json({
      success: true,
      data: { payerOverride: newOverride }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payer override:', error);
    return NextResponse.json(
      { error: 'Failed to create payer override' },
      { status: 500 }
    );
  }
}
