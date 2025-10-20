import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeInsert, safeSelect, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { apiKeys, teamMembers, userProfiles, organizations } from '@foresight-cdss-next/db';
import { randomBytes, createHash } from 'node:crypto';

interface CreateApiKeyRequest {
  organizationId: string;
  name: string;
  description?: string;
  scopes: string[];
  expiresAt?: string; // ISO date string, optional
}

interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: string;
}

// Generate a secure API key
function generateApiKey(): { key: string; prefix: string; hash: string } {
  // Generate random bytes for the key
  const randomBytesArray = randomBytes(32);
  const key = `fsk_${randomBytesArray.toString('base64url')}`;
  
  // Create prefix for identification (first 10 chars)
  const prefix = key.substring(0, 10);
  
  // Hash the key for storage
  const hash = createHash('sha256').update(key).digest('hex');
  
  return { key, prefix, hash };
}

// POST /api/api-keys - Create a new API key
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const createData: CreateApiKeyRequest = await request.json();

    // Validate required fields
    if (!createData.organizationId || !createData.name || !createData.scopes || createData.scopes.length === 0) {
      return NextResponse.json({
        error: 'Missing required fields: organizationId, name, and scopes are required'
      }, { status: 400 });
    }

    // Verify user has admin access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role,
        teamMemberId: teamMembers.id
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, createData.organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to manage API keys for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as { organizationId: string; role: string; teamMemberId: string };

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can manage API keys'
      }, { status: 403 });
    }

    // Generate the API key
    const { key, prefix, hash } = generateApiKey();

    // Create the API key record
    const { data: newApiKey } = await safeInsert(async () =>
      db.insert(apiKeys)
        .values({
          organizationId: createData.organizationId,
          name: createData.name,
          description: createData.description || null,
          keyHash: hash,
          keyPrefix: prefix,
          scopes: JSON.stringify(createData.scopes),
          isActive: true,
          expiresAt: createData.expiresAt ? new Date(createData.expiresAt) : null,
          createdBy: membershipData.teamMemberId,
        })
        .returning()
    );

    if (!newApiKey || newApiKey.length === 0) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    const createdApiKey = newApiKey[0] as any;

    return NextResponse.json({
      message: 'API key created successfully',
      apiKey: {
        id: createdApiKey.id,
        name: createdApiKey.name,
        description: createdApiKey.description,
        keyPrefix: createdApiKey.keyPrefix,
        scopes: JSON.parse(createdApiKey.scopes || '[]'),
        isActive: createdApiKey.isActive,
        expiresAt: createdApiKey.expiresAt,
        createdAt: createdApiKey.createdAt,
        lastUsed: createdApiKey.lastUsed,
      },
      // Return the actual key only once during creation
      key: key,
      warning: 'This is the only time the full API key will be shown. Please save it securely.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/api-keys - List API keys for an organization
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({
        error: 'organizationId query parameter is required'
      }, { status: 400 });
    }

    const { db } = await createAuthenticatedDatabaseClient();

    // Verify user has access to the organization
    const { data: membership } = await safeSingle(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(teamMembers.organizationId, organizationId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
    );

    if (!membership) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view API keys for this organization'
      }, { status: 403 });
    }

    const membershipData = membership as { organizationId: string; role: string };

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(membershipData.role)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can view API keys'
      }, { status: 403 });
    }

    // Get API keys for the organization (excluding deleted ones)
    const { data: apiKeysList } = await safeSelect(async () =>
      db.select({
        id: apiKeys.id,
        name: apiKeys.name,
        description: apiKeys.description,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        isActive: apiKeys.isActive,
        lastUsed: apiKeys.lastUsed,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(and(
        eq(apiKeys.organizationId, organizationId),
        isNull(apiKeys.deletedAt)
      ))
      .orderBy(apiKeys.createdAt)
    );

    // Parse scopes and format response
    const formattedApiKeys = (apiKeysList || []).map(key => ({
      ...key,
      scopes: JSON.parse(key.scopes || '[]'),
    }));

    return NextResponse.json({
      apiKeys: formattedApiKeys
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}