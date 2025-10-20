import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook, Shield, Lock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface WebhooksTabProps {
  teamSlug?: string;
}

interface WebhookStats {
  productionCount: number;
  developmentCount: number;
  loading: boolean;
}

export function WebhooksTab({ teamSlug }: Readonly<WebhooksTabProps>) {
  const [webhookStats, setWebhookStats] = useState<WebhookStats>({
    productionCount: 0,
    developmentCount: 0,
    loading: true
  });

  // Fetch webhook counts for both environments
  useEffect(() => {
    const fetchWebhookCounts = async () => {
      try {
        setWebhookStats(prev => ({ ...prev, loading: true }));

        // Get the organization ID first (we'll need to implement this based on teamSlug)
        let organizationId = '';
        if (teamSlug) {
          const orgResponse = await fetch(`/api/organizations/by-slug/${teamSlug}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            organizationId = orgData.organization?.id || '';
          }
        }

        if (!organizationId) {
          setWebhookStats({ productionCount: 0, developmentCount: 0, loading: false });
          return;
        }

        // Fetch webhooks for both environments
        const [productionResponse, stagingResponse] = await Promise.all([
          fetch(`/api/webhooks/config?organization_id=${organizationId}&environment=production`),
          fetch(`/api/webhooks/config?organization_id=${organizationId}&environment=staging`)
        ]);

        let productionCount = 0;
        let developmentCount = 0;

        if (productionResponse.ok) {
          const prodData = await productionResponse.json();
          productionCount = prodData.webhooks?.filter((webhook: any) => webhook.isActive)?.length || 0;
        }

        if (stagingResponse.ok) {
          const stagingData = await stagingResponse.json();
          developmentCount = stagingData.webhooks?.filter((webhook: any) => webhook.isActive)?.length || 0;
        }

        setWebhookStats({
          productionCount,
          developmentCount,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching webhook counts:', error);
        setWebhookStats({ productionCount: 0, developmentCount: 0, loading: false });
      }
    };

    fetchWebhookCounts();
  }, [teamSlug]);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Webhook Management
          </h3>
          <Button variant="outline" asChild>
            <Link href={teamSlug ? `/team/${teamSlug}/settings/webhooks` : "/settings/webhooks"}>
              <Webhook className="w-4 h-4 mr-2" />
              Manage Webhooks
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure HIPAA-compliant webhook endpoints to receive real-time notifications
          about organization, user, patient, claims, and document events.
        </p>

        {/* HIPAA Compliance Status */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-800 dark:text-green-200">HIPAA Compliance Ready</h4>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Your webhook system includes PHI encryption, BAA validation, signature verification,
            and automated data retention to ensure HIPAA compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Webhooks</h4>
              {webhookStats.loading ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              ) : (
                <Badge 
                  variant={webhookStats.productionCount > 0 ? "default" : "outline"}
                  className={webhookStats.productionCount > 0 ? "bg-green-100 text-green-800 border-green-200" : ""}
                >
                  {webhookStats.productionCount} active
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {webhookStats.loading 
                ? "Checking webhook configuration..." 
                : webhookStats.productionCount === 0 
                  ? "No production webhooks configured" 
                  : `${webhookStats.productionCount} webhook${webhookStats.productionCount !== 1 ? 's' : ''} actively monitoring events`
              }
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">HIPAA Protected</span>
            </div>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Webhooks</h4>
              {webhookStats.loading ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              ) : (
                <Badge 
                  variant={webhookStats.developmentCount > 0 ? "default" : "outline"}
                  className={webhookStats.developmentCount > 0 ? "bg-green-100 text-green-800 border-green-200" : ""}
                >
                  {webhookStats.developmentCount} active
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {webhookStats.loading 
                ? "Checking webhook configuration..." 
                : webhookStats.developmentCount === 0 
                  ? "No development webhooks configured" 
                  : `${webhookStats.developmentCount} webhook${webhookStats.developmentCount !== 1 ? 's' : ''} actively monitoring events`
              }
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Encrypted</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Available Events
        </h3>

        <div className="space-y-6">
          {/* Organization Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Organization Events
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "organization.created",
                "organization.updated",
                "organization.deleted",
                "organization.settings.changed"
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {event}
                  </code>
                  <Badge variant="outline" className="text-xs">PHI: Limited</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Patient Events
              <Badge variant="destructive" className="text-xs">HIPAA Critical</Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "patient.created",
                "patient.updated",
                "patient.deleted"
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center justify-between p-2 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-950"
                >
                  <code className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                    {event}
                  </code>
                  <Badge variant="destructive" className="text-xs">PHI: Full</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Claims Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-500" />
              Claims Events
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "claim.created",
                "claim.updated",
                "claim.submitted",
                "claim.approved",
                "claim.denied",
                "claim.processing.started",
                "claim.processing.completed"
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center justify-between p-2 border border-yellow-200 dark:border-yellow-800 rounded"
                >
                  <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    {event}
                  </code>
                  <Badge variant="outline" className="text-xs">PHI: Limited</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Document Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-500" />
              Document Events
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "document.uploaded",
                "document.processed",
                "document.analysis.completed",
                "document.deleted"
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center justify-between p-2 border border-purple-200 dark:border-purple-800 rounded"
                >
                  <code className="text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                    {event}
                  </code>
                  <Badge variant="outline" className="text-xs">PHI: Full</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* User & Team Events */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              User & Team Events
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "user.created",
                "user.updated",
                "user.deleted",
                "user.role.changed",
                "team_member.added",
                "team_member.updated",
                "team_member.removed"
              ].map((event) => (
                <div
                  key={event}
                  className="flex items-center justify-between p-2 border border-green-200 dark:border-green-800 rounded"
                >
                  <code className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                    {event}
                  </code>
                  <Badge variant="outline" className="text-xs">PHI: None</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
