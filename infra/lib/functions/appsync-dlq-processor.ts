import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';

interface DLQMessage {
  apiId: string;
  apiType: 'GRAPHQL' | 'EVENT';
  requestId: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  operation?: string;
  errors: Array<{
    errorType: string;
    errorMessage: string;
    path?: string[];
  }>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hipaaRelevant: boolean;
  patientDataInvolved: boolean;
  stageName: string;
}

const snsClient = new SNSClient({});
const cloudWatchClient = new CloudWatchClient({});

const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN;
const STAGE_NAME = process.env.STAGE_NAME!;

export const handler: SQSHandler = async (event) => {
  console.log(`Processing ${event.Records.length} messages from DLQ`);

  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error(`Failed to process record: ${record.messageId}`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  // Send batch metrics
  await sendBatchMetrics(event.Records.length, batchItemFailures.length);

  return {
    batchItemFailures,
  };
};

async function processRecord(record: SQSRecord): Promise<void> {
  console.log(`Processing DLQ message: ${record.messageId}`);

  try {
    const dlqMessage: DLQMessage = JSON.parse(record.body);

    // Extract message attributes
    const errorType = record.messageAttributes?.ErrorType?.stringValue || 'UNKNOWN';
    const severity = record.messageAttributes?.Severity?.stringValue || 'LOW';
    const apiType = record.messageAttributes?.ApiType?.stringValue || 'UNKNOWN';
    const hipaaRelevant = record.messageAttributes?.HipaaRelevant?.stringValue === 'true';

    console.log(`Processing ${severity} error of type ${errorType} for ${apiType} API`);

    // Send metrics to CloudWatch
    await sendErrorMetrics(dlqMessage, errorType, severity, apiType);

    // Send detailed alert for critical errors or HIPAA-relevant errors
    if (severity === 'CRITICAL' || hipaaRelevant) {
      await sendDetailedAlert(dlqMessage);
    }

    // Log error patterns for analysis
    await logErrorPattern(dlqMessage);

    console.log(`Successfully processed DLQ message: ${record.messageId}`);
  } catch (error) {
    console.error(`Error processing record ${record.messageId}:`, error);
    console.error('Record body:', record.body);
    throw error;
  }
}

async function sendErrorMetrics(
  dlqMessage: DLQMessage,
  errorType: string,
  severity: string,
  apiType: string
): Promise<void> {
  const metrics = [
    {
      MetricName: 'DLQMessageProcessed',
      Value: 1,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'ApiType', Value: apiType },
        { Name: 'ErrorType', Value: errorType },
        { Name: 'Severity', Value: severity },
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
    {
      MetricName: 'HipaaRelevantErrors',
      Value: dlqMessage.hipaaRelevant ? 1 : 0,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'ApiType', Value: apiType },
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
    {
      MetricName: 'PatientDataErrors',
      Value: dlqMessage.patientDataInvolved ? 1 : 0,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'ApiType', Value: apiType },
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
  ];

  // Add organization-specific metrics if available
  if (dlqMessage.organizationId) {
    metrics.push({
      MetricName: 'OrganizationErrors',
      Value: 1,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'OrganizationId', Value: dlqMessage.organizationId },
        { Name: 'ApiType', Value: apiType },
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    });
  }

  const command = new PutMetricDataCommand({
    Namespace: 'ForesightRCM/APIErrors',
    MetricData: metrics,
  });

  try {
    await cloudWatchClient.send(command);
    console.log('Error metrics sent to CloudWatch');
  } catch (error) {
    console.error('Failed to send metrics to CloudWatch:', error);
    // Don't throw - we don't want metrics failures to break the main flow
  }
}

async function sendDetailedAlert(dlqMessage: DLQMessage): Promise<void> {
  if (!ALERT_TOPIC_ARN) {
    console.log('No alert topic configured, skipping detailed alert');
    return;
  }

  const alertDetails = {
    title: '🚨 Healthcare RCM API Error Processed from DLQ',
    summary: {
      apiType: dlqMessage.apiType,
      apiId: dlqMessage.apiId,
      severity: dlqMessage.severity,
      hipaaRelevant: dlqMessage.hipaaRelevant,
      patientDataInvolved: dlqMessage.patientDataInvolved,
      stageName: dlqMessage.stageName,
      timestamp: dlqMessage.timestamp,
    },
    errorDetails: {
      operation: dlqMessage.operation,
      userId: dlqMessage.userId,
      organizationId: dlqMessage.organizationId,
      errors: dlqMessage.errors.map(error => ({
        type: error.errorType,
        message: error.errorMessage,
        path: error.path,
      })),
    },
    recommendedActions: getRecommendedActions(dlqMessage),
    complianceNotes: dlqMessage.hipaaRelevant
      ? 'This error involves patient data and may require compliance review.'
      : 'No patient data involved in this error.',
  };

  const subject = `🚨 ${dlqMessage.severity} RCM API Error - DLQ Processing - ${STAGE_NAME}`;

  const command = new PublishCommand({
    TopicArn: ALERT_TOPIC_ARN,
    Subject: subject,
    Message: JSON.stringify(alertDetails, null, 2),
    MessageAttributes: {
      Severity: {
        DataType: 'String',
        StringValue: dlqMessage.severity,
      },
      ApiType: {
        DataType: 'String',
        StringValue: dlqMessage.apiType,
      },
      HipaaRelevant: {
        DataType: 'String',
        StringValue: dlqMessage.hipaaRelevant.toString(),
      },
      Source: {
        DataType: 'String',
        StringValue: 'DLQProcessor',
      },
    },
  });

  try {
    const result = await snsClient.send(command);
    console.log(`Detailed alert sent successfully, MessageId: ${result.MessageId}`);
  } catch (error) {
    console.error('Failed to send detailed alert:', error);
    // Don't throw - we don't want alerting failures to break the main flow
  }
}

async function logErrorPattern(dlqMessage: DLQMessage): Promise<void> {
  // Create structured log entry for error pattern analysis
  const errorPattern = {
    timestamp: dlqMessage.timestamp,
    apiType: dlqMessage.apiType,
    apiId: dlqMessage.apiId,
    operation: dlqMessage.operation,
    errorTypes: dlqMessage.errors.map(e => e.errorType),
    errorMessages: dlqMessage.errors.map(e => e.errorMessage),
    paths: dlqMessage.errors.flatMap(e => e.path || []),
    severity: dlqMessage.severity,
    hipaaRelevant: dlqMessage.hipaaRelevant,
    organizationId: dlqMessage.organizationId,
    userId: dlqMessage.userId,
    stageName: dlqMessage.stageName,
  };

  // Log with specific prefix for easy CloudWatch Insights queries
  console.log(`ERROR_PATTERN: ${JSON.stringify(errorPattern)}`);
}

async function sendBatchMetrics(totalRecords: number, failedRecords: number): Promise<void> {
  const metrics = [
    {
      MetricName: 'DLQBatchProcessed',
      Value: 1,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
    {
      MetricName: 'DLQRecordsProcessed',
      Value: totalRecords,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
    {
      MetricName: 'DLQRecordsFailed',
      Value: failedRecords,
      Unit: StandardUnit.Count,
      Dimensions: [
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
    {
      MetricName: 'DLQSuccessRate',
      Value: totalRecords > 0 ? ((totalRecords - failedRecords) / totalRecords) * 100 : 100,
      Unit: StandardUnit.Percent,
      Dimensions: [
        { Name: 'Stage', Value: STAGE_NAME },
      ],
    },
  ];

  const command = new PutMetricDataCommand({
    Namespace: 'ForesightRCM/DLQProcessing',
    MetricData: metrics,
  });

  try {
    await cloudWatchClient.send(command);
    console.log('Batch processing metrics sent to CloudWatch');
  } catch (error) {
    console.error('Failed to send batch metrics:', error);
  }
}

function getRecommendedActions(dlqMessage: DLQMessage): string[] {
  const actions = [];

  // General recommendations based on error type
  const primaryError = dlqMessage.errors[0];
  if (primaryError) {
    switch (primaryError.errorType) {
      case 'RdsDataException':
      case 'DynamoDbException':
        actions.push(
          'Check database connectivity and permissions',
          'Review database performance metrics',
          'Verify RDS Data API configuration'
        );
        break;

      case 'UnauthorizedException':
      case 'AccessDeniedException':
        actions.push(
          'Verify user authentication and authorization',
          'Check OIDC/JWT token validity',
          'Review IAM permissions for the operation'
        );
        break;

      case 'ValidationException':
        actions.push(
          'Review input validation rules',
          'Check GraphQL schema constraints',
          'Verify required fields are provided'
        );
        break;

      default:
        actions.push(
          'Review CloudWatch logs for detailed error information',
          'Check API monitoring dashboards'
        );
    }
  }

  // HIPAA-specific recommendations
  if (dlqMessage.hipaaRelevant) {
    actions.push(
      'Document error in compliance audit log',
      'Review if patient data exposure occurred',
      'Consider breach notification requirements if applicable'
    );
  }

  // Critical error recommendations
  if (dlqMessage.severity === 'CRITICAL') {
    actions.push(
      'Escalate to on-call engineer immediately',
      'Check system health dashboards',
      'Consider enabling circuit breaker if pattern detected'
    );
  }

  return actions;
}
