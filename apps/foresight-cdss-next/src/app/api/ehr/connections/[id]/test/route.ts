import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
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

    const supabase = createClient();
    const connectionId = params.id;

    // Validate permissions
    const { data: member } = await supabase
      .from('team_member')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return NextResponse.json({ 
        error: 'Admin permissions required' 
      }, { status: 403 });
    }

    // Get connection with full auth config
    const { data: connection, error: connectionError } = await supabase
      .from('ehr_connection')
      .select(`
        *,
        ehr_system (
          id,
          name,
          api_type,
          auth_method,
          fhir_version,
          base_urls,
          capabilities
        )
      `)
      .eq('id', connectionId)
      .eq('team_id', member.team_id)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Update connection status to testing
    await supabase
      .from('ehr_connection')
      .update({ 
        status: 'testing',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    const testResult = await testEHRConnection(connection);

    // Update connection status based on test result
    const newStatus = testResult.success ? 'active' : 'error';
    const updateData: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (!testResult.success && testResult.error_message) {
      updateData.last_error = testResult.error_message;
    } else if (testResult.success) {
      updateData.last_error = null;
      updateData.last_sync_at = new Date().toISOString();
    }

    await supabase
      .from('ehr_connection')
      .update(updateData)
      .eq('id', connectionId);

    return NextResponse.json({
      test_result: testResult
    });

  } catch (error) {
    console.error('EHR connection test error:', error);
    
    // Ensure connection status is updated on error
    try {
      const supabase = createClient();
      await supabase
        .from('ehr_connection')
        .update({ 
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Test failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);
    } catch (updateError) {
      console.error('Error updating connection status:', updateError);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testEHRConnection(connection: any): Promise<EHRConnectionTestResult> {
  const startTime = Date.now();
  
  try {
    const { ehr_system, auth_config, base_url } = connection;
    
    if (!auth_config || !auth_config.type) {
      return {
        success: false,
        error_message: 'No authentication configuration found'
      };
    }

    // Determine the endpoint to test
    const testUrl = base_url || getDefaultEndpoint(ehr_system, connection.environment);
    
    if (!testUrl) {
      return {
        success: false,
        error_message: 'No endpoint URL configured'
      };
    }

    const testResults: EHRConnectionTestResult = {
      success: false,
      endpoints_tested: [testUrl]
    };

    // Test based on API type
    switch (ehr_system.api_type) {
      case 'fhir':
        return await testFHIRConnection(testUrl, auth_config, ehr_system, startTime);
      case 'rest':
        return await testRESTConnection(testUrl, auth_config, ehr_system, startTime);
      case 'custom':
        return await testCustomConnection(testUrl, auth_config, ehr_system, startTime);
      default:
        return {
          success: false,
          error_message: `Unsupported API type: ${ehr_system.api_type}`
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
  authConfig: any, 
  ehrSystem: any, 
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
      authTestResult = await testFHIRAuth(baseUrl, authConfig);
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

async function testFHIRAuth(baseUrl: string, authConfig: any) {
  if (authConfig.type === 'oauth2') {
    // For OAuth2, we can test if the authorization endpoint is reachable
    if (authConfig.authorization_url) {
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
  authConfig: any, 
  ehrSystem: any, 
  startTime: number
): Promise<EHRConnectionTestResult> {
  try {
    // Test basic connectivity
    const headers: Record<string, string> = {
      'User-Agent': 'Foresight-CDSS/1.0',
      'Accept': 'application/json'
    };

    // Add authentication headers if available
    if (authConfig.type === 'api_key' && authConfig.api_key) {
      const headerName = authConfig.api_key_header || 'Authorization';
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
  authConfig: any, 
  ehrSystem: any, 
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

function getDefaultEndpoint(ehrSystem: any, environment: string): string | null {
  const baseUrls = ehrSystem.base_urls;
  
  if (!baseUrls || typeof baseUrls !== 'object') {
    return null;
  }

  // Try to find environment-specific URL
  return baseUrls[environment] || baseUrls.production || baseUrls.sandbox || null;
}