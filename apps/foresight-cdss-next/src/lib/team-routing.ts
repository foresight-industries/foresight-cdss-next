import { clerkClient } from '@clerk/nextjs/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server';

/**
 * Get the team slug for a user based on their Clerk organization membership
 */
export async function getUserTeamSlug(userId: string): Promise<string | null> {
  try {
    const clerk = await clerkClient();

    // Get user's organization memberships
    const { data: organizationMemberships } =
      await clerk.users.getOrganizationMembershipList({ userId });

    if (organizationMemberships.length === 0) {
      return null;
    }

    // Use the first organization (assuming single org per user for now)
    const organization = organizationMemberships[0].organization;
    const organizationId = organization.id;

    // Create Supabase client to look up team by organization ID
    const supabase = await createSupabaseMiddlewareClient();

    // Look up team by Clerk organization ID
    const { data: team, error } = await supabase
      .from('team')
      .select('slug, id')
      .eq('clerk_organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error || !team) {
      // If no team found with organization ID, try to find by organization name
      const { data: teamByName, error: nameError } = await supabase
        .from('team')
        .select('slug, id')
        .eq('name', organization.name)
        .eq('status', 'active')
        .single();

      if (nameError || !teamByName) {
        // As a fallback, check if user has any team membership via clerk_user_id
        const { data: userMembership, error: memberError } = await supabase
          .from('team_member')
          .select('team_id, team:team_id(slug)')
          .eq('clerk_user_id', userId)
          .eq('status', 'active')
          .single();

        if (memberError || !userMembership || !userMembership.team) {
          return null;
        }

        return (userMembership.team as any).slug;
      }

      // If found by name but no clerk_organization_id set, update it
      try {
        await supabase
          .from('team')
          .update({ clerk_org_id: organizationId })
          .eq('id', teamByName.id);
      } catch (updateError) {
        console.error('Error updating team with clerk_organization_id:', updateError);
      }

      return teamByName.slug;
    }

    return team.slug;

  } catch (error) {
    console.error('Error getting user team slug:', error);
    return null;
  }
}

/**
 * Check if a user should be redirected to their team route
 */
export async function shouldRedirectToTeam(
  userId: string,
  currentPath: string
): Promise<{ shouldRedirect: boolean; teamSlug?: string }> {
  try {
    // Don't redirect if already on a team route
    if (currentPath.startsWith('/team/')) {
      return { shouldRedirect: false };
    }

    // Don't redirect for auth, API, or onboarding routes
    const excludedPaths = [
      '/login', '/signup', '/forgot-password', '/reset-password',
      '/onboard', '/accept-invitation', '/api/', '/error',
      '/_next/', '/favicon.ico'
    ];

    if (excludedPaths.some(path => currentPath.startsWith(path))) {
      return { shouldRedirect: false };
    }

    // Get user's team slug
    const teamSlug = await getUserTeamSlug(userId);

    if (!teamSlug) {
      return { shouldRedirect: false };
    }

    return { shouldRedirect: true, teamSlug };

  } catch (error) {
    console.error('Error checking team redirect:', error);
    return { shouldRedirect: false };
  }
}

/**
 * Create a team-scoped path from a regular path
 */
export function createTeamPath(teamSlug: string, path: string): string {
  // If path is root, go to team dashboard
  if (path === '/' || path === '') {
    return `/team/${teamSlug}`;
  }

  // If path already starts with team, don't modify
  if (path.startsWith('/team/')) {
    return path;
  }

  // For other paths, prefix with team slug
  return `/team/${teamSlug}${path}`;
}
