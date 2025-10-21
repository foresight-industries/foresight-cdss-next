import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedDatabaseClient, safeSelect, safeSingle, safeUpdate } from '@/lib/aws/database';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { teamMembers, ehrConnections } from '@foresight-cdss-next/db';
import type { EHRConnectionTestResult } from '@/types/ehr.types';

// POST - Test EHR connection
export async function POST(
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

    // Get connection with full auth config
    const { data: connection, error: connectionError } = await safeSingle(async () =>
      db.select({
        id: ehrConnections.id,
        testStatus: ehrConnections.testStatus,
        apiType: ehrConnections.apiType,
        baseUrl: ehrConnections.baseUrl,
        clientId: ehrConnections.clientId,
        clientSecret: ehrConnections.clientSecret,
        apiKey: ehrConnections.apiKey,
        tokenUrl: ehrConnections.tokenUrl,
        authorizeUrl: ehrConnections.authorizeUrl,
        scopes: ehrConnections.scopes,
        lastSyncAt: ehrConnections.lastSyncAt,
        updatedAt: ehrConnections.updatedAt,
        authMethod: ehrConnections.authMethod,
        ehrSystemName: ehrConnections.ehrSystemName,
        version: ehrConnections.version
      })
      .from(ehrConnections)
      .where(and(
        eq(ehrConnections.id, connectionId),
        eq(ehrConnections.organizationId, (member[0] as any).organizationId)
      ))
    );

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Update connection status to testing
    await safeUpdate(async () =>
      db.update(ehrConnections)
        .set({
          testStatus: 'pending',
          updatedAt: new Date()
        })
        .where(eq(ehrConnections.id, connectionId))
        .returning({ id: ehrConnections.id })
    );

    const testResult = await testEHRConnection(connection as {
      id: string;
      testStatus: string | null;
      apiType: string | null;
      baseUrl: string | null;
      clientId: string | null;
      clientSecret: string | null;
      apiKey: string | null;
      tokenUrl: string | null;
      authorizeUrl: string | null;
      scopes: string | null;
      lastSyncAt: Date | null;
      updatedAt: Date;
      authMethod: string | null;
      ehrSystemName: string;
      version: string | null;
    });

    // Update connection status based on test result
    const newStatus = testResult.success ? 'success' : 'failed';
    const updateData: Partial<typeof ehrConnections.$inferInsert> = {
      testStatus: newStatus,
      lastTestAt: new Date(),
      updatedAt: new Date()
    };

    if (testResult.success) {
      updateData.lastSyncAt = new Date();
    }

    await safeUpdate(async () =>
      db.update(ehrConnections)
        .set(updateData)
        .where(eq(ehrConnections.id, connectionId))
        .returning({ id: ehrConnections.id })
    );

    return NextResponse.json({
      test_result: testResult
    });

  } catch (error) {
    console.error('EHR connection test error:', error);

    // Ensure connection status is updated on error
    try {
      const { db } = await createAuthenticatedDatabaseClient();
      await safeUpdate(async () =>
        db.update(ehrConnections)
          .set({
            testStatus: 'failed',
            lastTestAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(ehrConnections.id, params.id))
          .returning({ id: ehrConnections.id })
      );
    } catch (updateError) {
      console.error('Error updating connection status:', updateError);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testEHRConnection(connection: {
  id: string;
  testStatus: string | null;
  apiType: string | null;
  baseUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  apiKey: string | null;
  tokenUrl: string | null;
  authorizeUrl: string | null;
  scopes: string | null;
  lastSyncAt: Date | null;
  updatedAt: Date;
  authMethod: string | null;
  ehrSystemName: string;
  version: string | null;
}): Promise<EHRConnectionTestResult> {
  const startTime = Date.now();

  try {
    const { apiType, authMethod, baseUrl, clientId, clientSecret, apiKey, tokenUrl, authorizeUrl, scopes } = connection;

    if (!authMethod) {
      return {
        success: false,
        error_message: 'No authentication method configured'
      };
    }

    if (!baseUrl) {
      return {
        success: false,
        error_message: 'No endpoint URL configured'
      };
    }

    // Build auth config from connection fields
    const authConfig = {
      type: authMethod,
      client_id: clientId,
      client_secret: clientSecret,
      api_key: apiKey,
      token_url: tokenUrl,
      authorization_url: authorizeUrl,
      scopes: scopes
    };

    // Test based on API type
    switch (apiType) {
      case 'fhir':
        return await testFHIRConnection(baseUrl, authConfig, connection, startTime);
      case 'rest':
        return await testRESTConnection(baseUrl, authConfig, connection, startTime);
      case 'custom':
        return await testCustomConnection(baseUrl, authConfig, connection, startTime);
      default:
        return {
          success: false,
          error_message: `Unsupported API type: ${apiType}`
        };
    }

  } catch (error) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function testFHIRConnection(
  baseUrl: string,
  authConfig: Record<string, unknown>,
  _connection: { ehrSystemName: string; version: string | null; },
  startTime: number
): Promise<EHRConnectionTestResult> {
  try {
    // Test metadata endpoint first (usually doesn't require auth)
    const metadataUrl = `${baseUrl.replace(/\/$/, '')}/metadata`;

    const metadataResponse = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'User-Agent': 'Foresight-CDSS/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!metadataResponse.ok) {
      return {
        success: false,
        status_code: metadataResponse.status,
        response_time_ms: responseTime,
        error_message: `Metadata endpoint failed: ${metadataResponse.statusText}`,
        endpoints_tested: [metadataUrl]
      };
    }

    const metadata = await metadataResponse.json();

    // Extract capabilities
    const capabilities = metadata?.rest?.[0]?.resource?.map((r: any) => r.type) || [];

    // Test authentication if credentials are provided
    let authTestResult = null;
    if (authConfig.client_id || authConfig.api_key) {
      authTestResult = await testFHIRAuth(authConfig);
    }

    return {
      success: true,
      status_code: metadataResponse.status,
      response_time_ms: responseTime,
      capabilities_discovered: capabilities,
      fhir_metadata: {
        fhirVersion: metadata.fhirVersion,
        software: metadata.software,
        implementation: metadata.implementation
      },
      endpoints_tested: [metadataUrl],
      ...(authTestResult && { auth_test: authTestResult })
    };

  } catch (error) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'FHIR connection test failed'
    };
  }
}

async function testFHIRAuth(authConfig: Record<string, unknown>) {
  if (authConfig.type === 'oauth2') {
    // For OAuth2, we can test if the authorization endpoint is reachable
    if (authConfig.authorization_url && typeof authConfig.authorization_url === 'string') {
      try {
        const response = await fetch(authConfig.authorization_url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        return {
          auth_endpoint_reachable: response.ok,
          auth_status_code: response.status
        };
      } catch (error) {
        return {
          auth_endpoint_reachable: false,
          auth_error: error instanceof Error ? error.message : 'Auth endpoint unreachable'
        };
      }
    }
  }

  return { auth_test_skipped: 'No testable auth configuration' };
}

async function testRESTConnection(
  baseUrl: string,
  authConfig: Record<string, unknown>,
  _connection: { ehrSystemName: string; version: string | null; },
  startTime: number
): Promise<EHRConnectionTestResult> {
  try {
    // Test basic connectivity
    const headers: Record<string, string> = {
      'User-Agent': 'Foresight-CDSS/1.0',
      'Accept': 'application/json'
    };

    // Add authentication headers if available
    if (authConfig.type === 'api_key' && authConfig.api_key && typeof authConfig.api_key === 'string') {
      const headerName = (authConfig.api_key_header as string) || 'Authorization';
      headers[headerName] = authConfig.api_key.startsWith('Bearer ')
        ? authConfig.api_key
        : `Bearer ${authConfig.api_key}`;
    }

    const response = await fetch(baseUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      status_code: response.status,
      response_time_ms: responseTime,
      error_message: response.ok ? undefined : `REST API test failed: ${response.statusText}`,
      endpoints_tested: [baseUrl]
    };

  } catch (error) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'REST connection test failed'
    };
  }
}

async function testCustomConnection(
  baseUrl: string,
  _authConfig: Record<string, unknown>,
  _connection: { ehrSystemName: string; version: string | null; },
  startTime: number
): Promise<EHRConnectionTestResult> {
  try {
    // Basic connectivity test for custom connections
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      status_code: response.status,
      response_time_ms: responseTime,
      error_message: response.ok ? undefined : `Custom endpoint test failed: ${response.statusText}`,
      endpoints_tested: [baseUrl]
    };

  } catch (error) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Custom connection test failed'
    };
  }
}

// This function is no longer needed since we're using the baseUrl directly from the connection
