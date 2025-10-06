import { createSupabaseServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

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

  const supabase = await createSupabaseServerClient();

  const { data: membership, error } = await supabase
    .from('team_member')
    .select(`
      team_id,
      role,
      status,
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

  if (error || !membership) {
    redirect('/onboard');
  }

  return membership as TeamMembership;
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

  const supabase = await createSupabaseServerClient();

  const { data: membership, error } = await supabase
    .from('team_member')
    .select(`
      team_id,
      role,
      status,
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

  if (error || !membership) {
    return null;
  }

  return membership as TeamMembership;
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
