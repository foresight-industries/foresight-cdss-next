import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Duration, Stack } from 'aws-cdk-lib';

export interface MedicalCodeCacheProps {
  environment: 'staging' | 'prod';
  database: rds.DatabaseCluster;
  medicalCodesBucket: s3.Bucket;
  backupBucket: s3.Bucket;
  redisSecret: secretsmanager.Secret;
}

/**
 * Reusable construct for medical code caching functionality
 * Provides a pre-configured Lambda function with all necessary permissions
 * for medical code caching, lookup, and annual updates
 */
export class MedicalCodeCache extends Construct {
  public readonly cacheFunction: lambda.Function;
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: MedicalCodeCacheProps) {
    super(scope, id);

    // Create dedicated IAM role for medical code operations
    this.role = new iam.Role(this, 'MedicalCodeCacheRole', {
      roleName: `foresight-${props.environment}-medical-code-cache-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        MedicalCodeCachePolicy: new iam.PolicyDocument({
          statements: [
            // RDS Data API access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds-data:BeginTransaction',
                'rds-data:CommitTransaction',
                'rds-data:ExecuteStatement',
                'rds-data:RollbackTransaction',
                'rds-data:BatchExecuteStatement',
              ],
              resources: [props.database.clusterArn],
            }),
            // Secrets Manager access for database and Redis
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [
                props.database.secret?.secretArn || '',
                props.redisSecret.secretArn,
              ],
            }),
            // S3 access for medical code files
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [
                props.medicalCodesBucket.bucketArn,
                `${props.medicalCodesBucket.bucketArn}/*`,
                props.backupBucket.bucketArn,
                `${props.backupBucket.bucketArn}/*`,
              ],
            }),
            // SSM Parameter Store access for configuration
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
                'ssm:PutParameter',
              ],
              resources: [
                `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/foresight/${props.environment}/cache/*`,
                `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/foresight/${props.environment}/storage/*`,
                `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/foresight/${props.environment}/medical-codes/*`,
              ],
            }),
            // CloudWatch Logs for monitoring
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              resources: [
                `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:log-group:/aws/lambda/foresight-${props.environment}-medical-code-*`,
              ],
            }),
          ],
        }),
      },
    });

    // Get configuration from SSM parameters
    const cacheDefaultTtl = ssm.StringParameter.valueForStringParameter(
      this,
      `/foresight/${props.environment}/cache/default-ttl`
    );

    const cacheHotCodesTtl = ssm.StringParameter.valueForStringParameter(
      this,
      `/foresight/${props.environment}/cache/hot-codes-ttl`
    );

    const redisUrl = ssm.StringParameter.valueForStringParameter(
      this,
      `/foresight/${props.environment}/cache/redis-url`
    );

    // Create the medical code cache Lambda function
    this.cacheFunction = new lambda.Function(this, 'MedicalCodeCacheFunction', {
      functionName: `foresight-${props.environment}-medical-code-cache`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'medical-codes-api.handler',
      code: lambda.Code.fromAsset('../packages/functions/api'),
      role: this.role,
      timeout: Duration.minutes(15),
      memorySize: 1024,
      environment: {
        NODE_ENV: props.environment,
        // Database configuration
        DATABASE_SECRET_ARN: props.database.secret?.secretArn || '',
        DATABASE_CLUSTER_ARN: props.database.clusterArn,
        DATABASE_NAME: 'rcm',
        // Cache configuration
        REDIS_DB_URL: redisUrl,
        REDIS_SECRET_ARN: props.redisSecret.secretArn,
        CACHE_DEFAULT_TTL: cacheDefaultTtl,
        CACHE_HOT_CODES_TTL: cacheHotCodesTtl,
        // Storage configuration
        MEDICAL_CODES_BUCKET: props.medicalCodesBucket.bucketName,
        MEDICAL_CODES_BACKUP_BUCKET: props.backupBucket.bucketName,
        // Medical code specific settings
        BATCH_SIZE: '1000',
        MAX_RETRY_ATTEMPTS: '3',
        CACHE_PREWARM_ENABLED: props.environment === 'prod' ? 'true' : 'false',
      },
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: props.environment === 'prod' ? 10 : 2,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
    });

    // Note: All permissions are handled via the IAM role inline policies above
    // to avoid cross-environment resource access issues and unsupported principals
  }

  /**
   * Grants the medical code cache function permissions to another Lambda function
   * Useful for allowing other functions to invoke cache operations
   */
  public grantInvoke(fn: lambda.Function): void {
    this.cacheFunction.grantInvoke(fn);
  }

  /**
   * Creates a custom cache policy for external functions that need to access
   * the medical code cache infrastructure
   */
  public createCacheAccessPolicy(): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lambda:InvokeFunction',
          ],
          resources: [
            this.cacheFunction.functionArn,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ssm:GetParameter',
            'ssm:GetParameters',
          ],
          resources: [
            `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/foresight/*/cache/*`,
            `arn:aws:ssm:${Stack.of(this).region}:${Stack.of(this).account}:parameter/foresight/*/medical-codes/*`,
          ],
        }),
      ],
    });
  }

  /**
   * Creates environment variables for external functions that need to
   * integrate with the medical code cache
   */
  public getCacheEnvironmentVariables(): Record<string, string> {
    return {
      MEDICAL_CODE_CACHE_FUNCTION_NAME: this.cacheFunction.functionName,
      MEDICAL_CODE_CACHE_FUNCTION_ARN: this.cacheFunction.functionArn,
    };
  }
}
