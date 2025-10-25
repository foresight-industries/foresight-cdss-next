import type { Config } from 'jest';

const config: Config = {
  displayName: 'LocalStack Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test files
  testMatch: [
    '<rootDir>/tests/localstack/**/*.test.ts',
    '<rootDir>/tests/localstack/**/*.test.js',
  ],

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/localstack/setup.ts'],
  globalSetup: '<rootDir>/tests/localstack/global-setup.ts',
  globalTeardown: '<rootDir>/tests/localstack/global-teardown.ts',

  // Timeouts for infrastructure tests
  testTimeout: 120000, // 2 minutes for infrastructure tests

  // Environment variables
  setupFiles: ['<rootDir>/tests/localstack/env-setup.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@foresight-cdss-next/(.*)$': '<rootDir>/packages/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },

  // Coverage (optional for integration tests)
  collectCoverage: false,

  // Verbose output for debugging
  verbose: true,

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-output/localstack',
      outputName: 'localstack-results.xml',
      suiteName: 'LocalStack Integration Tests',
    }],
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Fail on any console.error
  errorOnDeprecated: true,
};

export default config;
