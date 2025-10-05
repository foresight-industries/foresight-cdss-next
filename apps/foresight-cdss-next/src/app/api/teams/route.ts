import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// POST - Create new team
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    
    const { name, slug, description, logo_url } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Team name and slug are required' 
      }, { status: 400 });
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      }, { status: 400 });
    }

    // Check if slug is already taken
    const { data: existingTeam } = await supabase
      .from('team')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTeam) {
      return NextResponse.json({ 
        error: 'This team URL is already taken. Please choose a different one.' 
      }, { status: 409 });
    }

    // Check if user already has an active team membership
    const { data: existingMembership } = await supabase
      .from('team_member')
      .select('team_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingMembership) {
      return NextResponse.json({ 
        error: 'You are already a member of a team' 
      }, { status: 400 });
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('team')
      .insert({
        name,
        slug,
        description,
        logo_url,
        status: 'active'
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add the creator as team admin
    const { error: memberError } = await supabase
      .from('team_member')
      .insert({
        team_id: team.id,
        user_id: userId,
        clerk_user_id: userId,
        role: 'super_admin',
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error adding team member:', memberError);
      // Try to clean up the team if member creation fails
      await supabase.from('team').delete().eq('id', team.id);
      return NextResponse.json({ error: 'Failed to set up team membership' }, { status: 500 });
    }

    return NextResponse.json({ 
      team,
      message: 'Team created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List teams for current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get user's team memberships
    const { data: memberships, error } = await supabase
      .from('team_member')
      .select(`
        id,
        role,
        status,
        joined_at,
        team:team_id (
          id,
          name,
          slug,
          description,
          logo_url,
          status,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    const teams = memberships?.map(membership => ({
      ...membership.team,
      user_role: membership.role,
      joined_at: membership.joined_at
    })) || [];

    return NextResponse.json({ teams });

  } catch (error) {
    console.error('Teams fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}