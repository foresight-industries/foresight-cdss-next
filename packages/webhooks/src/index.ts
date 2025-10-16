// Event Publishing
export {
  WebhookEventPublisher,
  publishOrganizationEvent,
  publishUserEvent,
  publishPatientEvent,
  publishClaimEvent,
  publishDocumentEvent,
  publishTeamMemberEvent,
} from './event-publisher';

// Signature Validation
export {
  WebhookSignatureValidator,
  validateWebhookSignature,
  createWebhookValidationMiddleware,
} from './signature-validator';

// Secret Rotation
export {
  WebhookSecretRotationManager,
  handleSecretRotation,
} from './secret-rotation';

// Types
export interface WebhookEventData {
  organizationId: string;
  environment: 'staging' | 'production';
  eventType: string;
  data: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface WebhookHeaders {
  'x-foresight-signature'?: string;
  'x-foresight-timestamp'?: string;
  'x-foresight-delivery'?: string;
  'content-type'?: string;
  [key: string]: string | undefined;
}

export interface WebhookValidationOptions {
  toleranceInSeconds?: number;
  requiredHeaders?: string[];
}