import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import ProfileClient from '@/components/profile/profile-client';

async function loadUserProfile() {
  try {
    // Use the new Clerk-integrated Supabase client (same as dashboard)
    const supabase = await createSupabaseServerClient();

    // Get current user using the same method as the Supabase client
    const currentUserInfo = await getCurrentUser();
    if (!currentUserInfo?.userId) {
      console.error('No authenticated user');
      return {
        membership: null,
        userProfile: null,
        teamMember: null,
        userTitle: 'PA Coordinator',
        userId: null
      };
    }

    const { userId } = currentUserInfo;

    // Get user profile data with simpler query
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data

    if (profileError) {
      console.error('Error fetching user profile:', JSON.stringify(profileError));
    }

    // Get team membership data with simpler query
    const { data: membership, error: membershipError } = await supabase
      .from('team_member')
      .select('team_id, role, status, created_at')
      .eq('clerk_user_id', userId)
      .eq('status', 'active')
      .maybeSingle(); // Use maybeSingle instead of single

    if (membershipError) {
      console.error('Error fetching team membership:', JSON.stringify(membershipError));
    }

    // Get team info separately if membership exists
    let teamInfo = null;
    if (membership?.team_id) {
      const { data: team, error: teamError } = await supabase
        .from('team')
        .select('id, name, slug, logo_url')
        .eq('id', membership.team_id)
        .maybeSingle();

      if (teamError) {
        console.error('Error fetching team info:', JSON.stringify(teamError));
      } else {
        teamInfo = team;
      }
    }

    // Combine membership with team info
    const membershipWithTeam = membership ? {
      ...membership,
      team: teamInfo
    } : null;

    // Determine the user's title/role
    const userTitle = membership?.role || userProfile?.role || 'PA Coordinator';

    return {
      membership: membershipWithTeam,
      userProfile,
      teamMember: membershipWithTeam,
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
