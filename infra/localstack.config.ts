/**
 * LocalStack-specific CDK configuration for Healthcare RCM Platform
 * This file contains LocalStack-specific overrides and configurations
 */

import * as cdk from 'aws-cdk-lib';

export interface LocalStackConfig {
  endpoint: string;
  region: string;
  accountId: string;
  enableCodeSigning: boolean;
  enableCompliance: boolean;
  enableEncryption: boolean;
}

export const getLocalStackConfig = (): LocalStackConfig => ({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'https://localhost.localstack.cloud:4566',
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  accountId: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  enableCodeSigning: process.env.ENABLE_CODE_SIGNING === 'true',
  enableCompliance: process.env.ENABLE_HIPAA_LOGGING === 'true',
  enableEncryption: process.env.ENABLE_ENCRYPTION_AT_REST === 'true',
});

export const getLocalStackEnvironment = (): cdk.Environment => {
  const config = getLocalStackConfig();
  return {
    account: config.accountId,
    region: config.region,
  };
};

/**
 * LocalStack-specific stack props with healthcare compliance defaults
 */
export const getLocalStackStackProps = (stackName: string): cdk.StackProps => {
  return {
    env: getLocalStackEnvironment(),
    stackName: `${stackName}-local`,
    description: `LocalStack deployment of ${stackName} for Healthcare RCM Platform`,
    tags: {
      Environment: 'localstack',
      Purpose: 'LocalDevelopment',
      HealthcareCompliance: 'HIPAA-Testing',
      Project: 'ForesightRCM',
      LocalStack: 'true',
    },
  };
};

/**
 * Check if we're running in LocalStack environment
 */
export const isLocalStackEnvironment = (): boolean => {
  return (
    process.env.NODE_ENV === 'localstack' ||
    process.env.CDK_DEFAULT_ACCOUNT === '000000000000' ||
    process.env.LOCALSTACK_HOST !== undefined
  );
};

/**
 * Get appropriate encryption configuration for LocalStack
 * TODO: Use this function when customizing encryption settings for LocalStack stacks
 */
export const getLocalStackEncryptionConfig = () => {
  if (!isLocalStackEnvironment()) {
    throw new Error('This function should only be called in LocalStack environment');
  }
  
  return {
    // In LocalStack, we can use simpler encryption for testing
    enableKMSEncryption: getLocalStackConfig().enableEncryption,
    keyRotationEnabled: false, // Simplified for local testing
    keyAlias: 'alias/localstack-rcm-key',
  };
};

/**
 * Get appropriate database configuration for LocalStack
 * TODO: Use this function when customizing database settings for LocalStack stacks
 */
export const getLocalStackDatabaseConfig = () => {
  return {
    enableDeletionProtection: false, // Allow easy cleanup in local
    enableBackups: false, // Simplified for local testing
    enablePerformanceInsights: false, // Not supported in LocalStack
    enableCloudwatchLogsExport: false, // Simplified for local
    enableEncryption: getLocalStackConfig().enableEncryption,
  };
};