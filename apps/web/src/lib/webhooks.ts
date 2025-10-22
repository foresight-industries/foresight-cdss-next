import { publishOrganizationEvent, publishUserEvent, publishTeamMemberEvent, publishDocumentEvent } from '../../../../packages/webhooks/src/index';

/**
 * Webhook Integration Utilities
 *
 * Helper functions to publish webhook events from API routes
 */

// Determine environment based on current environment
function getCurrentEnvironment(): 'staging' | 'production' {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? 'production' : 'staging';
}

// Get organization ID from team membership or context
// async function getOrganizationId(userId?: string): Promise<string | null> {
//   // This would typically get the organization ID from the current user context
//   // For now, we'll need to pass it explicitly or get it from the request context
//   return null; // Implementation depends on your auth context
// }

/**
 * Organization Events
 */
export async function publishOrganizationCreated(
  organizationId: string,
  organizationData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishOrganizationEvent(
      'organization.created',
      organizationId,
      organizationData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish organization.created event:', error);
    // Don't throw - webhook publishing shouldn't break the main flow
  }
}

export async function publishOrganizationUpdated(
  organizationId: string,
  organizationData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishOrganizationEvent(
      'organization.updated',
      organizationId,
      organizationData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish organization.updated event:', error);
  }
}

export async function publishOrganizationDeleted(
  organizationId: string,
  organizationData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishOrganizationEvent(
      'organization.deleted',
      organizationId,
      organizationData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish organization.deleted event:', error);
  }
}

export async function publishOrganizationSettingsChanged(
  organizationId: string,
  settingsData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishOrganizationEvent(
      'organization.settings.changed',
      organizationId,
      settingsData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish organization.settings.changed event:', error);
  }
}

/**
 * User Events
 */
export async function publishUserCreated(
  organizationId: string,
  userData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishUserEvent(
      'user.created',
      organizationId,
      userData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish user.created event:', error);
  }
}

export async function publishUserUpdated(
  organizationId: string,
  userData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishUserEvent(
      'user.updated',
      organizationId,
      userData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish user.updated event:', error);
  }
}

export async function publishUserDeleted(
  organizationId: string,
  userData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishUserEvent(
      'user.deleted',
      organizationId,
      userData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish user.deleted event:', error);
  }
}

export async function publishUserRoleChanged(
  organizationId: string,
  userData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishUserEvent(
      'user.role.changed',
      organizationId,
      userData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish user.role.changed event:', error);
  }
}

/**
 * Team Member Events
 */
export async function publishTeamMemberAdded(
  organizationId: string,
  memberData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishTeamMemberEvent(
      'team_member.added',
      organizationId,
      memberData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish team_member.added event:', error);
  }
}

export async function publishTeamMemberUpdated(
  organizationId: string,
  memberData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishTeamMemberEvent(
      'team_member.updated',
      organizationId,
      memberData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish team_member.updated event:', error);
  }
}

export async function publishTeamMemberRemoved(
  organizationId: string,
  memberData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishTeamMemberEvent(
      'team_member.removed',
      organizationId,
      memberData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish team_member.removed event:', error);
  }
}

/**
 * Document Events
 */
export async function publishDocumentUploaded(
  organizationId: string,
  documentData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishDocumentEvent(
      'document.uploaded',
      organizationId,
      documentData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish document.uploaded event:', error);
  }
}

export async function publishDocumentProcessed(
  organizationId: string,
  documentData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishDocumentEvent(
      'document.processed',
      organizationId,
      documentData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish document.processed event:', error);
  }
}

export async function publishDocumentAnalysisCompleted(
  organizationId: string,
  documentData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishDocumentEvent(
      'document.analysis.completed',
      organizationId,
      documentData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish document.analysis.completed event:', error);
  }
}

export async function publishDocumentDeleted(
  organizationId: string,
  documentData: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await publishDocumentEvent(
      'document.deleted',
      organizationId,
      documentData,
      getCurrentEnvironment(),
      userId
    );
  } catch (error) {
    console.error('Failed to publish document.deleted event:', error);
  }
}
