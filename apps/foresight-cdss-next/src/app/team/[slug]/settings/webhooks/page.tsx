"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  Globe,
  Clock,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Eye
} from 'lucide-react';
import { type WebhookConfig, type WebhookStats, WEBHOOK_EVENTS } from '@/types/webhook.types';

const AVAILABLE_EVENTS = [
  { value: WEBHOOK_EVENTS.ALL, label: 'All Events', description: 'Listen to all webhook events' },
  { value: WEBHOOK_EVENTS.TEAM_CREATED, label: 'Team Created', description: 'When a new team is created' },
  { value: WEBHOOK_EVENTS.TEAM_UPDATED, label: 'Team Updated', description: 'When team information is modified' },
  { value: WEBHOOK_EVENTS.TEAM_DELETED, label: 'Team Deleted', description: 'When a team is deleted' },
  { value: WEBHOOK_EVENTS.TEAM_MEMBER_ADDED, label: 'Member Added', description: 'When a new team member joins' },
  { value: WEBHOOK_EVENTS.TEAM_MEMBER_UPDATED, label: 'Member Updated', description: 'When team member info changes' },
  { value: WEBHOOK_EVENTS.TEAM_MEMBER_REMOVED, label: 'Member Removed', description: 'When a team member leaves' }
];

interface WebhookWithStats extends WebhookConfig {
  stats: WebhookStats;
}

export default function WebhooksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [webhooks, setWebhooks] = useState<WebhookWithStats[]>([]);
  const [environment, setEnvironment] = useState<'development' | 'production'>('production');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, [environment]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      // Extract team slug from pathname: /team/[slug]/settings/webhooks
      const teamSlug = pathname.split('/')[2];
      const response = await fetch(`/api/webhooks/config?environment=${environment}&team_slug=${teamSlug}`);
      const data = await response.json();

      if (response.ok) {
        setWebhooks(data.webhooks || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch webhooks');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (formData: any) => {
    try {
      const response = await fetch('/api/webhooks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, environment })
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreateOpen(false);
        fetchWebhooks();
        // Show secret to user once
        alert(`Webhook created! Secret: ${data.secret_hint} (save this, it won't be shown again)`);
      } else {
        setError(data.error || 'Failed to create webhook');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_id: webhookId })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Test webhook sent! Check your endpoint logs.');
      } else {
        setError(data.error || 'Failed to send test webhook');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/config/${webhookId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchWebhooks();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete webhook');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.active).length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.stats.total_deliveries, 0);
  const successfulDeliveries = webhooks.reduce((sum, w) => sum + w.stats.successful_deliveries, 0);
  const overallSuccessRate = totalDeliveries > 0 ? Math.round((successfulDeliveries / totalDeliveries) * 100) : 0;
  const recentFailures = webhooks.reduce((sum, w) => sum + w.stats.failed_deliveries, 0);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Webhook Configuration
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure real-time webhooks to receive notifications when your team data changes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={environment} onValueChange={(value: 'development' | 'production') => setEnvironment(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => router.push(pathname + '/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      {/* Webhook Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Webhooks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalWebhooks}</p>
            </div>
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeWebhooks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">{overallSuccessRate}%</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recent Failures</p>
              <p className="text-2xl font-bold text-red-600">{recentFailures}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Webhook Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Webhook Endpoints
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your webhook endpoints and monitor their performance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading webhooks...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No webhooks configured for {environment}</p>
              <Button onClick={() => router.push(pathname + '/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Webhook
              </Button>
            </div>
          ) : (
            webhooks.map((webhook) => {
              const successRate = webhook.stats.total_deliveries > 0 ?
                Math.round((webhook.stats.successful_deliveries / webhook.stats.total_deliveries) * 100) : 0;

              return (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${webhook.active ? "bg-green-500" : "bg-gray-400"}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {webhook.name}
                        </p>
                        <Badge variant={webhook.active ? "default" : "secondary"}>
                          {webhook.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {webhook.url}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {webhook.timeout_seconds}s timeout
                        </span>
                        <span>{webhook.events.length} events</span>
                        <span>{successRate}% success rate</span>
                      </div>
                      {webhook.last_error && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span>Last error: {webhook.last_error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook.id)}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${pathname}/${webhook.id}/events`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Events
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <CreateWebhookForm
            onSubmit={handleCreateWebhook}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateWebhookForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    retry_count: 3,
    timeout_seconds: 30
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleEvent = (eventValue: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Webhook</DialogTitle>
        <DialogDescription>
          Configure a webhook endpoint to receive real-time notifications about team changes
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="name">Webhook Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., team-sync-webhook"
            required
          />
        </div>

        <div>
          <Label htmlFor="url">Endpoint URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://your-app.com/api/webhooks/foresight"
            required
          />
        </div>

        <div>
          <Label>Events to Listen For</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {AVAILABLE_EVENTS.map((event) => (
              <div key={event.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={event.value}
                  checked={formData.events.includes(event.value)}
                  onChange={() => toggleEvent(event.value)}
                  className="rounded"
                />
                <Label htmlFor={event.value} className="text-sm font-normal">
                  <span className="font-medium">{event.label}</span>
                  <span className="text-muted-foreground ml-2">{event.description}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="retry_count" className="mb-4">Retry Count</Label>
            <Input
              id="retry_count"
              type="number"
              min="1"
              max="10"
              value={formData.retry_count}
              onChange={(e) => setFormData(prev => ({ ...prev, retry_count: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
            <Input
              id="timeout_seconds"
              type="number"
              min="5"
              max="300"
              value={formData.timeout_seconds}
              onChange={(e) => setFormData(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || !formData.url || formData.events.length === 0}>
          Create Webhook
        </Button>
      </DialogFooter>
    </form>
  );
}

