import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

interface AuditLogEntry {
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private readonly client: CloudWatchLogsClient;
  private readonly logGroupName: string;
  private readonly logStreamName: string;

  constructor() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Missing required AWS environment variables');
    }

    this.client = new CloudWatchLogsClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.logGroupName = `/aws/rcm/${process.env.STAGE ?? 'staging'}/credential-operations`;
    this.logStreamName = `${new Date().toISOString().split('T')[0]}-${process.env.INSTANCE_ID ?? 'default'}`;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const timestamp = entry.timestamp ?? new Date();

      const logEntry = {
        timestamp: timestamp.toISOString(),
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        details: entry.details ?? {},
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        environment: process.env.STAGE ?? 'staging',
        version: '1.0',
      };

      const message = JSON.stringify(logEntry);

      const command = new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [
          {
            timestamp: timestamp.getTime(),
            message,
          },
        ],
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error writing audit log:', error);
      // Don't throw error to avoid breaking the main application flow
      // Instead, log to console for debugging
      console.error('Audit log entry that failed:', entry);
    }
  }

  async logCredentialOperation(
    organizationId: string,
    userId: string,
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'VALIDATE',
    credentialId: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: `CREDENTIALS_${operation}`,
      resourceType: 'external_service_credentials',
      resourceId: credentialId,
      details: {
        operation,
        ...details,
      },
    });
  }

  async logSecretOperation(
    organizationId: string,
    userId: string,
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    secretArn: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: `SECRETS_${operation}`,
      resourceType: 'aws_secret',
      resourceId: secretArn,
      details: {
        operation,
        ...details,
      },
    });
  }

  async logValidationAttempt(
    organizationId: string,
    userId: string,
    credentialId: string,
    serviceName: string,
    isValid: boolean,
    error?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: 'CREDENTIALS_VALIDATION_ATTEMPT',
      resourceType: 'external_service_credentials',
      resourceId: credentialId,
      details: {
        serviceName,
        isValid,
        error: error ?? null,
        validationTimestamp: new Date().toISOString(),
      },
    });
  }

  async logCredentialUsage(
    organizationId: string,
    userId: string,
    credentialId: string,
    serviceName: string,
    operation: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: 'CREDENTIALS_USAGE',
      resourceType: 'external_service_credentials',
      resourceId: credentialId,
      details: {
        serviceName,
        operation,
        success,
        usageTimestamp: new Date().toISOString(),
        ...details,
      },
    });
  }

  async logSecurityEvent(
    organizationId: string,
    userId: string,
    eventType: 'UNAUTHORIZED_ACCESS' | 'CREDENTIAL_COMPROMISE' | 'VALIDATION_FAILURE' | 'SUSPICIOUS_ACTIVITY',
    description: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: `SECURITY_EVENT_${eventType}`,
      resourceType: 'security_event',
      details: {
        eventType,
        description,
        severity: this.getSeverityLevel(eventType),
        ...details,
      },
    });
  }

  private getSeverityLevel(eventType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (eventType) {
      case 'UNAUTHORIZED_ACCESS':
      case 'CREDENTIAL_COMPROMISE':
        return 'CRITICAL';
      case 'SUSPICIOUS_ACTIVITY':
        return 'HIGH';
      case 'VALIDATION_FAILURE':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }
}
