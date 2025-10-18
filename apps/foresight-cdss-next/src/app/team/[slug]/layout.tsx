import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { createDatabaseClient, safeSingle } from '@/lib/aws/database';
import { eq } from 'drizzle-orm';
import { organizations } from '@foresight-cdss-next/db';
import { redirect } from 'next/navigation';

interface TeamLayoutProps {
  children: ReactNode;
  params: { slug: string };
}

// This will be your organization-specific layout
export default async function TeamLayout({ children, params }: TeamLayoutProps) {
  const { db } = await createDatabaseClient();
  const headersList = await headers();

  // Get organization info from middleware headers
  const teamSlug = headersList.get('x-team-slug') || params.slug;
  const teamId = headersList.get('x-team-id');
  // const teamName = headersList.get('x-team-name');

  // Verify organization exists (extra safety check)
  if (!teamId) {
    const { data: organization } = await safeSingle(async () =>
      db.select({
        id: organizations.id,
        slug: organizations.slug,
        name: organizations.name,
        deletedAt: organizations.deletedAt
      })
      .from(organizations)
      .where(eq(organizations.slug, teamSlug))
    );

    if (!organization) {
      redirect('/team-not-found');
    }

    const organizationData = organization as { id: string; slug: string; name: string; deletedAt: Date | null };

    if (organizationData.deletedAt) {
      redirect('/team-not-found');
    }
  }

  return (
    <div className="team-app" data-team-slug={teamSlug}>
      {/* You can add organization-specific branding, navigation, etc. here */}
      <div className="team-content">
        {children}
      </div>
    </div>
  );
}

// Dynamic metadata based on organization
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { db } = await createDatabaseClient();

  const { slug } = await params;

  const { data: organization } = await safeSingle(async () =>
    db.select({
      name: organizations.name,
      slug: organizations.slug
    })
    .from(organizations)
    .where(eq(organizations.slug, slug))
  );

  const organizationData = organization as { name: string; slug: string } | null;

  return {
    title: organizationData ? `${organizationData.name} - Foresight RCM` : 'Organization - Foresight RCM',
    description: `${organizationData?.name || 'Organization'} dashboard powered by Foresight RCM`,
  };
}
