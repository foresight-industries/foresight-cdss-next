import { createAuthenticatedDatabaseClient, safeSelect } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { teamMembers, organizations } from '@foresight-cdss-next/db';

export interface TeamMembership {
  team_id: string;
  role: string;
  status: string;
  team: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
}

/**
 * Get current user's team membership
 * Redirects to onboarding if no team membership found
 */
export async function requireTeamMembership(): Promise<TeamMembership> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  const { db } = await createAuthenticatedDatabaseClient();

  const { data: membership, error } = await safeSelect(async () =>
    db.select({
      team_id: teamMembers.organizationId,
      role: teamMembers.role,
      status: teamMembers.isActive,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug
    })
    .from(teamMembers)
    .leftJoin(organizations, eq(teamMembers.organizationId, organizations.id))
    .where(and(
      eq(teamMembers.clerkUserId, userId),
      eq(teamMembers.isActive, true)
    ))
    .limit(1)
  );

  if (error || !membership || membership.length === 0) {
    redirect('/onboard');
  }

  const result = membership[0] as any;
  return {
    team_id: result.team_id,
    role: result.role,
    status: result.status ? 'active' : 'inactive',
    team: {
      id: result.organizationId || '',
      name: result.organizationName || '',
      slug: result.organizationSlug || '',
      logo_url: undefined
    }
  } as TeamMembership;
}

/**
 * Get current user's team membership (optional)
 * Returns null if no team membership
 */
export async function getTeamMembership(): Promise<TeamMembership | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { db } = await createAuthenticatedDatabaseClient();

  const { data: membership, error } = await safeSelect(async () =>
    db.select({
      team_id: teamMembers.organizationId,
      role: teamMembers.role,
      status: teamMembers.isActive,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug
    })
    .from(teamMembers)
    .leftJoin(organizations, eq(teamMembers.organizationId, organizations.id))
    .where(and(
      eq(teamMembers.clerkUserId, userId),
      eq(teamMembers.isActive, true)
    ))
    .limit(1)
  );

  if (error || !membership || membership.length === 0) {
    return null;
  }

  const result = membership[0] as any;
  return {
    team_id: result.team_id,
    role: result.role,
    status: result.status ? 'active' : 'inactive',
    team: {
      id: result.organizationId || '',
      name: result.organizationName || '',
      slug: result.organizationSlug || '',
      logo_url: undefined
    }
  } as TeamMembership;
}

/**
 * Check if user has admin permissions for team operations
 */
export function hasAdminPermissions(role: string): boolean {
  return ['super_admin', 'admin'].includes(role);
}

/**
 * Generate team subdomain URL
 */
export function getTeamUrl(slug: string, path = ''): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const domain = process.env.NODE_ENV === 'production'
    ? 'have-foresight.app'
    : 'foresight.local:3000';

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${protocol}://${slug}.${domain}/${cleanPath}`;
}
