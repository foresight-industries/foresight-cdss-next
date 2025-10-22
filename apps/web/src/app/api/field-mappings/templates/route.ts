import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, desc } from 'drizzle-orm';
import { teamMembers, fieldMappingTemplates } from '@foresight-cdss-next/db';
import type {
  CreateMappingTemplateRequest,
  EntityType
} from '@/types/field-mapping.types';

// GET - List field mapping templates
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type') as EntityType;
    const defaultOnly = searchParams.get('default_only') === 'true';

    // Build where conditions
    const whereConditions: any[] = [];
    if (entityType) {
      whereConditions.push(eq(fieldMappingTemplates.sourceEntity, entityType));
    }
    if (defaultOnly) {
      whereConditions.push(eq(fieldMappingTemplates.isDefault, true));
    }

    const { data: templates, error } = await safeSelect(async () =>
      db.select({
        id: fieldMappingTemplates.id,
        organizationId: fieldMappingTemplates.organizationId,
        templateName: fieldMappingTemplates.templateName,
        description: fieldMappingTemplates.description,
        sourceSystem: fieldMappingTemplates.sourceSystem,
        targetSystem: fieldMappingTemplates.targetSystem,
        sourceEntity: fieldMappingTemplates.sourceEntity,
        targetEntity: fieldMappingTemplates.targetEntity,
        fieldMappings: fieldMappingTemplates.fieldMappings,
        transformationRules: fieldMappingTemplates.transformationRules,
        validationRules: fieldMappingTemplates.validationRules,
        version: fieldMappingTemplates.version,
        isDefault: fieldMappingTemplates.isDefault,
        isActive: fieldMappingTemplates.isActive,
        usageCount: fieldMappingTemplates.usageCount,
        createdAt: fieldMappingTemplates.createdAt,
        updatedAt: fieldMappingTemplates.updatedAt
      })
      .from(fieldMappingTemplates)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(fieldMappingTemplates.isDefault), fieldMappingTemplates.templateName)
    );

    if (error) {
      console.error('Error fetching field mapping templates:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      templates: templates || []
    });

  } catch (error) {
    console.error('Field mapping templates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new field mapping template
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body: CreateMappingTemplateRequest = await request.json();

    // Validate request body
    const bodyAny = body as any;
    const {
      name,
      source_system,
      target_system,
      source_entity,
      target_entity,
      field_mappings,
      transformation_rules,
      validation_rules,
      is_default
    } = bodyAny;

    if (!name || !field_mappings || field_mappings.length === 0) {
      return NextResponse.json({
        error: 'Missing required fields: name, field_mappings'
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

    // Check if template with same name already exists
    const { data: existingTemplate } = await safeSingle(async () =>
      db.select({ id: fieldMappingTemplates.id })
        .from(fieldMappingTemplates)
        .where(and(
          eq(fieldMappingTemplates.templateName, name),
          eq(fieldMappingTemplates.organizationId, (member[0] as any).organizationId),
          eq(fieldMappingTemplates.sourceSystem, source_system || ''),
          eq(fieldMappingTemplates.sourceEntity, source_entity || '')
        ))
    );

    if (existingTemplate) {
      return NextResponse.json({
        error: 'Template with this name already exists'
      }, { status: 409 });
    }

    // Validate mappings structure
    for (const mapping of field_mappings) {
      if (!mapping.source_field || !mapping.target_field) {
        return NextResponse.json({
          error: 'Invalid mapping definition: missing source_field or target_field'
        }, { status: 400 });
      }
    }

    // Create field mapping template
    const { data: template, error } = await safeInsert(async () =>
      db.insert(fieldMappingTemplates)
        .values({
          organizationId: (member[0] as any).organizationId,
          templateName: name,
          description: bodyAny.description || null,
          sourceSystem: source_system || 'unknown',
          targetSystem: target_system || 'foresight',
          sourceEntity: source_entity || 'generic',
          targetEntity: target_entity || 'generic',
          fieldMappings: field_mappings,
          transformationRules: transformation_rules || null,
          validationRules: validation_rules || null,
          isDefault: is_default || false
        })
        .returning({
          id: fieldMappingTemplates.id,
          organizationId: fieldMappingTemplates.organizationId,
          templateName: fieldMappingTemplates.templateName,
          description: fieldMappingTemplates.description,
          sourceSystem: fieldMappingTemplates.sourceSystem,
          targetSystem: fieldMappingTemplates.targetSystem,
          sourceEntity: fieldMappingTemplates.sourceEntity,
          targetEntity: fieldMappingTemplates.targetEntity,
          fieldMappings: fieldMappingTemplates.fieldMappings,
          transformationRules: fieldMappingTemplates.transformationRules,
          validationRules: fieldMappingTemplates.validationRules,
          version: fieldMappingTemplates.version,
          isDefault: fieldMappingTemplates.isDefault,
          isActive: fieldMappingTemplates.isActive,
          usageCount: fieldMappingTemplates.usageCount,
          createdAt: fieldMappingTemplates.createdAt,
          updatedAt: fieldMappingTemplates.updatedAt
        })
    );

    if (error || !template || template.length === 0) {
      console.error('Error creating field mapping template:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      template: template[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Field mapping template POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
