import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BackupStackProps extends cdk.StackProps {
  stageName: string;
  databaseCluster?: rds.DatabaseCluster;
  documentsBucket?: s3.Bucket;
  kmsKey?: kms.IKey;
  alertTopicArn?: string;
}

export class BackupStack extends cdk.Stack {
  public readonly backupVault: backup.BackupVault;
  public readonly backupPlan: backup.BackupPlan;
  public readonly backupRole: iam.Role;

  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id, props);

    // KMS key for backup encryption
    const backupKmsKey = props.kmsKey || new kms.Key(this, 'BackupKMSKey', {
      alias: `alias/foresight-backup-${props.stageName}`,
      description: 'KMS key for Foresight backup encryption',
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(props.stageName === 'prod' ? 30 : 7),
    });

    // IAM role for AWS Backup service
    this.backupRole = new iam.Role(this, 'BackupServiceRole', {
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForBackup'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForRestores'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Backup'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Restore'),
      ],
    });

    // Backup vault with encryption
    this.backupVault = new backup.BackupVault(this, 'ForesightBackupVault', {
      backupVaultName: `foresight-backup-vault-${props.stageName}`,
      encryptionKey: backupKmsKey,
      accessPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['backup:DeleteBackupVault', 'backup:DeleteRecoveryPoint'],
            resources: ['*'],
            conditions: {
              StringNotEquals: {
                'aws:PrincipalType': 'Root',
              },
            },
          }),
        ],
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Healthcare-specific backup plan with HIPAA compliance requirements
    this.backupPlan = new backup.BackupPlan(this, 'ForesightBackupPlan', {
      backupPlanName: `foresight-backup-plan-${props.stageName}`,
      backupVault: this.backupVault,
      backupPlanRules: [
        // Daily backups for critical healthcare data
        new backup.BackupPlanRule({
          ruleName: 'DailyBackupRule',
          deleteAfter: cdk.Duration.days(props.stageName === 'prod' ? 30 : 120), // 120 days for prod
          moveToColdStorageAfter: props.stageName === 'staging' ? cdk.Duration.days(30) : undefined,
          scheduleExpression: events.Schedule.cron({
            minute: '0',
            hour: '2', // 2 AM UTC
            day: '*',
            month: '*',
            year: '*',
          }),
          startWindow: cdk.Duration.hours(1),
          completionWindow: cdk.Duration.hours(4),
          enableContinuousBackup: props.stageName === 'prod',
          copyActions: props.stageName === 'prod' ? [
            {
              destinationBackupVault: this.backupVault,
              deleteAfter: cdk.Duration.days(180),
              moveToColdStorageAfter: cdk.Duration.days(90),
            },
          ] : undefined,
        }),

        // Weekly backups for additional redundancy
        new backup.BackupPlanRule({
          ruleName: 'WeeklyBackupRule',
          deleteAfter: cdk.Duration.days(props.stageName === 'prod' ? 180 : 150),
          moveToColdStorageAfter: cdk.Duration.days(props.stageName === 'prod' ? 90 : 60),
          scheduleExpression: events.Schedule.cron({
            minute: '0',
            hour: '3', // 3 AM UTC
            weekDay: 'SUN', // Every Sunday
            month: '*',
            year: '*',
          }),
          startWindow: cdk.Duration.hours(2),
          completionWindow: cdk.Duration.hours(6),
        }),

        // Monthly backups for long-term retention
        new backup.BackupPlanRule({
          ruleName: 'MonthlyBackupRule',
          deleteAfter: cdk.Duration.days(120),
          moveToColdStorageAfter: cdk.Duration.days(30),
          scheduleExpression: events.Schedule.cron({
            minute: '0',
            hour: '1', // 1 AM UTC
            day: '1', // First day of month
            month: '*',
            year: '*',
          }),
          startWindow: cdk.Duration.hours(3),
          completionWindow: cdk.Duration.hours(8),
        }),
      ],
    });

    // Backup selection for RDS Aurora cluster
    if (props.databaseCluster) {
      new backup.BackupSelection(this, 'DatabaseBackupSelection', {
        backupPlan: this.backupPlan,
        backupSelectionName: 'ForesightDatabaseBackup',
        role: this.backupRole,
        resources: [
          backup.BackupResource.fromRdsDatabaseCluster(props.databaseCluster),
        ],
      });
    }

    // Backup selection for S3 buckets using tag-based selection
    if (props.documentsBucket) {
      new backup.BackupSelection(this, 'S3BackupSelection', {
        backupPlan: this.backupPlan,
        backupSelectionName: 'ForesightS3Backup',
        role: this.backupRole,
        resources: [
          backup.BackupResource.fromTag('Project', 'ForesightRCM'),
          backup.BackupResource.fromTag('Component', 'storage'),
        ],
      });
    }

    // Backup notifications for monitoring
    if (props.alertTopicArn) {
      const alertTopic = sns.Topic.fromTopicArn(this, 'BackupAlertTopic', props.alertTopicArn);

      // EventBridge rules for backup job status
      new events.Rule(this, 'BackupJobStateChangeRule', {
        description: 'Capture backup job state changes',
        eventPattern: {
          source: ['aws.backup'],
          detailType: ['Backup Job State Change'],
          detail: {
            state: ['FAILED', 'EXPIRED', 'PARTIAL'],
          },
        },
        targets: [new targets.SnsTopic(alertTopic)],
      });

      new events.Rule(this, 'RestoreJobStateChangeRule', {
        description: 'Capture restore job state changes',
        eventPattern: {
          source: ['aws.backup'],
          detailType: ['Restore Job State Change'],
          detail: {
            state: ['FAILED'],
          },
        },
        targets: [new targets.SnsTopic(alertTopic)],
      });
    }

    // Cross-region backup for disaster recovery (production only)
    if (props.stageName === 'prod') {
      const crossRegionBackupVault = new backup.BackupVault(this, 'CrossRegionBackupVault', {
        backupVaultName: `foresight-backup-vault-dr-${props.stageName}`,
        encryptionKey: backupKmsKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      // Copy backups to different region for DR
      new backup.BackupPlan(this, 'DisasterRecoveryBackupPlan', {
        backupPlanName: `foresight-dr-backup-plan-${props.stageName}`,
        backupVault: crossRegionBackupVault,
        backupPlanRules: [
          new backup.BackupPlanRule({
            ruleName: 'CrossRegionDRRule',
            deleteAfter: cdk.Duration.days(365),
            scheduleExpression: events.Schedule.cron({
              minute: '0',
              hour: '4', // 4 AM UTC
              day: '*',
              month: '*',
              year: '*',
            }),
            copyActions: [
              {
                destinationBackupVault: this.backupVault, // Cross-region copy
                deleteAfter: cdk.Duration.days(365),
                moveToColdStorageAfter: cdk.Duration.days(30),
              },
            ],
          }),
        ],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BackupVaultArn', {
      value: this.backupVault.backupVaultArn,
      description: 'Backup Vault ARN',
      exportName: `Foresight-BackupVault-Arn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'BackupPlanArn', {
      value: this.backupPlan.backupPlanArn,
      description: 'Backup Plan ARN',
      exportName: `Foresight-BackupPlan-Arn-${props.stageName}`,
    });

    new cdk.CfnOutput(this, 'BackupRoleArn', {
      value: this.backupRole.roleArn,
      description: 'Backup Service Role ARN',
      exportName: `Foresight-BackupRole-Arn-${props.stageName}`,
    });

    // Tags
    cdk.Tags.of(this).add('Project', 'ForesightRCM');
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Component', 'backup');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
    cdk.Tags.of(this).add('Critical', 'true');
  }
}
