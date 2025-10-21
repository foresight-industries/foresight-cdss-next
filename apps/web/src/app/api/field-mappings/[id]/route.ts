import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, ne } from 'drizzle-orm';
import { teamMembers, customFieldMappings } from '@foresight-cdss-next/db';
import type { UpdateFieldMappingRequest } from '@/types/field-mapping.types';

// GET - Get specific field mapping
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const mappingId = Number.parseInt(params.id);

    // Verify user has access to this mapping
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Get field mapping with related data
    const { data: mapping, error } = await safeSingle(async () =>
      db.select({
        id: customFieldMappings.id,
        customFieldId: customFieldMappings.customFieldId,
        ehrSystem: customFieldMappings.ehrSystem,
        ehrFieldPath: customFieldMappings.ehrFieldPath,
        transformationRules: customFieldMappings.transformationRules,
        isActive: customFieldMappings.isActive,
        createdAt: customFieldMappings.createdAt,
        updatedAt: customFieldMappings.updatedAt
      })
      .from(customFieldMappings)
      .where(eq(customFieldMappings.id, mappingId))
    );

    if (error || !mapping) {
      return NextResponse.json({ error: 'Field mapping not found' }, { status: 404 });
    }

    return NextResponse.json({
      mapping
    });

  } catch (error) {
    console.error('Field mapping GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update field mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const mappingId = Number.parseInt(params.id);
    const body: UpdateFieldMappingRequest = await request.json();

    // Validate permissions
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0 || !['super_admin', 'admin'].includes((member[0] as any).role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify mapping exists
    const { data: existingMapping } = await safeSingle(async () =>
      db.select({
        id: customFieldMappings.id,
        ehrSystem: customFieldMappings.ehrSystem,
        ehrFieldPath: customFieldMappings.ehrFieldPath
      })
      .from(customFieldMappings)
      .where(eq(customFieldMappings.id, mappingId))
    );

    if (!existingMapping) {
      return NextResponse.json({ error: 'Field mapping not found' }, { status: 404 });
    }

    // Validate update fields and map to database columns
    const updates: Partial<typeof customFieldMappings.$inferInsert> = {};
    const bodyAny = body as any;

    if (bodyAny.ehr_field_path !== undefined) {
      updates.ehrFieldPath = bodyAny.ehr_field_path;
    }
    if (bodyAny.transformation_rules !== undefined) {
      updates.transformationRules = bodyAny.transformation_rules;
    }
    if (bodyAny.is_active !== undefined) {
      updates.isActive = bodyAny.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Check for conflicts if updating ehr_field_path
    const existingMappingAny = existingMapping as any;
    if (updates.ehrFieldPath && updates.ehrFieldPath !== existingMappingAny.ehrFieldPath) {
      const { data: conflictMapping } = await safeSingle(async () =>
        db.select({ id: customFieldMappings.id })
          .from(customFieldMappings)
          .where(and(
            eq(customFieldMappings.ehrSystem, existingMappingAny.ehrSystem),
            eq(customFieldMappings.ehrFieldPath, updates.ehrFieldPath as string),
            ne(customFieldMappings.id, mappingId)
          ))
      );

      if (conflictMapping) {
        return NextResponse.json({
          error: 'Another mapping already exists for this field path'
        }, { status: 409 });
      }
    }

    // Add updated_at timestamp
    updates.updatedAt = new Date();

    // Update field mapping
    const { data: mapping, error } = await safeUpdate(async () =>
      db.update(customFieldMappings)
        .set(updates)
        .where(eq(customFieldMappings.id, mappingId))
        .returning({
          id: customFieldMappings.id,
          customFieldId: customFieldMappings.customFieldId,
          ehrSystem: customFieldMappings.ehrSystem,
          ehrFieldPath: customFieldMappings.ehrFieldPath,
          transformationRules: customFieldMappings.transformationRules,
          isActive: customFieldMappings.isActive,
          createdAt: customFieldMappings.createdAt,
          updatedAt: customFieldMappings.updatedAt
        })
    );

    if (error || !mapping || mapping.length === 0) {
      console.error('Error updating field mapping:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      mapping: mapping[0]
    });

  } catch (error) {
    console.error('Field mapping PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete field mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const mappingId = Number.parseInt(params.id);

    // Validate permissions
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0 || !['super_admin', 'admin'].includes((member[0] as any).role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Delete field mapping
    const { data: mapping, error } = await safeDelete(async () =>
      db.delete(customFieldMappings)
        .where(eq(customFieldMappings.id, mappingId))
        .returning({
          id: customFieldMappings.id,
          ehrSystem: customFieldMappings.ehrSystem,
          ehrFieldPath: customFieldMappings.ehrFieldPath
        })
    );

    if (error || !mapping || mapping.length === 0) {
      return NextResponse.json({ error: 'Field mapping not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Field mapping deleted successfully',
      mapping_id: mappingId
    });

  } catch (error) {
    console.error('Field mapping DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
