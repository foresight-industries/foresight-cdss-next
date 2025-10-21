import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations, Organization, userProfiles, UserProfile } from '@foresight-cdss-next/db';

// GET - Get organizations for current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Get user's organization memberships
    const { data: memberships, error } = await safeSelect(async () =>
      db.select({
        membershipId: teamMembers.id,
        role: teamMembers.role,
        isActive: teamMembers.isActive,
        createdAt: teamMembers.createdAt,
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        organizationCreatedAt: organizations.createdAt,
        organizationUpdatedAt: organizations.updatedAt
      })
      .from(teamMembers)
      .leftJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Transform the data to match expected format
    const teams = (memberships || []).map((membership: any) => ({
      id: membership.organizationId,
      name: membership.organizationName,
      slug: membership.organizationSlug,
      description: null, // Not available in current schema
      logo_url: null, // Not available in current schema
      created_at: membership.organizationCreatedAt,
      updated_at: membership.organizationUpdatedAt,
      membership: {
        id: membership.membershipId,
        role: membership.role,
        status: membership.isActive ? 'active' : 'inactive',
        joined_at: membership.createdAt
      }
    }));

    return NextResponse.json({
      teams
    });

  } catch (error) {
    console.error('Teams GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();

    const { name, slug } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        error: 'Organization name and slug are required'
      }, { status: 400 });
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        error: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }, { status: 400 });
    }

    // Check if slug is already taken
    const { data: existingOrg } = await safeSingle(async () =>
      db.select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
    );

    if (existingOrg) {
      return NextResponse.json({
        error: 'Slug is already taken'
      }, { status: 409 });
    }

    // Create organization in Clerk first
    let clerkOrganization;
    try {
      const clerk = await clerkClient();
      clerkOrganization = await clerk.organizations.createOrganization({
        name: name,
        slug: slug,
        createdBy: userId,
      });
    } catch (clerkError) {
      console.error('Error creating Clerk organization:', clerkError);
      return NextResponse.json({
        error: 'Failed to create organization in Clerk',
        details: clerkError instanceof Error ? clerkError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create organization in our database
    const { data: organization, error: orgError } = await safeInsert(async () =>
      db.insert(organizations)
        .values({
          name,
          slug,
          clerkOrgId: clerkOrganization.id
        })
        .returning({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt
        })
    );

    if (orgError || !organization || organization.length === 0) {
      console.error('Error creating organization in database:', orgError);

      // Clean up the Clerk organization if database creation failed
      try {
        const clerk = await clerkClient();
        await clerk.organizations.deleteOrganization(clerkOrganization.id);
      } catch (cleanupError) {
        console.error('Error cleaning up Clerk organization:', cleanupError);
      }

      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    const newOrg = organization[0] as Organization;

    // Get or create user profile
    let userProfile: UserProfile;
    const { data: existingProfile } = await safeSingle(async () =>
      db.select().from(userProfiles).where(eq(userProfiles.clerkUserId, userId))
    );

    if (!existingProfile) {
      // Create user profile if it doesn't exist
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);

        const { data: newProfile } = await safeInsert(async () =>
          db.insert(userProfiles)
            .values({
              clerkUserId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
            })
            .returning()
        );

        if (!newProfile || newProfile.length === 0) {
          throw new Error('Failed to create user profile');
        }

        userProfile = newProfile[0] as UserProfile;
      } catch (createProfileError) {
        console.error('Error creating user profile:', createProfileError);

        // Clean up the organization and Clerk org if profile creation failed
        await db.delete(organizations).where(eq(organizations.id, newOrg.id));
        try {
          const clerk = await clerkClient();
          await clerk.organizations.deleteOrganization(clerkOrganization.id);
        } catch (cleanupError) {
          console.error('Error cleaning up Clerk organization:', cleanupError);
        }

        return NextResponse.json({
          error: 'User profile not found and could not be created',
          details: createProfileError instanceof Error ? createProfileError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      userProfile = existingProfile as UserProfile;
    }

    // Add creator as organization owner
    const { error: memberError } = await safeInsert(async () =>
      db.insert(teamMembers)
        .values({
          organizationId: newOrg.id,
          userProfileId: userProfile.id,
          clerkUserId: userId,
          role: 'owner' as const,
          isActive: true
        })
    );

    if (memberError) {
      console.error('Error adding team member:', memberError);
      // Try to clean up the organization if member creation failed
      await db.delete(organizations).where(eq(organizations.id, newOrg.id));
      return NextResponse.json({ error: 'Failed to create organization membership' }, { status: 500 });
    }

    return NextResponse.json({
      team: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        description: null,
        logo_url: null,
        created_at: newOrg.createdAt,
        updated_at: newOrg.updatedAt,
        membership: {
          role: 'owner',
          status: 'active',
          joined_at: newOrg.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
