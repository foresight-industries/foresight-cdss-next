import { Stack, StackProps, Tags, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CacheStack } from './stacks/cache-stack';
import { MedicalDataStack } from './stacks/medical-data-stack';
import { MedicalCodeCache } from './constructs/medical-code-cache';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface MedicalInfrastructureProps extends StackProps {
  environment: 'staging' | 'prod';
  database: rds.DatabaseCluster;
  documentsBucket?: s3.Bucket;
  redisConnectionString?: string;
}

/**
 * Complete medical infrastructure stack that combines all medical code
 * caching and data management components
 */
export class MedicalInfrastructure extends Stack {
  public readonly cacheStack: CacheStack;
  public readonly medicalDataStack: MedicalDataStack;
  public readonly medicalCodeCache: MedicalCodeCache;

  constructor(scope: Construct, id: string, props: MedicalInfrastructureProps) {
    super(scope, id, props);

    // Create cache infrastructure
    this.cacheStack = new CacheStack(this, 'CacheStack', {
      environment: props.environment,
      redisConnectionString: props.redisConnectionString,
    });

    // Create medical data storage infrastructure
    this.medicalDataStack = new MedicalDataStack(this, 'MedicalDataStack', {
      environment: props.environment,
    });

    // Create reusable medical code cache construct
    this.medicalCodeCache = new MedicalCodeCache(this, 'MedicalCodeCache', {
      environment: props.environment,
      database: props.database,
      medicalCodesBucket: this.medicalDataStack.medicalCodesBucket,
      backupBucket: this.medicalDataStack.medicalCodesBackupBucket,
      redisSecret: this.cacheStack.redisConnectionStringSecret,
    });

    // Apply consistent tagging
    this.applyTags(props.environment);

    // Create outputs for integration with other stacks
    this.createOutputs();
  }

  private applyTags(environment: string): void {
    Tags.of(this).add('Project', 'Foresight-CDSS');
    Tags.of(this).add('Environment', environment);
    Tags.of(this).add('Component', 'Medical-Infrastructure');
    Tags.of(this).add('ManagedBy', 'CDK');
    Tags.of(this).add('CostCenter', 'Healthcare-Technology');

    if (environment === 'prod') {
      Tags.of(this).add('BackupRequired', 'true');
      Tags.of(this).add('MonitoringLevel', 'enhanced');
    }
  }

  private createOutputs(): void {
    // Cache infrastructure outputs
    new CfnOutput(this, 'CacheStackName', {
      value: this.cacheStack.stackName,
      description: 'Name of the cache infrastructure stack',
      exportName: `${this.stackName}-cache-stack-name`,
    });

    new CfnOutput(this, 'RedisSecretArn', {
      value: this.cacheStack.redisConnectionStringSecret.secretArn,
      description: 'ARN of the Redis connection secret',
      exportName: `${this.stackName}-redis-secret-arn`,
    });

    // Medical data infrastructure outputs
    new CfnOutput(this, 'MedicalDataStackName', {
      value: this.medicalDataStack.stackName,
      description: 'Name of the medical data infrastructure stack',
      exportName: `${this.stackName}-medical-data-stack-name`,
    });

    new CfnOutput(this, 'MedicalCodesBucketName', {
      value: this.medicalDataStack.medicalCodesBucket.bucketName,
      description: 'Name of the medical codes S3 bucket',
      exportName: `${this.stackName}-medical-codes-bucket`,
    });

    new CfnOutput(this, 'MedicalCodesBackupBucketName', {
      value: this.medicalDataStack.medicalCodesBackupBucket.bucketName,
      description: 'Name of the medical codes backup S3 bucket',
      exportName: `${this.stackName}-medical-codes-backup-bucket`,
    });

    // Cache function outputs
    new CfnOutput(this, 'MedicalCodeCacheFunctionName', {
      value: this.medicalCodeCache.cacheFunction.functionName,
      description: 'Name of the medical code cache Lambda function',
      exportName: `${this.stackName}-cache-function-name`,
    });

    new CfnOutput(this, 'MedicalCodeCacheFunctionArn', {
      value: this.medicalCodeCache.cacheFunction.functionArn,
      description: 'ARN of the medical code cache Lambda function',
      exportName: `${this.stackName}-cache-function-arn`,
    });

    // Processing role output
    new CfnOutput(this, 'ProcessingRoleArn', {
      value: this.medicalDataStack.processingRole.roleArn,
      description: 'ARN of the medical code processing role',
      exportName: `${this.stackName}-processing-role-arn`,
    });
  }

  /**
   * Get environment variables for API functions that need to integrate
   * with the medical infrastructure
   */
  public getIntegrationEnvironmentVariables(): Record<string, string> {
    return {
      ...this.medicalCodeCache.getCacheEnvironmentVariables(),
      MEDICAL_CODES_BUCKET: this.medicalDataStack.medicalCodesBucket.bucketName,
      MEDICAL_CODES_BACKUP_BUCKET: this.medicalDataStack.medicalCodesBackupBucket.bucketName,
      REDIS_SECRET_ARN: this.cacheStack.redisConnectionStringSecret.secretArn,
      PROCESSING_ROLE_ARN: this.medicalDataStack.processingRole.roleArn,
    };
  }

  /**
   * Get policy statements for functions that need access to medical infrastructure
   */
  public getIntegrationPolicyStatements() {
    return [
      ...this.cacheStack.getCacheAccessPolicyStatements(),
      ...this.medicalDataStack.getS3AccessPolicyStatements(),
    ];
  }
}
