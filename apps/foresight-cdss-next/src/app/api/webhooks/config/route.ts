import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// Available webhook events
const AVAILABLE_EVENTS = [
  'all',
  'team.created',
  'team.updated',
  'team.deleted',
  'team_member.added',
  'team_member.updated',
  'team_member.removed'
];

// GET - List webhook configurations for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth({
      treatPendingAsSignedOut: false
    });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || 'production';

    // Get user's current team
    const { data: profile } = await supabase
      .from('user_profile')
      .select('current_team_id')
      .eq('clerk_id', userId)
      .single();

    if (!profile?.current_team_id) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Get webhook configurations
    const { data: webhooks, error } = await supabase
      .from('webhook_config')
      .select(`
        *,
        webhook_delivery (
          id,
          delivered_at,
          failed_at,
          response_status,
          created_at
        )
      `)
      .eq('team_id', profile.current_team_id)
      .eq('environment', environment)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Transform data to include delivery stats
    const webhooksWithStats = webhooks?.map(webhook => {
      const deliveries = webhook.webhook_delivery || [];
      const recentDeliveries = deliveries.slice(0, 10);

      return {
        ...webhook,
        webhook_delivery: undefined, // Remove the raw data
        stats: {
          total_deliveries: deliveries.length,
          successful_deliveries: deliveries.filter(d => d.delivered_at).length,
          failed_deliveries: deliveries.filter(d => d.failed_at).length,
          recent_deliveries: recentDeliveries
        }
      };
    }) || [];

    return NextResponse.json({
      webhooks: webhooksWithStats,
      available_events: AVAILABLE_EVENTS
    });

  } catch (error) {
    console.error('Webhook config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new webhook configuration
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    // Validate request body
    const {
      url,
      events,
      environment = 'production',
      retry_count = 3,
      timeout_seconds = 30
    } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({
        error: 'Missing required fields: url, events'
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate events
    const invalidEvents = events.filter(event => !AVAILABLE_EVENTS.includes(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json({
        error: `Invalid events: ${invalidEvents.join(', ')}`
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

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook configuration
    const insertData = {
      team_id: member.team_id!,
      environment: environment || 'production',
      target_url: url,
      secret: secret || null,
      events: events || [],
      retry_count: Math.min(Math.max(retry_count || 3, 1), 10), // Clamp between 1-10
      timeout_seconds: Math.min(Math.max(timeout_seconds || 30, 5), 300), // Clamp between 5-300
      active: true
    };

    const { data: webhook, error } = await supabase
      .from('webhook_config')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'Webhook configuration already exists'
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Return webhook config without the secret for security
    const { secret: _, ...webhookResponse } = webhook;

    return NextResponse.json({
      webhook: webhookResponse,
      secret_hint: `${secret.substring(0, 8)}...` // Only show first 8 chars
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
