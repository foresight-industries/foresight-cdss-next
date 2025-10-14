import { createAuthenticatedDatabaseClient, safeSingle } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations } from '@foresight-cdss-next/db';
import ProfileClient from '@/components/profile/profile-client';

async function loadUserProfile() {
  try {
    // Get current user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      console.error('No authenticated user');
      return {
        membership: null,
        userProfile: null,
        teamMember: null,
        userTitle: 'PA Coordinator',
        userId: null
      };
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Note: AWS schema doesn't have a separate user_profile table
    // User profile data comes from Clerk and team membership
    const userProfile = null; // Not stored in AWS schema

    // Get organization membership data with organization details
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        isActive: teamMembers.isActive,
        createdAt: teamMembers.createdAt,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        organizationId_org: organizations.id
      })
      .from(teamMembers)
      .innerJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    // Transform membership data to match expected format
    const membershipData = membership as {
      organizationId: string;
      role: string;
      isActive: boolean;
      createdAt: Date;
      organizationName: string;
      organizationSlug: string;
      organizationId_org: string;
    } | null;

    const membershipWithTeam = membershipData ? {
      team_id: membershipData.organizationId,
      role: membershipData.role,
      status: membershipData.isActive ? 'active' : 'inactive',
      created_at: membershipData.createdAt,
      team: {
        id: membershipData.organizationId,
        name: membershipData.organizationName,
        slug: membershipData.organizationSlug,
        logo_url: null // Not available in AWS schema
      }
    } : null;

    // Determine the user's title/role
    const userTitle = membershipData?.role || 'PA Coordinator';

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
