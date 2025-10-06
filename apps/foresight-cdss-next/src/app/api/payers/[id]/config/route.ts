import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { CreatePayerConfigRequest } from '@/types/payer.types';

// GET - Get payer configurations
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
    const payerId = params.id;

    // Verify user has access to this payer
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team access required' }, { status: 403 });
    }

    // Get payer configurations
    const { data: configs, error } = await supabase
      .from('payer_config')
      .select('*')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .order('config_type');

    if (error) {
      console.error('Error fetching payer configs:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      configs: configs || []
    });

  } catch (error) {
    console.error('Payer config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create payer configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const payerId = params.id;
    const body: CreatePayerConfigRequest = await request.json();

    // Validate request body
    const {
      config_type,
      auto_submit_claims,
      auto_submit_pa,
      timely_filing_days,
      eligibility_cache_hours,
      submission_batch_size,
      submission_schedule,
      portal_config,
      special_rules
    } = body;

    if (!config_type) {
      return NextResponse.json({
        error: 'config_type is required'
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

    // Verify payer exists and belongs to team
    const { data: payer } = await supabase
      .from('payer')
      .select('id, team_id')
      .eq('id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .single();

    if (!payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Check if config already exists for this type
    const { data: existingConfig } = await supabase
      .from('payer_config')
      .select('id')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member?.team_id ?? '')
      .eq('config_type', config_type)
      .single();

    if (existingConfig) {
      return NextResponse.json({
        error: `Configuration for ${config_type} already exists. Use PUT to update.`
      }, { status: 409 });
    }

    // Create payer configuration
    const insertData = {
      payer_id: Number(payerId),
      team_id: member.team_id ?? '',
      config_type,
      auto_submit_claims: auto_submit_claims || null,
      auto_submit_pa: auto_submit_pa || null,
      timely_filing_days: timely_filing_days || null,
      eligibility_cache_hours: eligibility_cache_hours || null,
      submission_batch_size: submission_batch_size || null,
      submission_schedule: submission_schedule || null,
      portal_config: (portal_config || null) as any,
      special_rules: (special_rules || null) as any
    };

    const { data: config, error } = await supabase
      .from('payer_config')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payer config:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      config
    }, { status: 201 });

  } catch (error) {
    console.error('Payer config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
