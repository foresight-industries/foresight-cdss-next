import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient as Clerk } from '@clerk/nextjs/server';
import { createAuthenticatedDatabaseClient } from '@/lib/aws/database';
import { teamMembers } from '@foresight-cdss-next/db/src/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await Clerk();

    const body = await request.json();
    const { token, invitationId } = body;

    if (!token && !invitationId) {
      return NextResponse.json({
        error: 'Missing invitation token or invitation ID'
      }, { status: 400 });
    }

    // Accept the organization invitation
    // Note: Clerk automatically handles the invitation acceptance when the user
    // follows the invitation link and signs in. The actual acceptance happens
    // through Clerk's built-in flow.

    // If you need to perform additional actions after invitation acceptance
    // (like creating user profile entries, setting up team memberships, etc.),
    // you would do that here.

    // Get user's organization memberships to find the newly joined organization
    const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId
    });

    // Find the most recently joined organization (this would be from the invitation)
    const sortedMemberships = organizationMemberships.data.toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestMembership = sortedMemberships[0];

    if (!latestMembership) {
      return NextResponse.json({
        error: 'No organization membership found'
      }, { status: 400 });
    }

    const organizationId = latestMembership.organization.id;

    // Here you can add any additional logic needed after invitation acceptance:
    // - Create user profile in your database
    // - Set up default team memberships
    // - Send welcome notifications
    // - Log the invitation acceptance

    try {
      const { db } = await createAuthenticatedDatabaseClient();

      // Check if team member record exists
      const existingMember = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.clerkUserId, userId))
        .limit(1);

      if (existingMember.length === 0) {
        // Create team member record
        await db
          .insert(teamMembers)
          .values({
            organizationId: organizationId,
            clerkUserId: userId,
            email: latestMembership.publicUserData?.identifier || '',
            firstName: latestMembership.publicUserData?.firstName || '',
            lastName: latestMembership.publicUserData?.lastName || '',
            role: 'provider',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }

    } catch (dbError) {
      console.error('Error setting up user data after invitation acceptance:', dbError);
      // Don't fail the entire request if database operations fail
      // The Clerk invitation was still accepted successfully
    }

    // Get organization details to include slug
    const organization = await clerkClient.organizations.getOrganization({
      organizationId: organizationId
    });

    return NextResponse.json({
      success: true,
      organizationId,
      organizationSlug: organization.slug,
      message: 'Invitation accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to accept invitation: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
