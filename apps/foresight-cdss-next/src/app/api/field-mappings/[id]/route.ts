import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
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

    const supabase = await createSupabaseServerClient();
    const mappingId = params.id;

    // Verify user has access to this mapping
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Get field mapping with related data
    const { data: mapping, error } = await supabase
      .from('custom_field_mapping')
      .select(`
        *,
        ehr_connection:ehr_connection_id (
          id,
          name,
          system_type,
          environment
        )
      `)
      .eq('id', mappingId)
      .eq('team_id', member?.team_id ?? '')
      .single();

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

    const supabase = await createSupabaseServerClient();
    const mappingId = params.id;
    const body: UpdateFieldMappingRequest = await request.json();

    // Validate permissions
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

    // Verify mapping exists and belongs to user's team
    const { data: existingMapping } = await supabase
      .from('custom_field_mapping')
      .select('id, team_id, source_path, entity_type')
      .eq('id', mappingId)
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (!existingMapping) {
      return NextResponse.json({ error: 'Field mapping not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = [
      'source_path', 'target_table', 'target_column',
      'transformation_rules', 'validation_rules', 'is_active'
    ];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Check for conflicts if updating source_path
    if (updates.source_path && updates.source_path !== existingMapping.source_path) {
      const { data: conflictMapping } = await supabase
        .from('custom_field_mapping')
        .select('id')
        .eq('team_id', member?.team_id ?? '')
        .eq('entity_type', existingMapping.entity_type)
        .eq('source_path', updates.source_path)
        .neq('id', mappingId)
        .single();

      if (conflictMapping) {
        return NextResponse.json({
          error: 'Another mapping already exists for this source path'
        }, { status: 409 });
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update field mapping
    const { data: mapping, error } = await supabase
      .from('custom_field_mapping')
      .update(updates)
      .eq('id', mappingId)
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
      console.error('Error updating field mapping:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      mapping
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

    const supabase = await createSupabaseServerClient();
    const mappingId = params.id;

    // Validate permissions
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

    // Verify mapping belongs to user's team and delete
    const { data: mapping, error } = await supabase
      .from('custom_field_mapping')
      .delete()
      .eq('id', mappingId)
      .eq('team_id', member?.team_id ?? '')
      .select('id, source_path, entity_type')
      .single();

    if (error || !mapping) {
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
