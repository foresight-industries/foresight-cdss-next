import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { teamMembers, organizations, organizationInvitations, userProfiles } from '@foresight-cdss-next/db';
import { randomBytes } from 'crypto';

interface TeamInvitation {
  email: string;
  role: 'admin' | 'read' | 'write';
}

// POST - Send organization invitations
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body = await request.json();

    const { organization_id, invitations }: { organization_id: string; invitations: TeamInvitation[] } = body;

    // Validate required fields
    if (!organization_id || !invitations || !Array.isArray(invitations)) {
      return NextResponse.json({
        error: 'Organization ID and invitations array are required'
      }, { status: 400 });
    }

    // Verify user has permission to invite to this organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        role: teamMembers.role,
        id: teamMembers.id
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.organizationId, organization_id),
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership || !['admin', 'owner'].includes((membership as any).role)) {
      return NextResponse.json({
        error: 'You do not have permission to invite members to this organization'
      }, { status: 403 });
    }

    // Get organization info for invitation
    const { data: organization } = await safeSingle(async () =>
      db.select({
        name: organizations.name,
        slug: organizations.slug
      })
      .from(organizations)
      .where(eq(organizations.id, organization_id))
    );

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invitation.email)) {
          errors.push(`Invalid email format: ${invitation.email}`);
          continue;
        }

        // Check if user is already an organization member
        const { data: existingMember } = await safeSingle(async () =>
          db.select({ id: teamMembers.id })
          .from(teamMembers)
          .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
          .where(and(
            eq(teamMembers.organizationId, organization_id),
            eq(userProfiles.email, invitation.email),
            eq(teamMembers.isActive, true)
          ))
        );

        if (existingMember) {
          errors.push(`${invitation.email} is already an organization member`);
          continue;
        }

        // Check if there's already a pending invitation
        const { data: existingInvitation } = await safeSingle(async () =>
          db.select({ id: organizationInvitations.id })
          .from(organizationInvitations)
          .where(and(
            eq(organizationInvitations.organizationId, organization_id),
            eq(organizationInvitations.email, invitation.email),
            eq(organizationInvitations.status, 'pending')
          ))
        );

        if (existingInvitation) {
          errors.push(`${invitation.email} already has a pending invitation`);
          continue;
        }

        // Generate invitation token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

        // Create organization invitation record
        const { data: invitationRecord, error: inviteError } = await safeInsert(async () =>
          db.insert(organizationInvitations)
            .values({
              organizationId: organization_id,
              email: invitation.email,
              role: invitation.role,
              token,
              status: 'pending',
              expiresAt,
              invitedBy: (membership as any).id
            })
            .returning({
              id: organizationInvitations.id,
              email: organizationInvitations.email,
              role: organizationInvitations.role,
              status: organizationInvitations.status,
              createdAt: organizationInvitations.createdAt
            })
        );

        if (inviteError || !invitationRecord || invitationRecord.length === 0) {
          console.error('Error creating invitation:', inviteError);
          errors.push(`Failed to invite ${invitation.email}`);
          continue;
        }

        // Here you would typically send an email invitation
        // For now, we'll just track the invitation was created
        results.push({
          email: invitation.email,
          role: invitation.role,
          invitation_id: (invitationRecord[0] as any).id,
          status: 'pending',
          token // Include token for invitation link
        });

        // TODO: Send email invitation
        // await sendInvitationEmail({
        //   email: invitation.email,
        //   organizationName: organization.name,
        //   organizationSlug: organization.slug,
        //   inviterName: user.fullName,
        //   invitationToken: token
        // });

      } catch (error) {
        console.error('Error processing invitation:', error);
        errors.push(`Failed to process invitation for ${invitation.email}`);
      }
    }

    return NextResponse.json({
      success: results,
      errors,
      message: `${results.length} invitation(s) sent successfully`
    });

  } catch (error) {
    console.error('Team invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List pending invitations for an organization
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has permission to view invitations
    const { data: membership } = await safeSingle(async () =>
      db.select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.organizationId, organizationId),
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership || !['admin', 'owner'].includes((membership as any).role)) {
      return NextResponse.json({
        error: 'You do not have permission to view organization invitations'
      }, { status: 403 });
    }

    // Get pending invitations
    const { data: invitations, error } = await safeSelect(async () =>
      db.select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        createdAt: organizationInvitations.createdAt,
        expiresAt: organizationInvitations.expiresAt,
        invitedBy: organizationInvitations.invitedBy
      })
      .from(organizationInvitations)
      .where(and(
        eq(organizationInvitations.organizationId, organizationId),
        eq(organizationInvitations.status, 'pending')
      ))
    );

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });

  } catch (error) {
    console.error('Invitations fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
