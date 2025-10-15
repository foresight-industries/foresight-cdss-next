import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';

export interface MedicalDataStackProps extends StackProps {
  environment: 'staging' | 'prod';
}

export class MedicalDataStack extends Stack {
  public readonly medicalCodesBucket: s3.Bucket;
  public readonly medicalCodesBackupBucket: s3.Bucket;
  public readonly processingRole: iam.Role;

  constructor(scope: Construct, id: string, props: MedicalDataStackProps) {
    super(scope, id, props);

    // S3 bucket for storing annual medical code files (ICD-10, CPT)
    this.medicalCodesBucket = new s3.Bucket(this, 'MedicalCodesBucket', {
      bucketName: `foresight-${props.environment}-medical-codes`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(90),
        },
        {
          id: 'ArchiveOldFiles',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
        {
          id: 'RedisBackupLifecycle',
          enabled: true,
          prefix: 'backups/redis/',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30), // AWS minimum for IA transition
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90), // Archive Redis backups after 90 days
            },
          ],
          expiration: Duration.days(props.environment === 'prod' ? 365 : 180), // Keep staging backups 6 months, prod 1 year
        },
      ],
      removalPolicy: props.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Backup bucket for medical code data
    this.medicalCodesBackupBucket = new s3.Bucket(this, 'MedicalCodesBackupBucket', {
      bucketName: `foresight-${props.environment}-medical-codes-backup`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'RetainBackups',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: Duration.days(365),
            },
          ],
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN, // Always retain backups
    });

    // Add official Redis.io backup access policy as per Redis documentation
    this.medicalCodesBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RedisCloudBackupsAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal('arn:aws:iam::168085023892:root')],
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject',
        ],
        resources: [
          `${this.medicalCodesBucket.bucketArn}/backups/redis/*`,
        ],
      })
    );

    // Cross-bucket replication for disaster recovery
    if (props.environment === 'prod') {
      // Enable replication to our s3 backup bucket
      this.medicalCodesBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
          actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
          resources: [`${this.medicalCodesBackupBucket.bucketArn}/*`],
        })
      );
    }

    // IAM role for medical code processing
    this.processingRole = new iam.Role(this, 'MedicalCodeProcessingRole', {
      roleName: `foresight-${props.environment}-medical-code-processing`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        MedicalCodeProcessingPolicy: new iam.PolicyDocument({
          statements: [
            // S3 bucket access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.medicalCodesBucket.bucketArn,
                `${this.medicalCodesBucket.bucketArn}/*`,
                this.medicalCodesBackupBucket.bucketArn,
                `${this.medicalCodesBackupBucket.bucketArn}/*`,
              ],
            }),
            // RDS access for code updates
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds-data:BeginTransaction',
                'rds-data:CommitTransaction',
                'rds-data:ExecuteStatement',
                'rds-data:RollbackTransaction',
              ],
              resources: ['*'], // Will be restricted by database resource ARN in practice
            }),
            // Secrets Manager access for database credentials
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:foresight-${props.environment}-*`,
              ],
            }),
          ],
        }),
      },
    });

    // Store bucket configurations in SSM
    new ssm.StringParameter(this, 'MedicalCodesBucketName', {
      parameterName: `/foresight/${props.environment}/storage/medical-codes-bucket`,
      stringValue: this.medicalCodesBucket.bucketName,
      description: 'S3 bucket name for medical code files',
    });

    new ssm.StringParameter(this, 'MedicalCodesBackupBucketName', {
      parameterName: `/foresight/${props.environment}/storage/medical-codes-backup-bucket`,
      stringValue: this.medicalCodesBackupBucket.bucketName,
      description: 'S3 bucket name for medical code backups',
    });

    // File structure parameters
    new ssm.StringParameter(this, 'IcdCodesPrefix', {
      parameterName: `/foresight/${props.environment}/storage/icd-codes-prefix`,
      stringValue: 'icd10-codes/',
      description: 'S3 prefix for ICD-10 code files',
    });

    new ssm.StringParameter(this, 'CptCodesPrefix', {
      parameterName: `/foresight/${props.environment}/storage/cpt-codes-prefix`,
      stringValue: 'cpt-codes/',
      description: 'S3 prefix for CPT code files',
    });

    // Medical codes import and backup structure
    new ssm.StringParameter(this, 'MedicalCodesImportPrefix', {
      parameterName: `/foresight/${props.environment}/storage/medical-codes-import-prefix`,
      stringValue: 'medical-codes-import/',
      description: 'S3 prefix for annual medical code import files',
    });

    new ssm.StringParameter(this, 'MedicalCodesBackupPrefix', {
      parameterName: `/foresight/${props.environment}/storage/medical-codes-backup-prefix`,
      stringValue: 'medical-codes-backup/',
      description: 'S3 prefix for medical code backup files',
    });

    new ssm.StringParameter(this, 'BackupsPrefix', {
      parameterName: `/foresight/${props.environment}/storage/backups-prefix`,
      stringValue: 'backups/',
      description: 'S3 prefix for database backups',
    });

    // Redis backup configuration parameters
    const redisBackupPath = props.environment === 'staging'
      ? 'backups/redis/daily/'
      : 'backups/redis/hourly/'; // prod

    new ssm.StringParameter(this, 'RedisBackupPath', {
      parameterName: `/foresight/${props.environment}/storage/redis-backup-path`,
      stringValue: redisBackupPath,
      description: 'S3 path for Redis backup files from Redis.io',
    });

    new ssm.StringParameter(this, 'RedisBackupBucket', {
      parameterName: `/foresight/${props.environment}/storage/redis-backup-bucket`,
      stringValue: this.medicalCodesBucket.bucketName,
      description: 'S3 bucket for Redis backup files from Redis.io',
    });

    new ssm.StringParameter(this, 'RedisBackupFullPath', {
      parameterName: `/foresight/${props.environment}/storage/redis-backup-full-path`,
      stringValue: `s3://${this.medicalCodesBucket.bucketName}/${redisBackupPath}`,
      description: 'Complete S3 path for Redis.io backup destination',
    });

    // EventBridge rule for annual code updates (October for ICD-10, January for CPT)
    const icd10UpdateRule = new events.Rule(this, 'ICD10AnnualUpdateRule', {
      ruleName: `foresight-${props.environment}-icd10-annual-update`,
      description: 'Triggers ICD-10 code update process annually in October',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // 2 AM UTC
        day: '1',  // 1st of the month
        month: '10', // October
      }),
      enabled: props.environment === 'prod',
    });

    const cptUpdateRule = new events.Rule(this, 'CPTAnnualUpdateRule', {
      ruleName: `foresight-${props.environment}-cpt-annual-update`,
      description: 'Triggers CPT code update process annually in January',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // 2 AM UTC
        day: '1',  // 1st of the month
        month: '1', // January
      }),
      enabled: props.environment === 'prod',
    });

    // Outputs
    new CfnOutput(this, 'MedicalCodesBucketOutput', {
      value: this.medicalCodesBucket.bucketName,
      description: 'S3 bucket for medical code files',
      exportName: `${this.stackName}-medical-codes-bucket`,
    });

    new CfnOutput(this, 'MedicalCodesBucketArnOutput', {
      value: this.medicalCodesBucket.bucketArn,
      description: 'ARN of the medical codes S3 bucket',
      exportName: `${this.stackName}-medical-codes-bucket-arn`,
    });

    new CfnOutput(this, 'ProcessingRoleArnOutput', {
      value: this.processingRole.roleArn,
      description: 'IAM role ARN for medical code processing',
      exportName: `${this.stackName}-processing-role-arn`,
    });
  }

  /**
   * Creates S3 access policy statements for Lambda functions
   */
  public getS3AccessPolicyStatements() {
    return [
      {
        Effect: 'Allow',
        Action: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:ListBucket',
        ],
        Resource: [
          this.medicalCodesBucket.bucketArn,
          `${this.medicalCodesBucket.bucketArn}/*`,
          this.medicalCodesBackupBucket.bucketArn,
          `${this.medicalCodesBackupBucket.bucketArn}/*`,
        ],
      },
    ];
  }
}
