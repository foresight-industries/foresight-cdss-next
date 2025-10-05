import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

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

// GET - Get specific webhook configuration
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
    const webhookId = params.id;

    // Get webhook with team verification
    const { data: webhook, error } = await supabase
      .from('webhook_config')
      .select(`
        *,
        team!inner(id, name, slug),
        webhook_delivery (
          id,
          event_type,
          response_status,
          delivered_at,
          failed_at,
          error_message,
          created_at
        )
      `)
      .eq('id', webhookId)
      .eq('team.team_member.user_id', userId)
      .eq('team.team_member.status', 'active')
      .single();

    if (error || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Calculate delivery stats
    const deliveries = webhook.webhook_delivery || [];
    const stats = {
      total_deliveries: deliveries.length,
      successful_deliveries: deliveries.filter(d => d.delivered_at).length,
      failed_deliveries: deliveries.filter(d => d.failed_at).length,
      last_delivery: deliveries[0]?.created_at || null,
      recent_deliveries: deliveries.slice(0, 20)
    };

    // Remove secret from response for security
    const { secret, webhook_delivery, ...webhookResponse } = webhook;

    return NextResponse.json({
      webhook: {
        ...webhookResponse,
        secret_hint: secret ? `${secret.substring(0, 8)}...` : null
      },
      stats
    });

  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update webhook configuration
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
    const webhookId = params.id;
    const body = await request.json();

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

    // Verify webhook belongs to user's team
    const { data: existingWebhook } = await supabase
      .from('webhook_config')
      .select('team_id')
      .eq('id', webhookId)
      .single();

    if (!existingWebhook || existingWebhook.team_id !== member.team_id) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = ['name', 'url', 'events', 'active', 'retry_count', 'timeout_seconds'];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }

    // Validate URL if provided
    if (updates.url) {
      try {
        new URL(updates.url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    // Validate events if provided
    if (updates.events) {
      if (!Array.isArray(updates.events)) {
        return NextResponse.json({ error: 'Events must be an array' }, { status: 400 });
      }
      
      const invalidEvents = updates.events.filter(event => !AVAILABLE_EVENTS.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json({ 
          error: `Invalid events: ${invalidEvents.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Clamp numeric values
    if (updates.retry_count !== undefined) {
      updates.retry_count = Math.min(Math.max(updates.retry_count, 1), 10);
    }
    if (updates.timeout_seconds !== undefined) {
      updates.timeout_seconds = Math.min(Math.max(updates.timeout_seconds, 5), 300);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update webhook
    const { data: webhook, error } = await supabase
      .from('webhook_config')
      .update(updates)
      .eq('id', webhookId)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Webhook name already exists for this environment' 
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Return without secret
    const { secret, ...webhookResponse } = webhook;

    return NextResponse.json({
      webhook: {
        ...webhookResponse,
        secret_hint: secret ? `${secret.substring(0, 8)}...` : null
      }
    });

  } catch (error) {
    console.error('Webhook PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete webhook configuration
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
    const webhookId = params.id;

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

    // Verify webhook belongs to user's team and delete
    const { data: webhook, error } = await supabase
      .from('webhook_config')
      .delete()
      .eq('id', webhookId)
      .eq('team_id', member.team_id)
      .select()
      .single();

    if (error || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Webhook deleted successfully',
      webhook_id: webhookId
    });

  } catch (error) {
    console.error('Webhook DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}