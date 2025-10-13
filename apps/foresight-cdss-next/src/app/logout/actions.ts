'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const { userId } = await auth();

  // Double-check authentication on the server
  if (!userId) {
    redirect('/login');
  }

  try {
    // Redirect to our API route which handles Clerk sign-out
    redirect('/api/auth/signout');
  } catch (error) {
    console.error('Logout error:', error);
    // On error, fallback to login page with error message
    redirect('/login?error=logout_failed');
  }
}
