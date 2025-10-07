import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient as Clerk } from '@clerk/nextjs/server';

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
    const latestMembership = organizationMemberships.data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

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
      // Example: Create user profile if it doesn't exist
      // You might want to move this to a separate function
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Create user profile
        await supabase
          .from('user_profile')
          .insert({
            id: userId,
            email: latestMembership.publicUserData?.identifier || '',
            first_name: latestMembership.publicUserData?.firstName || '',
            last_name: latestMembership.publicUserData?.lastName || '',
            role: 'provider', // Default role for invited users
          });
      }

      // You might also want to create a team membership record
      // that links the user to their team within the organization

    } catch (dbError) {
      console.error('Error setting up user data after invitation acceptance:', dbError);
      // Don't fail the entire request if database operations fail
      // The Clerk invitation was still accepted successfully
    }

    return NextResponse.json({
      success: true,
      organizationId,
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
