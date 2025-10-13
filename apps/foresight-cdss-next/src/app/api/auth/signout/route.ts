import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    // If user is not authenticated, redirect to login page
    if (!userId) {
      return NextResponse.redirect(new URL('/login', process.env.VERCEL_URL || 'http://localhost:3000'));
    }

    // Redirect to Clerk sign-out URL which will handle the logout and redirect
    const signOutUrl = new URL('/logout', process.env.VERCEL_URL || 'http://localhost:3000');

    // Add post-logout redirect
    signOutUrl.searchParams.set('redirect_url', '/login?signed_out=true');

    return NextResponse.redirect(signOutUrl);
  } catch (error) {
    console.error('Sign-out error:', error);

    // Fallback: redirect to login page with error
    return NextResponse.redirect(
      new URL('/login?error=signout_failed', process.env.VERCEL_URL || 'http://localhost:3000')
    );
  }
}

export async function POST() {
  // Handle POST requests the same way
  return GET();
}
