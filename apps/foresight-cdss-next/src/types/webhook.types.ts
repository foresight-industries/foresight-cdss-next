export interface WebhookConfig {
  id: string;
  team_id: string;
  name: string;
  environment: 'development' | 'production';
  url: string;
  events: string[];
  active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_success_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
  secret_hint?: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  response_time_ms?: number;
  attempt_number: number;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface WebhookQueue {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: any;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery?: string;
  recent_deliveries: WebhookDelivery[];
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  environment?: 'development' | 'production';
  retry_count?: number;
  timeout_seconds?: number;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
}

export interface WebhookEvent {
  event_type: string;
  team_id: string;
  timestamp: number;
  source: string;
  data?: any;
  before?: any;
  after?: any;
  changes?: any;
}

// Available webhook events
export const WEBHOOK_EVENTS = {
  // Team events
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',
  
  // Team member events
  TEAM_MEMBER_ADDED: 'team_member.added',
  TEAM_MEMBER_UPDATED: 'team_member.updated',
  TEAM_MEMBER_REMOVED: 'team_member.removed',
  
  // Test event
  WEBHOOK_TEST: 'webhook.test',
  
  // Special event for all events
  ALL: 'all'
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// HTTP headers sent with webhook requests
export interface WebhookHeaders {
  'Content-Type': 'application/json';
  'User-Agent': string;
  'X-Foresight-Event': string;
  'X-Foresight-Signature': string;
  'X-Foresight-Team-ID': string;
  'X-Foresight-Delivery': string;
}

// Response from webhook processor
export interface WebhookProcessorResponse {
  message: string;
  processed: number;
  total_queued: number;
  results: Array<{
    webhook_id: string;
    success: boolean;
    status_code?: number;
    response_body?: string;
    response_time_ms?: number;
    error_message?: string;
  }>;
}