import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { CreateEHRConnectionRequest } from '@/types/ehr.types';

// GET - List EHR connections for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    // Get user's current team
    const { data: profile } = await supabase
      .from('user_profile')
      .select('current_team_id')
      .eq('id', userId)
      .single();

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Build query
    let query = supabase
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
          documentation_url
        )
      `)
      .eq('team_id', profile.current_team_id)
      .order('created_at', { ascending: false });

    // Filter by environment if provided
    if (environment) {
      query = query.eq('environment', environment);
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error('Error fetching EHR connections:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Remove sensitive auth data from response
    const safeConnections = connections?.map(conn => ({
      ...conn,
      auth_config: {
        type: conn.auth_config?.type,
        // Only include non-sensitive metadata
        has_credentials: !!(
          conn.auth_config?.client_id || 
          conn.auth_config?.api_key || 
          conn.auth_config?.username
        ),
        expires_at: conn.auth_config?.expires_at,
        scope: conn.auth_config?.scope
      }
    })) || [];

    return NextResponse.json({
      connections: safeConnections
    });

  } catch (error) {
    console.error('EHR connections GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new EHR connection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body: CreateEHRConnectionRequest = await request.json();

    // Validate request body
    const {
      ehr_system_id,
      connection_name,
      base_url,
      environment = 'production',
      auth_config,
      custom_headers,
      sync_config,
      metadata
    } = body;

    if (!ehr_system_id || !connection_name || !auth_config) {
      return NextResponse.json({ 
        error: 'Missing required fields: ehr_system_id, connection_name, auth_config' 
      }, { status: 400 });
    }

    // Validate auth_config based on type
    if (!auth_config.type) {
      return NextResponse.json({ 
        error: 'auth_config.type is required' 
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

    // Verify EHR system exists
    const { data: ehrSystem, error: ehrError } = await supabase
      .from('ehr_system')
      .select('id, auth_method')
      .eq('id', ehr_system_id)
      .single();

    if (ehrError || !ehrSystem) {
      return NextResponse.json({ 
        error: 'Invalid EHR system ID' 
      }, { status: 400 });
    }

    // Validate auth config matches EHR system requirements
    if (ehrSystem.auth_method !== auth_config.type) {
      return NextResponse.json({ 
        error: `EHR system requires ${ehrSystem.auth_method} authentication` 
      }, { status: 400 });
    }

    // Create default sync config if not provided
    const defaultSyncConfig = {
      enabled: false,
      sync_frequency: 'manual',
      sync_entities: [],
      batch_size: 100,
      retry_attempts: 3,
      error_threshold: 5,
      ...sync_config
    };

    // Create EHR connection
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .insert({
        team_id: member.team_id,
        ehr_system_id,
        connection_name,
        base_url,
        environment,
        status: 'inactive', // Start as inactive until tested
        auth_config,
        custom_headers,
        sync_config: defaultSyncConfig,
        metadata
      })
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

    if (error) {
      console.error('Error creating EHR connection:', error);
      if (error.code === '23505') { // Unique constraint violation
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
        has_credentials: true,
        scope: connection.auth_config?.scope
      }
    };

    return NextResponse.json({
      connection: safeConnection
    }, { status: 201 });

  } catch (error) {
    console.error('EHR connection POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}