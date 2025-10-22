export interface Payer {
  id: number;
  name: string;
  external_payer_id: string;
  payer_type?: PayerConfigType;
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayerConfig {
  id: string;
  payer_id: number;
  team_id: string;
  config_type: PayerConfigType;
  auto_submit_claims?: boolean;
  auto_submit_pa?: boolean;
  timely_filing_days?: number;
  eligibility_cache_hours?: number;
  submission_batch_size?: number;
  submission_schedule?: string;
  portal_config?: PayerPortalConfig;
  special_rules?: PayerSpecialRules;
  created_at?: string;
  updated_at?: string;
  payer?: Payer;
}

export interface PayerPortalCredential {
  id: string;
  team_id: string;
  payer_id?: number;
  portal_url: string;
  username?: string;
  password?: string;
  mfa_enabled?: boolean;
  automation_enabled?: boolean;
  security_questions?: SecurityQuestion[];
  last_successful_login?: string;
  created_at?: string;
  updated_at?: string;
  payer?: Payer;
}

export interface PayerSubmissionConfig {
  id: string;
  payer_id?: number;
  submission_method?: SubmissionMethod;
  portal_url?: string;
  api_endpoint?: string;
  claim_type?: string;
  required_attachments?: string[];
  special_instructions?: any;
  payer?: Payer;
}

export interface PayerPortalConfig {
  login_url?: string;
  claims_portal_url?: string;
  pa_portal_url?: string;
  eligibility_url?: string;
  provider_portal_url?: string;
  supports_api?: boolean;
  api_version?: string;
  rate_limits?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;
  };
  session_timeout_minutes?: number;
  requires_captcha?: boolean;
  navigation_config?: {
    login_steps?: string[];
    claim_submission_steps?: string[];
    pa_submission_steps?: string[];
  };
}

export interface PayerSpecialRules {
  claim_rules?: {
    max_claims_per_batch?: number;
    requires_patient_signature?: boolean;
    requires_provider_signature?: boolean;
    supports_electronic_signature?: boolean;
    required_modifiers?: string[];
    excluded_procedure_codes?: string[];
  };
  pa_rules?: {
    max_pa_per_batch?: number;
    requires_clinical_notes?: boolean;
    requires_lab_results?: boolean;
    requires_imaging?: boolean;
    auto_approval_criteria?: any;
    step_therapy_required?: boolean;
  };
  eligibility_rules?: {
    check_frequency_hours?: number;
    cache_results?: boolean;
    real_time_required?: boolean;
  };
  billing_rules?: {
    timely_filing_days?: number;
    corrected_claim_deadline_days?: number;
    appeal_deadline_days?: number;
    coordination_of_benefits_required?: boolean;
  };
}

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export type PayerConfigType = 
  | 'submission' 
  | 'eligibility' 
  | 'pa_submission' 
  | 'portal' 
  | 'general';

export type SubmissionMethod = 
  | 'portal' 
  | 'edi' 
  | 'api' 
  | 'manual' 
  | 'clearinghouse';

export interface CreatePayerRequest {
  name: string;
  external_payer_id: string;
  payer_type?: PayerConfigType;
}

export interface CreatePayerConfigRequest {
  payer_id: number;
  config_type: PayerConfigType;
  auto_submit_claims?: boolean;
  auto_submit_pa?: boolean;
  timely_filing_days?: number;
  eligibility_cache_hours?: number;
  submission_batch_size?: number;
  submission_schedule?: string;
  portal_config?: PayerPortalConfig;
  special_rules?: PayerSpecialRules;
}

export interface CreatePayerPortalCredentialRequest {
  payer_id?: number;
  portal_url: string;
  username?: string;
  password?: string;
  mfa_enabled?: boolean;
  automation_enabled?: boolean;
  security_questions?: SecurityQuestion[];
}

export interface UpdatePayerConfigRequest {
  config_type?: PayerConfigType;
  auto_submit_claims?: boolean;
  auto_submit_pa?: boolean;
  timely_filing_days?: number;
  eligibility_cache_hours?: number;
  submission_batch_size?: number;
  submission_schedule?: string;
  portal_config?: PayerPortalConfig;
  special_rules?: PayerSpecialRules;
}

export interface UpdatePayerPortalCredentialRequest {
  portal_url?: string;
  username?: string;
  password?: string;
  mfa_enabled?: boolean;
  automation_enabled?: boolean;
  security_questions?: SecurityQuestion[];
}

export interface PayerWithConfig {
  payer: Payer;
  config?: PayerConfig;
  portal_credential?: PayerPortalCredential;
  submission_config?: PayerSubmissionConfig;
  performance_stats?: {
    total_claims: number;
    approval_rate: number;
    avg_response_time_days: number;
    last_submission: string;
  };
}

// Popular payers with default configurations
export const POPULAR_PAYERS = {
  medicare: {
    name: 'Medicare',
    external_payer_id: 'CMS',
    payer_type: 'general' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 24,
      submission_batch_size: 100,
      portal_config: {
        login_url: 'https://www.cms.gov/',
        supports_api: true,
        session_timeout_minutes: 30
      }
    }
  },
  medicaid: {
    name: 'Medicaid',
    external_payer_id: 'STATE_MEDICAID',
    payer_type: 'general' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 8,
      submission_batch_size: 50
    }
  },
  aetna: {
    name: 'Aetna',
    external_payer_id: 'AETNA',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 180,
      eligibility_cache_hours: 24,
      submission_batch_size: 25,
      portal_config: {
        login_url: 'https://www.aetna.com/providers/',
        claims_portal_url: 'https://www.aetna.com/providers/claims/',
        pa_portal_url: 'https://www.aetna.com/providers/prior-authorization/',
        supports_api: false,
        session_timeout_minutes: 20
      }
    }
  },
  anthem: {
    name: 'Anthem',
    external_payer_id: 'ANTHEM',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 24,
      submission_batch_size: 50,
      portal_config: {
        login_url: 'https://www.anthem.com/provider/',
        supports_api: false,
        session_timeout_minutes: 30
      }
    }
  },
  cigna: {
    name: 'Cigna',
    external_payer_id: 'CIGNA',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 180,
      eligibility_cache_hours: 12,
      submission_batch_size: 30,
      portal_config: {
        login_url: 'https://cignaforhcp.cigna.com/',
        supports_api: true,
        api_version: 'v1',
        session_timeout_minutes: 25
      }
    }
  },
  humana: {
    name: 'Humana',
    external_payer_id: 'HUMANA',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 24,
      submission_batch_size: 40,
      portal_config: {
        login_url: 'https://www.humana.com/provider/',
        supports_api: false,
        session_timeout_minutes: 20
      }
    }
  },
  united_healthcare: {
    name: 'United Healthcare',
    external_payer_id: 'UHC',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 24,
      submission_batch_size: 100,
      portal_config: {
        login_url: 'https://www.uhcprovider.com/',
        supports_api: true,
        api_version: 'v2',
        session_timeout_minutes: 30
      }
    }
  },
  bcbs: {
    name: 'Blue Cross Blue Shield',
    external_payer_id: 'BCBS',
    payer_type: 'portal' as PayerConfigType,
    default_config: {
      timely_filing_days: 365,
      eligibility_cache_hours: 24,
      submission_batch_size: 50,
      portal_config: {
        login_url: 'https://www.bcbs.com/providers/',
        supports_api: false,
        session_timeout_minutes: 25
      }
    }
  }
} as const;

export type PopularPayerKey = keyof typeof POPULAR_PAYERS;

// Helper functions
export function getPayerStatusColor(hasConfig: boolean, hasCredentials: boolean): string {
  if (hasConfig && hasCredentials) {
    return 'text-green-600 bg-green-50';
  } else if (hasConfig || hasCredentials) {
    return 'text-yellow-600 bg-yellow-50';
  } else {
    return 'text-gray-600 bg-gray-50';
  }
}

export function getPayerStatusLabel(hasConfig: boolean, hasCredentials: boolean): string {
  if (hasConfig && hasCredentials) {
    return 'Fully Configured';
  } else if (hasConfig || hasCredentials) {
    return 'Partially Configured';
  } else {
    return 'Not Configured';
  }
}

export function getConfigTypeLabel(configType: PayerConfigType): string {
  switch (configType) {
    case 'submission':
      return 'Claim Submission';
    case 'eligibility':
      return 'Eligibility Verification';
    case 'pa_submission':
      return 'Prior Authorization';
    case 'portal':
      return 'Portal Access';
    case 'general':
      return 'General Configuration';
    default:
      return 'Unknown';
  }
}

export function getSubmissionMethodLabel(method: SubmissionMethod): string {
  switch (method) {
    case 'portal':
      return 'Web Portal';
    case 'edi':
      return 'EDI (Electronic Data Interchange)';
    case 'api':
      return 'API Integration';
    case 'manual':
      return 'Manual Submission';
    case 'clearinghouse':
      return 'Clearinghouse';
    default:
      return 'Unknown';
  }
}