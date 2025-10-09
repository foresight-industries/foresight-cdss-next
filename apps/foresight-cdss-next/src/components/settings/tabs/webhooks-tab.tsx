import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook } from 'lucide-react';
import Link from 'next/link';

interface WebhooksTabProps {
  // No specific settings needed for this tab - it's mostly static information
}

export function WebhooksTab({}: WebhooksTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Webhook Management
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/webhooks">
              <Webhook className="w-4 h-4 mr-2" />
              Manage Webhooks
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure webhook endpoints to receive real-time notifications when
          your team data changes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No production webhooks configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Webhooks</h4>
              <Badge variant="outline">0 active</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No development webhooks configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Available Events
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "team.created",
            "team.updated",
            "team.deleted",
            "team_member.added",
            "team_member.updated",
            "team_member.removed",
          ].map((event) => (
            <div
              key={event}
              className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded"
            >
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {event}
              </code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}