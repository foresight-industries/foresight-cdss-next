import { Stack, StackProps, CfnOutput, SecretValue } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface CacheStackProps extends StackProps {
  environment: 'staging' | 'prod';
  redisConnectionString?: string; // Optional override for Redis.io connection
}

export class CacheStack extends Stack {
  public readonly redisConnectionStringSecret: secretsmanager.Secret;
  public readonly redisConnectionStringParameter: ssm.StringParameter;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    // Redis.io connection configuration
    // This will store the Redis.io connection string securely
    this.redisConnectionStringSecret = new secretsmanager.Secret(this, 'RedisConnectionSecret', {
      secretName: `foresight-${props.environment}-redis-connection`,
      description: 'Redis.io connection string for medical code caching - manually set after Redis.io setup',
      secretStringValue: SecretValue.unsafePlainText(
        props.redisConnectionString || 'redis://localhost:6379'
      ),
    });

    // Parameter for non-sensitive Redis configuration (just the URL without credentials)
    this.redisConnectionStringParameter = new ssm.StringParameter(this, 'RedisUrlParameter', {
      parameterName: `/foresight/${props.environment}/cache/redis-url`,
      stringValue: props.redisConnectionString || 'redis://localhost:6379',
      description: 'Redis.io URL for medical code caching',
    });

    // Cache configuration parameters
    new ssm.StringParameter(this, 'CacheDefaultTtl', {
      parameterName: `/foresight/${props.environment}/cache/default-ttl`,
      stringValue: '3600', // 1 hour
      description: 'Default TTL for medical code cache entries (seconds)',
    });

    new ssm.StringParameter(this, 'CacheHotCodesTtl', {
      parameterName: `/foresight/${props.environment}/cache/hot-codes-ttl`,
      stringValue: '7200', // 2 hours
      description: 'TTL for hot codes cache entries (seconds)',
    });

    new ssm.StringParameter(this, 'CacheFallbackMaxSize', {
      parameterName: `/foresight/${props.environment}/cache/fallback-max-size`,
      stringValue: '1000',
      description: 'Maximum entries in fallback in-memory cache',
    });

    // Cache performance monitoring parameters
    new ssm.StringParameter(this, 'CachePrewarmBatchSize', {
      parameterName: `/foresight/${props.environment}/cache/prewarm-batch-size`,
      stringValue: '10',
      description: 'Batch size for cache pre-warming operations',
    });

    // Redis.io backup configuration parameters
    new ssm.StringParameter(this, 'RedisBackupEnabled', {
      parameterName: `/foresight/${props.environment}/cache/backup-enabled`,
      stringValue: 'true', // Always enabled for staging and prod
      description: 'Whether Redis.io automated backups are enabled',
    });

    new ssm.StringParameter(this, 'RedisBackupFrequency', {
      parameterName: `/foresight/${props.environment}/cache/backup-frequency`,
      stringValue: props.environment === 'prod' ? 'hourly' : 'daily',
      description: 'Frequency of Redis.io automated backups',
    });

    new ssm.StringParameter(this, 'RedisBackupRetention', {
      parameterName: `/foresight/${props.environment}/cache/backup-retention`,
      stringValue: props.environment === 'prod' ? '30' : '7',
      description: 'Retention period for Redis.io backups (days)',
    });

    // Output the secret ARN for use in other stacks
    new CfnOutput(this, 'RedisSecretArn', {
      value: this.redisConnectionStringSecret.secretArn,
      description: 'ARN of the Redis connection string secret',
      exportName: `${this.stackName}-redis-secret-arn`,
    });

    new CfnOutput(this, 'RedisParameterName', {
      value: this.redisConnectionStringParameter.parameterName,
      description: 'SSM Parameter name for Redis URL',
      exportName: `${this.stackName}-redis-parameter-name`,
    });
  }

  /**
   * Creates cache-related IAM policy statements for Lambda functions
   */
  public getCacheAccessPolicyStatements() {
    return [
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        Resource: [
          this.redisConnectionStringSecret.secretArn,
        ],
      },
      {
        Effect: 'Allow',
        Action: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        Resource: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/foresight/${this.node.tryGetContext('environment') || 'dev'}/cache/*`,
        ],
      },
    ];
  }
}
