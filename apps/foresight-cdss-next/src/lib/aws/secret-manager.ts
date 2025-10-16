import {
  SecretsManagerClient,
  CreateSecretCommand,
  UpdateSecretCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
  DescribeSecretCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from '@aws-sdk/client-secrets-manager';

interface SecretTags {
  OrganizationId: string;
  ServiceName: string;
  Environment: string;
  CreatedBy: string;
}

interface DosespotCredentials {
  apiKey: string;
  clinicKey: string;
  clinicId: string;
  userId: string;
  subscriptionKey: string;
}

export class SecretManagerService {
  private readonly client: SecretsManagerClient;

  constructor() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Missing required AWS environment variables');
    }

    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createSecret(
    secretName: string,
    secretValue: DosespotCredentials,
    tags: SecretTags
  ): Promise<string> {
    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
        Description: `${tags.ServiceName} credentials for organization ${tags.OrganizationId}`,
        KmsKeyId: `alias/rcm-credential-encryption-${process.env.STAGE ?? 'staging'}`,
        Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
      });

      const response = await this.client.send(command);

      if (!response.ARN) {
        throw new Error('Failed to create secret - no ARN returned');
      }

      return response.ARN;
    } catch (error) {
      console.error('Error creating secret:', error);
      throw new Error(`Failed to create secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async updateSecret(
    secretArn: string,
    secretValue: DosespotCredentials
  ): Promise<void> {
    try {
      const command = new UpdateSecretCommand({
        SecretId: secretArn,
        SecretString: JSON.stringify(secretValue),
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error updating secret:', error);
      throw new Error(`Failed to update secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async getSecret(secretArn: string): Promise<DosespotCredentials> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('Secret value not found');
      }

      return JSON.parse(response.SecretString) as DosespotCredentials;
    } catch (error) {
      console.error('Error retrieving secret:', error);
      throw new Error(`Failed to retrieve secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async deleteSecret(secretArn: string, forceDelete = false): Promise<void> {
    try {
      const command = new DeleteSecretCommand({
        SecretId: secretArn,
        ForceDeleteWithoutRecovery: forceDelete,
        RecoveryWindowInDays: forceDelete ? undefined : 7, // 7-day recovery window
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting secret:', error);
      throw new Error(`Failed to delete secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async describeSecret(secretArn: string) {
    try {
      const command = new DescribeSecretCommand({
        SecretId: secretArn,
      });

      return await this.client.send(command);
    } catch (error) {
      console.error('Error describing secret:', error);
      throw new Error(`Failed to describe secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async tagSecret(secretArn: string, tags: Record<string, string>): Promise<void> {
    try {
      const command = new TagResourceCommand({
        SecretId: secretArn,
        Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error tagging secret:', error);
      throw new Error(`Failed to tag secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async untagSecret(secretArn: string, tagKeys: string[]): Promise<void> {
    try {
      const command = new UntagResourceCommand({
        SecretId: secretArn,
        TagKeys: tagKeys,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error untagging secret:', error);
      throw new Error(`Failed to untag secret: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }
}
