/**
 * LocalStack test setup
 * Sets up test environment for LocalStack integration tests
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Check if LocalStack is running
async function checkLocalStackHealth(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('curl -s http://localhost:4566/_localstack/health');
    const health = JSON.parse(stdout);

    // Check if core services are available
    const requiredServices = ['s3', 'lambda', 'sns', 'sts', 'iam'];
    const availableServices = Object.keys(health.services || {});

    for (const service of requiredServices) {
      if (!availableServices.includes(service) || health.services[service] !== 'available') {
        console.warn(`Required service ${service} is not available in LocalStack`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to check LocalStack health:', error);
    return false;
  }
}

// Wait for LocalStack to be ready
async function waitForLocalStack(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Checking LocalStack health (attempt ${attempt}/${maxAttempts})...`);

    if (await checkLocalStackHealth()) {
      console.log('LocalStack is ready for testing');
      return;
    }

    if (attempt < maxAttempts) {
      console.log(`LocalStack not ready, waiting ${intervalMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('LocalStack failed to become ready within the expected time');
}

// Setup function called before each test file
beforeAll(async () => {
  console.log('Setting up LocalStack integration tests...');

  try {
    await waitForLocalStack();
    console.log('LocalStack setup completed successfully');
  } catch (error) {
    console.error('LocalStack setup failed:', error);
    throw error;
  }
}, 120000); // 2 minute timeout for setup

// Cleanup function called after each test file
afterAll(async () => {
  console.log('Cleaning up LocalStack test resources...');
  // Add any cleanup logic here if needed
});
