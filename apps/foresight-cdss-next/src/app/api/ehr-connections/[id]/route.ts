import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { UpdateEhrConnectionRequest } from '@/types/ehr-connection.types';

// GET - Get specific EHR connection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const connectionId = params.id;

    // Verify user has access to this connection
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Get EHR connection with related data
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .select(`
        *,
        ehr_system:ehr_system_id (
          id,
          name,
          display_name,
          api_type,
          auth_method,
          fhir_version,
          capabilities,
          rate_limits,
          documentation_url
        )
      `)
      .eq('id', connectionId)
      .eq('team_id', member.team_id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'EHR connection not found' }, { status: 404 });
    }

    // Get integration health data
    const { data: health } = await supabase
      .from('integration_health')
      .select('*')
      .eq('connection_id', connectionId)
      .single();

    // Get recent sync jobs
    const { data: recentJobs } = await supabase
      .from('sync_job')
      .select('*')
      .eq('ehr_connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      connection: {
        ...connection,
        health,
        recent_jobs: recentJobs || []
      }
    });

  } catch (error) {
    console.error('EHR connection GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update EHR connection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const connectionId = params.id;
    const body: UpdateEhrConnectionRequest = await request.json();

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

    // Verify connection exists and belongs to user's team
    const { data: existingConnection } = await supabase
      .from('ehr_connection')
      .select('id, team_id, connection_name')
      .eq('id', connectionId)
      .eq('team_id', member.team_id)
      .single();

    if (!existingConnection) {
      return NextResponse.json({ error: 'EHR connection not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = [
      'connection_name', 'environment', 'base_url', 'auth_config',
      'sync_config', 'custom_headers', 'metadata', 'status'
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

    // Check for name conflicts if updating connection_name
    if (updates.connection_name && updates.connection_name !== existingConnection.connection_name) {
      const { data: conflictConnection } = await supabase
        .from('ehr_connection')
        .select('id')
        .eq('team_id', member.team_id)
        .eq('connection_name', updates.connection_name)
        .neq('id', connectionId)
        .single();

      if (conflictConnection) {
        return NextResponse.json({ 
          error: 'Another connection already exists with this name' 
        }, { status: 409 });
      }
    }

    // Validate base_url if provided
    if (updates.base_url) {
      try {
        new URL(updates.base_url);
      } catch {
        return NextResponse.json({ error: 'Invalid base URL format' }, { status: 400 });
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update EHR connection
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .update(updates)
      .eq('id', connectionId)
      .select(`
        *,
        ehr_system:ehr_system_id (
          id,
          name,
          display_name,
          api_type,
          auth_method,
          fhir_version
        )
      `)
      .single();

    if (error) {
      console.error('Error updating EHR connection:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      connection
    });

  } catch (error) {
    console.error('EHR connection PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete EHR connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const connectionId = params.id;

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

    // Check if connection has active sync jobs
    const { data: activeSyncJobs } = await supabase
      .from('sync_job')
      .select('id')
      .eq('ehr_connection_id', connectionId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (activeSyncJobs && activeSyncJobs.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete connection with active sync jobs. Please wait for jobs to complete or cancel them first.' 
      }, { status: 400 });
    }

    // Check if connection is referenced by field mappings
    const { data: fieldMappings } = await supabase
      .from('custom_field_mapping')
      .select('id')
      .eq('ehr_connection_id', connectionId)
      .limit(1);

    if (fieldMappings && fieldMappings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete connection that is referenced by field mappings. Please remove field mappings first.' 
      }, { status: 400 });
    }

    // Verify connection belongs to user's team and delete
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .delete()
      .eq('id', connectionId)
      .eq('team_id', member.team_id)
      .select('id, connection_name')
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'EHR connection not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'EHR connection deleted successfully',
      connection_id: connectionId
    });

  } catch (error) {
    console.error('EHR connection DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}