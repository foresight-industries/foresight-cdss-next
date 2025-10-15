#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { QueueStack } from '../lib/stacks/queue-stack';
import { WorkflowStack } from '../lib/stacks/workflow-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { MedicalInfrastructure } from '../lib/medical-infrastructure';

const app = new cdk.App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error('CDK_DEFAULT_ACCOUNT is not defined');
}

for (const envName of ['staging', 'prod']) {
  const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  };

  const database = new DatabaseStack(app, `RCM-Database-${envName}`, {
    env,
    stageName: envName,
    config: {
      dbMinCapacity: envName === 'prod' ? 2 : 0.5,
      dbMaxCapacity: envName === 'prod' ? 4 : 1,
      logRetention: envName === 'prod' ? 30 : 7,
      enableDeletionProtection: envName === 'prod', // Only enable for prod during staging recreation
    },
  });

  const storage = new StorageStack(app, `RCM-Storage-${envName}`, {
    env,
    stageName: envName,
  });

  // Create medical infrastructure (cache + medical data)
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

  const queues = new QueueStack(app, `RCM-Queues-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
    alertTopicArn: alerting.alarmTopic.topicArn,
  });

  const api = new ApiStack(app, `RCM-API-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
    cacheStack: medicalInfra.cacheStack,
    medicalDataStack: medicalInfra.medicalDataStack,
  });

  const workflows = new WorkflowStack(app, `RCM-Workflows-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    queues,
  });

  const security = new SecurityStack(app, `RCM-Security-${envName}`, {
    env,
    stageName: envName,
    api: api.httpApi,
  });

  const monitoring = new MonitoringStack(app, `RCM-Monitoring-${envName}`, {
    env,
    stageName: envName,
    api: api.httpApi,
    database: database.cluster,
    stackType: 'monitoring',
    queues: {
      claimsQueue: queues.claimsQueue,
      webhookQueue: queues.webhookQueue,
      dlq: queues.dlq,
    },
  });

  // Add dependencies
  alerting.addDependency(database);
  medicalInfra.addDependency(database);
  medicalInfra.addDependency(storage);
  queues.addDependency(database);
  queues.addDependency(storage);
  queues.addDependency(alerting);
  api.addDependency(database);
  api.addDependency(storage);
  api.addDependency(medicalInfra);
  workflows.addDependency(queues);
  security.addDependency(api);
  monitoring.addDependency(api);
  monitoring.addDependency(queues);
}
