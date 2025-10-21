# Field Mapping Templates for EHR Systems

This document describes the pre-configured field mapping templates for Canvas Medical and Tebra (formerly Kareo) EHR systems.

## Overview

These templates provide ready-to-use field mappings that can be applied in the Field Mappings settings to quickly configure data integration from popular EHR systems. Each template includes:

- **Field definitions** with source paths and target mappings
- **Data transformations** for formatting consistency
- **Validation rules** for data quality
- **Documentation** with examples and descriptions

## Available Templates

### Canvas Medical (FHIR R4)

Canvas Medical uses FHIR R4 API with OAuth2 authentication.

#### 1. Canvas Patient Template
Maps standard patient demographic data from Canvas FHIR Patient resources:
- Patient ID, MRN, name fields
- Contact information (phone, email, address)
- Demographics (DOB, gender)
- JSON path expressions for FHIR nested data

#### 2. Canvas Provider Template
Maps provider information from Canvas FHIR Practitioner resources:
- Provider ID, NPI, name fields
- Professional qualifications and specialties
- FHIR identifier extraction

#### 3. Canvas Medication Template
Maps medication data from Canvas FHIR MedicationRequest resources:
- Medication identifiers and names
- NDC codes and dosage instructions
- Patient references and prescription dates

### Tebra (REST API)

Tebra uses REST API with API key authentication.

#### 1. Tebra Patient Template
Maps patient data from Tebra REST API responses:
- Patient ID, name, contact details
- Address components (line1, city, state, zip)
- Demographics with format transformations
- Multiple phone numbers (home, work)

#### 2. Tebra Provider Template
Maps provider information from Tebra API:
- Provider ID, NPI, credentials
- Name fields and specialties
- Practice affiliation information

#### 3. Tebra Claim Template
Maps billing/claim data from Tebra:
- Claim identifiers and amounts
- Service dates and procedure codes
- Diagnosis codes and insurance information
- Financial data with proper formatting

## Data Transformations

### Standard Transformations Applied

1. **Text Cleanup**:
   - `trim`: Remove leading/trailing whitespace
   - `uppercase`/`lowercase`: Normalize text casing

2. **Phone Number Formatting**:
   - Input: Various formats (5551234567, 555-123-4567, etc.)
   - Output: Standardized format (555) 123-4567

3. **Date Formatting**:
   - Canvas: ISO 8601 format (YYYY-MM-DD)
   - Tebra: MM/DD/YYYY → YYYY-MM-DD conversion

4. **Reference Extraction**:
   - FHIR references like "Patient/12345" → "12345"

## Field Path Examples

### Canvas FHIR JSONPath Examples
```javascript
// Patient first name from FHIR name array
"$.name[0].given[0]"

// Phone number with telecom system filter
"$.telecom[?(@.system==\"phone\")].value"

// NPI from identifier array
"$.identifier[?(@.system==\"http://hl7.org/fhir/sid/us-npi\")].value"

// Medical record number
"$.identifier[?(@.type.coding[0].code==\"MR\")].value"
```

### Tebra REST API Path Examples
```javascript
// Simple property access
"$.PatientID"
"$.FirstName"
"$.LastName"

// Date fields
"$.DOB"          // MM/DD/YYYY format
"$.ServiceDate"  // MM/DD/YYYY format

// Array fields
"$.DiagnosisCodes"  // Array of ICD-10 codes
"$.ProcedureCodes"  // Array of CPT codes
```

## Installation Instructions

1. **Execute the SQL script** to create the templates:
   ```bash
   psql -d your_database -f field-mapping-templates.sql
   ```

2. **Verify installation** by checking the field_mapping_template table:
   ```sql
   SELECT id, name, ehr_system_id, entity_type 
   FROM field_mapping_template 
   WHERE ehr_system_id IN ('canvas-medical', 'tebra-ehr');
   ```

3. **Templates will appear** in the Field Mappings settings under the "Templates" button.

## Usage in Application

1. Navigate to **Settings → Field Mappings**
2. Click the **"Templates"** button
3. Select a template from the available options
4. Click **"Apply Template"** to create field mappings
5. Customize mappings as needed for your specific use case

## Customization

### Modifying Templates

Templates can be customized by:

1. **Adding new fields** to the mappings JSON array
2. **Modifying source paths** for different API versions
3. **Adjusting transformations** for specific data formats
4. **Adding validation rules** for data quality requirements

### Creating New Templates

To create additional templates:

1. Follow the existing JSON structure
2. Use appropriate JSONPath or simple property paths
3. Include comprehensive field descriptions and examples
4. Test with sample data from your EHR system

## Field Mapping JSON Structure

```json
{
  "field_name": "unique_identifier",
  "display_name": "Human Readable Name",
  "data_type": "string|number|date|email|phone|json|array",
  "source_path": "$.json.path.to.field",
  "target_table": "destination_table",
  "target_column": "destination_column",
  "is_required": true|false,
  "description": "Field description",
  "example": "Sample value"
}
```

## Validation Rules

Each template includes validation for:
- **Required fields**: Ensures critical data is present
- **Data format**: Validates email, phone, date formats
- **Field length**: Prevents truncation issues
- **Pattern matching**: Ensures consistent data formats

## Support and Troubleshooting

### Common Issues

1. **Missing data**: Check if source paths match your EHR API version
2. **Format errors**: Verify transformation rules for your data format
3. **Authentication**: Ensure proper API credentials for EHR connections

### Getting Help

- Review API documentation for Canvas or Tebra
- Test mappings with small datasets first
- Check application logs for mapping errors
- Contact support team for custom template requirements

## Template Maintenance

Templates should be reviewed and updated:
- When EHR systems update their APIs
- When new data requirements are identified
- When data quality issues are discovered
- Quarterly as part of system maintenance

---

**Note**: These templates are starting points and may need customization based on your specific EHR configuration, API version, and data requirements.