"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { WEBHOOK_EVENTS, type WebhookEventType } from '@/types/webhook.types';

const AVAILABLE_EVENTS = [
  {
    value: WEBHOOK_EVENTS.ALL,
    label: 'All Events',
    description: 'Listen to all webhook events (includes future events)',
    category: 'General'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_CREATED,
    label: 'Team Created',
    description: 'When a new team is created',
    category: 'Team Management'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_UPDATED,
    label: 'Team Updated',
    description: 'When team information is modified',
    category: 'Team Management'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_DELETED,
    label: 'Team Deleted',
    description: 'When a team is deleted',
    category: 'Team Management'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_MEMBER_ADDED,
    label: 'Member Added',
    description: 'When a new team member joins',
    category: 'Team Members'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_MEMBER_UPDATED,
    label: 'Member Updated',
    description: 'When team member information changes',
    category: 'Team Members'
  },
  {
    value: WEBHOOK_EVENTS.TEAM_MEMBER_REMOVED,
    label: 'Member Removed',
    description: 'When a team member leaves',
    category: 'Team Members'
  }
];

const EVENT_CATEGORIES = [...new Set(AVAILABLE_EVENTS.map(event => event.category))];

export default function NewWebhookPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as WebhookEventType[],
    retry_count: 3,
    timeout_seconds: 30,
    environment: 'production' as 'development' | 'production',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || formData.events.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/webhooks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/team/${params.slug || 'default'}/settings/webhooks?created=${data.webhook.id}`);
      } else {
        setError(data.error || 'Failed to create webhook');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventValue: WebhookEventType) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  const toggleAllInCategory = (category: string) => {
    const categoryEvents = AVAILABLE_EVENTS.filter(e => e.category === category).map(e => e.value) as WebhookEventType[];
    const allSelected = categoryEvents.every(event => formData.events.includes(event));

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        events: prev.events.filter(e => !categoryEvents.includes(e))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        events: [...new Set([...prev.events, ...categoryEvents])]
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create New Webhook
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure a webhook endpoint to receive real-time notifications
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Basic Configuration
            </CardTitle>
            <CardDescription>
              Configure the basic webhook settings and endpoint information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Team Sync"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  A descriptive name to identify this webhook
                </p>
              </div>

              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value: 'development' | 'production') =>
                    setFormData(prev => ({ ...prev, environment: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="url">Endpoint URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-app.com/api/webhooks/foresight"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                The URL where webhook payloads will be delivered
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Event Selection *
            </CardTitle>
            <CardDescription>
              Choose which events will trigger this webhook. You can select individual events or entire categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Selected events: <Badge variant="outline">{formData.events.length}</Badge>
              </p>
            </div>

            {EVENT_CATEGORIES.map((category) => {
              const categoryEvents = AVAILABLE_EVENTS.filter(e => e.category === category);
              const selectedInCategory = categoryEvents.filter(e => formData.events.includes(e.value)).length;
              const allSelected = selectedInCategory === categoryEvents.length;
              const someSelected = selectedInCategory > 0 && selectedInCategory < categoryEvents.length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`category-${category}`}
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            const checkboxEl = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                            if (checkboxEl) checkboxEl.indeterminate = someSelected;
                          }
                        }}
                        onCheckedChange={() => toggleAllInCategory(category)}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-base font-medium"
                      >
                        {category}
                      </Label>
                    </div>
                    <Badge variant="outline">
                      {selectedInCategory}/{categoryEvents.length}
                    </Badge>
                  </div>

                  <div className="ml-6 space-y-3">
                    {categoryEvents.map((event) => (
                      <div key={event.value} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Checkbox
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={() => toggleEvent(event.value)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={event.value}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {event.label}
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {category !== EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1] && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Configure delivery and retry behavior for this webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="retry_count">Retry Count</Label>
                <Select
                  value={formData.retry_count.toString()}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, retry_count: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'retry' : 'retries'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Number of retry attempts for failed deliveries
                </p>
              </div>

              <div>
                <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
                <Select
                  value={formData.timeout_seconds.toString()}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, timeout_seconds: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(seconds => (
                      <SelectItem key={seconds} value={seconds.toString()}>
                        {seconds}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Maximum time to wait for endpoint response
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, active: Boolean(checked) }))
                }
              />
              <Label htmlFor="active" className="text-sm">
                Enable webhook immediately after creation
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.url || formData.events.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Create Webhook
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
