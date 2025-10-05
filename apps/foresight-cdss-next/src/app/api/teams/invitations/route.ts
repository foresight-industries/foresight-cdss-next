import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

interface TeamInvitation {
  email: string;
  role: 'admin' | 'member';
}

// POST - Send team invitations
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    
    const { team_id, invitations }: { team_id: string; invitations: TeamInvitation[] } = body;

    // Validate required fields
    if (!team_id || !invitations || !Array.isArray(invitations)) {
      return NextResponse.json({ 
        error: 'Team ID and invitations array are required' 
      }, { status: 400 });
    }

    // Verify user has permission to invite to this team
    const { data: membership } = await supabase
      .from('team_member')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['super_admin', 'admin'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'You do not have permission to invite members to this team' 
      }, { status: 403 });
    }

    // Get team info for invitation
    const { data: team } = await supabase
      .from('team')
      .select('name, slug')
      .eq('id', team_id)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invitation.email)) {
          errors.push(`Invalid email format: ${invitation.email}`);
          continue;
        }

        // Check if user is already a team member
        const { data: existingMember } = await supabase
          .from('team_member')
          .select('id, status')
          .eq('team_id', team_id)
          .or(`email.eq.${invitation.email},user_id.eq.${invitation.email}`)
          .single();

        if (existingMember) {
          errors.push(`${invitation.email} is already a team member`);
          continue;
        }

        // Create team invitation record
        const { data: invitationRecord, error: inviteError } = await supabase
          .from('team_member')
          .insert({
            team_id,
            email: invitation.email,
            role: invitation.role === 'admin' ? 'admin' : 'member',
            status: 'invited',
            invited_by: userId,
            invited_at: new Date().toISOString()
          })
          .select()
          .single();

        if (inviteError) {
          console.error('Error creating invitation:', inviteError);
          errors.push(`Failed to invite ${invitation.email}`);
          continue;
        }

        // Here you would typically send an email invitation
        // For now, we'll just track the invitation was created
        results.push({
          email: invitation.email,
          role: invitation.role,
          invitation_id: invitationRecord.id,
          status: 'invited'
        });

        // TODO: Send email invitation
        // await sendInvitationEmail({
        //   email: invitation.email,
        //   teamName: team.name,
        //   teamSlug: team.slug,
        //   inviterName: user.fullName,
        //   invitationId: invitationRecord.id
        // });

      } catch (error) {
        console.error('Error processing invitation:', error);
        errors.push(`Failed to process invitation for ${invitation.email}`);
      }
    }

    return NextResponse.json({ 
      success: results,
      errors,
      message: `${results.length} invitation(s) sent successfully`
    });

  } catch (error) {
    console.error('Team invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List pending invitations for a team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user has permission to view invitations
    const { data: membership } = await supabase
      .from('team_member')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['super_admin', 'admin'].includes(membership.role)) {
      return NextResponse.json({ 
        error: 'You do not have permission to view team invitations' 
      }, { status: 403 });
    }

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('team_member')
      .select(`
        id,
        email,
        role,
        invited_at,
        invited_by,
        status
      `)
      .eq('team_id', teamId)
      .eq('status', 'invited')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Invitations fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}