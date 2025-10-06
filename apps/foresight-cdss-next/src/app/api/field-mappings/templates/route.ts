import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
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

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type') as EntityType;
    const ehrSystemId = searchParams.get('ehr_system_id');
    const defaultOnly = searchParams.get('default_only') === 'true';

    // Build query
    let query = supabase
      .from('field_mapping_template')
      .select(`
        *,
        ehr_system:ehr_system_id (
          id,
          name,
          system_type
        )
      `)
      .order('is_default desc, name');

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (ehrSystemId) {
      query = query.eq('ehr_system_id', ehrSystemId);
    }

    if (defaultOnly) {
      query = query.eq('is_default', true);
    }

    const { data: templates, error } = await query;

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

    const supabase = await createSupabaseServerClient();
    const body: CreateMappingTemplateRequest = await request.json();

    // Validate request body
    const {
      name,
      ehr_system_id,
      entity_type,
      mappings,
      transformations,
      is_default
    } = body;

    if (!name || !mappings || mappings.length === 0) {
      return NextResponse.json({
        error: 'Missing required fields: name, mappings'
      }, { status: 400 });
    }

    // Get user's current team and verify admin permissions
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Check if template with same name already exists
    const { data: existingTemplate } = await supabase
      .from('field_mapping_template')
      .select('id')
      .eq('name', name)
      .eq('ehr_system_id', ehr_system_id || '')
      .eq('entity_type', entity_type || '')
      .single();

    if (existingTemplate) {
      return NextResponse.json({
        error: 'Template with this name already exists'
      }, { status: 409 });
    }

    // Validate EHR system if specified
    if (ehr_system_id) {
      const { data: ehrSystem } = await supabase
        .from('ehr_system')
        .select('id')
        .eq('id', ehr_system_id)
        .single();

      if (!ehrSystem) {
        return NextResponse.json({
          error: 'EHR system not found'
        }, { status: 404 });
      }
    }

    // Validate mappings structure
    for (const mapping of mappings) {
      if (!mapping.field_name || !mapping.display_name || !mapping.data_type) {
        return NextResponse.json({
          error: 'Invalid mapping definition: missing required fields'
        }, { status: 400 });
      }
    }

    // Create field mapping template
    const insertData = {
      name,
      ehr_system_id: ehr_system_id || null,
      entity_type: entity_type || null,
      mappings: mappings as any,
      transformations: (transformations || null) as any,
      is_default: is_default || null
    };

    const { data: template, error } = await supabase
      .from('field_mapping_template')
      .insert(insertData)
      .select(`
        *,
        ehr_system:ehr_system_id (
          id,
          name,
          system_type
        )
      `)
      .single();

    if (error) {
      console.error('Error creating field mapping template:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      template
    }, { status: 201 });

  } catch (error) {
    console.error('Field mapping template POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
