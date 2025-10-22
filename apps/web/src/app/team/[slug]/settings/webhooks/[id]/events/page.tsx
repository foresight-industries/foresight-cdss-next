"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy
} from 'lucide-react';

interface WebhookEvent {
  id: string;
  event_type: string;
  status: 'pending' | 'completed' | 'failed' | 'retrying';
  created_at: string;
  updated_at: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at?: string;
  last_http_status?: number;
  last_response_time_ms?: number;
  payload: any;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    timestamp: string;
  };
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
    timestamp: string;
  };
  error_message?: string;
  delivery_attempts: DeliveryAttempt[];
}

interface DeliveryAttempt {
  id: string;
  attempt_number: number;
  timestamp: string;
  http_status?: number;
  response_time_ms?: number;
  error_message?: string;
  request_headers: Record<string, string>;
  response_headers?: Record<string, string>;
  response_body?: string;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  retrying: 'bg-blue-100 text-blue-800 border-blue-200'
};

const STATUS_ICONS = {
  pending: Clock,
  completed: CheckCircle,
  failed: XCircle,
  retrying: RefreshCw
};

export default function WebhookEventsPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const webhookId = params.id as string;

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<string>('24h');

  // Get team slug from pathname
  const teamSlug = pathname.split('/')[2];

  useEffect(() => {
    fetchEvents();
  }, [webhookId, statusFilter, eventTypeFilter, dateRange]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        webhook_id: webhookId,
        team_slug: teamSlug,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(eventTypeFilter !== 'all' && { event_type: eventTypeFilter }),
        ...(dateRange !== 'all' && { date_range: dateRange }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/webhooks/events?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch webhook events');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/webhooks/events/${eventId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_slug: teamSlug })
      });

      if (response.ok) {
        fetchEvents(); // Refresh the events list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to retry event');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.event_type.toLowerCase().includes(query) ||
        event.id.toLowerCase().includes(query) ||
        event.error_message?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Webhooks
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Webhook Event Logs
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View detailed logs and manage delivery attempts for webhook events
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="retrying">Retrying</SelectItem>
            </SelectContent>
          </Select>

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Event Types</SelectItem>
              <SelectItem value="user.created">User Created</SelectItem>
              <SelectItem value="user.updated">User Updated</SelectItem>
              <SelectItem value="claim.created">Claim Created</SelectItem>
              <SelectItem value="claim.updated">Claim Updated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </Alert>
      )}

      {/* Events List */}
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">No webhook events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isExpanded = expandedEvents.has(event.id);

              return (
                <div
                  key={event.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                >
                  {/* Event Header */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEventExpansion(event.id)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(event.status)}
                          <Badge className={STATUS_COLORS[event.status]}>
                            {event.status}
                          </Badge>
                        </div>

                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {event.event_type}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatTimestamp(event.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Attempt {event.attempt_count}/{event.max_attempts}
                          </p>
                          {event.last_http_status && (
                            <p className="text-sm text-slate-500">
                              HTTP {event.last_http_status}
                              {event.last_response_time_ms && ` • ${event.last_response_time_ms}ms`}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>

                          {event.status === 'failed' && event.attempt_count < event.max_attempts && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryEvent(event.id)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Request Details */}
                        <div>
                          <h4 className="font-medium mb-3">Request</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-slate-500 mb-1">URL</p>
                              <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                {event.request?.url}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Payload</p>
                              <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-40">
                                {formatJSON(event.payload)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Response Details */}
                        <div>
                          <h4 className="font-medium mb-3">Response</h4>
                          {event.response ? (
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-slate-500 mb-1">Status</p>
                                <p className="font-mono">HTTP {event.response.status}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Response Body</p>
                                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-40">
                                  {event.response.body}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm">No response received</p>
                          )}

                          {event.error_message && (
                            <div className="mt-3">
                              <p className="text-slate-500 mb-1">Error</p>
                              <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                                {event.error_message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={true} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-none w-[90vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedEvent.status)}
                Event Details: {selectedEvent.event_type}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Event Overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Event ID</p>
                  <p className="font-mono text-sm">{selectedEvent.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={STATUS_COLORS[selectedEvent.status]}>
                    {selectedEvent.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="text-sm">{formatTimestamp(selectedEvent.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Attempts</p>
                  <p className="text-sm">{selectedEvent.attempt_count}/{selectedEvent.max_attempts}</p>
                </div>
              </div>

              {/* Delivery Attempts */}
              <div>
                <h4 className="font-medium mb-3">Delivery Attempts</h4>
                <div className="space-y-3">
                  {selectedEvent.delivery_attempts.map((attempt) => (
                    <div key={attempt.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            Attempt #{attempt.attempt_number}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {formatTimestamp(attempt.timestamp)}
                          </span>
                        </div>
                        {attempt.http_status && (
                          <Badge className={attempt.http_status >= 200 && attempt.http_status < 300 ?
                            'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            HTTP {attempt.http_status}
                          </Badge>
                        )}
                      </div>

                      {attempt.response_body && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Response</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(attempt.response_body || '')}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto max-h-32">
                            {attempt.response_body}
                          </pre>
                        </div>
                      )}

                      {attempt.error_message && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Error</p>
                          <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                            {attempt.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Payload */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Event Payload</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatJSON(selectedEvent.payload))}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-sm overflow-auto max-h-64">
                  {formatJSON(selectedEvent.payload)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
