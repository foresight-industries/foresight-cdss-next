/**
 * Common API scopes that can be assigned to API keys
 * This file contains only constants and can be safely imported in client components
 */
export const API_SCOPES = {
  // Read permissions
  'encounters:read': 'Read encounter data',
  'patients:read': 'Read patient data',
  'claims:read': 'Read claims data',
  'reports:read': 'Read reports and analytics',
  'organizations:read': 'Read organization data',

  // Write permissions
  'encounters:write': 'Create and update encounters',
  'patients:write': 'Create and update patients',
  'claims:write': 'Create and update claims',
  'claims:submit': 'Submit claims to payers',

  // Admin permissions
  'webhooks:manage': 'Manage webhook configurations',
  'users:manage': 'Manage team members',
  'settings:manage': 'Manage organization settings',
  'api-keys:manage': 'Manage API keys (super admin)',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

/**
 * Get all available scopes grouped by category
 */
export function getAvailableScopes() {
  return {
    read: [
      'encounters:read',
      'patients:read',
      'claims:read',
      'reports:read',
      'organizations:read',
    ],
    write: [
      'encounters:write',
      'patients:write',
      'claims:write',
      'claims:submit',
    ],
    admin: [
      'webhooks:manage',
      'users:manage',
      'settings:manage',
      'api-keys:manage',
    ],
  } as const;
}