import { headers } from 'next/headers';
// import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface TeamDashboardProps {
  params: { slug: string };
}

export default async function TeamDashboard({ params }: TeamDashboardProps) {
  // const supabase = await createSupabaseServerClient();
  const headersList = await headers();

  // Get team info from middleware headers
  const teamSlug = headersList.get('x-team-slug') || params.slug;
  // const teamName = headersList.get('x-team-name');

  // This would be your main dashboard content
  // For now, let's redirect to the existing dashboard but with team context
  redirect(`/team/${teamSlug}/dashboard`);
}
