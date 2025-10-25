#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { QueueStack } from '../lib/stacks/queue-stack';
import { WorkflowStack } from '../lib/stacks/workflow-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { DocumentProcessingStack } from '../lib/stacks/document-processing-stack';
import { MedicalInfrastructure } from '../lib/medical-infrastructure';
import { WebhookStack } from '../lib/stacks/webhook-stack';
import { AppSyncStack } from '../lib/stacks/appsync-stack';
import { CloudTrailStack } from '../lib/stacks/cloudtrail-stack';
import { BatchStack } from '../lib/stacks/batch-stack';
import { ElastiCacheStack } from '../lib/stacks/elasticache-stack';
import { ApplicationStack } from '../lib/stacks/application-stack';
import { AppConfigStack } from '../lib/stacks/appconfig-stack';
import { BackupStack } from '../lib/stacks/backup-stack';
import { GrafanaStack } from '../lib/stacks/grafana-stack';
import { AutomationLifecycleStack } from '../lib/stacks/automation-lifecycle-stack';
import { CodeSigningStack } from '../lib/security/code-signing-stack';
import { SharedLayerStack } from '../lib/stacks/shared-layer-stack';
import { ConfigStack } from '../lib/stacks/config-stack';
import { SecurityHubStack } from '../lib/stacks/security-hub-stack';

const app = new cdk.App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error('CDK_DEFAULT_ACCOUNT is not defined');
}

for (const envName of ['staging', 'prod']) {
  const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  };

  // Shared dependencies layer for Lambda functions
  const sharedLayer = new SharedLayerStack(app, `RCM-SharedLayer-${envName}`, {
    env,
    stageName: envName,
  });

  // Code signing infrastructure for enterprise-grade security and HIPAA compliance
  const codeSigning = new CodeSigningStack(app, `RCM-CodeSigning-${envName}`, {
    env,
    stageName: envName,
    securityAlertEmail: 'ops@have-foresight.com',
  });

  const database = new DatabaseStack(app, `RCM-Database-${envName}`, {
    env,
    stageName: envName,
    config: {
      dbMinCapacity: envName === 'prod' ? 2 : 0.5,
      dbMaxCapacity: envName === 'prod' ? 4 : 1,
      logRetention: envName === 'prod' ? 30 : 7,
      enableDeletionProtection: envName === 'prod', // Only enable for prod during staging recreation
    },
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  const storage = new StorageStack(app, `RCM-Storage-${envName}`, {
    env,
    stageName: envName,
  });

  // Create medical infrastructure (cache + medical data + comprehend medical)
  const medicalInfra = new MedicalInfrastructure(app, `RCM-Medical-${envName}`, {
    env,
    environment: envName as 'staging' | 'prod',
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
  });

  // Create a simple alert stack first (just SNS topic and database alarms)
  const alerting = new MonitoringStack(app, `RCM-Alerting-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    stackType: 'alerting',
    // No API provided - will skip API Gateway alarms and dashboard widgets
  });

  // ElastiCache for session management, API caching, and rate limiting
  const elastiCache = new ElastiCacheStack(app, `RCM-ElastiCache-${envName}`, {
    env,
    stageName: envName,
    vpc: database.vpc,
    alertTopicArn: alerting.alarmTopic.topicArn,
  });

  const queues = new QueueStack(app, `RCM-Queues-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
    alertTopicArn: alerting.alarmTopic.topicArn,
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  const api = new ApiStack(app, `RCM-API-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
    cacheStack: medicalInfra.cacheStack,
    medicalDataStack: medicalInfra.medicalDataStack,
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  const workflows = new WorkflowStack(app, `RCM-Workflows-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
  });

  const security = new SecurityStack(app, `RCM-Security-${envName}`, {
    env,
    stageName: envName,
    api: api.httpApi,
  });

  // Document processing stack - use CloudFormation import to avoid dependency
  const documentProcessing = new DocumentProcessingStack(app, `RCM-DocumentProcessing-${envName}`, {
    env,
    stageName: envName,
    documentsBucketName: cdk.Fn.importValue(`RCM-DocumentsBucket-${envName}`),
    database: database.cluster,
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  // Enhanced webhook system
  const webhooks = new WebhookStack(app, `RCM-Webhooks-${envName}`, {
    env,
    stageName: envName as 'staging' | 'prod',
    database: database.cluster,
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  // AppSync GraphQL API for real-time data sync
  const appSync = new AppSyncStack(app, `RCM-AppSync-${envName}`, {
    env,
    stageName: envName,
    databaseCluster: database.cluster,
    databaseSecret: database.cluster.secret!,
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  // CloudTrail for audit logging and HIPAA compliance
  const cloudTrail = new CloudTrailStack(app, `RCM-CloudTrail-${envName}`, {
    env,
    stageName: envName,
  });

  // AWS Batch for bulk processing (claims, EDI, reporting)
  const batch = new BatchStack(app, `RCM-Batch-${envName}`, {
    env,
    stageName: envName,
    vpc: database.vpc,
    databaseCluster: database.cluster,
    databaseSecret: database.cluster.secret!,
  });

  // Application organization and resource groups
  const application = new ApplicationStack(app, `RCM-Application-${envName}`, {
    env,
    stageName: envName,
  });

  // Feature flags and configuration management
  const appConfig = new AppConfigStack(app, `RCM-AppConfig-${envName}`, {
    env,
    stageName: envName,
  });

  // Backup and disaster recovery for HIPAA compliance
  const backup = new BackupStack(app, `RCM-Backup-${envName}`, {
    env,
    stageName: envName,
    databaseCluster: database.cluster,
    documentsBucket: storage.documentsBucket,
    kmsKey: storage.encryptionKey,
    alertTopicArn: alerting.alarmTopic.topicArn,
  });

  // AWS Managed Grafana for observability and monitoring
  const grafana = new GrafanaStack(app, `RCM-Grafana-${envName}`, {
    env,
    stageName: envName,
  });

  // Automation lifecycle management for cost optimization
  const automationLifecycle = new AutomationLifecycleStack(app, `RCM-AutomationLifecycle-${envName}`, {
    env,
    bucketName: storage.documentsBucket.bucketName,
    environment: envName as 'staging' | 'production',
  });

  const monitoring = new MonitoringStack(app, `RCM-Monitoring-${envName}`, {
    env,
    stageName: envName,
    api: api.httpApi,
    database: database.cluster,
    stackType: 'monitoring',
    queues: {
      claimsQueue: queues.claimsQueue,
      dlq: queues.dlq,
    },
    webhookQueue: webhooks.webhookQueue,
  });

  // AWS Config for continuous HIPAA compliance monitoring
  const config = new ConfigStack(app, `RCM-Config-${envName}`, {
    env,
    stageName: envName,
    complianceEmail: 'ops@have-foresight.com',
    codeSigningConfigArn: codeSigning.codeSigningConfig.codeSigningConfigArn,
  });

  // AWS Security Hub for centralized security findings and compliance dashboard
  const securityHub = new SecurityHubStack(app, `RCM-SecurityHub-${envName}`, {
    env,
    stageName: envName,
    securityEmail: 'ops@have-foresight.com',
    configTopicArn: config.configTopic.topicArn,
  });

  // Add dependencies
  // Code signing stack dependencies - must deploy first
  database.addDependency(codeSigning);
  queues.addDependency(codeSigning);
  api.addDependency(codeSigning);
  documentProcessing.addDependency(codeSigning);
  webhooks.addDependency(codeSigning);
  appSync.addDependency(codeSigning);
  config.addDependency(codeSigning);

  alerting.addDependency(database);
  elastiCache.addDependency(database);
  elastiCache.addDependency(alerting);
  medicalInfra.addDependency(database);
  medicalInfra.addDependency(storage);
  queues.addDependency(database);
  queues.addDependency(storage);
  queues.addDependency(alerting);
  api.addDependency(database);
  api.addDependency(storage);
  api.addDependency(medicalInfra);
  // API stack can optionally use ElastiCache for response caching and rate limiting
  api.addDependency(elastiCache);
  workflows.addDependency(queues);
  security.addDependency(api);
  documentProcessing.addDependency(database);
  webhooks.addDependency(database);
  appSync.addDependency(database);
  // AppSync can use ElastiCache for real-time metrics caching
  appSync.addDependency(elastiCache);
  batch.addDependency(database);
  // Batch jobs can use ElastiCache for distributed locks and query caching
  batch.addDependency(elastiCache);
  // CloudTrail has no dependencies as it's account-wide infrastructure

  // New stack dependencies
  // Application stack has no dependencies - it's organizational only
  // AppConfig has no dependencies - it's configuration management
  backup.addDependency(database);
  backup.addDependency(storage);
  backup.addDependency(alerting); // For SNS notifications
  grafana.addDependency(alerting); // For monitoring integration

  // Note: Removed documentProcessing.addDependency(storage) to avoid cyclic dependency
  // The S3 event notifications below will create the necessary dependency automatically
  monitoring.addDependency(api);
  monitoring.addDependency(queues);
  monitoring.addDependency(webhooks);

  // Add dependencies for AutomationLifecycleStack
  automationLifecycle.addDependency(storage); // Needs to access the S3 bucket

  // Security Hub dependency - must deploy after Config to integrate properly
  securityHub.addDependency(config);

  // Add AWS Systems Manager Application Manager cost tracking tags to all stacks
  const allStacks = [
    sharedLayer, codeSigning, database, storage, medicalInfra, alerting, elastiCache, queues, api, workflows,
    security, documentProcessing, webhooks, appSync, cloudTrail, batch, application,
    appConfig, backup, grafana, automationLifecycle, monitoring, config, securityHub
  ];

  for (const stack of allStacks) {
    cdk.Tags.of(stack).add('AppManagerCFNStackKey', `foresight-rcm-${envName}`);
  }

  // Configure S3 event notifications after both stacks are created
  // This avoids cyclic dependencies between storage and document processing
  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.documentProcessorFunction),
    {
      prefix: 'documents/',
      suffix: '.pdf',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.documentProcessorFunction),
    {
      prefix: 'documents/',
      suffix: '.png',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.documentProcessorFunction),
    {
      prefix: 'documents/',
      suffix: '.jpg',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.documentProcessorFunction),
    {
      prefix: 'documents/',
      suffix: '.jpeg',
    }
  );

  // Insurance card processing notifications
  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.insuranceCardProcessorFunction),
    {
      prefix: 'insurance-cards/',
      suffix: '.pdf',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.insuranceCardProcessorFunction),
    {
      prefix: 'insurance-cards/',
      suffix: '.png',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.insuranceCardProcessorFunction),
    {
      prefix: 'insurance-cards/',
      suffix: '.jpg',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.insuranceCardProcessorFunction),
    {
      prefix: 'insurance-cards/',
      suffix: '.jpeg',
    }
  );

  storage.documentsBucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3notifications.LambdaDestination(documentProcessing.insuranceCardProcessorFunction),
    {
      prefix: 'insurance-cards/',
      suffix: '.heic',
    }
  );
}
