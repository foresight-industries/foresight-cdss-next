import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { CreatePayerRequest, PayerWithConfig } from '@/types/payer.types';

// GET - List payers and their configurations for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const includePopular = searchParams.get('include_popular') === 'true';

    // Get user's current team
    const { data: profile } = await supabase
      .from('user_profile')
      .select('current_team_id')
      .eq('id', userId)
      .single();

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Get team's configured payers with their configs
    const { data: payers, error } = await supabase
      .from('payer')
      .select(`
        *,
        payer_config (
          *
        ),
        payer_portal_credential (
          id,
          portal_url,
          username,
          mfa_enabled,
          automation_enabled,
          last_successful_login,
          created_at,
          updated_at
        ),
        payer_submission_config (
          *
        )
      `)
      .eq('team_id', profile.current_team_id)
      .order('name');

    if (error) {
      console.error('Error fetching payers:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Transform data to include performance stats
    const payersWithConfig: PayerWithConfig[] = (payers || []).map(payer => ({
      payer: {
        id: payer.id,
        name: payer.name,
        external_payer_id: payer.external_payer_id,
        payer_type: payer.payer_type,
        team_id: payer.team_id,
        created_at: payer.created_at,
        updated_at: payer.updated_at
      },
      config: payer.payer_config?.[0] || undefined,
      portal_credential: payer.payer_portal_credential?.[0] || undefined,
      submission_config: payer.payer_submission_config?.[0] || undefined,
      performance_stats: {
        total_claims: 0, // TODO: Calculate from claims table
        approval_rate: 0, // TODO: Calculate from prior_auth table
        avg_response_time_days: 0, // TODO: Calculate from prior_auth table
        last_submission: payer.updated_at || payer.created_at
      }
    }));

    return NextResponse.json({
      payers: payersWithConfig,
      include_popular: includePopular
    });

  } catch (error) {
    console.error('Payers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new payer
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body: CreatePayerRequest = await request.json();

    // Validate request body
    const {
      name,
      external_payer_id,
      payer_type = 'general'
    } = body;

    if (!name || !external_payer_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, external_payer_id' 
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

    // Check if payer already exists for this team
    const { data: existingPayer } = await supabase
      .from('payer')
      .select('id')
      .eq('team_id', member.team_id)
      .eq('external_payer_id', external_payer_id)
      .single();

    if (existingPayer) {
      return NextResponse.json({ 
        error: 'Payer already exists for this team' 
      }, { status: 409 });
    }

    // Create payer
    const { data: payer, error } = await supabase
      .from('payer')
      .insert({
        team_id: member.team_id,
        name,
        external_payer_id,
        payer_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payer:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      payer
    }, { status: 201 });

  } catch (error) {
    console.error('Payer POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}