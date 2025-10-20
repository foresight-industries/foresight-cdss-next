import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations, Organization, userProfiles } from '@foresight-cdss-next/db';

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

    // For now, we'll generate a placeholder Clerk org ID
    // In a real implementation, this should integrate with Clerk's organization creation
    const clerkOrgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create organization
    const { data: organization, error: orgError } = await safeInsert(async () =>
      db.insert(organizations)
        .values({
          name,
          slug,
          clerkOrgId
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
      console.error('Error creating organization:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    const newOrg = organization[0] as Organization;

    const { data: userProfile } = await safeSingle(async () =>
      db.select().from(userProfiles).where(eq(userProfiles.clerkUserId, userId))
    );

    if (!userProfile) {
      // Handle case where user profile doesn't exist
      throw new Error('User profile not found');
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
      // Try to cleanup the organization if member creation failed
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
