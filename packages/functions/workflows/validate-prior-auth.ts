import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

interface PriorAuthEvent {
  priorAuthId: string;
  patientId: string;
  providerId: string;
  organizationId: string;
  serviceCode?: string;
  diagnosisCode?: string;
  documentText?: string;
  attachments?: Array<{
    id: string;
    type: string;
    content: string;
  }>;
}

interface ValidationIssue {
  field: string;
  issue: string;
  confidence: number;
  auto_correctable: boolean;
  suggested_fix?: string;
}

interface ValidationResult {
  priorAuthId: string;
  is_valid: boolean;
  validation_issues: ValidationIssue[];
  validation_issues_count: number;
  document_text: string;
  extracted_data: {
    patient_info: any;
    provider_info: any;
    service_info: any;
    diagnosis_info: any;
  };
}

const rdsClient = new RDSDataClient({ region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' });

export const handler = async (event: PriorAuthEvent): Promise<ValidationResult> => {
  console.log('Validating Prior Authorization:', JSON.stringify(event, null, 2));

  try {
    const { priorAuthId, patientId, providerId, organizationId } = event;
    
    // Step 1: Validate required fields
    const validationIssues: ValidationIssue[] = [];
    
    if (!priorAuthId) {
      validationIssues.push({
        field: 'priorAuthId',
        issue: 'Missing prior authorization ID',
        confidence: 100,
        auto_correctable: false
      });
    }
    
    if (!patientId) {
      validationIssues.push({
        field: 'patientId',
        issue: 'Missing patient ID',
        confidence: 100,
        auto_correctable: false
      });
    }
    
    if (!providerId) {
      validationIssues.push({
        field: 'providerId',
        issue: 'Missing provider ID',
        confidence: 100,
        auto_correctable: false
      });
    }

    // Step 2: Fetch PA data from database
    let documentText = event.documentText || '';
    let extractedData = {
      patient_info: {},
      provider_info: {},
      service_info: {},
      diagnosis_info: {}
    };

    if (priorAuthId) {
      try {
        // Fetch PA details from database
        const paQuery = `
          SELECT 
            pa.id,
            pa.patient_id,
            pa.provider_id,
            pa.service_code,
            pa.diagnosis_code,
            pa.status,
            pa.document_text,
            pa.created_at,
            p.first_name as patient_first_name,
            p.last_name as patient_last_name,
            p.date_of_birth,
            p.insurance_id,
            pr.npi,
            pr.name as provider_name,
            pr.specialty
          FROM prior_authorizations pa
          LEFT JOIN patients p ON pa.patient_id = p.id
          LEFT JOIN providers pr ON pa.provider_id = pr.id
          WHERE pa.id = :priorAuthId AND pa.organization_id = :organizationId
        `;

        const paResult = await rdsClient.send(new ExecuteStatementCommand({
          resourceArn: process.env.DATABASE_CLUSTER_ARN,
          secretArn: process.env.DATABASE_SECRET_ARN,
          database: process.env.DATABASE_NAME,
          sql: paQuery,
          parameters: [
            { name: 'priorAuthId', value: { stringValue: priorAuthId } },
            { name: 'organizationId', value: { stringValue: organizationId } }
          ]
        }));

        if (paResult.records && paResult.records.length > 0) {
          const record = paResult.records[0];
          
          documentText = record[7]?.stringValue || '';
          
          extractedData = {
            patient_info: {
              id: record[1]?.stringValue,
              first_name: record[8]?.stringValue,
              last_name: record[9]?.stringValue,
              date_of_birth: record[10]?.stringValue,
              insurance_id: record[11]?.stringValue
            },
            provider_info: {
              id: record[2]?.stringValue,
              npi: record[12]?.stringValue,
              name: record[13]?.stringValue,
              specialty: record[14]?.stringValue
            },
            service_info: {
              code: record[3]?.stringValue,
              description: ''
            },
            diagnosis_info: {
              code: record[4]?.stringValue,
              description: ''
            }
          };

          // Step 3: Validate extracted data
          
          // Validate patient information
          if (!extractedData.patient_info.first_name) {
            validationIssues.push({
              field: 'patient.first_name',
              issue: 'Missing patient first name',
              confidence: 90,
              auto_correctable: false
            });
          }
          
          if (!extractedData.patient_info.last_name) {
            validationIssues.push({
              field: 'patient.last_name',
              issue: 'Missing patient last name',
              confidence: 90,
              auto_correctable: false
            });
          }
          
          if (!extractedData.patient_info.date_of_birth) {
            validationIssues.push({
              field: 'patient.date_of_birth',
              issue: 'Missing patient date of birth',
              confidence: 95,
              auto_correctable: false
            });
          }
          
          if (!extractedData.patient_info.insurance_id) {
            validationIssues.push({
              field: 'patient.insurance_id',
              issue: 'Missing patient insurance ID',
              confidence: 85,
              auto_correctable: false
            });
          }

          // Validate provider information
          if (!extractedData.provider_info.npi) {
            validationIssues.push({
              field: 'provider.npi',
              issue: 'Missing provider NPI',
              confidence: 95,
              auto_correctable: false
            });
          } else {
            // Validate NPI format (10 digits)
            const npi = extractedData.provider_info.npi;
            if (!/^\d{10}$/.test(npi)) {
              validationIssues.push({
                field: 'provider.npi',
                issue: 'Invalid NPI format (must be 10 digits)',
                confidence: 100,
                auto_correctable: false
              });
            }
          }
          
          if (!extractedData.provider_info.name) {
            validationIssues.push({
              field: 'provider.name',
              issue: 'Missing provider name',
              confidence: 85,
              auto_correctable: false
            });
          }

          // Validate service information
          if (!extractedData.service_info.code) {
            validationIssues.push({
              field: 'service.code',
              issue: 'Missing service/procedure code',
              confidence: 95,
              auto_correctable: false
            });
          } else {
            // Basic CPT code format validation
            const serviceCode = extractedData.service_info.code;
            if (!/^\d{5}$/.test(serviceCode)) {
              validationIssues.push({
                field: 'service.code',
                issue: 'Invalid CPT code format (must be 5 digits)',
                confidence: 90,
                auto_correctable: false
              });
            }
          }

          // Validate diagnosis information
          if (!extractedData.diagnosis_info.code) {
            validationIssues.push({
              field: 'diagnosis.code',
              issue: 'Missing diagnosis code',
              confidence: 95,
              auto_correctable: false
            });
          } else {
            // Basic ICD-10 code format validation
            const diagnosisCode = extractedData.diagnosis_info.code;
            if (!/^[A-Z]\d{2}(\.\d{1,4})?$/.test(diagnosisCode)) {
              validationIssues.push({
                field: 'diagnosis.code',
                issue: 'Invalid ICD-10 code format',
                confidence: 85,
                auto_correctable: true,
                suggested_fix: 'Format code according to ICD-10 standards'
              });
            }
          }

          // Step 4: Document text validation
          if (!documentText || documentText.trim().length < 10) {
            validationIssues.push({
              field: 'document_text',
              issue: 'Missing or insufficient supporting documentation',
              confidence: 90,
              auto_correctable: false
            });
          }

          // Step 5: Check for common formatting issues that can be auto-corrected
          
          // Fix common diagnosis code formatting
          if (extractedData.diagnosis_info.code) {
            const originalCode = extractedData.diagnosis_info.code;
            let correctedCode = originalCode.toUpperCase().replace(/\s+/g, '');
            
            // Add decimal point if missing for detailed codes
            if (/^[A-Z]\d{3,6}$/.test(correctedCode) && correctedCode.length > 3) {
              correctedCode = correctedCode.substring(0, 3) + '.' + correctedCode.substring(3);
            }
            
            if (correctedCode !== originalCode) {
              validationIssues.push({
                field: 'diagnosis.code',
                issue: 'Diagnosis code formatting can be improved',
                confidence: 95,
                auto_correctable: true,
                suggested_fix: correctedCode
              });
            }
          }

          // Fix common service code formatting
          if (extractedData.service_info.code) {
            const originalCode = extractedData.service_info.code;
            const correctedCode = originalCode.replace(/\D/g, ''); // Remove non-digits
            
            if (correctedCode !== originalCode && correctedCode.length === 5) {
              validationIssues.push({
                field: 'service.code',
                issue: 'Service code formatting can be improved',
                confidence: 95,
                auto_correctable: true,
                suggested_fix: correctedCode
              });
            }
          }

        } else {
          validationIssues.push({
            field: 'priorAuthId',
            issue: 'Prior authorization not found in database',
            confidence: 100,
            auto_correctable: false
          });
        }

      } catch (dbError) {
        console.error('Database query error:', dbError);
        validationIssues.push({
          field: 'database',
          issue: 'Unable to fetch PA data from database',
          confidence: 100,
          auto_correctable: false
        });
      }
    }

    // Step 6: Calculate overall validation status
    const criticalIssues = validationIssues.filter(issue => 
      !issue.auto_correctable && issue.confidence >= 90
    );
    
    const isValid = criticalIssues.length === 0;

    const result: ValidationResult = {
      priorAuthId,
      is_valid: isValid,
      validation_issues: validationIssues,
      validation_issues_count: validationIssues.length,
      document_text: documentText,
      extracted_data: extractedData
    };

    console.log('Validation completed:', {
      priorAuthId,
      isValid,
      issuesCount: validationIssues.length,
      criticalIssuesCount: criticalIssues.length
    });

    return result;

  } catch (error) {
    console.error('Prior Auth validation error:', error);
    
    return {
      priorAuthId: event.priorAuthId,
      is_valid: false,
      validation_issues: [{
        field: 'system',
        issue: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 100,
        auto_correctable: false
      }],
      validation_issues_count: 1,
      document_text: '',
      extracted_data: {
        patient_info: {},
        provider_info: {},
        service_info: {},
        diagnosis_info: {}
      }
    };
  }
};