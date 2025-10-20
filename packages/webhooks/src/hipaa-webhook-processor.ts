import { eq, and, sql } from 'drizzle-orm';
import { WebhookHipaaComplianceManager, PhiDataClassifier } from './hipaa-compliance';
import { PhiEncryptionManager, PhiFieldDetector } from './phi-encryption';
import type { DatabaseWrapper, HipaaComplianceStatus, PhiDataClassification } from './types';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { createHmac } from 'node:crypto';

/**
 * HIPAA-Compliant Webhook Processor
 * Handles webhook delivery with PHI protection and compliance validation
 */
export class HipaaWebhookProcessor {
  private readonly complianceManager: WebhookHipaaComplianceManager;
  private readonly encryptionManager?: PhiEncryptionManager;
  private readonly databaseWrapper: DatabaseWrapper;
  private readonly secretsClient: SecretsManagerClient;

  constructor(
    organizationId: string,
    databaseWrapper: DatabaseWrapper,
    userId?: string,
    kmsKeyId?: string
  ) {
    this.databaseWrapper = databaseWrapper;
    this.complianceManager = new WebhookHipaaComplianceManager(organizationId, databaseWrapper, userId);
    this.secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

    if (kmsKeyId) {
      this.encryptionManager = new PhiEncryptionManager(kmsKeyId);
    }
  }

  /**
   * Process webhook delivery with HIPAA compliance
   */
  async processWebhookDelivery(webhookConfigId: string, eventData: any): Promise<{
    success: boolean;
    deliveryId?: string;
    complianceStatus: HipaaComplianceStatus;
    issues: string[];
    auditLogId?: string;
  }> {
    const issues: string[] = [];

    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Step 1: Get webhook configuration with HIPAA settings
      const { webhookConfigs } = this.databaseWrapper.schemas;
      const { data: webhook } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          id: webhookConfigs.id,
          name: webhookConfigs.name,
          url: webhookConfigs.url,
          organizationId: webhookConfigs.organizationId,
          environment: webhookConfigs.environment,
          phiDataClassification: webhookConfigs.phiDataClassification,
          hipaaComplianceStatus: webhookConfigs.hipaaComplianceStatus,
          requiresEncryption: webhookConfigs.requiresEncryption,
          timeoutSeconds: webhookConfigs.timeoutSeconds,
          isActive: webhookConfigs.isActive,
          baaSignedDate: webhookConfigs.baaSignedDate,
          baaExpiryDate: webhookConfigs.baaExpiryDate,
        })
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, webhookConfigId))
      );

      if (!webhook || webhook.length === 0) {
        return {
          success: false,
          complianceStatus: 'non_compliant' as HipaaComplianceStatus,
          issues: ['Webhook configuration not found'],
        };
      }

      const webhookData = webhook[0] as {
        id: string;
        name: string;
        url: string;
        organizationId: string;
        environment: 'staging' | 'production';
        phiDataClassification: PhiDataClassification;
        hipaaComplianceStatus: 'compliant' | 'pending' | 'non_compliant';
        requiresEncryption: boolean;
        timeoutSeconds: number;
        isActive: boolean;
        baaSignedDate: Date | null;
        baaExpiryDate: Date | null;
      };

      if (!webhookData.isActive) {
        return {
          success: false,
          complianceStatus: 'non_compliant' as HipaaComplianceStatus,
          issues: ['Webhook is not active'],
        };
      }

      // Step 2: Analyze event data for PHI content
      const dataClassification = this.complianceManager.classifyEventData(eventData);
      const phiTypes = this.complianceManager.extractPhiTypes(eventData);
      const entityIds = this.complianceManager.extractEntityIds(eventData);

      // Step 3: HIPAA compliance validation
      const complianceCheck = await this.complianceManager.checkWebhookCompliance(
        webhookConfigId,
        dataClassification
      );

      if (!complianceCheck.compliant) {
        // Log compliance violation
        await this.complianceManager.logHipaaAuditEvent({
          webhookConfigId,
          auditEventType: 'phi_accessed',
          dataClassification,
          phiDataTypes: phiTypes,
          entityIds,
          baaVerified: false,
          riskLevel: 'critical',
          complianceStatus: 'violation',
        });

        return {
          success: false,
          complianceStatus: 'non_compliant' as HipaaComplianceStatus,
          issues: complianceCheck.blockers,
        };
      }

      // Step 4: Prepare payload with encryption if needed
      let processedPayload = eventData;
      let encryptionMetadata = null;

      if (dataClassification !== 'none' && webhookData.requiresEncryption && this.encryptionManager) {
        const detectedFields = PhiFieldDetector.detectPhiFields(eventData);

        if (detectedFields.detectedFields.length > 0) {
          const encryptionResult = await this.encryptionManager.encryptPhiFields(
            eventData,
            detectedFields.detectedFields
          );

          if (encryptionResult.error) {
            issues.push(`Encryption failed: ${encryptionResult.error}`);
          } else {
            processedPayload = encryptionResult.encryptedPayload;
            encryptionMetadata = encryptionResult.encryptionMetadata;
          }
        }
      }

      // Step 5: Get webhook secret for signing
      const { data: webhookSecret } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          secretId: this.databaseWrapper.schemas.webhookSecrets.secretId,
          algorithm: this.databaseWrapper.schemas.webhookSecrets.algorithm,
        })
        .from(this.databaseWrapper.schemas.webhookSecrets)
        .where(and(
          eq(this.databaseWrapper.schemas.webhookSecrets.webhookConfigId, webhookConfigId),
          eq(this.databaseWrapper.schemas.webhookSecrets.isActive, true)
        ))
      );

      // Step 6: Create delivery record
      const { data: delivery } : { data: { id: string }[] } = await this.databaseWrapper.safeInsert(async () =>
        db.insert(this.databaseWrapper.schemas.webhookDeliveries)
          .values({
            webhookConfigId,
            eventType: eventData.event_type ?? 'unknown',
            eventData: processedPayload,
            environment: sql`CAST(${webhookData.environment} AS webhook_environment)`,
            status: 'pending',
            attemptCount: 1,
          })
          .returning({ id: this.databaseWrapper.schemas.webhookDeliveries.id })
      );

      if (!delivery || !Array.isArray(delivery) || delivery.length === 0) {
        return {
          success: false,
          complianceStatus: 'non_compliant' as HipaaComplianceStatus,
          issues: ['Failed to create delivery record'],
        };
      }

      const deliveryId = delivery[0].id;

      // Step 7: Attempt webhook delivery
      const deliveryResult = await this.executeWebhookDelivery({
        webhookConfigId,
        deliveryId,
        url: webhookData.url,
        payload: processedPayload,
        secretId: webhookSecret?.[0]?.secretId,
        timeoutSeconds: webhookData.timeoutSeconds,
        phiDataClassification: dataClassification,
        encryptionMetadata,
      });

      // Step 8: Update delivery record with result
      await this.databaseWrapper.safeUpdate(async () =>
        db.update(this.databaseWrapper.schemas.webhookDeliveries)
          .set({
            httpStatus: deliveryResult.httpStatus,
            responseBody: deliveryResult.responseBody,
            deliveredAt: deliveryResult.success ? new Date() : null,
            status: deliveryResult.success ? 'delivered' : 'failed',
            deliveryLatencyMs: deliveryResult.responseTimeMs,
            updatedAt: new Date(),
          })
          .where(eq(this.databaseWrapper.schemas.webhookDeliveries.id, deliveryId))
      );

      // Step 9: Log HIPAA audit event
      const auditResult = await this.complianceManager.logHipaaAuditEvent({
        webhookConfigId,
        webhookDeliveryId: deliveryId,
        auditEventType: 'data_transmitted',
        dataClassification,
        phiDataTypes: phiTypes,
        entityIds,
        baaVerified: complianceCheck.baaStatus === 'compliant',
        encryptionVerified: encryptionMetadata !== null,
        riskLevel: this.calculateRiskLevel(dataClassification, deliveryResult.success),
        complianceStatus: deliveryResult.success ? 'compliant' : 'under_review',
      });

      // Determine final compliance status
      let complianceStatus: HipaaComplianceStatus = 'compliant';

      if (complianceCheck.warnings.length > 0) {
        issues.push(...complianceCheck.warnings);
        complianceStatus = 'pending';
      }

      if (!deliveryResult.success) {
        issues.push(`Delivery failed: ${deliveryResult.error}`);
        complianceStatus = 'non_compliant';
      }

      return {
        success: deliveryResult.success,
        deliveryId,
        complianceStatus,
        issues,
        auditLogId: auditResult.auditLogId,
      };

    } catch (error) {
      console.error('HIPAA webhook processing error:', error);

      // Log critical error
      await this.complianceManager.logHipaaAuditEvent({
        webhookConfigId,
        auditEventType: 'phi_accessed',
        dataClassification: 'unknown' as any,
        riskLevel: 'critical',
        complianceStatus: 'violation',
      });

      return {
        success: false,
        complianceStatus: 'non_compliant' as HipaaComplianceStatus,
        issues: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Execute webhook delivery with proper security
   */
  private async executeWebhookDelivery({
    webhookConfigId,
    deliveryId,
    url,
    payload,
    secretId,
    timeoutSeconds,
    phiDataClassification,
    encryptionMetadata,
  }: {
    webhookConfigId: string;
    deliveryId: string;
    url: string;
    payload: any;
    secretId?: string;
    timeoutSeconds: number;
    phiDataClassification: PhiDataClassification;
    encryptionMetadata?: any;
  }): Promise<{
    success: boolean;
    httpStatus?: number;
    responseBody?: string;
    responseTimeMs: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Validate HTTPS for PHI data
      if (phiDataClassification !== 'none' && !url.startsWith('https://')) {
        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          error: 'HTTPS required for PHI data transmission',
        };
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Foresight-CDSS-Webhook/1.0',
        'X-Foresight-Webhook-ID': webhookConfigId,
        'X-Foresight-Delivery-ID': deliveryId,
        'X-Foresight-Timestamp': new Date().toISOString(),
        'X-Foresight-PHI-Classification': phiDataClassification,
      };

      // Add encryption metadata header if present
      if (encryptionMetadata) {
        headers['X-Foresight-Encryption-Metadata'] = Buffer.from(JSON.stringify(encryptionMetadata)).toString('base64');
      }

      // Create HMAC signature if secret is available
      if (secretId) {
        try {
          const secretResult = await this.fetchWebhookSecret(secretId);
          
          if (secretResult.error) {
            console.warn(`Failed to fetch webhook secret for signing: ${secretResult.error}`);
            // Continue without signature - this is logged for monitoring
            headers['X-Foresight-Signature-Method'] = 'HMAC-SHA256';
            headers['X-Foresight-Signature-Status'] = 'secret-fetch-failed';
          } else {
            const payloadString = JSON.stringify(payload);
            const timestamp = headers['X-Foresight-Timestamp'];
            
            // Create signature payload: timestamp + payload (standard webhook security practice)
            const signaturePayload = `${timestamp}.${payloadString}`;
            const signature = this.createWebhookSignature(signaturePayload, secretResult.secret);
            
            headers['X-Foresight-Signature-Method'] = 'HMAC-SHA256';
            headers['X-Foresight-Signature'] = `sha256=${signature}`;
            headers['X-Foresight-Signature-Status'] = 'signed';
          }
        } catch (error) {
          console.error('Error during webhook signature creation:', error);
          // Continue without signature - this is logged for monitoring
          headers['X-Foresight-Signature-Method'] = 'HMAC-SHA256';
          headers['X-Foresight-Signature-Status'] = 'signature-failed';
        }
      }

      // Execute request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        let responseBody = '';

        try {
          responseBody = await response.text();

          // Limit response body size for storage
          if (responseBody.length > 2000) {
            responseBody = responseBody.substring(0, 2000) + '... [truncated]';
          }
        } catch {
          responseBody = '[Response body could not be read]';
        }

        return {
          success: response.ok,
          httpStatus: response.status,
          responseBody,
          responseTimeMs: responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        };

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch webhook secret from AWS Secrets Manager
   */
  private async fetchWebhookSecret(secretId: string): Promise<{ secret: string; error?: string }> {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretId });
      const response = await this.secretsClient.send(command);
      
      if (!response.SecretString) {
        return { secret: '', error: 'Secret value is empty' };
      }
      
      // Secrets Manager can store either plain text or JSON
      try {
        const parsed = JSON.parse(response.SecretString);
        // If it's JSON, look for common webhook secret keys
        const secret = parsed.secret || parsed.webhook_secret || parsed.key || parsed.value;
        if (typeof secret === 'string') {
          return { secret };
        }
        return { secret: '', error: 'Secret JSON does not contain a valid secret field' };
      } catch {
        // If it's not JSON, treat it as plain text
        return { secret: response.SecretString };
      }
    } catch (error) {
      console.error('Failed to fetch webhook secret:', error);
      return { 
        secret: '', 
        error: `Failed to fetch secret: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create HMAC signature for webhook payload
   */
  private createWebhookSignature(payload: string, secret: string, algorithm = 'sha256'): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Calculate risk level based on data classification and delivery success
   */
  private calculateRiskLevel(
    dataClassification: PhiDataClassification,
    deliverySuccess: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!deliverySuccess) {
      return dataClassification === 'full' ? 'critical' : 'high';
    }

    switch (dataClassification) {
      case 'none':
        return 'low';
      case 'limited':
        return 'medium';
      case 'full':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Validate webhook environment segregation
   */
  async validateEnvironmentSegregation(
    webhookConfigId: string,
    requestedEnvironment: 'staging' | 'production'
  ): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      const { data: webhook } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          environment: this.databaseWrapper.schemas.webhookConfigs.environment,
          phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
          hipaaComplianceStatus: this.databaseWrapper.schemas.webhookConfigs.hipaaComplianceStatus,
          url: this.databaseWrapper.schemas.webhookConfigs.url,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(eq(this.databaseWrapper.schemas.webhookConfigs.id, webhookConfigId))
      );

      if (!webhook || webhook.length === 0) {
        issues.push('Webhook configuration not found');
        return { valid: false, issues, recommendations };
      }

      const webhookData = webhook[0] as {
        environment: 'staging' | 'production';
        phiDataClassification: PhiDataClassification;
        hipaaComplianceStatus: 'compliant' | 'pending' | 'non_compliant';
        url: string;
      };

      // Environment segregation validation
      if (webhookData.environment !== requestedEnvironment) {
        issues.push(`Webhook configured for ${webhookData.environment} but ${requestedEnvironment} requested`);
      }

      // PHI in staging environment warnings
      if (requestedEnvironment === 'staging' && webhookData.phiDataClassification !== 'none') {
        recommendations.push('Consider using de-identified data in staging environment');
        recommendations.push('Ensure staging environment has same security controls as production');
      }

      // Production environment requirements
      if (requestedEnvironment === 'production') {
        if (webhookData.phiDataClassification !== 'none' && webhookData.hipaaComplianceStatus !== 'compliant') {
          issues.push('Production PHI webhooks require compliant HIPAA status');
        }

        const domain = new URL(webhookData.url).hostname;
        if (domain.includes('staging') || domain.includes('dev') || domain.includes('test')) {
          issues.push('Production webhook pointing to non-production domain');
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations,
      };

    } catch (error) {
      issues.push(`Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, issues, recommendations };
    }
  }
}

/**
 * Webhook Event Router with HIPAA Classification
 */
export class HipaaWebhookEventRouter {
  private readonly organizationId: string;
  private readonly databaseWrapper: DatabaseWrapper;

  constructor(organizationId: string, databaseWrapper: DatabaseWrapper) {
    this.organizationId = organizationId;
    this.databaseWrapper = databaseWrapper;
  }

  /**
   * Route event to appropriate webhooks based on PHI classification
   */
  async routeEvent(eventData: {
    eventType: string;
    environment: 'staging' | 'production';
    payload: any;
    sourceUserId?: string;
  }): Promise<{
    success: boolean;
    routedWebhooks: number;
    results: Array<{
      webhookId: string;
      webhookName: string;
      success: boolean;
      complianceStatus: 'compliant' | 'blocked' | 'warning';
      issues: string[];
    }>;
  }> {
    try {
      const { db } = await this.databaseWrapper.createAuthenticatedDatabaseClient();

      // Classify the event data
      const classification = PhiDataClassifier.classifyData(eventData.payload);

      // Get eligible webhooks for this event type and environment
      const { data: webhooks } = await this.databaseWrapper.safeSelect(async () =>
        db.select({
          id: this.databaseWrapper.schemas.webhookConfigs.id,
          name: this.databaseWrapper.schemas.webhookConfigs.name,
          phiDataClassification: this.databaseWrapper.schemas.webhookConfigs.phiDataClassification,
          hipaaComplianceStatus: this.databaseWrapper.schemas.webhookConfigs.hipaaComplianceStatus,
          environment: this.databaseWrapper.schemas.webhookConfigs.environment,
          isActive: this.databaseWrapper.schemas.webhookConfigs.isActive,
        })
        .from(this.databaseWrapper.schemas.webhookConfigs)
        .where(and(
          eq(this.databaseWrapper.schemas.webhookConfigs.organizationId, this.organizationId),
          eq(this.databaseWrapper.schemas.webhookConfigs.environment, sql`CAST(${eventData.environment} AS webhook_environment)`),
          eq(this.databaseWrapper.schemas.webhookConfigs.isActive, true)
        ))
      );

      const results = [];
      let routedWebhooks = 0;

      // Process each eligible webhook
      for (const webhook of webhooks || []) {
        const webhookData = webhook as {
          id: string;
          name: string;
          phiDataClassification: PhiDataClassification;
          hipaaComplianceStatus: 'compliant' | 'pending' | 'non_compliant';
          environment: 'staging' | 'production';
          isActive: boolean;
        };

        // Check if webhook can handle this level of PHI
        const canHandle = this.canWebhookHandlePhiLevel(
          webhookData.phiDataClassification,
          classification.classification
        );

        if (!canHandle) {
          results.push({
            webhookId: webhookData.id,
            webhookName: webhookData.name,
            success: false,
            complianceStatus: 'blocked' as 'compliant' | 'blocked' | 'warning',
            issues: [`Webhook classified for ${webhookData.phiDataClassification} PHI, cannot handle ${classification.classification} PHI`],
          });
          continue;
        }

        // Process webhook delivery
        const processor = new HipaaWebhookProcessor(
          this.organizationId,
          this.databaseWrapper,
          eventData.sourceUserId
        );

        const result = await processor.processWebhookDelivery(webhookData.id, eventData.payload);

        results.push({
          webhookId: webhookData.id,
          webhookName: webhookData.name,
          success: result.success,
          complianceStatus: result.complianceStatus as 'compliant' | 'blocked' | 'warning',
          issues: result.issues,
        });

        if (result.success) {
          routedWebhooks++;
        }
      }

      return {
        success: true,
        routedWebhooks,
        results,
      };

    } catch (error) {
      console.error('Event routing error:', error);
      return {
        success: false,
        routedWebhooks: 0,
        results: [],
      };
    }
  }

  private canWebhookHandlePhiLevel(
    webhookClassification: PhiDataClassification,
    eventClassification: PhiDataClassification
  ): boolean {
    const levelMap = { none: 0, limited: 1, full: 2 };
    return levelMap[webhookClassification] >= levelMap[eventClassification];
  }
}
