"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  Globe,
  Clock,
  XCircle,
  AlertTriangle
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
      const response = await fetch(`/api/webhooks/config?environment=${environment}`);
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

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications when your team data changes
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

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateWebhookForm
                onSubmit={handleCreateWebhook}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <CardDescription>{error}</CardDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook to start receiving real-time notifications
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onTest={() => handleTestWebhook(webhook.id)}
                onDelete={() => handleDeleteWebhook(webhook.id)}
              />
            ))}
          </div>
        )}
      </div>
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
            <Label htmlFor="retry_count">Retry Count</Label>
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

function WebhookCard({
  webhook,
  onTest,
  onDelete
}: {
  webhook: WebhookWithStats;
  onTest: () => void;
  onDelete: () => void;
}) {
  const { stats } = webhook;
  const successRate = stats.total_deliveries > 0 ?
    Math.round((stats.successful_deliveries / stats.total_deliveries) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {webhook.name}
              <Badge variant={webhook.active ? "default" : "secondary"}>
                {webhook.active ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {webhook.url}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {webhook.timeout_seconds}s timeout
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onTest}>
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Events</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {webhook.events.map((event) => (
                <Badge key={event} variant="outline" className="text-xs">
                  {event}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successful_deliveries}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed_deliveries}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {webhook.last_error && (
            <Alert variant="error">
              <XCircle className="h-4 w-4" />
              <CardDescription>
                Last error: {webhook.last_error}
              </CardDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
