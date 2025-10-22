import { NextApiRequest, NextApiResponse } from 'next';
import { AppConfigDataClient, GetLatestConfigurationCommand, StartConfigurationSessionCommand } from '@aws-sdk/client-appconfigdata';

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

// Initialize AppConfig client
const client = new AppConfigDataClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Cache configurations in memory for better performance
const cache = new Map<string, {
  data: any;
  timestamp: number;
  version?: string;
}>();

const CACHE_TTL = 60 * 1000; // 1 minute

async function getCachedConfiguration(
  key: string,
  fetcher: () => Promise<{ data: any; version?: string }>
): Promise<{ data: any; version?: string }> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { data: cached.data, version: cached.version };
  }

  const result = await fetcher();
  cache.set(key, {
    data: result.data,
    timestamp: now,
    version: result.version,
  });

  return result;
}

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const applicationId = process.env.APPCONFIG_APPLICATION_ID;
    const environment = process.env.APPCONFIG_ENVIRONMENT || process.env.NODE_ENV || 'development';
    const featureFlagsProfile = process.env.APPCONFIG_FEATURE_FLAGS_PROFILE;
    const configurationProfile = process.env.APPCONFIG_CONFIGURATION_PROFILE;

    if (!applicationId || !featureFlagsProfile || !configurationProfile) {
      return res.status(500).json({
        error: 'AppConfig configuration missing',
        message: 'Please check environment variables for AppConfig setup'
      });
    }

    // const clientId = req.headers['x-client-id'] as string || `web-client-${Date.now()}`;
    // const featureFlagsVersion = req.headers['x-feature-flags-version'] as string;
    // const appConfigVersion = req.headers['x-app-config-version'] as string;

    // Start configuration session for better performance
    const sessionCommand = new StartConfigurationSessionCommand({
      ApplicationIdentifier: applicationId,
      EnvironmentIdentifier: environment,
      ConfigurationProfileIdentifier: featureFlagsProfile,
    });

    const session = await client.send(sessionCommand);

    console.log('SESSION COMMAND', sessionCommand);

    // Get feature flags
    const featureFlags = await getCachedConfiguration(
      `feature-flags-${environment}`,
      async () => {
        const command = new GetLatestConfigurationCommand({
          ConfigurationToken: session.InitialConfigurationToken
        });

        const response = await client.send(command);

        if (!response.Configuration) {
          return { data: {} };
        }

        const content = new TextDecoder().decode(response.Configuration);
        const parsed = JSON.parse(content);

        // Transform AppConfig feature flags format to simpler format
        const flags = Object.keys(parsed.flags || {}).reduce((acc, flagName) => {
          const flag = parsed.flags[flagName];
          const value = parsed.values?.[flagName] || {};

          acc[flagName] = {
            name: flagName,
            enabled: flag.enabled && value.enabled !== false,
            ...value, // Include additional configuration
          };

          return acc;
        }, {} as Record<string, FeatureFlag>);

        return {
          data: flags,
          version: response.VersionLabel,
          nextToken: response.NextPollConfigurationToken,
        };
      }
    );

    // Get app configuration
    const appConfig = await getCachedConfiguration(
      `app-config-${environment}`,
      async () => {
        const command = new GetLatestConfigurationCommand({
          ConfigurationToken: featureFlags.data.nextToken
        });

        const response = await client.send(command);

        if (!response.Configuration) {
          return { data: {} };
        }

        const content = new TextDecoder().decode(response.Configuration);
        const parsed = JSON.parse(content);

        return {
          data: parsed,
          version: response.VersionLabel
        };
      }
    );

    const responseData: AppConfigResponse = {
      featureFlags: featureFlags.data,
      configuration: appConfig.data,
      timestamp: new Date().toISOString(),
      environment,
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'max-age=60'); // Cache for 1 minute

    if (featureFlags.version) {
      res.setHeader('X-Feature-Flags-Version', featureFlags.version);
    }
    if (appConfig.version) {
      res.setHeader('X-App-Config-Version', appConfig.version);
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching AppConfig:', error);

    return res.status(500).json({
      error: 'Failed to retrieve configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Health check endpoint
export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.APPCONFIG_ENVIRONMENT || process.env.NODE_ENV,
    cacheSize: cache.size,
  };
}
