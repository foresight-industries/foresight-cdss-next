import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// GET - Get specific payer with all configurations
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

    // Get payer with team verification
    const { data: payer, error } = await supabase
      .from('payer')
      .select(`
        *,
        payer_config (*),
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
        payer_submission_config (*),
        team!inner(id, name, slug)
      `)
      .eq('id', Number(payerId))
      .eq('team.team_member.user_id', userId)
      .eq('team.team_member.status', 'active')
      .single();

    if (error || !payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Get performance stats
    const { data: claimStats } = await supabase
      .from('claim')
      .select('id, status, created_at')
      .eq('payer_id', Number(payerId))
      .eq('team_id', payer.team_id ?? '');

    const { data: paStats } = await supabase
      .from('prior_auth')
      .select('id, status, created_at, approved_at, denied_at')
      .eq('payer_id', Number(payerId))
      .eq('team_id', payer.team_id ?? '');

    const totalClaims = claimStats?.length || 0;
    const approvedPAs = paStats?.filter(pa => pa.status === 'approved').length || 0;
    const totalPAs = paStats?.length || 0;
    const approvalRate = totalPAs > 0 ? Math.round((approvedPAs / totalPAs) * 100) : 0;

    // Calculate average response time
    const responseTimes = paStats
      ?.filter(pa => (pa.approved_at || pa.denied_at) && pa.created_at)
      .map(pa => {
        const created = new Date(pa.created_at!);
        const decided = new Date(pa.approved_at || pa.denied_at!);
        return Math.ceil((decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }) || [];

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const lastSubmission = [...(claimStats || []), ...(paStats || [])]
      .filter(item => item.created_at) // Filter out items with null created_at
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      [0]?.created_at || payer.created_at;

    return NextResponse.json({
      payer: {
        ...payer,
        payer_config: payer.payer_config || [],
        portal_credential: payer.payer_portal_credential?.[0] || null,
        submission_config: payer.payer_submission_config?.[0] || null
      },
      performance_stats: {
        total_claims: totalClaims,
        approval_rate: approvalRate,
        avg_response_time_days: avgResponseTime,
        last_submission: lastSubmission
      }
    });

  } catch (error) {
    console.error('Payer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payer
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
    const payerId = params.id;
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

    // Verify payer belongs to user's team
    const { data: existingPayer } = await supabase
      .from('payer')
      .select('team_id')
      .eq('id', Number(payerId))
      .single();

    if (!existingPayer || existingPayer.team_id !== member.team_id) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    // Validate update fields
    const allowedFields = ['name', 'external_payer_id', 'payer_type'];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update payer
    const { data: payer, error } = await supabase
      .from('payer')
      .update(updates)
      .eq('id', Number(payerId))
      .select()
      .single();

    if (error) {
      console.error('Error updating payer:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      payer
    });

  } catch (error) {
    console.error('Payer PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete payer
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
    const payerId = params.id;

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

    // Check if payer has any active claims or prior auths
    const { data: activeClaims } = await supabase
      .from('claim')
      .select('id')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member.team_id ?? '')
      .in('status', ['submitted', 'in_review', 'awaiting_277ca'])
      .limit(1);

    if (activeClaims && activeClaims.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete payer with active claims. Please resolve all active claims first.'
      }, { status: 400 });
    }

    const { data: activePAs } = await supabase
      .from('prior_auth')
      .select('id')
      .eq('payer_id', Number(payerId))
      .eq('team_id', member.team_id ?? '')
      .in('status', ['draft', 'submitted', 'in_review', 'peer_to_peer_required'])
      .limit(1);

    if (activePAs && activePAs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete payer with active prior authorizations. Please resolve all active PAs first.'
      }, { status: 400 });
    }

    // Verify payer belongs to user's team and delete
    const { data: payer, error } = await supabase
      .from('payer')
      .delete()
      .eq('id', Number(payerId))
      .eq('team_id', member.team_id ?? '')
      .select()
      .single();

    if (error || !payer) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Payer deleted successfully',
      payer_id: payerId
    });

  } catch (error) {
    console.error('Payer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
