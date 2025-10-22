import {
  HealthLakeClient,
  CreateFHIRDatastoreCommand,
  DeleteFHIRDatastoreCommand,
  DescribeFHIRDatastoreCommand,
  ListFHIRDatastoresCommand,
  StartFHIRImportJobCommand,
  StartFHIRExportJobCommand,
  DescribeFHIRImportJobCommand,
  DescribeFHIRExportJobCommand,
  // type DatastoreProperties,
  // type ImportJobProperties,
  // type ExportJobProperties
} from '@aws-sdk/client-healthlake';

// import { FHIRResource } from './ehr-integration';
import { db } from '@foresight-cdss-next/db';
import {
  fhirResources,
  // organizations,
  // ehrConnections
} from '@foresight-cdss-next/db/schema';
import { eq } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface HealthLakeConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  datastoreName: string;
  datastoreTypeVersion: 'R4';
  preloadDataType?: 'SYNTHEA';
}

export interface HealthLakeDatastore {
  datastoreId: string;
  datastoreName: string;
  datastoreStatus: string;
  datastoreTypeVersion: string;
  datastoreArn: string;
  datastoreEndpoint: string;
  sseConfiguration?: any;
  preloadDataConfig?: any;
  identityProviderConfiguration?: any;
  errorCause?: any;
  createdAt: Date;
}

export interface HealthLakeImportJob {
  jobId: string;
  jobName?: string;
  jobStatus: string;
  submitTime: Date;
  endTime?: Date;
  datastoreId: string;
  inputDataConfig: {
    s3Uri?: string;
  };
  jobOutputDataConfig?: {
    s3Configuration?: {
      s3Uri: string;
      kmsKeyId?: string;
    };
  };
  jobProgressReport?: {
    totalNumberOfScannedFiles?: number;
    totalNumberOfImportedResources?: number;
    totalNumberOfResourcesWithCustomerError?: number;
    totalNumberOfFilesReadWithCustomerError?: number;
  };
  dataAccessRoleArn?: string;
  message?: string;
}

export interface HealthLakeExportJob {
  jobId: string;
  jobName?: string;
  jobStatus: string;
  submitTime: Date;
  endTime?: Date;
  datastoreId: string;
  outputDataConfig: {
    s3Configuration: {
      s3Uri: string;
      kmsKeyId?: string;
    };
  };
  dataAccessRoleArn: string;
  jobProgressReport?: {
    totalNumberOfScannedResources?: number;
    totalNumberOfExportedResources?: number;
    totalNumberOfResourcesWithCustomerError?: number;
  };
  message?: string;
}

export class HealthLakeIntegrationService {
  private readonly client: HealthLakeClient;
  private readonly s3Client: S3Client;
  private readonly config: HealthLakeConfig;

  constructor(config: HealthLakeConfig) {
    this.config = config;
    this.client = new HealthLakeClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      } : undefined
    });
    this.s3Client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      } : undefined
    });
  }

  /**
   * Create a new FHIR datastore in HealthLake
   */
  async createDatastore(
    datastoreName: string,
    organizationId?: string
  ): Promise<HealthLakeDatastore> {
    try {
      const command = new CreateFHIRDatastoreCommand({
        DatastoreName: datastoreName,
        DatastoreTypeVersion: this.config.datastoreTypeVersion,
        PreloadDataConfig: this.config.preloadDataType ? {
          PreloadDataType: this.config.preloadDataType
        } : undefined,
        SseConfiguration: {
          KmsEncryptionConfig: {
            CmkType: 'AWS_OWNED_KMS_KEY'
          }
        },
        Tags: organizationId ? [
          {
            Key: 'OrganizationId',
            Value: organizationId
          },
          {
            Key: 'Purpose',
            Value: 'EHR-Integration'
          }
        ] : undefined
      });

      const response = await this.client.send(command);

      if (!response.DatastoreId) {
        throw new Error('Failed to create HealthLake datastore');
      }

      return {
        datastoreId: response.DatastoreId,
        datastoreName,
        datastoreStatus: 'CREATING',
        datastoreTypeVersion: this.config.datastoreTypeVersion,
        datastoreArn: response.DatastoreArn ?? '',
        datastoreEndpoint: response.DatastoreEndpoint ?? '',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Failed to create HealthLake datastore:', error);
      throw error;
    }
  }

  /**
   * Get datastore details
   */
  async getDatastore(datastoreId: string): Promise<HealthLakeDatastore | null> {
    try {
      const command = new DescribeFHIRDatastoreCommand({
        DatastoreId: datastoreId
      });

      const response = await this.client.send(command);
      const datastore = response.DatastoreProperties;

      if (!datastore) {
        return null;
      }

      return {
        datastoreId: datastore.DatastoreId!,
        datastoreName: datastore.DatastoreName!,
        datastoreStatus: datastore.DatastoreStatus!,
        datastoreTypeVersion: datastore.DatastoreTypeVersion!,
        datastoreArn: datastore.DatastoreArn!,
        datastoreEndpoint: datastore.DatastoreEndpoint!,
        sseConfiguration: datastore.SseConfiguration,
        preloadDataConfig: datastore.PreloadDataConfig,
        identityProviderConfiguration: datastore.IdentityProviderConfiguration,
        errorCause: datastore.ErrorCause,
        createdAt: datastore.CreatedAt ?? new Date()
      };
    } catch (error) {
      console.error('Failed to get HealthLake datastore:', error);
      return null;
    }
  }

  /**
   * List all datastores
   */
  async listDatastores(): Promise<HealthLakeDatastore[]> {
    try {
      const command = new ListFHIRDatastoresCommand({});
      const response = await this.client.send(command);

      return (response.DatastorePropertiesList ?? []).map(datastore => ({
        datastoreId: datastore.DatastoreId!,
        datastoreName: datastore.DatastoreName!,
        datastoreStatus: datastore.DatastoreStatus!,
        datastoreTypeVersion: datastore.DatastoreTypeVersion!,
        datastoreArn: datastore.DatastoreArn!,
        datastoreEndpoint: datastore.DatastoreEndpoint!,
        sseConfiguration: datastore.SseConfiguration,
        preloadDataConfig: datastore.PreloadDataConfig,
        identityProviderConfiguration: datastore.IdentityProviderConfiguration,
        errorCause: datastore.ErrorCause,
        createdAt: datastore.CreatedAt ?? new Date()
      }));
    } catch (error) {
      console.error('Failed to list HealthLake datastores:', error);
      throw error;
    }
  }

  /**
   * Start bulk import job from S3 to HealthLake
   */
  async startImportJob(
    datastoreId: string,
    s3Uri: string,
    dataAccessRoleArn: string,
    jobName?: string
  ): Promise<string> {
    try {
      const command = new StartFHIRImportJobCommand({
        DatastoreId: datastoreId,
        InputDataConfig: {
          S3Uri: s3Uri
        },
        JobOutputDataConfig: {
          S3Configuration: {
            S3Uri: s3Uri.replace('/input/', '/output/'),
            KmsKeyId: process.env.HEALTHLAKE_KMS_KEY_ID ?? 'alias/aws/s3'
          }
        },
        DataAccessRoleArn: dataAccessRoleArn,
        JobName: jobName
      });

      const response = await this.client.send(command);

      if (!response.JobId) {
        throw new Error('Failed to start HealthLake import job');
      }

      return response.JobId;
    } catch (error) {
      console.error('Failed to start HealthLake import job:', error);
      throw error;
    }
  }

  /**
   * Start bulk export job from HealthLake to S3
   */
  async startExportJob(
    datastoreId: string,
    s3Uri: string,
    dataAccessRoleArn: string,
    jobName?: string
  ): Promise<string> {
    try {
      const command = new StartFHIRExportJobCommand({
        DatastoreId: datastoreId,
        OutputDataConfig: {
          S3Configuration: {
            S3Uri: s3Uri,
            KmsKeyId: process.env.HEALTHLAKE_KMS_KEY_ID ?? 'alias/aws/s3'
          }
        },
        DataAccessRoleArn: dataAccessRoleArn,
        JobName: jobName
      });

      const response = await this.client.send(command);

      if (!response.JobId) {
        throw new Error('Failed to start HealthLake export job');
      }

      return response.JobId;
    } catch (error) {
      console.error('Failed to start HealthLake export job:', error);
      throw error;
    }
  }

  /**
   * Get import job status
   */
  async getImportJobStatus(
    datastoreId: string,
    jobId: string
  ): Promise<HealthLakeImportJob | null> {
    try {
      const command = new DescribeFHIRImportJobCommand({
        DatastoreId: datastoreId,
        JobId: jobId
      });

      const response = await this.client.send(command);
      const job = response.ImportJobProperties;

      if (!job) {
        return null;
      }

      return {
        jobId: job.JobId!,
        jobName: job.JobName,
        jobStatus: job.JobStatus!,
        submitTime: job.SubmitTime!,
        endTime: job.EndTime,
        datastoreId: job.DatastoreId!,
        inputDataConfig: {
          s3Uri: job.InputDataConfig?.S3Uri
        },
        jobOutputDataConfig: job.JobOutputDataConfig ? {
          s3Configuration: {
            s3Uri: (job.JobOutputDataConfig as any)?.S3Configuration?.S3Uri || '',
            kmsKeyId: (job.JobOutputDataConfig as any)?.S3Configuration?.KmsKeyId
          }
        } : undefined,
        jobProgressReport: job.JobProgressReport ? {
          totalNumberOfScannedFiles: job.JobProgressReport.TotalNumberOfScannedFiles,
          totalNumberOfImportedResources: job.JobProgressReport.TotalNumberOfResourcesImported,
          totalNumberOfResourcesWithCustomerError: job.JobProgressReport.TotalNumberOfResourcesWithCustomerError,
          totalNumberOfFilesReadWithCustomerError: job.JobProgressReport.TotalNumberOfFilesReadWithCustomerError
        } : undefined,
        dataAccessRoleArn: job.DataAccessRoleArn,
        message: job.Message
      };
    } catch (error) {
      console.error('Failed to get HealthLake import job status:', error);
      return null;
    }
  }

  /**
   * Get export job status
   */
  async getExportJobStatus(
    datastoreId: string,
    jobId: string
  ): Promise<HealthLakeExportJob | null> {
    try {
      const command = new DescribeFHIRExportJobCommand({
        DatastoreId: datastoreId,
        JobId: jobId
      });

      const response = await this.client.send(command);
      const job = response.ExportJobProperties;

      if (!job) {
        return null;
      }

      return {
        jobId: job.JobId!,
        jobName: job.JobName,
        jobStatus: job.JobStatus!,
        submitTime: job.SubmitTime!,
        endTime: job.EndTime,
        datastoreId: job.DatastoreId!,
        outputDataConfig: {
          s3Configuration: {
            s3Uri: (job.OutputDataConfig as any)?.S3Configuration?.S3Uri || '',
            kmsKeyId: (job.OutputDataConfig as any)?.S3Configuration?.KmsKeyId
          }
        },
        dataAccessRoleArn: job.DataAccessRoleArn!,
        jobProgressReport: (job as any).JobProgressReport ? {
          totalNumberOfScannedResources: (job as any).JobProgressReport.TotalNumberOfScannedResources,
          totalNumberOfExportedResources: (job as any).JobProgressReport.TotalNumberOfExportedResources,
          totalNumberOfResourcesWithCustomerError: (job as any).JobProgressReport.TotalNumberOfResourcesWithCustomerError
        } : undefined,
        message: job.Message
      };
    } catch (error) {
      console.error('Failed to get HealthLake export job status:', error);
      return null;
    }
  }

  /**
   * Sync organization data to HealthLake
   */
  async syncOrganizationToHealthLake(
    organizationId: string,
    datastoreId: string,
    s3BucketUri: string,
    dataAccessRoleArn: string
  ): Promise<string> {
    try {
      // Get all FHIR resources for the organization
      const resources = await db
        .select()
        .from(fhirResources)
        .where(eq(fhirResources.organizationId, organizationId));

      if (resources.length === 0) {
        throw new Error('No FHIR resources found for organization');
      }

      // Create NDJSON file content for HealthLake import
      const ndjsonContent = resources
        .map((resource: any) => JSON.stringify(resource.fhirData))
        .join('\n');

      // Upload NDJSON content to S3 for HealthLake import
      const s3Key = `healthlake-imports/${organizationId}/${Date.now()}/resources.ndjson`;
      const bucketName = s3BucketUri.replace('s3://', '').split('/')[0];
      const s3Uri = `s3://${bucketName}/${s3Key}`;

      // Upload the FHIR data to S3
      await this.uploadToS3(bucketName, s3Key, ndjsonContent, 'application/x-ndjson');
      console.log(`Uploaded FHIR data to S3: ${s3Uri}`);

      // Start HealthLake import job
      const jobId = await this.startImportJob(
        datastoreId,
        s3Uri,
        dataAccessRoleArn,
        `sync-org-${organizationId}-${Date.now()}`
      );

      console.log(`Started HealthLake sync job ${jobId} for organization ${organizationId}`);
      return jobId;
    } catch (error) {
      console.error(`Failed to sync organization ${organizationId} to HealthLake:`, error);
      throw error;
    }
  }

  /**
   * Sync multiple organizations to HealthLake
   */
  async syncMultipleOrganizationsToHealthLake(
    organizationIds: string[],
    datastoreId: string,
    s3BucketUri: string,
    dataAccessRoleArn: string
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const orgId of organizationIds) {
      try {
        const jobId = await this.syncOrganizationToHealthLake(
          orgId,
          datastoreId,
          s3BucketUri,
          dataAccessRoleArn
        );
        jobIds.push(jobId);
      } catch (error) {
        console.error(`Failed to sync organization ${orgId}:`, error);
        // Continue with other organizations
      }
    }

    return jobIds;
  }

  /**
   * Export HealthLake data back to local system
   */
  async exportHealthLakeDataToLocal(
    datastoreId: string,
    s3BucketUri: string,
    dataAccessRoleArn: string,
    organizationIds?: string[]
  ): Promise<string> {
    try {
      const jobName = organizationIds
        ? `export-orgs-${organizationIds.join('-')}-${Date.now()}`
        : `export-all-${Date.now()}`;

      const exportJobId = await this.startExportJob(
        datastoreId,
        `${s3BucketUri}/healthlake-exports/${jobName}/`,
        dataAccessRoleArn,
        jobName
      );

      console.log(`Started HealthLake export job ${exportJobId}`);
      return exportJobId;
    } catch (error) {
      console.error('Failed to export HealthLake data:', error);
      throw error;
    }
  }

  /**
   * Get cross-provider analytics from HealthLake
   */
  async getHealthLakeCrossProviderAnalytics(
    datastoreId: string,
    organizationIds?: string[]
  ): Promise<any> {
    try {
      // HealthLake doesn't have direct analytics API
      // You would typically export data and run analytics on the exported files
      // Or use HealthLake's search capabilities with FHIR queries

      const exportJobId = await this.exportHealthLakeDataToLocal(
        datastoreId,
        process.env.HEALTHLAKE_S3_BUCKET ?? '',
        process.env.HEALTHLAKE_DATA_ACCESS_ROLE_ARN ?? '',
        organizationIds
      );

      return {
        exportJobId,
        status: 'EXPORT_STARTED',
        message: 'Analytics data export started. Process exported files for detailed analytics.'
      };
    } catch (error) {
      console.error('Failed to get HealthLake analytics:', error);
      throw error;
    }
  }

  /**
   * Delete datastore (careful!)
   */
  async deleteDatastore(datastoreId: string): Promise<void> {
    try {
      const command = new DeleteFHIRDatastoreCommand({
        DatastoreId: datastoreId
      });

      await this.client.send(command);
      console.log(`HealthLake datastore ${datastoreId} deletion started`);
    } catch (error) {
      console.error('Failed to delete HealthLake datastore:', error);
      throw error;
    }
  }

  /**
   * Test HealthLake connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listDatastores();
      return true;
    } catch (error) {
      console.error('HealthLake connection test failed:', error);
      return false;
    }
  }

  /**
   * Upload content to S3 bucket
   */
  private async uploadToS3(
    bucketName: string,
    key: string,
    content: string,
    contentType: string
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
        ServerSideEncryption: 'AES256'
      });

      await this.s3Client.send(command);
      console.log(`Successfully uploaded ${key} to S3 bucket ${bucketName}`);
    } catch (error) {
      console.error(`Failed to upload ${key} to S3 bucket ${bucketName}:`, error);
      throw error;
    }
  }
}

// Factory for creating HealthLake integration
export function createHealthLakeIntegration(config?: Partial<HealthLakeConfig>): HealthLakeIntegrationService {
  const defaultConfig: HealthLakeConfig = {
    region: process.env.AWS_REGION ?? 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    datastoreName: process.env.HEALTHLAKE_DATASTORE_NAME ?? 'foresight-rcm-hl-datastore',
    datastoreTypeVersion: 'R4',
    preloadDataType: undefined // Can be 'SYNTHEA' for test data
  };

  return new HealthLakeIntegrationService({ ...defaultConfig, ...config });
}

export const healthLakeService = createHealthLakeIntegration();
