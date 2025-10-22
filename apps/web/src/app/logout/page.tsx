import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LogoutForm } from './logout-form';

export default async function LogoutPage() {
  const { userId } = await auth();

  // If user is not authenticated, redirect to login page
  if (!userId) {
    redirect('/login');
  }

  // User is authenticated, show logout form
  return <LogoutForm />;
}
