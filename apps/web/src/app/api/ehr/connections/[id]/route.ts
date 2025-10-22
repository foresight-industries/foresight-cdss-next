import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeUpdate, safeDelete } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';
import { teamMembers, ehrConnections, syncJobs } from '@foresight-cdss-next/db';
import type {
  UpdateEHRConnectionRequest,
  EHRAuthConfig,
} from "@/types/ehr.types";

// GET - Get specific EHR connection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const connectionId = params.id;

    // First verify user has access to a team
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get connection with team verification
    const { data: connection, error } = await safeSingle(async () =>
      db.select({
        id: ehrConnections.id,
        organizationId: ehrConnections.organizationId,
        ehrSystemName: ehrConnections.ehrSystemName,
        version: ehrConnections.version,
        apiType: ehrConnections.apiType,
        authMethod: ehrConnections.authMethod,
        baseUrl: ehrConnections.baseUrl,
        clientId: ehrConnections.clientId,
        clientSecret: ehrConnections.clientSecret,
        apiKey: ehrConnections.apiKey,
        tokenUrl: ehrConnections.tokenUrl,
        authorizeUrl: ehrConnections.authorizeUrl,
        scopes: ehrConnections.scopes,
        isActive: ehrConnections.isActive,
        lastSyncAt: ehrConnections.lastSyncAt,
        lastTestAt: ehrConnections.lastTestAt,
        testStatus: ehrConnections.testStatus,
        syncPatients: ehrConnections.syncPatients,
        createdAt: ehrConnections.createdAt,
        updatedAt: ehrConnections.updatedAt
      })
      .from(ehrConnections)
      .where(and(
        eq(ehrConnections.id, connectionId),
        eq(ehrConnections.organizationId, (member[0] as any).organizationId)
      ))
    );

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Build auth config from connection fields and remove sensitive data
    const conn = connection as any;
    const authConfig: EHRAuthConfig = {
      type: conn.authMethod,
      client_id: conn.clientId ? '••••••••' : undefined,
      api_key: conn.apiKey ? '••••••••' : undefined,
      token_url: conn.tokenUrl,
      authorization_url: conn.authorizeUrl,
      scope: conn.scopes
    };

    const safeConnection = {
      ...conn,
      auth_config: authConfig
    };

    return NextResponse.json({
      connection: safeConnection
    });

  } catch (error) {
    console.error('EHR connection GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update EHR connection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const connectionId = params.id;
    const body: UpdateEHRConnectionRequest = await request.json();

    // Validate permissions
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0 || !['super_admin', 'admin'].includes((member[0] as any).role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Verify connection belongs to user's team
    const { data: existingConnection } = await safeSingle(async () =>
      db.select({
        organizationId: ehrConnections.organizationId,
        clientId: ehrConnections.clientId,
        clientSecret: ehrConnections.clientSecret,
        apiKey: ehrConnections.apiKey,
        tokenUrl: ehrConnections.tokenUrl,
        authorizeUrl: ehrConnections.authorizeUrl,
        scopes: ehrConnections.scopes,
        authMethod: ehrConnections.authMethod
      })
      .from(ehrConnections)
      .where(eq(ehrConnections.id, connectionId))
    );

    if (!existingConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Map request fields to database columns
    const updates: Partial<typeof ehrConnections.$inferInsert> = {};

    // Handle direct field mappings
    if (body.base_url !== undefined) updates.baseUrl = body.base_url;
    if (body.status !== undefined) updates.isActive = body.status === 'active';

    // Handle auth_config updates by mapping to individual columns
    if (body.auth_config) {
      const authConfig = body.auth_config;
      
      // Only update auth fields that are provided and not masked
      if (authConfig.client_id !== undefined && authConfig.client_id !== '••••••••') {
        updates.clientId = authConfig.client_id;
      }
      if (authConfig.client_secret !== undefined && authConfig.client_secret !== '••••••••') {
        updates.clientSecret = authConfig.client_secret;
      }
      if (authConfig.api_key !== undefined && authConfig.api_key !== '••••••••') {
        updates.apiKey = authConfig.api_key;
      }
      if (authConfig.token_url !== undefined) {
        updates.tokenUrl = authConfig.token_url;
      }
      if (authConfig.authorization_url !== undefined) {
        updates.authorizeUrl = authConfig.authorization_url;
      }
      if (authConfig.scope !== undefined) {
        updates.scopes = authConfig.scope;
      }
      if (authConfig.type !== undefined) {
        updates.authMethod = authConfig.type;
      }
    }

    // Handle sync config mappings
    if (body.sync_config && (body.sync_config as any).sync_patients !== undefined) {
      updates.syncPatients = (body.sync_config as any).sync_patients;
    }

    // Validate auth method if provided
    if (updates.authMethod && !['oauth2', 'api_key', 'basic'].includes(updates.authMethod)) {
      return NextResponse.json({
        error: 'Invalid auth method. Must be oauth2, api_key, or basic'
      }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.updatedAt = new Date();

    // Update connection
    const { data, error } = await safeUpdate(async () =>
      db.update(ehrConnections)
        .set(updates)
        .where(eq(ehrConnections.id, connectionId))
        .returning({
          id: ehrConnections.id,
          organizationId: ehrConnections.organizationId,
          ehrSystemName: ehrConnections.ehrSystemName,
          version: ehrConnections.version,
          apiType: ehrConnections.apiType,
          authMethod: ehrConnections.authMethod,
          baseUrl: ehrConnections.baseUrl,
          clientId: ehrConnections.clientId,
          clientSecret: ehrConnections.clientSecret,
          apiKey: ehrConnections.apiKey,
          tokenUrl: ehrConnections.tokenUrl,
          authorizeUrl: ehrConnections.authorizeUrl,
          scopes: ehrConnections.scopes,
          isActive: ehrConnections.isActive,
          lastSyncAt: ehrConnections.lastSyncAt,
          lastTestAt: ehrConnections.lastTestAt,
          testStatus: ehrConnections.testStatus,
          syncPatients: ehrConnections.syncPatients,
          createdAt: ehrConnections.createdAt,
          updatedAt: ehrConnections.updatedAt
        })
    );

    const connection = data?.[0];

    if (error || !connection) {
      console.error('Error updating EHR connection:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Remove sensitive auth data from response
    const conn = connection as any;
    const safeConnection = {
      ...conn,
      auth_config: {
        type: conn.authMethod,
        has_credentials: !!(
          conn.clientId ||
          conn.apiKey
        ),
        scope: conn.scopes
      }
    };

    return NextResponse.json({
      connection: safeConnection
    });

  } catch (error) {
    console.error('EHR connection PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete EHR connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const connectionId = params.id;

    // Validate permissions
    const { data: member } = await safeSelect(async () =>
      db.select({
        organizationId: teamMembers.organizationId,
        role: teamMembers.role
      })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.clerkUserId, userId),
        eq(teamMembers.isActive, true)
      ))
      .limit(1)
    );

    if (!member || member.length === 0 || !['super_admin', 'admin'].includes((member[0] as any).role)) {
      return NextResponse.json({
        error: 'Admin permissions required'
      }, { status: 403 });
    }

    // Check if connection has any active sync jobs
    const { data: activeSyncJobs } = await safeSelect(async () =>
      db.select({ id: syncJobs.id })
        .from(syncJobs)
        .where(and(
          eq(syncJobs.ehrSystemId, connectionId),
          inArray(syncJobs.status, ['pending', 'in_progress'])
        ))
        .limit(1)
    );

    if (activeSyncJobs && activeSyncJobs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete connection with active sync jobs. Please stop all sync jobs first.'
      }, { status: 400 });
    }

    // Verify connection belongs to user's team and delete
    const { data: connection, error } = await safeDelete(async () =>
      db.delete(ehrConnections)
        .where(and(
          eq(ehrConnections.id, connectionId),
          eq(ehrConnections.organizationId, (member[0] as any).organizationId)
        ))
        .returning({ id: ehrConnections.id })
    );

    if (error || !connection || connection.length === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'EHR connection deleted successfully',
      connection_id: connectionId
    });

  } catch (error) {
    console.error('EHR connection DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
