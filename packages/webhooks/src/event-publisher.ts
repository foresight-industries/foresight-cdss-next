import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { WebhookEventData } from './types';

interface PublishEventOptions {
  eventBusName?: string;
  source?: string;
  region?: string;
}

/**
 * Event Publisher for Webhook System
 *
 * Publishes events to EventBridge which triggers webhook deliveries
 */
export class WebhookEventPublisher {
  private eventBridgeClient: EventBridgeClient;
  private defaultEventBusName: string;
  private defaultSource: string;

  constructor(options: PublishEventOptions = {}) {
    this.eventBridgeClient = new EventBridgeClient({
      region: options.region || process.env.AWS_REGION || 'us-east-1',
    });

    this.defaultEventBusName = options.eventBusName ||
      process.env.WEBHOOK_EVENT_BUS_NAME ||
      'foresight-webhooks-staging';

    this.defaultSource = options.source || 'foresight';
  }

  /**
   * Publish a webhook event to EventBridge
   */
  async publishEvent(eventData: WebhookEventData): Promise<void> {
    const { organizationId, environment, eventType, data, userId, metadata } = eventData;

    // Determine event source based on event type
    const source = this.getEventSource(eventType);

    // Create EventBridge event
    const event = {
      Source: source,
      DetailType: this.formatDetailType(eventType),
      Detail: JSON.stringify({
        organizationId,
        environment,
        eventType,
        data,
        userId,
        metadata,
        timestamp: new Date().toISOString(),
      }),
      EventBusName: this.defaultEventBusName,
    };

    try {
      await this.eventBridgeClient.send(new PutEventsCommand({
        Entries: [event],
      }));

      console.log(`Published webhook event: ${eventType} for organization ${organizationId}`);
    } catch (error) {
      console.error(`Failed to publish webhook event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Publish multiple events in a batch
   */
  async publishEvents(events: WebhookEventData[]): Promise<void> {
    if (events.length === 0) return;

    if (events.length > 10) {
      // EventBridge has a limit of 10 events per batch
      const batches = this.chunkArray(events, 10);
      await Promise.all(batches.map(batch => this.publishEvents(batch)));
      return;
    }

    const eventEntries = events.map(eventData => ({
      Source: this.getEventSource(eventData.eventType),
      DetailType: this.formatDetailType(eventData.eventType),
      Detail: JSON.stringify({
        organizationId: eventData.organizationId,
        environment: eventData.environment,
        eventType: eventData.eventType,
        data: eventData.data,
        userId: eventData.userId,
        metadata: eventData.metadata,
        timestamp: new Date().toISOString(),
      }),
      EventBusName: this.defaultEventBusName,
    }));

    try {
      await this.eventBridgeClient.send(new PutEventsCommand({
        Entries: eventEntries,
      }));

      console.log(`Published ${events.length} webhook events in batch`);
    } catch (error) {
      console.error('Failed to publish webhook events batch:', error);
      throw error;
    }
  }

  /**
   * Get the appropriate event source based on event type
   */
  private getEventSource(eventType: string): string {
    const parts = eventType.split('.');
    if (parts.length >= 2) {
      return `${this.defaultSource}.${parts[0]}`;
    }
    return this.defaultSource;
  }

  /**
   * Format event type for EventBridge DetailType
   */
  private formatDetailType(eventType: string): string {
    return eventType
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Utility to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Convenience functions for publishing specific event types
 */

// Organization Events
export async function publishOrganizationEvent(
  eventType: 'organization.created' | 'organization.updated' | 'organization.deleted' | 'organization.settings.changed',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}

// User Events
export async function publishUserEvent(
  eventType: 'user.created' | 'user.updated' | 'user.deleted' | 'user.role.changed',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}

// Patient Events
export async function publishPatientEvent(
  eventType: 'patient.created' | 'patient.updated' | 'patient.deleted',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}

// Claim Events
export async function publishClaimEvent(
  eventType: 'claim.created' | 'claim.updated' | 'claim.submitted' | 'claim.approved' | 'claim.denied' | 'claim.processing.started' | 'claim.processing.completed',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}

// Document Events
export async function publishDocumentEvent(
  eventType: 'document.uploaded' | 'document.processed' | 'document.analysis.completed' | 'document.deleted',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}

// Team Member Events
export async function publishTeamMemberEvent(
  eventType: 'team_member.added' | 'team_member.updated' | 'team_member.removed',
  organizationId: string,
  data: Record<string, any>,
  environment: 'staging' | 'production' = 'staging',
  userId?: string
): Promise<void> {
  const publisher = new WebhookEventPublisher();
  await publisher.publishEvent({
    organizationId,
    environment,
    eventType,
    data,
    userId,
  });
}
