import { getUserTeamSlug } from '@/lib/team-routing';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import NoTeamHome from '@/components/no-team-home';

async function checkUserTeamAndRedirect(): Promise<void> {
  try {
    // Get the current user from Clerk
    const user = await currentUser();

    if (!user) {
      // User not authenticated, redirect to login
      redirect('/login');
    }

    // Check if user has a team
    const teamSlug = await getUserTeamSlug(user.id);

    if (teamSlug) {
      // User has a team, redirect to their team dashboard
      redirect(`/team/${teamSlug}`);
    }

    // User doesn't have a team, continue to show no-team UI

  } catch (error) {
    console.error('Error checking user team:', error);
    // On error, allow the page to continue (will show no-team UI)
  }
}
export default async function HomePage() {
  // Check if user should be redirected to their team page
  await checkUserTeamAndRedirect();

  // If we reach here, user doesn't have a team - show no-team UI
  return <NoTeamHome />;
}
