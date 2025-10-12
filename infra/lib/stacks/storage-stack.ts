import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  stageName: string;
}

export class StorageStack extends cdk.Stack {
  public readonly documentsBucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Customer-managed KMS key for PHI encryption
    this.encryptionKey = new kms.Key(this, 'PHIEncryptionKey', {
      alias: `rcm-phi-key-${props.stageName}`,
      description: 'KMS key for RCM PHI data encryption',
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(props.stageName === 'prod' ? 30 : 7),
    });

    // Bucket for audit logs
    const auditBucket = new s3.Bucket(this, 'AuditLogsBucket', {
      bucketName: `rcm-audit-logs-${props.stageName}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'retain-then-delete',
        expiration: cdk.Duration.days(props.stageName === 'prod' ? 2555 : 90), // 7 years for prod
      }],
      objectLockEnabled: props.stageName === 'prod', // WORM for compliance
    });

    // S3 bucket for documents with HIPAA compliance
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `rcm-documents-${props.stageName}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: auditBucket,
      serverAccessLogsPrefix: 'documents-access/',
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'move-to-ia',
          transitions: [{
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(30),
          }],
        },
      ],
      cors: [{
        allowedOrigins: props.stageName === 'prod'
          ? ['https://have-foresight.app']
          : ['http://localhost:3000', 'https://*.vercel.app'],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
        maxAge: 3000,
      }],
      enforceSSL: true,
      removalPolicy: props.stageName === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stageName !== 'prod',
    });


    // Outputs
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      exportName: `RCM-DocumentsBucket-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.encryptionKey.keyId,
      exportName: `RCM-KMSKeyId-${props.stageName}`,
    });
  }
}
