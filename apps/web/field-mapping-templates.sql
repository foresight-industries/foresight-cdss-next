-- Field Mapping Templates for Canvas and Tebra EHR Systems
-- These templates provide pre-configured field mappings for common entities

-- First, let's ensure we have EHR systems for Canvas and Tebra
INSERT INTO ehr_system (id, name, display_name, api_type, auth_method, is_active, created_at)
VALUES 
  ('canvas-medical', 'canvas', 'Canvas Medical', 'fhir', 'oauth2', true, NOW()),
  ('tebra-ehr', 'tebra', 'Tebra (formerly Kareo)', 'rest', 'api_key', true, NOW())
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_type = EXCLUDED.api_type,
  auth_method = EXCLUDED.auth_method,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Canvas Medical FHIR Templates

-- 1. Canvas Patient Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'canvas-patient-template',
  'Canvas Patient Fields',
  'canvas-medical',
  'patient',
  '[
    {
      "field_name": "patient_id",
      "display_name": "Patient ID",
      "data_type": "string",
      "source_path": "$.id",
      "target_table": "patient",
      "target_column": "external_id",
      "is_required": true,
      "description": "Unique Canvas patient identifier",
      "example": "12345"
    },
    {
      "field_name": "first_name",
      "display_name": "First Name",
      "data_type": "string",
      "source_path": "$.name[0].given[0]",
      "target_table": "patient",
      "target_column": "first_name",
      "is_required": true,
      "description": "Patient first name from Canvas FHIR",
      "example": "John"
    },
    {
      "field_name": "last_name",
      "display_name": "Last Name",
      "data_type": "string",
      "source_path": "$.name[0].family",
      "target_table": "patient",
      "target_column": "last_name",
      "is_required": true,
      "description": "Patient last name from Canvas FHIR",
      "example": "Doe"
    },
    {
      "field_name": "date_of_birth",
      "display_name": "Date of Birth",
      "data_type": "date",
      "source_path": "$.birthDate",
      "target_table": "patient",
      "target_column": "date_of_birth",
      "is_required": true,
      "description": "Patient birth date",
      "example": "1990-01-15"
    },
    {
      "field_name": "gender",
      "display_name": "Gender",
      "data_type": "string",
      "source_path": "$.gender",
      "target_table": "patient",
      "target_column": "gender",
      "is_required": false,
      "description": "Patient gender",
      "example": "male"
    },
    {
      "field_name": "phone",
      "display_name": "Phone Number",
      "data_type": "phone",
      "source_path": "$.telecom[?(@.system==\"phone\")].value",
      "target_table": "patient",
      "target_column": "phone",
      "is_required": false,
      "description": "Primary phone number",
      "example": "(555) 123-4567"
    },
    {
      "field_name": "email",
      "display_name": "Email",
      "data_type": "email",
      "source_path": "$.telecom[?(@.system==\"email\")].value",
      "target_table": "patient",
      "target_column": "email",
      "is_required": false,
      "description": "Patient email address",
      "example": "john.doe@example.com"
    },
    {
      "field_name": "address",
      "display_name": "Address",
      "data_type": "json",
      "source_path": "$.address[0]",
      "target_table": "patient",
      "target_column": "address_json",
      "is_required": false,
      "description": "Complete address object",
      "example": "{\"line\": [\"123 Main St\"], \"city\": \"Anytown\", \"state\": \"CA\", \"postalCode\": \"12345\"}"
    },
    {
      "field_name": "mrn",
      "display_name": "Medical Record Number",
      "data_type": "string",
      "source_path": "$.identifier[?(@.type.coding[0].code==\"MR\")].value",
      "target_table": "patient",
      "target_column": "mrn",
      "is_required": false,
      "description": "Medical record number from Canvas",
      "example": "MRN123456"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "format_phone",
      "parameters": {"format": "(XXX) XXX-XXXX"},
      "order": 2
    }
  ]',
  true,
  NOW()
);

-- 2. Canvas Provider Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'canvas-provider-template',
  'Canvas Provider Fields',
  'canvas-medical',
  'provider',
  '[
    {
      "field_name": "provider_id",
      "display_name": "Provider ID",
      "data_type": "string",
      "source_path": "$.id",
      "target_table": "provider",
      "target_column": "external_id",
      "is_required": true,
      "description": "Canvas provider identifier",
      "example": "prov-12345"
    },
    {
      "field_name": "npi",
      "display_name": "NPI Number",
      "data_type": "string",
      "source_path": "$.identifier[?(@.system==\"http://hl7.org/fhir/sid/us-npi\")].value",
      "target_table": "provider",
      "target_column": "npi",
      "is_required": true,
      "description": "National Provider Identifier",
      "example": "1234567890"
    },
    {
      "field_name": "first_name",
      "display_name": "First Name",
      "data_type": "string",
      "source_path": "$.name[0].given[0]",
      "target_table": "provider",
      "target_column": "first_name",
      "is_required": true,
      "description": "Provider first name",
      "example": "Jane"
    },
    {
      "field_name": "last_name",
      "display_name": "Last Name",
      "data_type": "string",
      "source_path": "$.name[0].family",
      "target_table": "provider",
      "target_column": "last_name",
      "is_required": true,
      "description": "Provider last name",
      "example": "Smith"
    },
    {
      "field_name": "specialty",
      "display_name": "Specialty",
      "data_type": "string",
      "source_path": "$.qualification[0].code.coding[0].display",
      "target_table": "provider",
      "target_column": "specialty",
      "is_required": false,
      "description": "Provider medical specialty",
      "example": "Internal Medicine"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "uppercase",
      "parameters": {},
      "order": 2
    }
  ]',
  true,
  NOW()
);

-- Tebra (Kareo) REST API Templates

-- 3. Tebra Patient Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'tebra-patient-template',
  'Tebra Patient Fields',
  'tebra-ehr',
  'patient',
  '[
    {
      "field_name": "patient_id",
      "display_name": "Patient ID",
      "data_type": "string",
      "source_path": "$.PatientID",
      "target_table": "patient",
      "target_column": "external_id",
      "is_required": true,
      "description": "Tebra patient identifier",
      "example": "12345"
    },
    {
      "field_name": "first_name",
      "display_name": "First Name",
      "data_type": "string",
      "source_path": "$.FirstName",
      "target_table": "patient",
      "target_column": "first_name",
      "is_required": true,
      "description": "Patient first name",
      "example": "John"
    },
    {
      "field_name": "last_name",
      "display_name": "Last Name",
      "data_type": "string",
      "source_path": "$.LastName",
      "target_table": "patient",
      "target_column": "last_name",
      "is_required": true,
      "description": "Patient last name",
      "example": "Doe"
    },
    {
      "field_name": "middle_name",
      "display_name": "Middle Name",
      "data_type": "string",
      "source_path": "$.MiddleName",
      "target_table": "patient",
      "target_column": "middle_name",
      "is_required": false,
      "description": "Patient middle name",
      "example": "Michael"
    },
    {
      "field_name": "date_of_birth",
      "display_name": "Date of Birth",
      "data_type": "date",
      "source_path": "$.DOB",
      "target_table": "patient",
      "target_column": "date_of_birth",
      "is_required": true,
      "description": "Patient birth date",
      "example": "01/15/1990"
    },
    {
      "field_name": "gender",
      "display_name": "Gender",
      "data_type": "string",
      "source_path": "$.Gender",
      "target_table": "patient",
      "target_column": "gender",
      "is_required": false,
      "description": "Patient gender",
      "example": "M"
    },
    {
      "field_name": "ssn",
      "display_name": "Social Security Number",
      "data_type": "string",
      "source_path": "$.SSN",
      "target_table": "patient",
      "target_column": "ssn",
      "is_required": false,
      "description": "Patient SSN",
      "example": "123-45-6789"
    },
    {
      "field_name": "phone_home",
      "display_name": "Home Phone",
      "data_type": "phone",
      "source_path": "$.HomePhone",
      "target_table": "patient",
      "target_column": "phone",
      "is_required": false,
      "description": "Home phone number",
      "example": "555-123-4567"
    },
    {
      "field_name": "phone_work",
      "display_name": "Work Phone",
      "data_type": "phone",
      "source_path": "$.WorkPhone",
      "target_table": "patient",
      "target_column": "phone_work",
      "is_required": false,
      "description": "Work phone number",
      "example": "555-987-6543"
    },
    {
      "field_name": "email",
      "display_name": "Email",
      "data_type": "email",
      "source_path": "$.EmailAddress",
      "target_table": "patient",
      "target_column": "email",
      "is_required": false,
      "description": "Patient email address",
      "example": "john.doe@example.com"
    },
    {
      "field_name": "address_line1",
      "display_name": "Address Line 1",
      "data_type": "string",
      "source_path": "$.AddressLine1",
      "target_table": "patient",
      "target_column": "address_line1",
      "is_required": false,
      "description": "Primary address line",
      "example": "123 Main St"
    },
    {
      "field_name": "city",
      "display_name": "City",
      "data_type": "string",
      "source_path": "$.City",
      "target_table": "patient",
      "target_column": "city",
      "is_required": false,
      "description": "City",
      "example": "Anytown"
    },
    {
      "field_name": "state",
      "display_name": "State",
      "data_type": "string",
      "source_path": "$.State",
      "target_table": "patient",
      "target_column": "state",
      "is_required": false,
      "description": "State abbreviation",
      "example": "CA"
    },
    {
      "field_name": "zip_code",
      "display_name": "ZIP Code",
      "data_type": "string",
      "source_path": "$.ZipCode",
      "target_table": "patient",
      "target_column": "zip_code",
      "is_required": false,
      "description": "ZIP/postal code",
      "example": "12345"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "format_date",
      "parameters": {"input_format": "MM/DD/YYYY", "output_format": "YYYY-MM-DD"},
      "order": 2
    },
    {
      "type": "format_phone",
      "parameters": {"format": "(XXX) XXX-XXXX"},
      "order": 3
    }
  ]',
  true,
  NOW()
);

-- 4. Tebra Provider Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'tebra-provider-template',
  'Tebra Provider Fields',
  'tebra-ehr',
  'provider',
  '[
    {
      "field_name": "provider_id",
      "display_name": "Provider ID",
      "data_type": "string",
      "source_path": "$.ProviderID",
      "target_table": "provider",
      "target_column": "external_id",
      "is_required": true,
      "description": "Tebra provider identifier",
      "example": "prov-12345"
    },
    {
      "field_name": "npi",
      "display_name": "NPI Number",
      "data_type": "string",
      "source_path": "$.NPI",
      "target_table": "provider",
      "target_column": "npi",
      "is_required": true,
      "description": "National Provider Identifier",
      "example": "1234567890"
    },
    {
      "field_name": "first_name",
      "display_name": "First Name",
      "data_type": "string",
      "source_path": "$.FirstName",
      "target_table": "provider",
      "target_column": "first_name",
      "is_required": true,
      "description": "Provider first name",
      "example": "Jane"
    },
    {
      "field_name": "last_name",
      "display_name": "Last Name",
      "data_type": "string",
      "source_path": "$.LastName",
      "target_table": "provider",
      "target_column": "last_name",
      "is_required": true,
      "description": "Provider last name",
      "example": "Smith"
    },
    {
      "field_name": "middle_name",
      "display_name": "Middle Name",
      "data_type": "string",
      "source_path": "$.MiddleName",
      "target_table": "provider",
      "target_column": "middle_name",
      "is_required": false,
      "description": "Provider middle name",
      "example": "Marie"
    },
    {
      "field_name": "credentials",
      "display_name": "Credentials",
      "data_type": "string",
      "source_path": "$.Credentials",
      "target_table": "provider",
      "target_column": "credentials",
      "is_required": false,
      "description": "Provider credentials (MD, DO, etc.)",
      "example": "MD"
    },
    {
      "field_name": "specialty",
      "display_name": "Specialty",
      "data_type": "string",
      "source_path": "$.Specialty",
      "target_table": "provider",
      "target_column": "specialty",
      "is_required": false,
      "description": "Provider medical specialty",
      "example": "Internal Medicine"
    },
    {
      "field_name": "practice_name",
      "display_name": "Practice Name",
      "data_type": "string",
      "source_path": "$.PracticeName",
      "target_table": "provider",
      "target_column": "practice_name",
      "is_required": false,
      "description": "Name of the medical practice",
      "example": "Anytown Medical Center"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "uppercase",
      "parameters": {},
      "order": 2
    }
  ]',
  true,
  NOW()
);

-- 5. Tebra Claim Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'tebra-claim-template',
  'Tebra Claim Fields',
  'tebra-ehr',
  'claim',
  '[
    {
      "field_name": "claim_id",
      "display_name": "Claim ID",
      "data_type": "string",
      "source_path": "$.ClaimID",
      "target_table": "claim",
      "target_column": "external_id",
      "is_required": true,
      "description": "Tebra claim identifier",
      "example": "CLM123456"
    },
    {
      "field_name": "patient_id",
      "display_name": "Patient ID",
      "data_type": "string",
      "source_path": "$.PatientID",
      "target_table": "claim",
      "target_column": "patient_id",
      "is_required": true,
      "description": "Reference to patient",
      "example": "12345"
    },
    {
      "field_name": "provider_id",
      "display_name": "Provider ID",
      "data_type": "string",
      "source_path": "$.ProviderID",
      "target_table": "claim",
      "target_column": "provider_id",
      "is_required": true,
      "description": "Reference to provider",
      "example": "prov-12345"
    },
    {
      "field_name": "service_date",
      "display_name": "Service Date",
      "data_type": "date",
      "source_path": "$.ServiceDate",
      "target_table": "claim",
      "target_column": "service_date",
      "is_required": true,
      "description": "Date of service",
      "example": "01/15/2024"
    },
    {
      "field_name": "total_amount",
      "display_name": "Total Amount",
      "data_type": "number",
      "source_path": "$.TotalCharges",
      "target_table": "claim",
      "target_column": "total_amount",
      "is_required": true,
      "description": "Total claim amount",
      "example": "150.00"
    },
    {
      "field_name": "diagnosis_codes",
      "display_name": "Diagnosis Codes",
      "data_type": "array",
      "source_path": "$.DiagnosisCodes",
      "target_table": "claim",
      "target_column": "diagnosis_codes",
      "is_required": true,
      "description": "ICD-10 diagnosis codes",
      "example": "[\"Z00.00\", \"M79.3\"]"
    },
    {
      "field_name": "procedure_codes",
      "display_name": "Procedure Codes",
      "data_type": "array",
      "source_path": "$.ProcedureCodes",
      "target_table": "claim",
      "target_column": "procedure_codes",
      "is_required": true,
      "description": "CPT procedure codes",
      "example": "[\"99213\", \"36415\"]"
    },
    {
      "field_name": "insurance_name",
      "display_name": "Insurance Name",
      "data_type": "string",
      "source_path": "$.InsuranceName",
      "target_table": "claim",
      "target_column": "payer_name",
      "is_required": false,
      "description": "Primary insurance payer name",
      "example": "Blue Cross Blue Shield"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "format_date",
      "parameters": {"input_format": "MM/DD/YYYY", "output_format": "YYYY-MM-DD"},
      "order": 2
    }
  ]',
  true,
  NOW()
);

-- 6. Canvas Medication Template
INSERT INTO field_mapping_template (
  id, 
  name, 
  ehr_system_id, 
  entity_type, 
  mappings, 
  transformations,
  is_default,
  created_at
) VALUES (
  'canvas-medication-template',
  'Canvas Medication Fields',
  'canvas-medical',
  'medication',
  '[
    {
      "field_name": "medication_id",
      "display_name": "Medication ID",
      "data_type": "string",
      "source_path": "$.id",
      "target_table": "medication",
      "target_column": "external_id",
      "is_required": true,
      "description": "Canvas medication identifier",
      "example": "med-12345"
    },
    {
      "field_name": "patient_id",
      "display_name": "Patient ID",
      "data_type": "string",
      "source_path": "$.subject.reference",
      "target_table": "medication",
      "target_column": "patient_id",
      "is_required": true,
      "description": "Reference to patient",
      "example": "Patient/12345"
    },
    {
      "field_name": "medication_name",
      "display_name": "Medication Name",
      "data_type": "string",
      "source_path": "$.medicationCodeableConcept.coding[0].display",
      "target_table": "medication",
      "target_column": "name",
      "is_required": true,
      "description": "Medication name",
      "example": "Lisinopril 10mg"
    },
    {
      "field_name": "ndc_code",
      "display_name": "NDC Code",
      "data_type": "string",
      "source_path": "$.medicationCodeableConcept.coding[?(@.system==\"http://hl7.org/fhir/sid/ndc\")].code",
      "target_table": "medication",
      "target_column": "ndc_code",
      "is_required": false,
      "description": "National Drug Code",
      "example": "12345-678-90"
    },
    {
      "field_name": "dosage_text",
      "display_name": "Dosage Instructions",
      "data_type": "string",
      "source_path": "$.dosageInstruction[0].text",
      "target_table": "medication",
      "target_column": "dosage",
      "is_required": false,
      "description": "Dosage instructions",
      "example": "Take 1 tablet by mouth daily"
    },
    {
      "field_name": "prescribed_date",
      "display_name": "Prescribed Date",
      "data_type": "date",
      "source_path": "$.authoredOn",
      "target_table": "medication",
      "target_column": "prescribed_date",
      "is_required": false,
      "description": "Date medication was prescribed",
      "example": "2024-01-15"
    }
  ]',
  '[
    {
      "type": "trim",
      "parameters": {},
      "order": 1
    },
    {
      "type": "extract_number",
      "parameters": {"pattern": "Patient/(.*)"},
      "order": 2
    }
  ]',
  true,
  NOW()
);

-- Display the created templates
SELECT id, name, ehr_system_id, entity_type, is_default 
FROM field_mapping_template 
WHERE ehr_system_id IN ('canvas-medical', 'tebra-ehr')
ORDER BY ehr_system_id, entity_type;