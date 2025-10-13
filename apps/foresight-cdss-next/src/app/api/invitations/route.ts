import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient as Clerk } from '@clerk/nextjs/server';
import { requireTeamMembership } from '@/lib/team';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await Clerk();

    // Ensure user has team membership and permission to invite
    const membership = await requireTeamMembership();

    // Check if user has permission to invite (org_admin or super_admin)
    if (!['org_admin', 'super_admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to invite users' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({
        error: 'Missing required fields: email, firstName, lastName, role'
      }, { status: 400 });
    }

    // Get the current user's organization
    const user = await clerkClient.users.getUser(userId);
    const { data: organizationMemberships } =
      await clerkClient.users.getOrganizationMembershipList({ userId });

    if (organizationMemberships.length === 0) {
      return NextResponse.json({ error: 'User is not part of any organization' }, { status: 400 });
    }

    // Use the first organization (assuming single org per user for now)
    const organizationId = organizationMemberships[0].organization.id;

    // Map our roles to Clerk roles
    const clerkRoleMap: Record<string, string> = {
      'super_admin': 'org:admin',
      'org_admin': 'org:admin',
      'provider': 'org:member',
      'coder': 'org:member',
      'viewer': 'org:member'
    };

    const clerkRole = clerkRoleMap[role] || 'org:member';

    // Create organization invitation through Clerk
    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId,
      emailAddress: email,
      role: clerkRole,
      redirectUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/accept-invitation` : 'http://localhost:3000/accept-invitation',
      publicMetadata: {
        inviterName: `${user.firstName} ${user.lastName}`.trim(),
        role, // Store our custom role
        organizationName: organizationMemberships[0].organization.name,
      },
    });

    // Optionally store additional user details in our database for when they accept
    // This could include the specific role, firstName, lastName, etc.

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
        role: role, // Return our role, not Clerk's
        createdAt: invitation.createdAt,
      }
    });

  } catch (error) {
    console.error('Error creating organization invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to send invitation: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await Clerk();

    // Get the user's organization
    const { data: organizationMemberships } =
      await clerkClient.users.getOrganizationMembershipList({ userId });

    if (organizationMemberships.length === 0) {
      return NextResponse.json({ error: 'User is not part of any organization' }, { status: 400 });
    }

    const organizationId = organizationMemberships[0].organization.id;

    // Fetch pending invitations
    const { data: invitations } =
      await clerkClient.organizations.getOrganizationInvitationList({
        organizationId,
        status: ["pending"],
      });

    return NextResponse.json({
      success: true,
      data: invitations.map(inv => ({
        id: inv.id,
        email: inv.emailAddress,
        status: inv.status,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkClient = await Clerk();

    // Ensure user has team membership and permission
    const membership = await requireTeamMembership();

    if (!['org_admin', 'super_admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
    }

    // Revoke the invitation
    await clerkClient.organizations.revokeOrganizationInvitation({
      organizationId: membership.team_id, // Assuming team_id maps to organization_id
      invitationId,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking organization invitation:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}
