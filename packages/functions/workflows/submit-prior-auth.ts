import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

interface SubmissionConfig {
  payer_id: string;
  submission_method: 'api' | 'fax' | 'portal' | 'email';
  endpoint_url?: string;
  credentials?: {
    username: string;
    password: string;
    api_key?: string;
  };
  submission_format: 'x12_278' | 'pdf' | 'json' | 'xml';
  retry_attempts: number;
  timeout_seconds: number;
}

interface SubmissionPayload {
  transaction_id: string;
  submission_type: 'initial' | 'resubmission' | 'appeal';
  priority: 'routine' | 'urgent' | 'stat';
  prior_auth_data: {
    member_info: any;
    provider_info: any;
    service_info: any;
    clinical_info: any;
    attachments?: any[];
  };
  submission_timestamp: string;
}

interface SubmissionResult {
  priorAuthId: string;
  submission_id: string;
  submission_status: 'submitted' | 'failed' | 'pending_retry';
  confirmation_number?: string;
  payer_response?: any;
  submission_timestamp: string;
  expected_response_time: string;
  retry_count: number;
  error_details?: string;
  next_action: 'await_response' | 'retry_submission' | 'manual_intervention';
}

const rdsClient = new RDSDataClient({ region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' });
const sqsClient = new SQSClient({ region: process.env.COMPREHEND_MEDICAL_REGION || 'us-east-1' });

// Common payer configurations
const PAYER_CONFIGS: Record<string, SubmissionConfig> = {
  'ANTHEM': {
    payer_id: 'ANTHEM',
    submission_method: 'api',
    endpoint_url: 'https://api.anthem.com/prior-auth',
    submission_format: 'json',
    retry_attempts: 3,
    timeout_seconds: 30
  },
  'AETNA': {
    payer_id: 'AETNA',
    submission_method: 'api',
    endpoint_url: 'https://api.aetna.com/authorization',
    submission_format: 'x12_278',
    retry_attempts: 3,
    timeout_seconds: 45
  },
  'CIGNA': {
    payer_id: 'CIGNA',
    submission_method: 'portal',
    endpoint_url: 'https://portal.cigna.com/prior-auth',
    submission_format: 'pdf',
    retry_attempts: 2,
    timeout_seconds: 60
  },
  'UNITED_HEALTHCARE': {
    payer_id: 'UNITED_HEALTHCARE',
    submission_method: 'api',
    endpoint_url: 'https://api.uhc.com/prior-authorization',
    submission_format: 'json',
    retry_attempts: 3,
    timeout_seconds: 30
  },
  'DEFAULT': {
    payer_id: 'DEFAULT',
    submission_method: 'fax',
    submission_format: 'pdf',
    retry_attempts: 2,
    timeout_seconds: 120
  }
};

export const handler = async (event: any): Promise<SubmissionResult> => {
  console.log('Submitting prior authorization:', JSON.stringify(event, null, 2));

  try {
    const { 
      priorAuthId, 
      auto_submit = false,
      submission_type = 'initial',
      priority = 'routine',
      retry_count = 0
    } = event;

    // Step 1: Fetch complete PA data
    const paData = await fetchCompletePAData(priorAuthId);
    if (!paData) {
      throw new Error('Prior authorization data not found');
    }

    // Step 2: Determine payer and submission configuration
    const payerId = await determinePayerId(paData.patient_info?.insurance_id, paData.organization_id);
    const submissionConfig = PAYER_CONFIGS[payerId] || PAYER_CONFIGS['DEFAULT'];

    // Step 3: Validate submission readiness
    const validationResult = await validateSubmissionReadiness(paData);
    if (!validationResult.ready && !auto_submit) {
      return {
        priorAuthId,
        submission_id: '',
        submission_status: 'failed',
        submission_timestamp: new Date().toISOString(),
        expected_response_time: '',
        retry_count,
        error_details: `Submission validation failed: ${validationResult.issues.join(', ')}`,
        next_action: 'manual_intervention'
      };
    }

    // Step 4: Prepare submission payload
    const submissionPayload = await prepareSubmissionPayload(
      paData,
      submission_type,
      priority,
      submissionConfig
    );

    // Step 5: Submit to payer
    console.log(`Submitting to ${payerId} via ${submissionConfig.submission_method}...`);
    const submissionResponse = await submitToPayer(submissionPayload, submissionConfig);

    // Step 6: Process submission response
    const result = await processSubmissionResponse(
      priorAuthId,
      submissionResponse,
      submissionConfig,
      retry_count
    );

    // Step 7: Update database with submission status
    await updateSubmissionStatus(priorAuthId, result, submissionPayload);

    // Step 8: Schedule follow-up if needed
    if (result.submission_status === 'submitted') {
      await scheduleFollowUp(priorAuthId, result.expected_response_time);
    }

    console.log('Prior auth submission completed:', {
      priorAuthId,
      submissionId: result.submission_id,
      status: result.submission_status,
      payerId,
      method: submissionConfig.submission_method
    });

    return result;

  } catch (error) {
    console.error('Prior auth submission error:', error);
    
    return {
      priorAuthId: event.priorAuthId,
      submission_id: '',
      submission_status: 'failed',
      submission_timestamp: new Date().toISOString(),
      expected_response_time: '',
      retry_count: event.retry_count || 0,
      error_details: `Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      next_action: 'manual_intervention'
    };
  }
};

async function fetchCompletePAData(priorAuthId: string): Promise<any> {
  try {
    const query = `
      SELECT 
        pa.id, pa.patient_id, pa.provider_id, pa.organization_id,
        pa.service_code, pa.diagnosis_code, pa.document_text,
        pa.status, pa.created_at,
        p.first_name, p.last_name, p.date_of_birth, p.gender,
        p.address, p.city, p.state, p.zip_code, p.phone,
        p.insurance_id, p.insurance_plan, p.group_number,
        pr.npi, pr.name as provider_name, pr.specialty,
        pr.address as provider_address, pr.phone as provider_phone,
        pr.fax as provider_fax,
        o.name as organization_name, o.npi as organization_npi
      FROM prior_authorizations pa
      LEFT JOIN patients p ON pa.patient_id = p.id
      LEFT JOIN providers pr ON pa.provider_id = pr.id
      LEFT JOIN organizations o ON pa.organization_id = o.id
      WHERE pa.id = :priorAuthId
    `;

    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: query,
      parameters: [
        { name: 'priorAuthId', value: { stringValue: priorAuthId } }
      ]
    }));

    if (result.records && result.records.length > 0) {
      const record = result.records[0];
      
      return {
        id: record[0]?.stringValue,
        patient_id: record[1]?.stringValue,
        provider_id: record[2]?.stringValue,
        organization_id: record[3]?.stringValue,
        service_code: record[4]?.stringValue,
        diagnosis_code: record[5]?.stringValue,
        document_text: record[6]?.stringValue,
        status: record[7]?.stringValue,
        created_at: record[8]?.stringValue,
        patient_info: {
          first_name: record[9]?.stringValue,
          last_name: record[10]?.stringValue,
          date_of_birth: record[11]?.stringValue,
          gender: record[12]?.stringValue,
          address: record[13]?.stringValue,
          city: record[14]?.stringValue,
          state: record[15]?.stringValue,
          zip_code: record[16]?.stringValue,
          phone: record[17]?.stringValue,
          insurance_id: record[18]?.stringValue,
          insurance_plan: record[19]?.stringValue,
          group_number: record[20]?.stringValue
        },
        provider_info: {
          npi: record[21]?.stringValue,
          name: record[22]?.stringValue,
          specialty: record[23]?.stringValue,
          address: record[24]?.stringValue,
          phone: record[25]?.stringValue,
          fax: record[26]?.stringValue
        },
        organization_info: {
          name: record[27]?.stringValue,
          npi: record[28]?.stringValue
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch PA data:', error);
    return null;
  }
}

async function determinePayerId(insuranceId: string, organizationId: string): Promise<string> {
  if (!insuranceId) return 'DEFAULT';

  // Extract payer from insurance ID patterns
  const insuranceUpper = insuranceId.toUpperCase();
  
  if (insuranceUpper.includes('ANTHEM') || insuranceUpper.startsWith('ANT')) {
    return 'ANTHEM';
  }
  if (insuranceUpper.includes('AETNA') || insuranceUpper.startsWith('AET')) {
    return 'AETNA';
  }
  if (insuranceUpper.includes('CIGNA') || insuranceUpper.startsWith('CIG')) {
    return 'CIGNA';
  }
  if (insuranceUpper.includes('UNITED') || insuranceUpper.includes('UHC') || insuranceUpper.startsWith('UNH')) {
    return 'UNITED_HEALTHCARE';
  }

  // Could also check against a payer mapping table in database
  try {
    const payerQuery = `
      SELECT payer_id FROM payer_mappings 
      WHERE insurance_prefix = :prefix OR insurance_name LIKE :pattern
      LIMIT 1
    `;

    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: payerQuery,
      parameters: [
        { name: 'prefix', value: { stringValue: insuranceId.substring(0, 3) } },
        { name: 'pattern', value: { stringValue: `%${insuranceId.substring(0, 5)}%` } }
      ]
    }));

    if (result.records && result.records.length > 0) {
      return result.records[0][0]?.stringValue || 'DEFAULT';
    }
  } catch (error) {
    console.warn('Failed to lookup payer mapping:', error);
  }

  return 'DEFAULT';
}

async function validateSubmissionReadiness(paData: any): Promise<{ ready: boolean; issues: string[]; }> {
  const issues: string[] = [];

  // Required patient information
  if (!paData.patient_info?.first_name) issues.push('Missing patient first name');
  if (!paData.patient_info?.last_name) issues.push('Missing patient last name');
  if (!paData.patient_info?.date_of_birth) issues.push('Missing patient date of birth');
  if (!paData.patient_info?.insurance_id) issues.push('Missing patient insurance ID');

  // Required provider information
  if (!paData.provider_info?.npi) issues.push('Missing provider NPI');
  if (!paData.provider_info?.name) issues.push('Missing provider name');

  // Required service information
  if (!paData.service_code) issues.push('Missing service/procedure code');
  if (!paData.diagnosis_code) issues.push('Missing diagnosis code');

  // Required documentation
  if (!paData.document_text || paData.document_text.length < 50) {
    issues.push('Insufficient supporting documentation');
  }

  // Code format validation
  if (paData.service_code && !/^\d{5}$/.test(paData.service_code)) {
    issues.push('Invalid CPT code format');
  }
  
  if (paData.diagnosis_code && !/^[A-Z]\d{2}(\.\d{1,4})?$/.test(paData.diagnosis_code)) {
    issues.push('Invalid ICD-10 code format');
  }

  return {
    ready: issues.length === 0,
    issues
  };
}

async function prepareSubmissionPayload(
  paData: any,
  submissionType: string,
  priority: string,
  config: SubmissionConfig
): Promise<SubmissionPayload> {
  const transactionId = `PA_${paData.id}_${Date.now()}`;

  const payload: SubmissionPayload = {
    transaction_id: transactionId,
    submission_type: submissionType as any,
    priority: priority as any,
    prior_auth_data: {
      member_info: {
        member_id: paData.patient_info.insurance_id,
        first_name: paData.patient_info.first_name,
        last_name: paData.patient_info.last_name,
        date_of_birth: paData.patient_info.date_of_birth,
        gender: paData.patient_info.gender,
        address: {
          street: paData.patient_info.address,
          city: paData.patient_info.city,
          state: paData.patient_info.state,
          zip: paData.patient_info.zip_code
        },
        phone: paData.patient_info.phone,
        insurance_plan: paData.patient_info.insurance_plan,
        group_number: paData.patient_info.group_number
      },
      provider_info: {
        npi: paData.provider_info.npi,
        name: paData.provider_info.name,
        specialty: paData.provider_info.specialty,
        address: paData.provider_info.address,
        phone: paData.provider_info.phone,
        fax: paData.provider_info.fax
      },
      service_info: {
        procedure_code: paData.service_code,
        diagnosis_code: paData.diagnosis_code,
        service_date_requested: new Date().toISOString().split('T')[0],
        quantity: 1,
        service_description: await getServiceDescription(paData.service_code)
      },
      clinical_info: {
        clinical_notes: paData.document_text,
        medical_necessity_justification: extractMedicalNecessity(paData.document_text),
        diagnosis_description: await getDiagnosisDescription(paData.diagnosis_code)
      }
    },
    submission_timestamp: new Date().toISOString()
  };

  return payload;
}

async function submitToPayer(
  payload: SubmissionPayload,
  config: SubmissionConfig
): Promise<any> {
  switch (config.submission_method) {
    case 'api':
      return await submitViaAPI(payload, config);
    case 'fax':
      return await submitViaFax(payload, config);
    case 'portal':
      return await submitViaPortal(payload, config);
    case 'email':
      return await submitViaEmail(payload, config);
    default:
      throw new Error(`Unsupported submission method: ${config.submission_method}`);
  }
}

async function submitViaAPI(payload: SubmissionPayload, config: SubmissionConfig): Promise<any> {
  // Mock API submission - in real implementation, this would call the payer's API
  console.log(`Submitting to ${config.endpoint_url} via API...`);
  
  // Simulate API call with timeout
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful submission
  const confirmationNumber = `CONF_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  return {
    success: true,
    confirmation_number: confirmationNumber,
    response_time: new Date().toISOString(),
    expected_decision_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    payer_reference_id: `PAY_${confirmationNumber}`,
    submission_format: config.submission_format,
    api_response: {
      status: 'received',
      message: 'Prior authorization request received and is being processed'
    }
  };
}

async function submitViaFax(payload: SubmissionPayload, config: SubmissionConfig): Promise<any> {
  // Mock fax submission
  console.log('Preparing fax submission...');
  
  // In real implementation, this would:
  // 1. Generate PDF from payload
  // 2. Send via fax service (e.g., RingCentral Fax, eFax API)
  // 3. Return fax confirmation
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const confirmationNumber = `FAX_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  return {
    success: true,
    confirmation_number: confirmationNumber,
    response_time: new Date().toISOString(),
    expected_decision_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days for fax
    submission_format: 'pdf',
    fax_details: {
      fax_number: '1-800-FAX-PAYER',
      pages_sent: 3,
      transmission_id: confirmationNumber
    }
  };
}

async function submitViaPortal(payload: SubmissionPayload, config: SubmissionConfig): Promise<any> {
  // Mock portal submission
  console.log('Submitting via payer portal...');
  
  // In real implementation, this would:
  // 1. Authenticate with payer portal
  // 2. Fill out web forms programmatically
  // 3. Upload documents
  // 4. Submit and capture confirmation
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const confirmationNumber = `POR_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  return {
    success: true,
    confirmation_number: confirmationNumber,
    response_time: new Date().toISOString(),
    expected_decision_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
    submission_format: config.submission_format,
    portal_details: {
      portal_url: config.endpoint_url,
      case_number: confirmationNumber,
      status_check_url: `${config.endpoint_url}/status/${confirmationNumber}`
    }
  };
}

async function submitViaEmail(payload: SubmissionPayload, config: SubmissionConfig): Promise<any> {
  // Mock email submission
  console.log('Preparing email submission...');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const confirmationNumber = `EML_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  return {
    success: true,
    confirmation_number: confirmationNumber,
    response_time: new Date().toISOString(),
    expected_decision_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days for email
    submission_format: 'pdf',
    email_details: {
      recipient: 'prior-auth@payer.com',
      subject: `Prior Authorization Request - ${payload.transaction_id}`,
      message_id: confirmationNumber
    }
  };
}

async function processSubmissionResponse(
  priorAuthId: string,
  response: any,
  config: SubmissionConfig,
  retryCount: number
): Promise<SubmissionResult> {
  if (response.success) {
    return {
      priorAuthId,
      submission_id: response.confirmation_number,
      submission_status: 'submitted',
      confirmation_number: response.confirmation_number,
      payer_response: response,
      submission_timestamp: response.response_time,
      expected_response_time: response.expected_decision_time,
      retry_count: retryCount,
      next_action: 'await_response'
    };
  } else {
    const shouldRetry = retryCount < config.retry_attempts;
    
    return {
      priorAuthId,
      submission_id: '',
      submission_status: shouldRetry ? 'pending_retry' : 'failed',
      submission_timestamp: new Date().toISOString(),
      expected_response_time: '',
      retry_count: retryCount,
      error_details: response.error || 'Submission failed',
      next_action: shouldRetry ? 'retry_submission' : 'manual_intervention'
    };
  }
}

async function updateSubmissionStatus(
  priorAuthId: string,
  result: SubmissionResult,
  payload: SubmissionPayload
): Promise<void> {
  try {
    // Update PA status
    const updateQuery = `
      UPDATE prior_authorizations 
      SET 
        status = :status,
        submission_id = :submissionId,
        submitted_at = :submittedAt,
        expected_response_date = :expectedResponse,
        last_modified = NOW()
      WHERE id = :priorAuthId
    `;

    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: updateQuery,
      parameters: [
        { name: 'status', value: { stringValue: result.submission_status } },
        { name: 'submissionId', value: { stringValue: result.submission_id } },
        { name: 'submittedAt', value: { stringValue: result.submission_timestamp } },
        { name: 'expectedResponse', value: { stringValue: result.expected_response_time } },
        { name: 'priorAuthId', value: { stringValue: priorAuthId } }
      ]
    }));

    // Log submission details
    const logQuery = `
      INSERT INTO prior_auth_submissions 
      (prior_auth_id, submission_id, transaction_id, submission_method, submission_status, 
       confirmation_number, payer_response, retry_count, created_at)
      VALUES (:priorAuthId, :submissionId, :transactionId, :method, :status, 
              :confirmationNumber, :payerResponse, :retryCount, NOW())
    `;

    await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: logQuery,
      parameters: [
        { name: 'priorAuthId', value: { stringValue: priorAuthId } },
        { name: 'submissionId', value: { stringValue: result.submission_id } },
        { name: 'transactionId', value: { stringValue: payload.transaction_id } },
        { name: 'method', value: { stringValue: 'api' } }, // Would use actual method
        { name: 'status', value: { stringValue: result.submission_status } },
        { name: 'confirmationNumber', value: { stringValue: result.confirmation_number || '' } },
        { name: 'payerResponse', value: { stringValue: JSON.stringify(result.payer_response || {}) } },
        { name: 'retryCount', value: { longValue: result.retry_count } }
      ]
    }));

  } catch (error) {
    console.error('Failed to update submission status:', error);
  }
}

async function scheduleFollowUp(priorAuthId: string, expectedResponseTime: string): Promise<void> {
  try {
    // Schedule follow-up via SQS for status checking
    const followUpMessage = {
      action: 'check_pa_status',
      priorAuthId,
      scheduledFor: expectedResponseTime,
      type: 'submission_follow_up'
    };

    const queueUrl = process.env.FOLLOW_UP_QUEUE_URL;
    if (queueUrl) {
      // Calculate delay in seconds (max 15 minutes for SQS, would use EventBridge for longer delays)
      const delay = Math.min(900, Math.max(0, 
        (new Date(expectedResponseTime).getTime() - Date.now()) / 1000
      ));

      await sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(followUpMessage),
        DelaySeconds: Math.floor(delay)
      }));

      console.log(`Scheduled follow-up for PA ${priorAuthId} in ${delay} seconds`);
    }
  } catch (error) {
    console.warn('Failed to schedule follow-up:', error);
  }
}

async function getServiceDescription(serviceCode: string): Promise<string> {
  try {
    const query = `
      SELECT description FROM cpt_codes WHERE code = :code LIMIT 1
    `;

    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: query,
      parameters: [
        { name: 'code', value: { stringValue: serviceCode } }
      ]
    }));

    return result.records?.[0]?.[0]?.stringValue || 'Service description not available';
  } catch (error) {
    return 'Service description not available';
  }
}

async function getDiagnosisDescription(diagnosisCode: string): Promise<string> {
  try {
    const query = `
      SELECT description FROM icd10_codes WHERE code = :code LIMIT 1
    `;

    const result = await rdsClient.send(new ExecuteStatementCommand({
      resourceArn: process.env.DATABASE_CLUSTER_ARN,
      secretArn: process.env.DATABASE_SECRET_ARN,
      database: process.env.DATABASE_NAME,
      sql: query,
      parameters: [
        { name: 'code', value: { stringValue: diagnosisCode } }
      ]
    }));

    return result.records?.[0]?.[0]?.stringValue || 'Diagnosis description not available';
  } catch (error) {
    return 'Diagnosis description not available';
  }
}

function extractMedicalNecessity(documentText: string): string {
  const text = documentText.toLowerCase();
  
  // Look for medical necessity statements
  const necessityKeywords = [
    'medically necessary',
    'clinically indicated',
    'medical necessity',
    'physician recommends',
    'treatment necessary'
  ];

  for (const keyword of necessityKeywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      // Extract surrounding context
      const start = Math.max(0, index - 100);
      const end = Math.min(documentText.length, index + 200);
      return documentText.substring(start, end).trim();
    }
  }

  // If no specific necessity statement, return first paragraph
  const firstParagraph = documentText.split('\n\n')[0];
  return firstParagraph.length > 20 ? firstParagraph : documentText.substring(0, 200);
}