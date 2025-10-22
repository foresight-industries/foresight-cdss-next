import { SecretsManagerClient, UpdateSecretCommand, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand } from '@aws-sdk/client-rds-data';
import * as crypto from 'node:crypto';

interface RotationConfig {
  region?: string;
  databaseClusterArn: string;
  databaseSecretArn: string;
  databaseName: string;
}

interface WebhookSecretData {
  key: string;
  algorithm: string;
  rotatedAt?: string;
  previousKey?: string;
}

/**
 * Webhook Secret Rotation Manager
 *
 * Handles automatic rotation of webhook signing secrets
 */
export class WebhookSecretRotationManager {
  private readonly secretsClient: SecretsManagerClient;
  private readonly rdsClient: RDSDataClient;
  private readonly config: RotationConfig;

  constructor(config: RotationConfig) {
    this.config = config;
    this.secretsClient = new SecretsManagerClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
    });
    this.rdsClient = new RDSDataClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Rotate secrets for a specific webhook configuration
   */
  async rotateWebhookSecret(webhookConfigId: string): Promise<{
    success: boolean;
    newSecretId?: string;
    error?: string;
  }> {
    let transactionId: string | undefined;

    try {
      // Start database transaction
      const transaction = await this.rdsClient.send(new BeginTransactionCommand({
        resourceArn: this.config.databaseClusterArn,
        secretArn: this.config.databaseSecretArn,
        database: this.config.databaseName,
      }));

      transactionId = transaction.transactionId;

      // Get current webhook secret info
      const currentSecretInfo = await this.getCurrentWebhookSecret(webhookConfigId, transactionId);
      if (!currentSecretInfo) {
        throw new Error('Webhook secret not found');
      }

      // Get current secret value
      const currentSecretData = await this.getSecretValue(currentSecretInfo.secretId);

      // Generate new secret
      const newSecretData: WebhookSecretData = {
        key: crypto.randomBytes(32).toString('hex'),
        algorithm: currentSecretData.algorithm,
        rotatedAt: new Date().toISOString(),
        previousKey: currentSecretData.key, // Keep previous key for grace period
      };

      // Update existing secret in AWS Secrets Manager (better practice)
      await this.updateExistingSecret(currentSecretInfo.secretId, newSecretData);

      // Update database to record the rotation
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      await this.recordSecretRotation(
        webhookConfigId,
        currentSecretInfo.secretId,
        transactionId
      );

      // Commit transaction
      await this.rdsClient.send(new CommitTransactionCommand({
        resourceArn: this.config.databaseClusterArn,
        secretArn: this.config.databaseSecretArn,
        transactionId,
      }));

      // Schedule cleanup of old secret (after grace period)
      await this.scheduleSecretCleanup(currentSecretInfo.secretId);

      console.log(`Successfully rotated secret for webhook ${webhookConfigId}`);

      return {
        success: true,
        newSecretId: currentSecretInfo.secretId,
      };

    } catch (error) {
      // Rollback transaction if it was started
      if (transactionId) {
        try {
          await this.rdsClient.send(new RollbackTransactionCommand({
            resourceArn: this.config.databaseClusterArn,
            secretArn: this.config.databaseSecretArn,
            transactionId,
          }));
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }

      console.error(`Failed to rotate secret for webhook ${webhookConfigId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rotate secrets for all webhooks in an organization
   */
  async rotateOrganizationSecrets(
    organizationId: string,
    environment?: 'staging' | 'production'
  ): Promise<{
    success: boolean;
    rotatedCount: number;
    errors: string[];
  }> {
    try {
      // Get all webhook configs for the organization
      const webhookConfigs = await this.getOrganizationWebhooks(organizationId, environment);

      const results = await Promise.allSettled(
        webhookConfigs.map(config => this.rotateWebhookSecret(config.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Unknown error');

      return {
        success: errors.length === 0,
        rotatedCount: successful,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        rotatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get current webhook secret information from database
   */
  private async getCurrentWebhookSecret(
    webhookConfigId: string,
    transactionId?: string
  ): Promise<{ secretId: string; algorithm: string } | null> {
    const sql = `
      SELECT secret_id, algorithm
      FROM webhook_secrets
      WHERE webhook_config_id = :webhookConfigId
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.rdsClient.send(new ExecuteStatementCommand({
      resourceArn: this.config.databaseClusterArn,
      secretArn: this.config.databaseSecretArn,
      database: this.config.databaseName,
      sql,
      parameters: [
        { name: 'webhookConfigId', value: { stringValue: webhookConfigId } },
      ],
      transactionId,
    }));

    if (!result.records || result.records.length === 0) {
      return null;
    }

    return {
      secretId: result.records[0][0]?.stringValue || '',
      algorithm: result.records[0][1]?.stringValue || 'sha256',
    };
  }

  /**
   * Get secret value from AWS Secrets Manager
   */
  private async getSecretValue(secretId: string): Promise<WebhookSecretData> {
    const result = await this.secretsClient.send(new GetSecretValueCommand({
      SecretId: secretId,
    }));

    if (!result.SecretString) {
      throw new Error('Secret value is empty');
    }

    return JSON.parse(result.SecretString);
  }

  /**
   * Update existing secret in AWS Secrets Manager using UpdateSecretCommand
   */
  private async updateExistingSecret(
    secretId: string,
    secretData: WebhookSecretData
  ): Promise<void> {
    await this.secretsClient.send(new UpdateSecretCommand({
      SecretId: secretId,
      SecretString: JSON.stringify(secretData),
    }));
  }

  /**
   * Record secret rotation in database (update last rotation timestamp)
   */
  private async recordSecretRotation(
    webhookConfigId: string,
    secretId: string,
    transactionId: string
  ): Promise<void> {
    const sql = `
      UPDATE webhook_secrets
      SET updated_at = NOW()
      WHERE webhook_config_id = :webhookConfigId
        AND secret_id = :secretId
        AND is_active = true
    `;

    await this.rdsClient.send(new ExecuteStatementCommand({
      resourceArn: this.config.databaseClusterArn,
      secretArn: this.config.databaseSecretArn,
      database: this.config.databaseName,
      sql,
      parameters: [
        { name: 'webhookConfigId', value: { stringValue: webhookConfigId } },
        { name: 'secretId', value: { stringValue: secretId } },
      ],
      transactionId,
    }));
  }

  /**
   * Create new secret in AWS Secrets Manager (kept for initial webhook creation)
   */
  // private async createNewSecret(
  //   secretName: string,
  //   secretData: WebhookSecretData,
  //   webhookConfigId: string
  // ): Promise<string> {
  //   const result = await this.secretsClient.send(new CreateSecretCommand({
  //     Name: secretName,
  //     SecretString: JSON.stringify(secretData),
  //     Description: `Rotated webhook signing secret for config ${webhookConfigId}`,
  //   }));
  //
  //   if (!result.ARN) {
  //     throw new Error('Failed to create new secret');
  //   }
  //
  //   return result.ARN;
  // }

  /**
   * Update webhook secret reference in database
   */
  // private async updateWebhookSecretReference(
  //   webhookConfigId: string,
  //   oldSecretId: string,
  //   newSecretId: string,
  //   transactionId: string
  // ): Promise<void> {
  //   // Deactivate old secret
  //   const deactivateOldSql = `
  //     UPDATE webhook_secrets
  //     SET is_active = false, updated_at = NOW()
  //     WHERE webhook_config_id = :webhookConfigId
  //       AND secret_id = :oldSecretId
  //   `;
  //
  //   await this.rdsClient.send(new ExecuteStatementCommand({
  //     resourceArn: this.config.databaseClusterArn,
  //     secretArn: this.config.databaseSecretArn,
  //     database: this.config.databaseName,
  //     sql: deactivateOldSql,
  //     parameters: [
  //       { name: 'webhookConfigId', value: { stringValue: webhookConfigId } },
  //       { name: 'oldSecretId', value: { stringValue: oldSecretId } },
  //     ],
  //     transactionId,
  //   }));
  //
  //   // Insert new secret reference
  //   const insertNewSql = `
  //     INSERT INTO webhook_secrets (
  //       webhook_config_id, secret_id, algorithm, is_active, created_at, updated_at
  //     ) VALUES (
  //       :webhookConfigId, :newSecretId, 'sha256', true, NOW(), NOW()
  //     )
  //   `;
  //
  //   await this.rdsClient.send(new ExecuteStatementCommand({
  //     resourceArn: this.config.databaseClusterArn,
  //     secretArn: this.config.databaseSecretArn,
  //     database: this.config.databaseName,
  //     sql: insertNewSql,
  //     parameters: [
  //       { name: 'webhookConfigId', value: { stringValue: webhookConfigId } },
  //       { name: 'newSecretId', value: { stringValue: newSecretId } },
  //     ],
  //     transactionId,
  //   }));
  // }

  /**
   * Get all webhook configurations for an organization
   */
  private async getOrganizationWebhooks(
    organizationId: string,
    environment?: 'staging' | 'production'
  ): Promise<{ id: string; environment: string }[]> {
    let sql = `
      SELECT id, environment
      FROM webhook_configs
      WHERE organization_id = :organizationId
        AND is_active = true
        AND deleted_at IS NULL
    `;

    const parameters = [
      { name: 'organizationId', value: { stringValue: organizationId } },
    ];

    if (environment) {
      sql += ' AND environment = :environment';
      parameters.push({ name: 'environment', value: { stringValue: environment } });
    }

    const result = await this.rdsClient.send(new ExecuteStatementCommand({
      resourceArn: this.config.databaseClusterArn,
      secretArn: this.config.databaseSecretArn,
      database: this.config.databaseName,
      sql,
      parameters,
    }));

    return (result.records || []).map(record => ({
      id: record[0]?.stringValue || '',
      environment: record[1]?.stringValue || 'staging',
    }));
  }

  /**
   * Schedule cleanup of old secret after grace period
   */
  private async scheduleSecretCleanup(secretId: string): Promise<void> {
    // In a production environment, you would schedule this with EventBridge or similar
    // For now, we'll just log the intention
    console.log(`Scheduled cleanup for old secret ${secretId} after grace period`);

    // TODO: Implement actual scheduling mechanism
    // This could be done with:
    // - EventBridge scheduled rule
    // - Lambda with delayed execution
    // - SQS with delay
  }
}

/**
 * Lambda function handler for automated secret rotation
 */
export async function handleSecretRotation(event: any): Promise<any> {
  const {
    webhookConfigId,
    organizationId,
    environment,
    databaseClusterArn,
    databaseSecretArn,
    databaseName,
  } = event;

  const rotationManager = new WebhookSecretRotationManager({
    databaseClusterArn,
    databaseSecretArn,
    databaseName,
  });

  if (webhookConfigId) {
    // Rotate specific webhook secret
    return await rotationManager.rotateWebhookSecret(webhookConfigId);
  } else if (organizationId) {
    // Rotate all secrets for organization
    return await rotationManager.rotateOrganizationSecrets(organizationId, environment);
  } else {
    throw new Error('Either webhookConfigId or organizationId must be provided');
  }
}
