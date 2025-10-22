import { Handler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface AppSyncError {
  errorType: string;
  errorMessage: string;
  path: string[];
  locations: Array<{
    line: number;
    column: number;
  }>;
  extensions?: {
    code?: string;
    exception?: {
      stacktrace?: string[];
    };
  };
}

interface ErrorEvent {
  apiId: string;
  apiType: 'GRAPHQL' | 'EVENT';
  requestId: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  operation?: string;
  variables?: Record<string, any>;
  errors: AppSyncError[];
  metadata?: Record<string, any>;
}

const sqsClient = new SQSClient({});
const snsClient = new SNSClient({});

const APPSYNC_DLQ_URL = process.env.APPSYNC_DLQ_URL!;
const EVENT_API_DLQ_URL = process.env.EVENT_API_DLQ_URL!;
const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN;
const STAGE_NAME = process.env.STAGE_NAME!;

export const handler: Handler = async (event: ErrorEvent) => {
  console.log('Processing API error event:', JSON.stringify(event, null, 2));

  try {
    // Determine which DLQ to use based on API type
    const dlqUrl = event.apiType === 'GRAPHQL' ? APPSYNC_DLQ_URL : EVENT_API_DLQ_URL;
    
    // Enrich error event with additional metadata
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      stageName: STAGE_NAME,
      severity: determineSeverity(event.errors),
      patientDataInvolved: checkForPatientData(event),
      hipaaRelevant: isHipaaRelevant(event),
    };

    // Send to appropriate DLQ
    await sendToDLQ(dlqUrl, enrichedEvent);

    // Send alert if critical error
    if (enrichedEvent.severity === 'CRITICAL' || enrichedEvent.hipaaRelevant) {
      await sendAlert(enrichedEvent);
    }

    // Log for CloudWatch
    console.log(`Error processed successfully. Severity: ${enrichedEvent.severity}, HIPAA Relevant: ${enrichedEvent.hipaaRelevant}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Error processed successfully',
        dlqUrl: dlqUrl,
        severity: enrichedEvent.severity,
      }),
    };
  } catch (error) {
    console.error('Failed to process API error:', error);
    
    // Log to CloudWatch for debugging
    console.error('Original event:', JSON.stringify(event, null, 2));
    
    throw error;
  }
};

async function sendToDLQ(dlqUrl: string, errorEvent: any): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: dlqUrl,
    MessageBody: JSON.stringify(errorEvent),
    MessageAttributes: {
      ErrorType: {
        DataType: 'String',
        StringValue: errorEvent.errors[0]?.errorType || 'UNKNOWN',
      },
      Severity: {
        DataType: 'String',
        StringValue: errorEvent.severity,
      },
      ApiType: {
        DataType: 'String',
        StringValue: errorEvent.apiType,
      },
      HipaaRelevant: {
        DataType: 'String',
        StringValue: errorEvent.hipaaRelevant.toString(),
      },
      Timestamp: {
        DataType: 'String',
        StringValue: errorEvent.timestamp,
      },
    },
  });

  try {
    const result = await sqsClient.send(command);
    console.log(`Message sent to DLQ: ${dlqUrl}, MessageId: ${result.MessageId}`);
  } catch (error) {
    console.error(`Failed to send message to DLQ: ${dlqUrl}`, error);
    throw error;
  }
}

async function sendAlert(errorEvent: any): Promise<void> {
  if (!ALERT_TOPIC_ARN) {
    console.log('No alert topic configured, skipping alert');
    return;
  }

  const alertMessage = {
    severity: errorEvent.severity,
    apiType: errorEvent.apiType,
    apiId: errorEvent.apiId,
    errorType: errorEvent.errors[0]?.errorType,
    errorMessage: errorEvent.errors[0]?.errorMessage,
    operation: errorEvent.operation,
    userId: errorEvent.userId,
    organizationId: errorEvent.organizationId,
    timestamp: errorEvent.timestamp,
    stageName: STAGE_NAME,
    hipaaRelevant: errorEvent.hipaaRelevant,
    patientDataInvolved: errorEvent.patientDataInvolved,
  };

  const subject = `🚨 ${errorEvent.severity} Healthcare RCM API Error - ${STAGE_NAME}`;
  
  const command = new PublishCommand({
    TopicArn: ALERT_TOPIC_ARN,
    Subject: subject,
    Message: JSON.stringify(alertMessage, null, 2),
    MessageAttributes: {
      Severity: {
        DataType: 'String',
        StringValue: errorEvent.severity,
      },
      ApiType: {
        DataType: 'String',
        StringValue: errorEvent.apiType,
      },
      HipaaRelevant: {
        DataType: 'String',
        StringValue: errorEvent.hipaaRelevant.toString(),
      },
    },
  });

  try {
    const result = await snsClient.send(command);
    console.log(`Alert sent successfully, MessageId: ${result.MessageId}`);
  } catch (error) {
    console.error('Failed to send alert:', error);
    // Don't throw here - we don't want alerting failures to break the main flow
  }
}

function determineSeverity(errors: AppSyncError[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  for (const error of errors) {
    // Critical errors that affect patient data or system integrity
    if (
      error.errorType === 'DynamoDbException' ||
      error.errorType === 'RdsDataException' ||
      error.errorMessage?.includes('database') ||
      error.errorMessage?.includes('patient') ||
      error.errorMessage?.includes('claim') ||
      error.errorMessage?.includes('prior_auth')
    ) {
      return 'CRITICAL';
    }

    // High severity for authentication/authorization issues
    if (
      error.errorType === 'UnauthorizedException' ||
      error.errorType === 'AccessDeniedException' ||
      error.errorMessage?.includes('unauthorized') ||
      error.errorMessage?.includes('forbidden')
    ) {
      return 'HIGH';
    }

    // Medium severity for validation errors
    if (
      error.errorType === 'ValidationException' ||
      error.errorType === 'BadRequestException' ||
      error.errorMessage?.includes('validation')
    ) {
      return 'MEDIUM';
    }
  }

  return 'LOW';
}

function checkForPatientData(event: ErrorEvent): boolean {
  const eventString = JSON.stringify(event).toLowerCase();
  
  // Check for patient-related operations
  const patientKeywords = [
    'patient',
    'mrn',
    'claim',
    'prior_auth',
    'diagnosis',
    'treatment',
    'medical',
    'hipaa',
    'phi',
  ];

  return patientKeywords.some(keyword => eventString.includes(keyword));
}

function isHipaaRelevant(event: ErrorEvent): boolean {
  // Any error involving patient data is HIPAA relevant
  if (checkForPatientData(event)) {
    return true;
  }

  // Check operation paths for healthcare-specific operations
  const healthcareOperations = [
    'getpatient',
    'createpatient',
    'updatepatient',
    'getclaim',
    'updateclaimstatus',
    'createpriorauth',
    'getrealtimemetrics',
  ];

  const operation = event.operation?.toLowerCase();
  const paths = event.errors.flatMap(error => error.path || []).map(p => p.toString().toLowerCase());

  return healthcareOperations.some(op => 
    operation?.includes(op) || paths.some(path => path.includes(op))
  );
}