import { auth } from '@clerk/nextjs/server';
import ProfileClient from '@/components/profile/profile-client';

async function loadUserProfile() {
  try {
    // Get authenticated user - this is the critical first step
    const authResult = await auth();
    if (!authResult?.userId) {
      console.error('No authenticated user');
      return {
        membership: null,
        userProfile: null,
        teamMember: null,
        userTitle: 'PA Coordinator',
        userId: null
      };
    }

    const { userId } = authResult;
    
    // Create a basic Supabase client for data fetching (avoiding the auth() call in createSupabaseServerClient)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', profileError);
    }

    // Get team membership data directly from database
    const { data: membership, error: membershipError } = await supabase
      .from('team_member')
      .select(`
        team_id,
        role,
        status,
        created_at,
        team:team_id (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error fetching team membership:', membershipError);
    }

    // Determine the user's title/role
    // Priority: team role -> user profile role -> fallback
    const userTitle = membership?.role || userProfile?.role || 'PA Coordinator';

    return {
      membership,
      userProfile,
      teamMember: membership, // Use membership data directly
      userTitle,
      userId
    };
  } catch (error) {
    console.error('Profile fetch error:', error);
    return {
      membership: null,
      userProfile: null,
      teamMember: null,
      userTitle: 'PA Coordinator',
      userId: null
    };
  }
}

export default async function ProfilePage() {
  const profileData = await loadUserProfile();

  return (
    <ProfileClient 
      initialUserTitle={profileData.userTitle}
      teamMembership={profileData.membership}
      userProfile={profileData.userProfile}
      teamMember={profileData.teamMember}
      userId={profileData.userId}
    />
  );
}