import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AppConfigDataClient, GetConfigurationCommand } from '@aws-sdk/client-appconfigdata';

const client = new AppConfigDataClient({ region: process.env.AWS_REGION });

interface FeatureFlag {
  name: string;
  enabled: boolean;
  variant?: string;
  [key: string]: any;
}

interface AppConfiguration {
  [key: string]: any;
}

interface AppConfigResponse {
  featureFlags: Record<string, FeatureFlag>;
  configuration: AppConfiguration;
  timestamp: string;
  environment: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const applicationId = process.env.APPCONFIG_APPLICATION_ID!;
    const environment = process.env.APPCONFIG_ENVIRONMENT!;
    const featureFlagsProfile = process.env.APPCONFIG_FEATURE_FLAGS_PROFILE!;
    const configurationProfile = process.env.APPCONFIG_CONFIGURATION_PROFILE!;

    // Extract client token from headers or generate one
    const clientId = event.headers['x-client-id'] || `web-client-${Date.now()}`;
    
    // Get feature flags
    const featureFlagsCommand = new GetConfigurationCommand({
      Application: applicationId,
      Environment: environment,
      Configuration: featureFlagsProfile,
      ClientId: clientId,
      ClientConfigurationVersion: event.headers['x-feature-flags-version'],
    });

    // Get app configuration
    const appConfigCommand = new GetConfigurationCommand({
      Application: applicationId,
      Environment: environment,
      Configuration: configurationProfile,
      ClientId: clientId,
      ClientConfigurationVersion: event.headers['x-app-config-version'],
    });

    const [featureFlagsResponse, appConfigResponse] = await Promise.all([
      client.send(featureFlagsCommand),
      client.send(appConfigCommand),
    ]);

    // Parse feature flags
    let featureFlags = {};
    if (featureFlagsResponse.Content) {
      const content = new TextDecoder().decode(featureFlagsResponse.Content);
      const parsed = JSON.parse(content);
      
      // Transform AppConfig feature flags format to simpler format
      featureFlags = Object.keys(parsed.flags || {}).reduce((acc, flagName) => {
        const flag = parsed.flags[flagName];
        const value = parsed.values?.[flagName] || {};
        
        acc[flagName] = {
          name: flagName,
          enabled: flag.enabled && value.enabled !== false,
          ...value, // Include additional configuration
        };
        
        return acc;
      }, {} as Record<string, FeatureFlag>);
    }

    // Parse app configuration
    let configuration = {};
    if (appConfigResponse.Content) {
      const content = new TextDecoder().decode(appConfigResponse.Content);
      configuration = JSON.parse(content);
    }

    const response: AppConfigResponse = {
      featureFlags,
      configuration,
      timestamp: new Date().toISOString(),
      environment,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Client-Id,X-Feature-Flags-Version,X-App-Config-Version',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Cache-Control': 'max-age=60', // Cache for 1 minute
        // Include configuration versions for client-side caching
        'X-Feature-Flags-Version': featureFlagsResponse.ConfigurationVersion || '',
        'X-App-Config-Version': appConfigResponse.ConfigurationVersion || '',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error retrieving AppConfig:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Health check handler
export const healthCheck = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.APPCONFIG_ENVIRONMENT,
    }),
  };
};