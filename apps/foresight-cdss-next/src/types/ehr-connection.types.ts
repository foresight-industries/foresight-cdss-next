// EHR Connection types for Electronic Health Record integrations

export type EnvironmentType = 'production' | 'staging' | 'development' | 'testing' | 'sandbox';
export type ConnectionStatus = 'active' | 'inactive' | 'testing' | 'error' | 'maintenance';
export type EhrApiType = 'fhir' | 'rest' | 'custom';
export type EhrAuthMethod = 'oauth2' | 'api_key' | 'custom' | 'smart_on_fhir';
export type FhirVersion = 'DSTU1' | 'DSTU2' | 'STU3' | 'R4' | 'R4B' | 'R5' | 'R6';

// Core EHR Connection interfaces
export interface EhrConnection {
  id: string;
  team_id: string;
  ehr_system_id: string;
  connection_name?: string;
  environment?: EnvironmentType;
  status?: ConnectionStatus;
  base_url?: string;
  auth_config?: AuthConfig;
  sync_config?: SyncConfig;
  custom_headers?: Record<string, string>;
  metadata?: Record<string, any>;
  last_sync_at?: string;
  last_error?: string;
  created_at: string;
  updated_at?: string;
}

export interface EhrSystem {
  id: string;
  name: string;
  display_name?: string;
  api_type?: EhrApiType;
  auth_method?: EhrAuthMethod;
  fhir_version?: FhirVersion;
  base_urls?: Record<string, string>;
  capabilities?: EhrCapabilities;
  rate_limits?: RateLimit;
  documentation_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthConfig {
  method: EhrAuthMethod;
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  oauth_settings?: {
    authorization_url?: string;
    token_url?: string;
    scopes?: string[];
    redirect_uri?: string;
  };
  smart_on_fhir_settings?: {
    well_known_url?: string;
    launch_url?: string;
    aud?: string;
  };
  custom_auth?: Record<string, any>;
}

export interface SyncConfig {
  enabled: boolean;
  frequency: SyncFrequency;
  entity_types: string[];
  filters?: Record<string, any>;
  batch_size?: number;
  concurrent_requests?: number;
  timeout_seconds?: number;
  retry_config?: {
    max_retries: number;
    backoff_multiplier: number;
    initial_delay_ms: number;
  };
}

export interface EhrCapabilities {
  supported_resources?: string[];
  supported_operations?: string[];
  supported_formats?: string[];
  supports_bulk_data?: boolean;
  supports_smart_launch?: boolean;
  supports_patient_access?: boolean;
  supports_provider_access?: boolean;
  version_info?: Record<string, string>;
}

export interface RateLimit {
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
  burst_limit?: number;
  concurrent_limit?: number;
}

export interface SyncJob {
  id: string;
  team_id: string;
  ehr_connection_id?: string;
  job_type?: string;
  entity_type?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  records_processed?: number;
  records_failed?: number;
  error_log?: Record<string, any>;
  metadata?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface IntegrationHealth {
  connection_id?: string;
  connection_status?: ConnectionStatus;
  ehr_system?: string;
  team_name?: string;
  last_sync_at?: string;
  last_error?: string;
  recent_successes?: number;
  recent_failures?: number;
}

// Request/Response types for API
export interface CreateEhrConnectionRequest {
  ehr_system_id: string;
  connection_name: string;
  environment: EnvironmentType;
  base_url?: string;
  auth_config: AuthConfig;
  sync_config?: SyncConfig;
  custom_headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateEhrConnectionRequest {
  connection_name?: string;
  environment?: EnvironmentType;
  base_url?: string;
  auth_config?: AuthConfig;
  sync_config?: SyncConfig;
  custom_headers?: Record<string, string>;
  metadata?: Record<string, any>;
  status?: ConnectionStatus;
}

export interface TestConnectionRequest {
  connection_id: string;
  test_type: 'basic' | 'auth' | 'sync' | 'comprehensive';
}

export interface TestConnectionResult {
  success: boolean;
  tests: {
    connectivity?: TestResult;
    authentication?: TestResult;
    authorization?: TestResult;
    data_access?: TestResult;
    fhir_conformance?: TestResult;
  };
  summary: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    warnings: string[];
  };
}

export interface TestResult {
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  duration_ms?: number;
}

// UI-specific types
export interface EhrConnectionWithSystem extends EhrConnection {
  ehr_system?: EhrSystem;
  health?: IntegrationHealth;
  recent_jobs?: SyncJob[];
}

export interface ConnectionStats {
  total_connections: number;
  active_connections: number;
  by_environment: Record<EnvironmentType, number>;
  by_status: Record<ConnectionStatus, number>;
  by_ehr_system: Record<string, number>;
  recent_sync_failures: number;
}

// Predefined EHR systems and configurations
export type SyncFrequency = 'manual' | 'hourly' | 'daily' | 'weekly' | 'real-time';

export const POPULAR_EHR_SYSTEMS: Partial<EhrSystem>[] = [
  {
    name: 'epic',
    display_name: 'Epic',
    api_type: 'fhir',
    auth_method: 'smart_on_fhir',
    fhir_version: 'R4',
    capabilities: {
      supported_resources: ['Patient', 'Encounter', 'Observation', 'Condition', 'Medication'],
      supported_operations: ['read', 'search'],
      supports_smart_launch: true,
      supports_bulk_data: true
    }
  },
  {
    name: 'cerner',
    display_name: 'Cerner (Oracle Health)',
    api_type: 'fhir',
    auth_method: 'smart_on_fhir',
    fhir_version: 'R4',
    capabilities: {
      supported_resources: ['Patient', 'Encounter', 'Observation', 'Condition', 'MedicationRequest'],
      supported_operations: ['read', 'search'],
      supports_smart_launch: true,
      supports_bulk_data: false
    }
  },
  {
    name: 'athenahealth',
    display_name: 'athenahealth',
    api_type: 'rest',
    auth_method: 'oauth2',
    capabilities: {
      supported_resources: ['Patient', 'Appointment', 'Document', 'Encounter'],
      supported_operations: ['read', 'create', 'update'],
      supports_patient_access: true
    }
  },
  {
    name: 'allscripts',
    display_name: 'Allscripts',
    api_type: 'fhir',
    auth_method: 'oauth2',
    fhir_version: 'STU3',
    capabilities: {
      supported_resources: ['Patient', 'Encounter', 'Observation'],
      supported_operations: ['read', 'search']
    }
  },
  {
    name: 'nextgen',
    display_name: 'NextGen Healthcare',
    api_type: 'fhir',
    auth_method: 'oauth2',
    fhir_version: 'R4',
    capabilities: {
      supported_resources: ['Patient', 'Encounter', 'Condition'],
      supported_operations: ['read', 'search']
    }
  },
  {
    name: 'eclinicalworks',
    display_name: 'eClinicalWorks',
    api_type: 'fhir',
    auth_method: 'oauth2',
    fhir_version: 'R4',
    capabilities: {
      supported_resources: ['Patient', 'Encounter', 'Observation'],
      supported_operations: ['read']
    }
  }
];

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: false,
  frequency: 'daily',
  entity_types: ['Patient', 'Encounter'],
  batch_size: 100,
  concurrent_requests: 5,
  timeout_seconds: 30,
  retry_config: {
    max_retries: 3,
    backoff_multiplier: 2,
    initial_delay_ms: 1000
  }
};

export const DEFAULT_RATE_LIMITS: RateLimit = {
  requests_per_minute: 60,
  requests_per_hour: 1000,
  requests_per_day: 10000,
  burst_limit: 10,
  concurrent_limit: 5
};

// Common auth configurations for different EHR systems
export const AUTH_TEMPLATES: Record<string, Partial<AuthConfig>> = {
  epic_smart: {
    method: 'smart_on_fhir',
    oauth_settings: {
      scopes: ['patient/Patient.read', 'patient/Encounter.read', 'patient/Observation.read']
    }
  },
  cerner_smart: {
    method: 'smart_on_fhir',
    oauth_settings: {
      scopes: ['patient/Patient.read', 'patient/Encounter.read', 'patient/Condition.read']
    }
  },
  athena_oauth: {
    method: 'oauth2',
    oauth_settings: {
      scopes: ['patient/read', 'encounter/read']
    }
  },
  generic_api_key: {
    method: 'api_key'
  }
};

// Entity types commonly synced from EHR systems
export const SYNC_ENTITY_TYPES = [
  { value: 'Patient', label: 'Patients', description: 'Patient demographics and basic information' },
  { value: 'Encounter', label: 'Encounters', description: 'Healthcare encounters and visits' },
  { value: 'Observation', label: 'Observations', description: 'Lab results, vitals, and measurements' },
  { value: 'Condition', label: 'Conditions', description: 'Diagnoses and health conditions' },
  { value: 'Medication', label: 'Medications', description: 'Medications and prescriptions' },
  { value: 'MedicationRequest', label: 'Medication Requests', description: 'Prescription orders' },
  { value: 'Procedure', label: 'Procedures', description: 'Medical procedures performed' },
  { value: 'DocumentReference', label: 'Documents', description: 'Clinical documents and reports' },
  { value: 'Appointment', label: 'Appointments', description: 'Scheduled appointments' },
  { value: 'Coverage', label: 'Insurance Coverage', description: 'Insurance and coverage information' }
];