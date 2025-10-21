// Field mapping types for custom field configurations

export type EntityType = 
  | 'patient'
  | 'provider'
  | 'claim'
  | 'prior_auth'
  | 'medication'
  | 'diagnosis'
  | 'procedure'
  | 'insurance';

export type FieldDataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'json'
  | 'array';

export type TransformationType = 
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'format_phone'
  | 'format_date'
  | 'parse_name'
  | 'extract_number'
  | 'custom';

export type ValidationRuleType = 
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'date'
  | 'numeric'
  | 'custom';

// Core field mapping interfaces
export interface CustomFieldMapping {
  id: string;
  team_id: string;
  ehr_connection_id?: string;
  entity_type: EntityType;
  source_path: string;
  target_table?: string;
  target_column?: string;
  transformation_rules?: TransformationRule[];
  validation_rules?: ValidationRule[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Extended type with populated EHR connection data
export interface CustomFieldMappingWithConnection extends CustomFieldMapping {
  ehr_connection?: {
    id: string;
    name: string;
    system_type?: string;
  };
}

export interface FieldMappingTemplate {
  id: string;
  name: string;
  ehr_system_id?: string;
  entity_type?: EntityType;
  mappings: FieldMappingDefinition[];
  transformations?: TransformationRule[];
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FieldMappingDefinition {
  field_name: string;
  display_name: string;
  data_type: FieldDataType;
  source_path: string;
  target_table?: string;
  target_column?: string;
  is_required: boolean;
  default_value?: any;
  description?: string;
  example?: string;
}

export interface TransformationRule {
  type: TransformationType;
  parameters?: Record<string, any>;
  custom_function?: string;
  order: number;
}

export interface ValidationRule {
  type: ValidationRuleType;
  parameters?: Record<string, any>;
  error_message?: string;
  is_blocking: boolean;
}

// Request/Response types for API
export interface CreateFieldMappingRequest {
  entity_type: EntityType;
  source_path: string;
  target_table?: string;
  target_column?: string;
  transformation_rules?: TransformationRule[];
  validation_rules?: ValidationRule[];
  ehr_connection_id?: string;
}

export interface UpdateFieldMappingRequest {
  source_path?: string;
  target_table?: string;
  target_column?: string;
  transformation_rules?: TransformationRule[];
  validation_rules?: ValidationRule[];
  is_active?: boolean;
}

export interface CreateMappingTemplateRequest {
  name: string;
  ehr_system_id?: string;
  entity_type?: EntityType;
  mappings: FieldMappingDefinition[];
  transformations?: TransformationRule[];
  is_default?: boolean;
}

export interface UpdateMappingTemplateRequest {
  name?: string;
  mappings?: FieldMappingDefinition[];
  transformations?: TransformationRule[];
  is_default?: boolean;
}

// UI-specific types
export interface FieldMappingWithTemplate extends CustomFieldMapping {
  template?: FieldMappingTemplate;
  ehr_connection?: {
    id: string;
    name: string;
    system_type: string;
  };
}

export interface MappingValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  field_conflicts: string[];
}

export interface FieldMappingStats {
  total_mappings: number;
  active_mappings: number;
  by_entity_type: Record<EntityType, number>;
  by_ehr_system: Record<string, number>;
  validation_errors: number;
}

// Predefined field options for common entities
export const COMMON_ENTITY_FIELDS: Record<EntityType, FieldMappingDefinition[]> = {
  patient: [
    {
      field_name: 'patient_id',
      display_name: 'Patient ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the patient'
    },
    {
      field_name: 'first_name',
      display_name: 'First Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Patient first name'
    },
    {
      field_name: 'last_name',
      display_name: 'Last Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Patient last name'
    },
    {
      field_name: 'date_of_birth',
      display_name: 'Date of Birth',
      data_type: 'date',
      source_path: '',
      is_required: true,
      description: 'Patient date of birth'
    },
    {
      field_name: 'gender',
      display_name: 'Gender',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Patient gender'
    },
    {
      field_name: 'phone',
      display_name: 'Phone Number',
      data_type: 'phone',
      source_path: '',
      is_required: false,
      description: 'Primary phone number'
    },
    {
      field_name: 'email',
      display_name: 'Email Address',
      data_type: 'email',
      source_path: '',
      is_required: false,
      description: 'Patient email address'
    },
    {
      field_name: 'address',
      display_name: 'Address',
      data_type: 'json',
      source_path: '',
      is_required: false,
      description: 'Patient address information'
    }
  ],
  provider: [
    {
      field_name: 'provider_id',
      display_name: 'Provider ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the provider'
    },
    {
      field_name: 'npi',
      display_name: 'NPI Number',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'National Provider Identifier'
    },
    {
      field_name: 'first_name',
      display_name: 'First Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Provider first name'
    },
    {
      field_name: 'last_name',
      display_name: 'Last Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Provider last name'
    },
    {
      field_name: 'specialty',
      display_name: 'Specialty',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Provider medical specialty'
    },
    {
      field_name: 'practice_name',
      display_name: 'Practice Name',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Name of the medical practice'
    }
  ],
  claim: [
    {
      field_name: 'claim_id',
      display_name: 'Claim ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the claim'
    },
    {
      field_name: 'patient_id',
      display_name: 'Patient ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Reference to patient'
    },
    {
      field_name: 'provider_id',
      display_name: 'Provider ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Reference to provider'
    },
    {
      field_name: 'service_date',
      display_name: 'Service Date',
      data_type: 'date',
      source_path: '',
      is_required: true,
      description: 'Date of service'
    },
    {
      field_name: 'procedure_codes',
      display_name: 'Procedure Codes',
      data_type: 'array',
      source_path: '',
      is_required: true,
      description: 'CPT/HCPCS codes for procedures'
    },
    {
      field_name: 'diagnosis_codes',
      display_name: 'Diagnosis Codes',
      data_type: 'array',
      source_path: '',
      is_required: true,
      description: 'ICD-10 diagnosis codes'
    },
    {
      field_name: 'total_amount',
      display_name: 'Total Amount',
      data_type: 'number',
      source_path: '',
      is_required: true,
      description: 'Total claim amount'
    }
  ],
  prior_auth: [
    {
      field_name: 'auth_id',
      display_name: 'Authorization ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the prior authorization'
    },
    {
      field_name: 'patient_id',
      display_name: 'Patient ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Reference to patient'
    },
    {
      field_name: 'provider_id',
      display_name: 'Provider ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Reference to provider'
    },
    {
      field_name: 'service_type',
      display_name: 'Service Type',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Type of service requiring authorization'
    },
    {
      field_name: 'procedure_codes',
      display_name: 'Procedure Codes',
      data_type: 'array',
      source_path: '',
      is_required: true,
      description: 'CPT/HCPCS codes'
    },
    {
      field_name: 'diagnosis_codes',
      display_name: 'Diagnosis Codes',
      data_type: 'array',
      source_path: '',
      is_required: true,
      description: 'ICD-10 diagnosis codes'
    },
    {
      field_name: 'urgency',
      display_name: 'Urgency Level',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Urgency of the request'
    }
  ],
  medication: [
    {
      field_name: 'medication_id',
      display_name: 'Medication ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the medication'
    },
    {
      field_name: 'ndc_code',
      display_name: 'NDC Code',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'National Drug Code'
    },
    {
      field_name: 'medication_name',
      display_name: 'Medication Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Name of the medication'
    },
    {
      field_name: 'dosage',
      display_name: 'Dosage',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Medication dosage'
    },
    {
      field_name: 'frequency',
      display_name: 'Frequency',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Dosing frequency'
    }
  ],
  diagnosis: [
    {
      field_name: 'diagnosis_id',
      display_name: 'Diagnosis ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the diagnosis'
    },
    {
      field_name: 'icd10_code',
      display_name: 'ICD-10 Code',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'ICD-10 diagnosis code'
    },
    {
      field_name: 'description',
      display_name: 'Description',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Diagnosis description'
    },
    {
      field_name: 'onset_date',
      display_name: 'Onset Date',
      data_type: 'date',
      source_path: '',
      is_required: false,
      description: 'Date of diagnosis onset'
    }
  ],
  procedure: [
    {
      field_name: 'procedure_id',
      display_name: 'Procedure ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Unique identifier for the procedure'
    },
    {
      field_name: 'cpt_code',
      display_name: 'CPT Code',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'CPT procedure code'
    },
    {
      field_name: 'description',
      display_name: 'Description',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Procedure description'
    },
    {
      field_name: 'procedure_date',
      display_name: 'Procedure Date',
      data_type: 'date',
      source_path: '',
      is_required: false,
      description: 'Date procedure was performed'
    }
  ],
  insurance: [
    {
      field_name: 'policy_id',
      display_name: 'Policy ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Insurance policy identifier'
    },
    {
      field_name: 'member_id',
      display_name: 'Member ID',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Insurance member identifier'
    },
    {
      field_name: 'group_number',
      display_name: 'Group Number',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Insurance group number'
    },
    {
      field_name: 'payer_name',
      display_name: 'Payer Name',
      data_type: 'string',
      source_path: '',
      is_required: true,
      description: 'Insurance payer name'
    },
    {
      field_name: 'policy_type',
      display_name: 'Policy Type',
      data_type: 'string',
      source_path: '',
      is_required: false,
      description: 'Type of insurance policy'
    }
  ]
};

// Common transformation rules
export const COMMON_TRANSFORMATIONS: TransformationRule[] = [
  {
    type: 'trim',
    parameters: {},
    order: 1
  },
  {
    type: 'uppercase',
    parameters: {},
    order: 2
  },
  {
    type: 'format_phone',
    parameters: { format: '(XXX) XXX-XXXX' },
    order: 1
  },
  {
    type: 'format_date',
    parameters: { 
      input_format: 'MM/DD/YYYY',
      output_format: 'YYYY-MM-DD'
    },
    order: 1
  },
  {
    type: 'parse_name',
    parameters: {
      separator: ',',
      last_first: true
    },
    order: 1
  }
];

// Common validation rules
export const COMMON_VALIDATIONS: ValidationRule[] = [
  {
    type: 'required',
    parameters: {},
    error_message: 'This field is required',
    is_blocking: true
  },
  {
    type: 'email',
    parameters: {},
    error_message: 'Invalid email format',
    is_blocking: true
  },
  {
    type: 'phone',
    parameters: {},
    error_message: 'Invalid phone number format',
    is_blocking: false
  },
  {
    type: 'pattern',
    parameters: { regex: '^[0-9]{10}$' },
    error_message: 'Must be 10 digits',
    is_blocking: true
  },
  {
    type: 'min_length',
    parameters: { length: 1 },
    error_message: 'Field cannot be empty',
    is_blocking: true
  },
  {
    type: 'max_length',
    parameters: { length: 255 },
    error_message: 'Field too long (max 255 characters)',
    is_blocking: false
  }
];