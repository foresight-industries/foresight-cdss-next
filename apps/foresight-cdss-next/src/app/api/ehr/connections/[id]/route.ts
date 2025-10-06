import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type {
  UpdateEHRConnectionRequest,
  EHRAuthConfig,
  EHRConnection,
} from "@/types/ehr.types";

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

    const supabase = await createSupabaseServerClient();
    const connectionId = params.id;

    // Get connection with team verification
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .select(`
        *,
        ehr_system (
          id,
          name,
          display_name,
          api_type,
          auth_method,
          fhir_version,
          documentation_url,
          capabilities
        ),
        team!inner(id, name, slug)
      `)
      .eq('id', connectionId)
      .eq('team.team_member.user_id', userId)
      .eq('team.team_member.status', 'active')
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Cast auth_config to proper type and remove sensitive auth data
    const authConfig = connection.auth_config as unknown as EHRAuthConfig;
    const safeConnection = {
      ...connection,
      auth_config: {
        type: authConfig?.type,
        // Include field names but not values for form population
        client_id: authConfig?.client_id ? '••••••••' : undefined,
        api_key: authConfig?.api_key ? '••••••••' : undefined,
        username: authConfig?.username || undefined,
        authorization_url: authConfig?.authorization_url,
        token_url: authConfig?.token_url,
        scope: authConfig?.scope,
        api_key_header: authConfig?.api_key_header,
        expires_at: authConfig?.expires_at,
        has_credentials: !!(
          authConfig?.client_id ||
          authConfig?.api_key ||
          authConfig?.username
        )
      }
    };

    return NextResponse.json({
      connection: safeConnection
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

    const supabase = await createSupabaseServerClient();
    const connectionId = params.id;
    const body: UpdateEHRConnectionRequest = await request.json();

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

    // Verify connection belongs to user's team
    const { data: existingConnection } = await supabase
      .from('ehr_connection')
      .select('team_id, auth_config, ehr_system_id')
      .eq('id', connectionId)
      .single();

    if (!existingConnection || existingConnection.team_id !== member.team_id) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = [
      'connection_name', 'base_url', 'environment', 'status',
      'auth_config', 'custom_headers', 'sync_config', 'metadata'
    ];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = value;
      }
    }

    // Handle auth_config updates carefully
    if (updates.auth_config) {
      const currentAuthConfig = (existingConnection.auth_config || {}) as unknown as EHRAuthConfig;
      const newAuthConfig = { ...currentAuthConfig } as Record<string, any>;

      // Only update fields that are provided and not masked
      for (const [key, value] of Object.entries(updates.auth_config)) {
        if (value !== undefined && value !== '••••••••') {
          newAuthConfig[key] = value;
        }
      }

      updates.auth_config = newAuthConfig as EHRAuthConfig;
    }

    // Validate environment if provided
    if (updates.environment && !['development', 'staging', 'production'].includes(updates.environment)) {
      return NextResponse.json({
        error: 'Invalid environment. Must be development, staging, or production'
      }, { status: 400 });
    }

    // Validate status if provided
    if (updates.status && !['active', 'inactive', 'testing', 'error'].includes(updates.status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be active, inactive, testing, or error'
      }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update connection
    const { data, error } = await supabase
      .from('ehr_connection')
      .update(updates)
      .eq('id', connectionId)
      .select(`
        *,
        ehr_system (
          id,
          name,
          display_name,
          api_type,
          auth_method,
          fhir_version
        )
      `)
      .single();

    const connection = data as unknown as EHRConnection;

    if (error) {
      console.error('Error updating EHR connection:', error);
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'Connection name already exists for this team'
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Remove sensitive auth data from response
    const safeConnection = {
      ...connection,
      auth_config: {
        type: connection.auth_config?.type,
        has_credentials: !!(
          connection.auth_config?.client_id ||
          connection.auth_config?.api_key ||
          connection.auth_config?.username
        ),
        scope: connection.auth_config?.scope
      }
    };

    return NextResponse.json({
      connection: safeConnection
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

    const supabase = await createSupabaseServerClient();
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

    // Check if connection has any active sync jobs
    const { data: activeSyncJobs } = await supabase
      .from('sync_job')
      .select('id')
      .eq('ehr_connection_id', connectionId)
      .in('status', ['pending', 'running'])
      .limit(1);

    if (activeSyncJobs && activeSyncJobs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete connection with active sync jobs. Please stop all sync jobs first.'
      }, { status: 400 });
    }

    // Verify connection belongs to user's team and delete
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .delete()
      .eq('id', connectionId)
      .eq('team_id', member?.team_id ?? '')
      .select()
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
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
