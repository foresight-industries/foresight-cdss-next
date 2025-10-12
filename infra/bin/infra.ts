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

const app = new cdk.App();

['staging', 'prod'].forEach(envName => {
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
      enableDeletionProtection: envName === 'prod',
    },
  });

  const storage = new StorageStack(app, `RCM-Storage-${envName}`, {
    env,
    stageName: envName,
  });

  const queues = new QueueStack(app, `RCM-Queues-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentsBucket: storage.documentsBucket,
  });

  const api = new ApiStack(app, `RCM-API-${envName}`, {
    env,
    stageName: envName,
    database: database.cluster,
    documentssBucket: storage.documentsBucket,
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
    queues: {
      claimsQueue: queues.claimsQueue,
      webhookQueue: queues.webhookQueue,
      dlq: queues.dlq,
    },
  });

  // Add dependencies
  api.addDependency(database);
  api.addDependency(storage);
  queues.addDependency(database);
  queues.addDependency(storage);
  workflows.addDependency(queues);
  security.addDependency(api);
  monitoring.addDependency(api);
  monitoring.addDependency(queues);
});
