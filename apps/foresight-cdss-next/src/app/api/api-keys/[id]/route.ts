import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSingle, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { eq, and, isNull } from 'drizzle-orm';
import { apiKeys, teamMembers, userProfiles } from '@foresight-cdss-next/db';

interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
  expiresAt?: string;
}

// GET /api/api-keys/[id] - Get a specific API key
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const apiKeyId = params.id;

    // Get the API key with organization verification
    const { data: apiKey } = await safeSingle(async () =>
      db.select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        name: apiKeys.name,
        description: apiKeys.description,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        isActive: apiKeys.isActive,
        lastUsed: apiKeys.lastUsed,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        memberRole: teamMembers.role,
      })
      .from(apiKeys)
      .innerJoin(teamMembers, eq(apiKeys.organizationId, teamMembers.organizationId))
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(apiKeys.id, apiKeyId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true),
        isNull(apiKeys.deletedAt)
      ))
    );

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found or access denied' }, { status: 404 });
    }

    const apiKeyData = apiKey as any;

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(apiKeyData.memberRole)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can view API keys'
      }, { status: 403 });
    }

    return NextResponse.json({
      apiKey: {
        id: apiKeyData.id,
        name: apiKeyData.name,
        description: apiKeyData.description,
        keyPrefix: apiKeyData.keyPrefix,
        scopes: JSON.parse(apiKeyData.scopes || '[]'),
        isActive: apiKeyData.isActive,
        lastUsed: apiKeyData.lastUsed,
        expiresAt: apiKeyData.expiresAt,
        createdAt: apiKeyData.createdAt,
        updatedAt: apiKeyData.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/api-keys/[id] - Update an API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const apiKeyId = params.id;
    const updateData: UpdateApiKeyRequest = await request.json();

    // Verify user has access to this API key and can modify it
    const { data: existingApiKey } = await safeSingle(async () =>
      db.select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        memberRole: teamMembers.role,
      })
      .from(apiKeys)
      .innerJoin(teamMembers, eq(apiKeys.organizationId, teamMembers.organizationId))
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(apiKeys.id, apiKeyId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true),
        isNull(apiKeys.deletedAt)
      ))
    );

    if (!existingApiKey) {
      return NextResponse.json({ error: 'API key not found or access denied' }, { status: 404 });
    }

    const existingData = existingApiKey as any;

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(existingData.memberRole)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can modify API keys'
      }, { status: 403 });
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }
    if (updateData.scopes !== undefined) {
      updateFields.scopes = JSON.stringify(updateData.scopes);
    }
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive;
    }
    if (updateData.expiresAt !== undefined) {
      updateFields.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
    }

    // Update the API key
    const { data: updatedApiKey } = await safeUpdate(async () =>
      db.update(apiKeys)
        .set(updateFields)
        .where(eq(apiKeys.id, apiKeyId))
        .returning()
    );

    if (!updatedApiKey || updatedApiKey.length === 0) {
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
    }

    const updatedData = updatedApiKey[0] as any;

    return NextResponse.json({
      message: 'API key updated successfully',
      apiKey: {
        id: updatedData.id,
        name: updatedData.name,
        description: updatedData.description,
        keyPrefix: updatedData.keyPrefix,
        scopes: JSON.parse(updatedData.scopes || '[]'),
        isActive: updatedData.isActive,
        lastUsed: updatedData.lastUsed,
        expiresAt: updatedData.expiresAt,
        createdAt: updatedData.createdAt,
        updatedAt: updatedData.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/api-keys/[id] - Delete (soft delete) an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const apiKeyId = params.id;

    // Verify user has access to this API key and can delete it
    const { data: existingApiKey } = await safeSingle(async () =>
      db.select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        name: apiKeys.name,
        memberRole: teamMembers.role,
      })
      .from(apiKeys)
      .innerJoin(teamMembers, eq(apiKeys.organizationId, teamMembers.organizationId))
      .innerJoin(userProfiles, eq(teamMembers.clerkUserId, userProfiles.clerkUserId))
      .where(and(
        eq(apiKeys.id, apiKeyId),
        eq(userProfiles.clerkUserId, userId),
        eq(teamMembers.isActive, true),
        isNull(apiKeys.deletedAt)
      ))
    );

    if (!existingApiKey) {
      return NextResponse.json({ error: 'API key not found or access denied' }, { status: 404 });
    }

    const existingData = existingApiKey as any;

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(existingData.memberRole)) {
      return NextResponse.json({
        error: 'Access denied: Only admins and owners can delete API keys'
      }, { status: 403 });
    }

    // Soft delete the API key
    const { data: deletedApiKey } = await safeUpdate(async () =>
      db.update(apiKeys)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, apiKeyId))
        .returning({ id: apiKeys.id, name: apiKeys.name })
    );

    if (!deletedApiKey || deletedApiKey.length === 0) {
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
      deletedApiKey: deletedApiKey[0]
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}