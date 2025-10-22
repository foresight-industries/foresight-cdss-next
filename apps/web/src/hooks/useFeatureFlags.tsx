import { useState, useEffect, useContext, createContext, type ReactNode, type ComponentType } from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  variant?: string;
  [key: string]: any;
}

export interface AppConfiguration {
  ui?: {
    appName?: string;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
    };
    pagination?: {
      defaultPageSize?: number;
      pageSizeOptions?: number[];
    };
    notifications?: {
      autoCloseDelay?: number;
      maxNotifications?: number;
    };
  };
  api?: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  };
  healthcare?: {
    claimSubmission?: {
      autoSaveInterval?: number;
      validationLevel?: 'loose' | 'normal' | 'strict';
    };
    priorAuth?: {
      reminderDays?: number[];
      autoRenewalDays?: number;
    };
  };
  integrations?: {
    redis?: {
      sessionTimeout?: number;
      cachePrefix?: string;
    };
    database?: {
      connectionTimeout?: number;
      queryTimeout?: number;
    };
  };
}

interface FeatureFlagsContextType {
  featureFlags: Record<string, FeatureFlag>;
  configuration: AppConfiguration;
  loading: boolean;
  error: string | null;
  isEnabled: (flagName: string) => boolean;
  getFlag: (flagName: string) => FeatureFlag | null;
  getConfig: <T>(path: string, defaultValue?: T) => T;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
  apiEndpoint?: string;
  pollInterval?: number;
  clientId?: string;
}

export function FeatureFlagsProvider({
  children,
  apiEndpoint = '/api/feature-flags',
  pollInterval = 60000, // 1 minute
  clientId = `web-${Math.random().toString(36).substring(2, 9)}`
}: FeatureFlagsProviderProps) {
  const [featureFlags, setFeatureFlags] = useState<Record<string, FeatureFlag>>({});
  const [configuration, setConfiguration] = useState<AppConfiguration>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVersions, setLastVersions] = useState<{
    featureFlags?: string;
    appConfig?: string;
  }>({});

  const fetchConfig = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
      };

      // Include version headers for conditional requests
      if (lastVersions.featureFlags) {
        headers['X-Feature-Flags-Version'] = lastVersions.featureFlags;
      }
      if (lastVersions.appConfig) {
        headers['X-App-Config-Version'] = lastVersions.appConfig;
      }

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.status}`);
      }

      const data = await response.json();

      setFeatureFlags(data.featureFlags || {});
      setConfiguration(data.configuration || {});
      setError(null);

      // Update versions from response headers
      const newFeatureFlagsVersion = response.headers.get('X-Feature-Flags-Version');
      const newAppConfigVersion = response.headers.get('X-App-Config-Version');

      if (newFeatureFlagsVersion || newAppConfigVersion) {
        setLastVersions({
          featureFlags: newFeatureFlagsVersion || lastVersions.featureFlags,
          appConfig: newAppConfigVersion || lastVersions.appConfig,
        });
      }

    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (flagName: string): boolean => {
    const flag = featureFlags[flagName];
    return flag?.enabled === true;
  };

  const getFlag = (flagName: string): FeatureFlag | null => {
    return featureFlags[flagName] ?? null;
  };

  function getConfig<T>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: any = configuration;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current !== undefined ? current : defaultValue as T;
  }

  const refresh = async () => {
    setLoading(true);
    await fetchConfig();
  };

  useEffect(() => {
    fetchConfig();

    // Set up polling for updates
    const interval = setInterval(fetchConfig, pollInterval);

    return () => clearInterval(interval);
  }, [apiEndpoint, pollInterval, clientId]);

  const value: FeatureFlagsContextType = {
    featureFlags,
    configuration,
    loading,
    error,
    isEnabled,
    getFlag,
    getConfig,
    refresh,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Convenience hooks for specific feature flags
export function useFeatureFlag(flagName: string) {
  const { isEnabled, getFlag } = useFeatureFlags();
  return {
    enabled: isEnabled(flagName),
    flag: getFlag(flagName),
  };
}

export function useAppConfig<T>(path: string, defaultValue?: T): T {
  const { getConfig } = useFeatureFlags();
  return getConfig(path, defaultValue);
}

// HOC for conditional rendering based on feature flags
export function withFeatureFlag<P extends object>(
  flagName: string,
  Component: ComponentType<P>,
  FallbackComponent?: ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    const { enabled } = useFeatureFlag(flagName);

    if (enabled) {
      return <Component {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}

// Component for conditional rendering
interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback }: FeatureGateProps) {
  const { enabled } = useFeatureFlag(flag);

  if (enabled) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
}
