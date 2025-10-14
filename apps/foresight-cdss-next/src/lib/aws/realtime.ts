import { EventEmitter } from 'events';

/**
 * AWS Real-time Client
 * Replaces Supabase real-time subscriptions with Server-Sent Events (SSE)
 * and WebSocket connections for live updates
 */

type RealtimeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  schema: string;
  table: string;
}) => void;

type RealtimeSubscription = {
  id: string;
  table: string;
  callback: RealtimeCallback;
  unsubscribe: () => void;
};

class AWSRealtimeClient extends EventEmitter {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(private apiEndpoint?: string) {
    super();

    // Use API Gateway WebSocket endpoint if provided
    if (apiEndpoint) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket endpoint
   */
  private connect() {
    if (this.isConnecting || this.websocket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isConnecting = true;

    try {
      // In production, this would be your API Gateway WebSocket endpoint
      const wsEndpoint = this.apiEndpoint || 'ws://localhost:3001/realtime';
      this.websocket = new WebSocket(wsEndpoint);

      this.websocket.onopen = () => {
        console.log('[Realtime] Connected to WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');

        // Re-subscribe to all active subscriptions
        for (const subscription of this.subscriptions.values()) {
          this.sendSubscription(subscription.table);
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[Realtime] Failed to parse message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('[Realtime] WebSocket disconnected');
        this.isConnecting = false;
        this.websocket = null;
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('[Realtime] WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('[Realtime] Failed to connect:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any) {
    if (data.type === 'database_change') {
      const { schema, table, eventType, new: newRecord, old: oldRecord } = data;

      // Find matching subscriptions
      for (const subscription of this.subscriptions.values()) {
        if (subscription.table === table || subscription.table === '*') {
          subscription.callback({
            eventType,
            new: newRecord,
            old: oldRecord,
            schema,
            table
          });
        }
      }
    }
  }

  /**
   * Send subscription message to server
   */
  private sendSubscription(table: string) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        table
      }));
    }
  }

  /**
   * Subscribe to table changes
   * This replaces supabase.channel().on()
   */
  channel(tableName = '*') {
    return {
      on: (
        event: 'postgres_changes',
        config: { event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; schema: string; table: string },
        callback: RealtimeCallback
      ) => {
        const subscriptionId = `${config.table}_${Date.now()}_${Math.random()}`;

        const subscription: RealtimeSubscription = {
          id: subscriptionId,
          table: config.table,
          callback,
          unsubscribe: () => {
            this.subscriptions.delete(subscriptionId);

            // Send unsubscribe message if connected
            if (this.websocket?.readyState === WebSocket.OPEN) {
              this.websocket.send(JSON.stringify({
                type: 'unsubscribe',
                table: config.table,
                subscriptionId
              }));
            }
          }
        };

        this.subscriptions.set(subscriptionId, subscription);

        // Subscribe immediately if connected
        if (this.websocket?.readyState === WebSocket.OPEN) {
          this.sendSubscription(config.table);
        }

        return {
          subscribe: () => {
            // WebSocket subscription is automatic
            console.log(`[Realtime] Subscribed to ${config.table}`);
            return subscription;
          }
        };
      }
    };
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    this.subscriptions.clear();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.removeAllListeners();
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.websocket) return 'DISCONNECTED';

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Create global realtime client instance
let realtimeClient: AWSRealtimeClient | null = null;

/**
 * Get or create realtime client
 * This replaces createSupabaseClient().channel()
 */
export function createRealtimeClient(apiEndpoint?: string): AWSRealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new AWSRealtimeClient(apiEndpoint);
  }
  return realtimeClient;
}

/**
 * Server-Sent Events (SSE) client for simpler real-time updates
 * Alternative to WebSocket for one-way server-to-client communication
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private subscriptions = new Map<string, (data: any) => void>();

  constructor(private endpoint: string) {}

  /**
   * Subscribe to SSE events
   */
  subscribe(eventType: string, callback: (data: any) => void) {
    this.subscriptions.set(eventType, callback);

    if (!this.eventSource) {
      this.eventSource = new EventSource(this.endpoint);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const handler = this.subscriptions.get(data.type);
          if (handler) {
            handler(data);
          }
        } catch (error) {
          console.error('[SSE] Failed to parse event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
      };
    }

    return {
      unsubscribe: () => {
        this.subscriptions.delete(eventType);

        if (this.subscriptions.size === 0 && this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.subscriptions.clear();
  }
}

/**
 * Create SSE client for real-time updates
 * Use this for simpler one-way updates from server
 */
export function createSSEClient(endpoint: string): SSEClient {
  return new SSEClient(endpoint);
}

// Export types
export type { RealtimeCallback, RealtimeSubscription };
