import { headers } from 'next/headers';
import Link from "next/link";

interface TeamSpecificDashboardProps {
  params: { slug: string };
}

export default async function TeamSpecificDashboard({ params }: TeamSpecificDashboardProps) {
  const headersList = await headers();

  // Get team info from middleware headers
  const teamSlug = headersList.get('x-team-slug') || params.slug;
  const teamId = headersList.get('x-team-id');
  const teamName = headersList.get('x-team-name');

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {teamName || teamSlug}
        </h1>
        <p className="text-gray-600 mt-2">
          Team Dashboard - You&apos;re accessing via subdomain: {teamSlug}.have-foresight.app
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Team Info</h3>
          <p><strong>Team ID:</strong> {teamId}</p>
          <p><strong>Team Slug:</strong> {teamSlug}</p>
          <p><strong>Team Name:</strong> {teamName}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href={`/team/${teamSlug}/settings`} className="block text-blue-600 hover:underline">
              Team Settings
            </Link>
            <Link href={`/team/${teamSlug}/queue`} className="block text-blue-600 hover:underline">
              ePA Queue
            </Link>
            <Link href={`/team/${teamSlug}/analytics`} className="block text-blue-600 hover:underline">
              Analytics
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">URL Examples</h3>
          <div className="text-sm space-y-1">
            <p>Dashboard: {teamSlug}.have-foresight.app</p>
            <p>Settings: {teamSlug}.have-foresight.app/settings</p>
            <p>Queue: {teamSlug}.have-foresight.app/queue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
