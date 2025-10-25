/**
 * Environment setup for LocalStack tests
 * Sets up required environment variables for LocalStack integration
 */

// LocalStack environment configuration
process.env.NODE_ENV = 'localstack';
process.env.AWS_DEFAULT_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.CDK_DEFAULT_ACCOUNT = '000000000000';

// LocalStack endpoint configuration
process.env.LOCALSTACK_ENDPOINT = 'http://localhost:4566';
process.env.LOCALSTACK_HOST = 'localhost.localstack.cloud';

// Healthcare RCM specific configuration
process.env.STAGE_NAME = 'local';
process.env.DB_HOST = 'localhost.localstack.cloud';
process.env.DB_PORT = '4566';
process.env.DB_NAME = 'foresight_rcm_local';
process.env.DB_USER = 'localstack';
process.env.DB_PASSWORD = 'localstack';

// S3 bucket configuration
process.env.DOCUMENTS_BUCKET = 'rcm-documents-local-000000000000';
process.env.INSURANCE_CARDS_BUCKET = 'rcm-insurance-cards-local-000000000000';

// Security configuration
process.env.ENCRYPTION_KEY_ALIAS = 'alias/rcm-local-key';
process.env.CODE_SIGNING_PROFILE = 'rcm-local-signing-profile';

// Compliance configuration
process.env.ENABLE_HIPAA_LOGGING = 'true';
process.env.ENABLE_AUDIT_TRAIL = 'true';
process.env.ENABLE_ENCRYPTION_AT_REST = 'true';
process.env.ENABLE_CODE_SIGNING = 'true';

// Logging configuration
process.env.LOG_LEVEL = 'DEBUG';
process.env.ENABLE_CLOUDWATCH_LOGS = 'true';

// Test email addresses
process.env.COMPLIANCE_EMAIL = 'compliance-test@localhost';
process.env.SECURITY_EMAIL = 'security-test@localhost';

console.log('LocalStack environment variables configured for testing');