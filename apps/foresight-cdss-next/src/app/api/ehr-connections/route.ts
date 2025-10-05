import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { 
  CreateEhrConnectionRequest, 
  EhrConnection,
  EnvironmentType,
  ConnectionStatus
} from '@/types/ehr-connection.types';

// GET - List EHR connections for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') as EnvironmentType;
    const status = searchParams.get('status') as ConnectionStatus;
    const ehrSystemId = searchParams.get('ehr_system_id');

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

    // Build query for EHR connections
    let query = supabase
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
          documentation_url
        )
      `)
      .eq('team_id', member.team_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (environment) {
      query = query.eq('environment', environment);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (ehrSystemId) {
      query = query.eq('ehr_system_id', ehrSystemId);
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error('Error fetching EHR connections:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get connection statistics
    const { data: allConnections } = await supabase
      .from('ehr_connection')
      .select('environment, status, ehr_system_id')
      .eq('team_id', member.team_id);

    // Get integration health data
    const { data: healthData } = await supabase
      .from('integration_health')
      .select('*')
      .in('connection_id', (connections || []).map(c => c.id));

    // Get recent sync jobs
    const { data: recentJobs } = await supabase
      .from('sync_job')
      .select('*')
      .eq('team_id', member.team_id)
      .in('ehr_connection_id', (connections || []).map(c => c.id))
      .order('created_at', { ascending: false })
      .limit(50);

    const connectionStats = {
      total_connections: allConnections?.length || 0,
      active_connections: allConnections?.filter(c => c.status === 'active').length || 0,
      by_environment: allConnections?.reduce((acc, c) => {
        acc[c.environment || 'production'] = (acc[c.environment || 'production'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      by_status: allConnections?.reduce((acc, c) => {
        acc[c.status || 'inactive'] = (acc[c.status || 'inactive'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      by_ehr_system: allConnections?.reduce((acc, c) => {
        acc[c.ehr_system_id] = (acc[c.ehr_system_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      recent_sync_failures: recentJobs?.filter(j => j.status === 'failed').length || 0
    };

    // Enhance connections with health and job data
    const enhancedConnections = (connections || []).map(connection => ({
      ...connection,
      health: healthData?.find(h => h.connection_id === connection.id),
      recent_jobs: recentJobs?.filter(j => j.ehr_connection_id === connection.id).slice(0, 5) || []
    }));

    return NextResponse.json({
      connections: enhancedConnections,
      stats: connectionStats
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
    const body: CreateEhrConnectionRequest = await request.json();

    // Validate request body
    const {
      ehr_system_id,
      connection_name,
      environment,
      base_url,
      auth_config,
      sync_config,
      custom_headers,
      metadata
    } = body;

    if (!ehr_system_id || !connection_name || !environment) {
      return NextResponse.json({ 
        error: 'Missing required fields: ehr_system_id, connection_name, environment' 
      }, { status: 400 });
    }

    // Validate auth_config
    if (!auth_config || !auth_config.method) {
      return NextResponse.json({ 
        error: 'auth_config with method is required' 
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
    const { data: ehrSystem } = await supabase
      .from('ehr_system')
      .select('id, name, display_name')
      .eq('id', ehr_system_id)
      .eq('is_active', true)
      .single();

    if (!ehrSystem) {
      return NextResponse.json({ 
        error: 'EHR system not found or inactive' 
      }, { status: 404 });
    }

    // Check if connection with same name already exists for this team
    const { data: existingConnection } = await supabase
      .from('ehr_connection')
      .select('id')
      .eq('team_id', member.team_id)
      .eq('connection_name', connection_name)
      .single();

    if (existingConnection) {
      return NextResponse.json({ 
        error: 'Connection with this name already exists for your team' 
      }, { status: 409 });
    }

    // Validate base_url if provided
    if (base_url) {
      try {
        new URL(base_url);
      } catch {
        return NextResponse.json({ error: 'Invalid base URL format' }, { status: 400 });
      }
    }

    // Create EHR connection
    const { data: connection, error } = await supabase
      .from('ehr_connection')
      .insert({
        team_id: member.team_id,
        ehr_system_id,
        connection_name,
        environment,
        base_url,
        auth_config,
        sync_config: sync_config || {
          enabled: false,
          frequency: 'daily',
          entity_types: ['Patient', 'Encounter']
        },
        custom_headers,
        metadata,
        status: 'inactive' // Start as inactive until tested/configured
      })
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
      console.error('Error creating EHR connection:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      connection
    }, { status: 201 });

  } catch (error) {
    console.error('EHR connection POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}