import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, asc } from 'drizzle-orm';
import { teamMembers, customFieldMappings } from '@foresight-cdss-next/db';
import type { CreateFieldMappingRequest } from '@/types/field-mapping.types';

// GET - List field mappings for current team
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    // Get user's current team
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

    // Build where conditions
    const whereConditions: any[] = [];
    if (activeOnly) {
      whereConditions.push(eq(customFieldMappings.isActive, true));
    }

    const { data: mappings, error } = await safeSelect(async () =>
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(asc(customFieldMappings.ehrSystem), asc(customFieldMappings.ehrFieldPath))
    );

    if (error) {
      console.error('Error fetching field mappings:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get mapping statistics
    const { data: stats } = await safeSelect(async () =>
      db.select({
        ehrSystem: customFieldMappings.ehrSystem,
        isActive: customFieldMappings.isActive
      })
      .from(customFieldMappings)
    );

    const mappingStats = {
      total_mappings: stats?.length || 0,
      active_mappings: stats?.filter((s: any) => s.isActive).length || 0,
      by_ehr_system: stats?.reduce((acc: any, s: any) => {
        if (s.ehrSystem) {
          acc[s.ehrSystem] = (acc[s.ehrSystem] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {},
      validation_errors: 0 // TODO: Calculate based on validation rules
    };

    return NextResponse.json({
      mappings: mappings || [],
      stats: mappingStats
    });

  } catch (error) {
    console.error('Field mappings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new field mapping
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body: CreateFieldMappingRequest = await request.json();

    // Validate request body
    const bodyAny = body as any;
    const {
      ehr_system,
      ehr_field_path,
      transformation_rules,
      custom_field_id
    } = bodyAny;

    if (!ehr_system || !ehr_field_path) {
      return NextResponse.json({
        error: 'Missing required fields: ehr_system, ehr_field_path'
      }, { status: 400 });
    }

    // Get user's team and verify admin permissions
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

    // Check if mapping already exists
    const { data: existingMapping } = await safeSelect(async () =>
      db.select({ id: customFieldMappings.id })
        .from(customFieldMappings)
        .where(and(
          eq(customFieldMappings.ehrSystem, ehr_system),
          eq(customFieldMappings.ehrFieldPath, ehr_field_path)
        ))
        .limit(1)
    );

    if (existingMapping && existingMapping.length > 0) {
      return NextResponse.json({
        error: 'Field mapping already exists for this EHR field path'
      }, { status: 409 });
    }

    // Create field mapping
    const { data: mapping, error } = await safeInsert(async () =>
      db.insert(customFieldMappings)
        .values({
          customFieldId: custom_field_id || null,
          ehrSystem: ehr_system,
          ehrFieldPath: ehr_field_path,
          transformationRules: transformation_rules || null,
          isActive: true
        })
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
      console.error('Error creating field mapping:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      mapping: mapping[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Field mapping POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
