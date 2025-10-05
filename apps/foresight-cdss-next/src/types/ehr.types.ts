export interface EHRSystem {
  id: string;
  name: string;
  display_name: string;
  api_type: 'fhir' | 'rest' | 'custom';
  auth_method: 'oauth2' | 'api_key' | 'custom' | 'smart_on_fhir';
  fhir_version?: string;
  base_urls: Record<string, string>;
  capabilities: string[];
  documentation_url?: string;
  rate_limits?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface EHRConnection {
  id: string;
  team_id: string;
  ehr_system_id: string;
  connection_name: string;
  base_url?: string;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'testing' | 'error';
  auth_config: EHRAuthConfig;
  custom_headers?: Record<string, string>;
  sync_config?: EHRSyncConfig;
  metadata?: Record<string, any>;
  last_sync_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
  ehr_system?: EHRSystem;
}

export interface EHRAuthConfig {
  type: 'oauth2' | 'api_key' | 'custom' | 'smart_on_fhir';
  
  // OAuth2 fields
  client_id?: string;
  client_secret?: string;
  authorization_url?: string;
  token_url?: string;
  refresh_token?: string;
  access_token?: string;
  scope?: string;
  redirect_uri?: string;
  
  // API Key fields
  api_key?: string;
  api_key_header?: string;
  
  // Custom auth fields
  username?: string;
  password?: string;
  custom_fields?: Record<string, string>;
  
  // SMART on FHIR specific
  smart_configuration_url?: string;
  client_assertion?: string;
  
  // Common fields
  expires_at?: string;
  additional_params?: Record<string, string>;
}

export interface EHRSyncConfig {
  enabled: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  sync_entities: string[];
  batch_size?: number;
  retry_attempts?: number;
  error_threshold?: number;
  last_successful_sync?: string;
  sync_filters?: Record<string, any>;
}

export interface CreateEHRConnectionRequest {
  ehr_system_id: string;
  connection_name: string;
  base_url?: string;
  environment: 'development' | 'staging' | 'production';
  auth_config: Partial<EHRAuthConfig>;
  custom_headers?: Record<string, string>;
  sync_config?: Partial<EHRSyncConfig>;
  metadata?: Record<string, any>;
}

export interface UpdateEHRConnectionRequest {
  connection_name?: string;
  base_url?: string;
  environment?: 'development' | 'staging' | 'production';
  status?: 'active' | 'inactive' | 'testing' | 'error';
  auth_config?: Partial<EHRAuthConfig>;
  custom_headers?: Record<string, string>;
  sync_config?: Partial<EHRSyncConfig>;
  metadata?: Record<string, any>;
}

export interface EHRConnectionTestResult {
  success: boolean;
  status_code?: number;
  response_time_ms?: number;
  error_message?: string;
  capabilities_discovered?: string[];
  endpoints_tested?: string[];
  fhir_metadata?: any;
}

export interface SyncJob {
  id: string;
  ehr_connection_id: string;
  team_id: string;
  job_type: string;
  entity_type?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed?: number;
  records_failed?: number;
  started_at?: string;
  completed_at?: string;
  error_log?: any;
  metadata?: Record<string, any>;
  created_at: string;
}

// Popular EHR systems with their configuration templates
export const EHR_SYSTEM_TEMPLATES = {
  epic: {
    name: 'Epic',
    display_name: 'Epic EHR',
    api_type: 'fhir' as const,
    auth_method: 'oauth2' as const,
    fhir_version: 'R4',
    default_endpoints: {
      sandbox: 'https://fhir.epic.com/interconnect-fhir-oauth',
      production: 'https://fhir.epic.com/interconnect-fhir-oauth'
    },
    required_scopes: ['patient/*.read', 'user/*.read']
  },
  cerner: {
    name: 'Cerner',
    display_name: 'Oracle Cerner',
    api_type: 'fhir' as const,
    auth_method: 'oauth2' as const,
    fhir_version: 'R4',
    default_endpoints: {
      sandbox: 'https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
      production: 'https://fhir-myrecord.cerner.com/r4/'
    },
    required_scopes: ['patient/Patient.read', 'patient/Observation.read']
  },
  athenahealth: {
    name: 'athenahealth',
    display_name: 'athenahealth',
    api_type: 'rest' as const,
    auth_method: 'oauth2' as const,
    default_endpoints: {
      sandbox: 'https://api.athenahealth.com/preview1',
      production: 'https://api.athenahealth.com/v1'
    }
  },
  allscripts: {
    name: 'Allscripts',
    display_name: 'Allscripts',
    api_type: 'rest' as const,
    auth_method: 'oauth2' as const,
    default_endpoints: {
      sandbox: 'https://sandbox.allscripts.com/oauthserver',
      production: 'https://api.allscripts.com'
    }
  },
  nextgen: {
    name: 'NextGen',
    display_name: 'NextGen Healthcare',
    api_type: 'fhir' as const,
    auth_method: 'oauth2' as const,
    fhir_version: 'R4',
    default_endpoints: {
      sandbox: 'https://fhir.nextgen.com/sandbox',
      production: 'https://fhir.nextgen.com/api'
    }
  },
  eclinicalworks: {
    name: 'eClinicalWorks',
    display_name: 'eClinicalWorks',
    api_type: 'fhir' as const,
    auth_method: 'oauth2' as const,
    fhir_version: 'R4',
    default_endpoints: {
      sandbox: 'https://sandbox.eclinicalworks.com/fhir',
      production: 'https://api.eclinicalworks.com/fhir'
    }
  },
  custom: {
    name: 'Custom',
    display_name: 'Custom EHR System',
    api_type: 'custom' as const,
    auth_method: 'custom' as const,
    default_endpoints: {
      sandbox: '',
      production: ''
    }
  }
} as const;

export type EHRSystemTemplate = keyof typeof EHR_SYSTEM_TEMPLATES;

// Connection status helpers
export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'testing':
      return 'text-blue-600 bg-blue-50';
    case 'inactive':
      return 'text-gray-600 bg-gray-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getConnectionStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'testing':
      return 'Testing';
    case 'inactive':
      return 'Inactive';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}