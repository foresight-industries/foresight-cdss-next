import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// POST - Test webhook by sending a test event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { webhook_id } = await request.json();

    if (!webhook_id) {
      return NextResponse.json({
        error: 'webhook_id is required'
      }, { status: 400 });
    }

    // Validate permissions and get webhook
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

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_config')
      .select('*')
      .eq('id', webhook_id)
      .eq('team_id', member.team_id ?? '')
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Create test payload
    const testPayload = {
      event_type: 'webhook.test',
      team_id: webhook.team_id,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'foresight_cdss',
      test: true,
      data: {
        message: 'This is a test webhook event',
        webhook_id: webhook.id,
        webhook_url: webhook.target_url || webhook.url,
        environment: webhook.environment,
        triggered_by: userId,
        triggered_at: new Date().toISOString()
      }
    };

    // Add to webhook queue for processing
    const { data: queueItem, error: queueError } = await supabase
      .from('webhook_queue')
      .insert({
        webhook_config_id: webhook.id,
        event_type: 'webhook.test',
        payload: testPayload,
        max_attempts: 1 // Only try once for test
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error queuing test webhook:', queueError);
      return NextResponse.json({ error: 'Failed to queue test webhook' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Test webhook queued successfully',
      queue_id: queueItem.id,
      webhook_id: webhook.id,
      test_payload: testPayload
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get webhook testing information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhook_id');

    if (!webhookId) {
      return NextResponse.json({
        testing_guide: {
          description: 'Test your webhooks by sending sample events',
          steps: [
            '1. Create a webhook endpoint that accepts POST requests',
            '2. Configure your webhook URL in the settings',
            '3. Use the test button to send a sample event',
            '4. Check your endpoint logs for the received payload'
          ],
          sample_payload: {
            event_type: 'webhook.test',
            team_id: 'uuid',
            timestamp: Math.floor(Date.now() / 1000),
            source: 'foresight_cdss',
            test: true,
            data: {
              message: 'This is a test webhook event',
              webhook_id: 'uuid',
              environment: 'production'
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Foresight-CDSS-Webhook/1.0',
            'X-Foresight-Event': 'webhook.test',
            'X-Foresight-Signature': 'sha256=<hmac-signature>',
            'X-Foresight-Team-ID': '<team-uuid>',
            'X-Foresight-Delivery': '<delivery-uuid>'
          }
        }
      });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Get recent test deliveries for this webhook
    const { data: deliveries, error } = await supabase
      .from('webhook_delivery')
      .select(`
        *,
        webhook_config!inner(team_id)
      `)
      .eq('webhook_config_id', webhookId)
      .eq('event_type', 'webhook.test')
      .eq('webhook_config.team_member.user_id', userId)
      .eq('webhook_config.team_member.status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      webhook_id: webhookId,
      recent_tests: deliveries || [],
      testing_info: {
        description: 'Recent test webhook deliveries',
        note: 'Test events help verify your webhook endpoint is working correctly'
      }
    });

  } catch (error) {
    console.error('Webhook test GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
