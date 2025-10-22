import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });
    }

    // Since Clerk doesn't provide a direct API to get invitation details by token,
    // we need to work with what we have. In a production app, you might want to
    // store invitation metadata in your own database when creating invitations.

    // For now, we'll return a generic response. In practice, you'd want to:
    // 1. Decode the token or look up invitation in your database
    // 2. Fetch the actual invitation details from Clerk using the invitation ID
    // 3. Return the organization and inviter information

    // This is a simplified version - you should implement proper token validation
    // and store invitation details when creating them
    return NextResponse.json({
      organizationName: 'Foresight Healthcare',
      inviterName: 'Admin User',
      role: 'member',
      email: '', // This should come from the invitation
    });

  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}
