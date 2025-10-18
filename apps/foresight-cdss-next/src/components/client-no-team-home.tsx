'use client';

import dynamic from 'next/dynamic';

// Dynamically import NoTeamHome with no SSR to avoid clerk hook issues
const NoTeamHome = dynamic(() => import('@/components/no-team-home'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  ),
});

export default function ClientNoTeamHome() {
  return <NoTeamHome />;
}