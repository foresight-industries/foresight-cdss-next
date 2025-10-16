import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeInsert } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq, desc } from 'drizzle-orm';
import { teamMembers, ehrConnections } from '@foresight-cdss-next/db';
import type {
  CreateEHRConnectionRequest,
} from "@/types/ehr.types";

// GET - List EHR connections for current team
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    // Get user's team membership
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
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Build query for connections
    const whereConditions = [
      eq(ehrConnections.organizationId, (member[0] as any).organizationId)
    ];

    // Filter by environment if provided
    if (environment && ['production', 'staging', 'development'].includes(environment)) {
      // Environment filtering would need to be added to schema if needed
    }

    const { data, error } = await safeSelect(async () =>
      db.select({
        id: ehrConnections.id,
        organizationId: ehrConnections.organizationId,
        ehrSystemName: ehrConnections.ehrSystemName,
        version: ehrConnections.version,
        apiType: ehrConnections.apiType,
        authMethod: ehrConnections.authMethod,
        baseUrl: ehrConnections.baseUrl,
        clientId: ehrConnections.clientId,
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
      .where(and(...whereConditions))
      .orderBy(desc(ehrConnections.createdAt))
    );

    if (error) {
      console.error('Error fetching EHR connections:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Remove sensitive auth data from response
    const safeConnections = data?.map(conn => {
      const c = conn as any;
      return {
        ...c,
        auth_config: {
          type: c.authMethod,
          has_credentials: !!(
            c.clientId ||
            c.apiKey
          ),
          scope: c.scopes
        }
      };
    }) || [];

    return NextResponse.json({
      connections: safeConnections
    });

  } catch (error) {
    console.error('EHR connections GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new EHR connection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await createAuthenticatedDatabaseClient();
    const body: CreateEHRConnectionRequest = await request.json();

    // Validate request body
    const {
      ehr_system_name,
      connection_name,
      base_url,
      auth_config,
      sync_config
    } = body as any;

    if (!ehr_system_name || !connection_name || !auth_config) {
      return NextResponse.json({
        error: 'Missing required fields: ehr_system_name, connection_name, auth_config'
      }, { status: 400 });
    }

    // Validate auth_config based on type
    if (!auth_config.type) {
      return NextResponse.json({
        error: 'auth_config.type is required'
      }, { status: 400 });
    }

    // Get user's team and verify admin permissions
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

    // Validate auth method
    if (!['oauth2', 'api_key', 'basic'].includes(auth_config.type)) {
      return NextResponse.json({
        error: 'Invalid authentication type. Must be oauth2, api_key, or basic'
      }, { status: 400 });
    }

    // Create EHR connection
    const { data, error } = await safeInsert(async () =>
      db.insert(ehrConnections)
        .values({
          organizationId: (member[0] as any).organizationId,
          ehrSystemName: ehr_system_name,
          version: '1.0',
          apiType: 'fhir', // Default to FHIR
          authMethod: auth_config.type,
          baseUrl: base_url,
          clientId: auth_config.client_id,
          clientSecret: auth_config.client_secret,
          apiKey: auth_config.api_key,
          tokenUrl: auth_config.token_url,
          authorizeUrl: auth_config.authorization_url,
          scopes: auth_config.scope,
          isActive: false, // Start as inactive until tested
          syncPatients: (sync_config as any)?.sync_patients || false
        })
        .returning({
          id: ehrConnections.id,
          organizationId: ehrConnections.organizationId,
          ehrSystemName: ehrConnections.ehrSystemName,
          version: ehrConnections.version,
          apiType: ehrConnections.apiType,
          authMethod: ehrConnections.authMethod,
          baseUrl: ehrConnections.baseUrl,
          clientId: ehrConnections.clientId,
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

    if (error || !data || data.length === 0) {
      console.error('Error creating EHR connection:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const connection = data[0];

    // Remove sensitive auth data from response
    const conn = connection as any;
    const safeConnection = {
      ...conn,
      auth_config: {
        type: conn.authMethod,
        has_credentials: true,
        scope: conn.scopes
      }
    };

    return NextResponse.json({
      connection: safeConnection
    }, { status: 201 });

  } catch (error) {
    console.error('EHR connection POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
