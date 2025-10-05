import { Metadata } from 'next';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface TeamLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

// This will be your team-specific layout
export default async function TeamLayout({ children, params }: TeamLayoutProps) {
  const supabase = createClient();
  const headersList = headers();
  
  // Get team info from middleware headers
  const teamSlug = headersList.get('x-team-slug') || params.slug;
  const teamId = headersList.get('x-team-id');
  const teamName = headersList.get('x-team-name');
  
  // Verify team exists (extra safety check)
  if (!teamId) {
    const { data: team, error } = await supabase
      .from('team')
      .select('id, slug, name, logo_url, branding_config')
      .eq('slug', teamSlug)
      .single();
      
    if (error || !team) {
      redirect('/team-not-found');
    }
  }
  
  return (
    <div className="team-app" data-team-slug={teamSlug}>
      {/* You can add team-specific branding, navigation, etc. here */}
      <div className="team-content">
        {children}
      </div>
    </div>
  );
}

// Dynamic metadata based on team
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  
  const { data: team } = await supabase
    .from('team')
    .select('name, slug')
    .eq('slug', params.slug)
    .single();
    
  return {
    title: team ? `${team.name} - Foresight RCM` : 'Team - Foresight RCM',
    description: `${team?.name || 'Team'} dashboard powered by Foresight RCM`,
  };
}