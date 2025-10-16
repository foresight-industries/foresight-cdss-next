import { clerkClient } from '@clerk/nextjs/server';
import { createDatabaseAdminClient } from '@/lib/aws/database';
import { organizations, teamMembers } from '@foresight-cdss-next/db';
import { eq } from 'drizzle-orm';

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

    // Create AWS database client for administrative access
    const { db } = createDatabaseAdminClient();

    // Look up organization by Clerk organization ID
    const orgResult = await db
      .select({ slug: organizations.slug, id: organizations.id })
      .from(organizations)
      .where(eq(organizations.clerkOrgId, organizationId))
      .limit(1);

    if (orgResult.length > 0) {
      return orgResult[0].slug;
    }

    // If no organization found with organization ID, try to find by organization name
    const orgByNameResult = await db
      .select({ slug: organizations.slug, id: organizations.id })
      .from(organizations)
      .where(eq(organizations.name, organization.name))
      .limit(1);

    if (orgByNameResult.length > 0) {
      const org = orgByNameResult[0];

      // If found by name but no clerk_org_id set, update it
      try {
        await db
          .update(organizations)
          .set({ clerkOrgId: organizationId })
          .where(eq(organizations.id, org.id));
      } catch (updateError) {
        console.error('Error updating organization with clerk_org_id:', updateError);
      }

      return org.slug;
    }

    // As a fallback, check if user has any organization membership via clerk_user_id
    const userMembershipResult = await db
      .select({
        organizationId: teamMembers.organizationId,
        slug: organizations.slug
      })
      .from(teamMembers)
      .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(eq(teamMembers.clerkUserId, userId))
      .limit(1);

    if (userMembershipResult.length > 0) {
      return userMembershipResult[0].slug;
    }

    return null;

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
