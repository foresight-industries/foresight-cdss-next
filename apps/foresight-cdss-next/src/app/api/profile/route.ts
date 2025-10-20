import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { userProfiles, organizations, teamMembers } from '@foresight-cdss-next/db';

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile data required' }, { status: 400 });
    }

    // Find the user's profile record
    const { data: existingProfile } = await safeSingle(async () =>
      db.select({
        id: userProfiles.id
      })
      .from(userProfiles)
      .where(and(
        eq(userProfiles.clerkUserId, userId),
        eq(userProfiles.isActive, true)
      ))
    );

    if (!existingProfile?.id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Prepare profile update data (only fields available in teamMembers)
    const profileUpdate: any = {
      updatedAt: new Date()
    };

    if (profile.firstName !== undefined) {
      profileUpdate.firstName = profile.firstName;
    }
    if (profile.lastName !== undefined) {
      profileUpdate.lastName = profile.lastName;
    }
    if (profile.email !== undefined) {
      profileUpdate.email = profile.email;
    }

    // Update team member profile
    const { data: updatedProfile, error: profileError } = await safeUpdate(async () =>
      db.update(userProfiles)
        .set(profileUpdate)
        .where(eq(userProfiles.id, existingProfile.id))
        .returning({
          id: userProfiles.id,
          email: userProfiles.email,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          role: userProfiles.role,
          updatedAt: userProfiles.updatedAt
        })
    );

    if (profileError || !updatedProfile || updatedProfile.length === 0) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile[0]
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

    const { db } = await createAuthenticatedDatabaseClient();

    // Get user team membership with organization details
    const { data: teamMember, error: memberError } = await safeSingle(async () =>
      db.select({
        id: userProfiles.id,
        email: userProfiles.email,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        role: userProfiles.role,
        isActive: userProfiles.isActive,
        lastSeenAt: userProfiles.lastSeenAt,
        createdAt: userProfiles.createdAt,
        updatedAt: userProfiles.updatedAt,
        clerkUserId: userProfiles.clerkUserId,
        organizationName: organizations.name,
        organizationSlug: organizations.slug
      })
      .from(userProfiles)
      .leftJoin(organizations, eq(teamMembers.organizationId, organizations.id))
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (memberError) {
      console.error('Error fetching user profile:', memberError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!teamMember) {
      return NextResponse.json({
        profile: null,
        teamMember: null
      });
    }

    const memberData = teamMember as any;

    // Format response to match expected structure
    const profile = {
      user_id: userId,
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      email: memberData.email,
      role: memberData.role,
      updated_at: memberData.updatedAt,
      created_at: memberData.createdAt
    };

    const teamInfo = {
      role: memberData.role,
      status: memberData.isActive ? 'active' : 'inactive',
      created_at: memberData.createdAt,
      team: {
        id: memberData.organizationId,
        name: memberData.organizationName,
        slug: memberData.organizationSlug
      }
    };

    return NextResponse.json({
      profile: profile,
      teamMember: teamInfo
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
