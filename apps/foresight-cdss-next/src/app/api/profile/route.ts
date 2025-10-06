import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { profile, security } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile data required' }, { status: 400 });
    }

    // Prepare user profile update data
    const profileUpdate = {
      user_id: userId,
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      role: profile.title,
      department: profile.department,
      location: profile.location,
      timezone: profile.timezone,
      bio: profile.bio,
      two_factor_enabled: security?.twoFactorEnabled ?? true,
      email_notifications: security?.emailNotifications ?? true,
      sms_notifications: security?.smsNotifications ?? false,
      session_timeout: security?.sessionTimeout ?? '1 hour',
      updated_at: new Date().toISOString()
    };

    // Upsert user profile (insert or update)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .upsert(profileUpdate, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: userProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get user profile
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Get team membership if exists
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member')
      .select(`
        role,
        status,
        created_at,
        team:team_id (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error fetching team membership:', memberError);
    }

    return NextResponse.json({
      profile: userProfile,
      teamMember: teamMember
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
