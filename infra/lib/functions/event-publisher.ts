import { Handler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/api';

interface EventPayload {
  eventType: string;
  eventData: any;
  organizationId: string;
  targetUsers?: string[];
  metadata?: Record<string, any>;
  timestamp: string;
  publisherId: string;
}

interface EventResponse {
  success: boolean;
  eventId: string;
  subscribersNotified: number;
  message: string;
}

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
const GRAPHQL_API_KEY = process.env.GRAPHQL_API_KEY;

if (!GRAPHQL_ENDPOINT || !GRAPHQL_API_KEY) {
  throw new Error('GRAPHQL_ENDPOINT and GRAPHQL_API_KEY are required');
}

const client = generateClient({
  endpoint: GRAPHQL_ENDPOINT,
  authMode: 'apiKey',
  apiKey: process.env.GRAPHQL_API_KEY!,
});

// Healthcare RCM Event Types
const HEALTHCARE_EVENT_TYPES = {
  // Claim Events
  CLAIM_CREATED: 'CLAIM_CREATED',
  CLAIM_STATUS_CHANGED: 'CLAIM_STATUS_CHANGED',
  CLAIM_DENIED: 'CLAIM_DENIED',
  CLAIM_APPROVED: 'CLAIM_APPROVED',
  CLAIM_PAYMENT_RECEIVED: 'CLAIM_PAYMENT_RECEIVED',

  // Prior Authorization Events
  PRIOR_AUTH_REQUESTED: 'PRIOR_AUTH_REQUESTED',
  PRIOR_AUTH_APPROVED: 'PRIOR_AUTH_APPROVED',
  PRIOR_AUTH_DENIED: 'PRIOR_AUTH_DENIED',
  PRIOR_AUTH_EXPIRED: 'PRIOR_AUTH_EXPIRED',

  // Patient Events
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
  PATIENT_INSURANCE_CHANGED: 'PATIENT_INSURANCE_CHANGED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',

  // Payment Events
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  COPAY_COLLECTED: 'COPAY_COLLECTED',
  REFUND_ISSUED: 'REFUND_ISSUED',

  // System Events
  BATCH_JOB_COMPLETED: 'BATCH_JOB_COMPLETED',
  BATCH_JOB_FAILED: 'BATCH_JOB_FAILED',
  EDI_TRANSMISSION_SENT: 'EDI_TRANSMISSION_SENT',
  EDI_TRANSMISSION_RECEIVED: 'EDI_TRANSMISSION_RECEIVED',

  // Audit Events
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  DATA_ACCESS: 'DATA_ACCESS',
  SECURITY_ALERT: 'SECURITY_ALERT',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION'
} as const;

// Subscription mutation to trigger real-time updates
const PUBLISH_SUBSCRIPTION_MUTATION = `
  mutation PublishEventToSubscribers(
    $eventType: String!
    $eventData: AWSJSON!
    $organizationId: ID!
    $targetUsers: [String!]
    $metadata: AWSJSON
    $timestamp: AWSDateTime!
  ) {
    publishEventToSubscribers(
      eventType: $eventType
      eventData: $eventData
      organizationId: $organizationId
      targetUsers: $targetUsers
      metadata: $metadata
      timestamp: $timestamp
    ) {
      success
      subscribersNotified
      message
    }
  }
`;

// Store event in database for audit trail
const STORE_EVENT_MUTATION = `
  mutation StoreEvent(
    $eventType: String!
    $eventData: AWSJSON!
    $organizationId: ID!
    $publisherId: String!
    $targetUsers: [String!]
    $metadata: AWSJSON
    $timestamp: AWSDateTime!
  ) {
    storeEvent(
      eventType: $eventType
      eventData: $eventData
      organizationId: $organizationId
      publisherId: $publisherId
      targetUsers: $targetUsers
      metadata: $metadata
      timestamp: $timestamp
    ) {
      id
      eventType
      timestamp
    }
  }
`;

export const handler: Handler<EventPayload, EventResponse> = async (event) => {
  try {
    console.log('Processing event:', JSON.stringify(event, null, 2));

    const {
      eventType,
      eventData,
      organizationId,
      targetUsers = [],
      metadata = {},
      timestamp,
      publisherId
    } = event;

    // Validate event type
    if (!Object.values(HEALTHCARE_EVENT_TYPES).includes(eventType as any)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    // Validate required fields
    if (!eventType || !eventData || !organizationId || !publisherId) {
      throw new Error('Missing required fields: eventType, eventData, organizationId, publisherId');
    }

    // Generate unique event ID
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store event in database for audit trail and history
    try {
      await client.graphql({ query: STORE_EVENT_MUTATION, variables: {
        eventType,
        eventData: JSON.stringify(eventData),
        organizationId,
        publisherId,
        targetUsers,
        metadata: JSON.stringify({
          ...metadata,
          eventId,
          source: 'event-publisher-lambda'
        }),
        timestamp
      } });
      console.log('Event stored in database for audit trail');
    } catch (dbError) {
      console.error('Failed to store event in database:', dbError);
      // Continue with publishing even if storage fails
    }

    // Publish to subscribers based on event type and targeting
    let subscribersNotified = 0;

    try {
      // Determine subscription filters based on event type
      const subscriptionTargets = getSubscriptionTargets(eventType, organizationId, targetUsers);

      for (const target of subscriptionTargets) {
        try {
          await client.graphql({ query: PUBLISH_SUBSCRIPTION_MUTATION, variables: {
            eventType,
            eventData: JSON.stringify({
              ...eventData,
              eventId,
              target: target.filter
            }),
            organizationId,
            targetUsers: target.users,
            metadata: JSON.stringify({
              ...metadata,
              eventId,
              subscriptionFilter: target.filter
            }),
            timestamp
          } });
          subscribersNotified += target.users.length;
        } catch (subError) {
          console.error(`Failed to publish to subscription target ${target.filter}:`, subError);
        }
      }
    } catch (publishError) {
      console.error('Failed to publish to subscribers:', publishError);
    }

    // Log successful event publication
    console.log(`Event ${eventId} published successfully. Type: ${eventType}, Subscribers notified: ${subscribersNotified}`);

    return {
      success: true,
      eventId,
      subscribersNotified,
      message: `Event published successfully to ${subscribersNotified} subscribers`
    };

  } catch (error) {
    console.error('Error processing event:', error);

    return {
      success: false,
      eventId: '',
      subscribersNotified: 0,
      message: `Failed to publish event: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Determine which subscriptions should receive this event
function getSubscriptionTargets(eventType: string, organizationId: string, targetUsers: string[] = []) {
  const targets = [];

  // Organization-wide events (all users in the organization)
  if (isOrganizationWideEvent(eventType)) {
    targets.push({
      filter: `organization:${organizationId}`,
      users: ['*'] // All users in organization
    });
  }

  // Role-based events (specific user roles)
  const roleTargets = getRoleBasedTargets(eventType, organizationId);
  targets.push(...roleTargets);

  // User-specific events
  if (targetUsers.length > 0) {
    targets.push({
      filter: `users:specific`,
      users: targetUsers
    });
  }

  // Department-specific events
  const deptTargets = getDepartmentTargets(eventType, organizationId);
  targets.push(...deptTargets);

  return targets;
}

function isOrganizationWideEvent(eventType: string): boolean {
  const orgWideEvents = [
    HEALTHCARE_EVENT_TYPES.BATCH_JOB_COMPLETED,
    HEALTHCARE_EVENT_TYPES.BATCH_JOB_FAILED,
    HEALTHCARE_EVENT_TYPES.SECURITY_ALERT,
    HEALTHCARE_EVENT_TYPES.COMPLIANCE_VIOLATION,
    HEALTHCARE_EVENT_TYPES.EDI_TRANSMISSION_SENT,
    HEALTHCARE_EVENT_TYPES.EDI_TRANSMISSION_RECEIVED
  ];

  return orgWideEvents.includes(eventType as any);
}

function getRoleBasedTargets(eventType: string, organizationId: string) {
  const targets = [];

  // Billing/Finance team events
  if ([
    HEALTHCARE_EVENT_TYPES.CLAIM_DENIED,
    HEALTHCARE_EVENT_TYPES.CLAIM_APPROVED,
    HEALTHCARE_EVENT_TYPES.CLAIM_PAYMENT_RECEIVED,
    HEALTHCARE_EVENT_TYPES.PAYMENT_PROCESSED,
    HEALTHCARE_EVENT_TYPES.PAYMENT_FAILED,
    HEALTHCARE_EVENT_TYPES.REFUND_ISSUED
  ].includes(eventType as any)) {
    targets.push({
      filter: `role:billing:${organizationId}`,
      users: ['role:billing', 'role:finance', 'role:manager']
    });
  }

  // Clinical team events
  if ([
    HEALTHCARE_EVENT_TYPES.PRIOR_AUTH_REQUESTED,
    HEALTHCARE_EVENT_TYPES.PRIOR_AUTH_APPROVED,
    HEALTHCARE_EVENT_TYPES.PRIOR_AUTH_DENIED,
    HEALTHCARE_EVENT_TYPES.PATIENT_REGISTERED,
    HEALTHCARE_EVENT_TYPES.APPOINTMENT_SCHEDULED,
    HEALTHCARE_EVENT_TYPES.APPOINTMENT_CANCELLED
  ].includes(eventType as any)) {
    targets.push({
      filter: `role:clinical:${organizationId}`,
      users: ['role:provider', 'role:nurse', 'role:clinical_staff']
    });
  }

  // IT/Admin team events
  if ([
    HEALTHCARE_EVENT_TYPES.USER_LOGIN,
    HEALTHCARE_EVENT_TYPES.USER_LOGOUT,
    HEALTHCARE_EVENT_TYPES.DATA_ACCESS,
    HEALTHCARE_EVENT_TYPES.SECURITY_ALERT
  ].includes(eventType as any)) {
    targets.push({
      filter: `role:admin:${organizationId}`,
      users: ['role:admin', 'role:it_support', 'role:security']
    });
  }

  return targets;
}

function getDepartmentTargets(eventType: string, organizationId: string) {
  const targets = [];

  // Patient registration events go to front desk
  if ([
    HEALTHCARE_EVENT_TYPES.PATIENT_REGISTERED,
    HEALTHCARE_EVENT_TYPES.PATIENT_INSURANCE_CHANGED,
    HEALTHCARE_EVENT_TYPES.COPAY_COLLECTED
  ].includes(eventType as any)) {
    targets.push({
      filter: `department:front_desk:${organizationId}`,
      users: ['department:front_desk', 'department:registration']
    });
  }

  return targets;
}
