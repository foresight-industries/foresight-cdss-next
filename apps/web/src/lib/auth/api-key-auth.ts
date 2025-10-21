import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { createDatabaseAdminClient, safeSingle, safeUpdate } from '@/lib/aws/database';
import { eq, and, isNull } from 'drizzle-orm';
import { apiKeys, organizations } from '@foresight-cdss-next/db';

export interface ApiKeyAuthResult {
  success: boolean;
  error?: string;
  organizationId?: string;
  apiKeyId?: string;
  scopes?: string[];
}

/**
 * Validates an API key from the Authorization header
 * Expected format: "Bearer fsk_..."
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { success: false, error: 'Missing Authorization header' };
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return { success: false, error: 'Invalid Authorization header format. Expected: Bearer <api_key>' };
    }

    // Validate API key format
    if (!token.startsWith('fsk_')) {
      return { success: false, error: 'Invalid API key format' };
    }

    // Hash the provided key
    const keyHash = createHash('sha256').update(token).digest('hex');
    const keyPrefix = token.substring(0, 10);

    // Look up the API key in the database
    const { db } = createDatabaseAdminClient();

    const { data: apiKey } = await safeSingle(async () =>
      db.select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
        lastUsed: apiKeys.lastUsed,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
      })
      .from(apiKeys)
      .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.keyPrefix, keyPrefix),
        eq(apiKeys.isActive, true),
        isNull(apiKeys.deletedAt)
      ))
    );

    if (!apiKey) {
      return { success: false, error: 'Invalid or inactive API key' };
    }

    const apiKeyData = apiKey as any;

    // Check if the API key has expired
    if (apiKeyData.expiresAt && new Date() > new Date(apiKeyData.expiresAt)) {
      return { success: false, error: 'API key has expired' };
    }

    // Update last used timestamp (fire and forget)
    safeUpdate(async () =>
      db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, apiKeyData.id))
        .returning({ id: apiKeys.id })
    ).catch(error => {
      console.error('Failed to update API key last used timestamp:', error);
      // Don't fail the authentication for this
    });

    // Parse scopes
    const scopes = JSON.parse(apiKeyData.scopes || '[]');

    return {
      success: true,
      organizationId: apiKeyData.organizationId,
      apiKeyId: apiKeyData.id,
      scopes,
    };

  } catch (error) {
    console.error('Error validating API key:', error);
    return { success: false, error: 'Internal authentication error' };
  }
}

/**
 * Middleware function to require API key authentication
 * Can be used in API routes to ensure requests are authenticated with a valid API key
 */
export async function requireApiKeyAuth(
  request: NextRequest,
  requiredScopes?: string[]
): Promise<ApiKeyAuthResult> {
  const authResult = await validateApiKey(request);

  if (!authResult.success) {
    return authResult;
  }

  // Check required scopes if specified
  if (requiredScopes && requiredScopes.length > 0) {
    const userScopes = authResult.scopes || [];

    // Check if user has all required scopes
    const hasAllScopes = requiredScopes.every(scope => userScopes.includes(scope));

    if (!hasAllScopes) {
      return {
        success: false,
        error: `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`
      };
    }
  }

  return authResult;
}

// Export the scopes from the separate file to maintain compatibility
export { API_SCOPES, getAvailableScopes, type ApiScope } from './api-scopes';
