import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { 
  CreateFieldMappingRequest, 
  CustomFieldMapping,
  EntityType 
} from '@/types/field-mapping.types';

// GET - List field mappings for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type') as EntityType;
    const ehrConnectionId = searchParams.get('ehr_connection_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    // Get user's current team
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('custom_field_mapping')
      .select(`
        *,
        ehr_connection:ehr_connection_id (
          id,
          name,
          system_type
        )
      `)
      .eq('team_id', member.team_id)
      .order('entity_type, source_path');

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    
    if (ehrConnectionId) {
      query = query.eq('ehr_connection_id', ehrConnectionId);
    }
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: mappings, error } = await query;

    if (error) {
      console.error('Error fetching field mappings:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get mapping statistics
    const { data: stats } = await supabase
      .from('custom_field_mapping')
      .select('entity_type, is_active, ehr_connection_id')
      .eq('team_id', member.team_id);

    const mappingStats = {
      total_mappings: stats?.length || 0,
      active_mappings: stats?.filter(s => s.is_active).length || 0,
      by_entity_type: stats?.reduce((acc, s) => {
        acc[s.entity_type] = (acc[s.entity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      by_ehr_system: stats?.reduce((acc, s) => {
        if (s.ehr_connection_id) {
          acc[s.ehr_connection_id] = (acc[s.ehr_connection_id] || 0) + 1;
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
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body: CreateFieldMappingRequest = await request.json();

    // Validate request body
    const {
      entity_type,
      source_path,
      target_table,
      target_column,
      transformation_rules,
      validation_rules,
      ehr_connection_id
    } = body;

    if (!entity_type || !source_path) {
      return NextResponse.json({ 
        error: 'Missing required fields: entity_type, source_path' 
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

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from('custom_field_mapping')
      .select('id')
      .eq('team_id', member.team_id)
      .eq('entity_type', entity_type)
      .eq('source_path', source_path)
      .eq('ehr_connection_id', ehr_connection_id || '')
      .single();

    if (existingMapping) {
      return NextResponse.json({ 
        error: 'Field mapping already exists for this source path' 
      }, { status: 409 });
    }

    // Validate EHR connection if specified
    if (ehr_connection_id) {
      const { data: ehrConnection } = await supabase
        .from('ehr_connection')
        .select('id, team_id')
        .eq('id', ehr_connection_id)
        .eq('team_id', member.team_id)
        .single();

      if (!ehrConnection) {
        return NextResponse.json({ 
          error: 'EHR connection not found or access denied' 
        }, { status: 404 });
      }
    }

    // Create field mapping
    const { data: mapping, error } = await supabase
      .from('custom_field_mapping')
      .insert({
        team_id: member.team_id,
        entity_type,
        source_path,
        target_table,
        target_column,
        transformation_rules: transformation_rules || [],
        validation_rules: validation_rules || [],
        ehr_connection_id,
        is_active: true
      })
      .select(`
        *,
        ehr_connection:ehr_connection_id (
          id,
          name,
          system_type
        )
      `)
      .single();

    if (error) {
      console.error('Error creating field mapping:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      mapping
    }, { status: 201 });

  } catch (error) {
    console.error('Field mapping POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}