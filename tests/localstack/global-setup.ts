/**
 * Global setup for LocalStack integration tests
 * Ensures LocalStack is running before any tests execute
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const execAsync = promisify(exec);

async function globalSetup(): Promise<void> {
  console.log('🚀 Starting LocalStack global setup...');

  const projectRoot = path.resolve(__dirname, '../..');
  const envFile = path.join(projectRoot, '.env.localstack.local');

  // Check if environment file exists
  if (!existsSync(envFile)) {
    throw new Error(
      'LocalStack environment file not found. Please run: yarn local:setup'
    );
  }

  // Check if Docker is running
  try {
    await execAsync('docker ps');
    console.log('✅ Docker is running');
  } catch (error) {
    console.error('Docker is not running - LocalStack cannot start', error);
    throw new Error('Docker is not running. Please start Docker before running tests.');
  }

  // Check if LocalStack is already running
  let isLocalStackRunning = false;
  try {
    await execAsync('curl -s http://localhost:4566/_localstack/health');
    isLocalStackRunning = true;
    console.log('✅ LocalStack is already running');
  } catch (error) {
    console.warn('LocalStack health check failed, attempting startup...', error);
  }

  // Start LocalStack if not running
  if (!isLocalStackRunning) {
    console.log('🔄 Starting LocalStack...');
    try {
      // Start LocalStack using the deployment script
      const scriptPath = path.join(projectRoot, 'scripts/localstack-deploy.sh');

      // Make sure script is executable
      await execAsync(`chmod +x ${scriptPath}`);

      // Start LocalStack (this will take some time)
      console.log('📦 Deploying infrastructure to LocalStack...');
      const { stdout, stderr } = await execAsync(`${scriptPath} deploy`, {
        cwd: projectRoot,
        timeout: 300000, // 5 minute timeout
        env: {
          ...process.env,
          NODE_ENV: 'localstack',
        },
      });

      console.log('LocalStack deployment output:', stdout);
      if (stderr) {
        console.warn('LocalStack deployment warnings:', stderr);
      }

      console.log('✅ LocalStack infrastructure deployed successfully');
    } catch (error) {
      console.error('❌ Failed to start LocalStack:', error);
      throw new Error(`LocalStack startup failed: ${error}`);
    }
  }

  // Verify infrastructure is deployed
  console.log('🔍 Verifying infrastructure deployment...');
  try {
    const { stdout } = await execAsync('curl -s http://localhost:4566/_localstack/health');
    const health = JSON.parse(stdout);

    const coreServices = ['s3', 'lambda', 'sns', 'sts', 'iam'];
    const missingServices = coreServices.filter(
      service => !health.services[service] || health.services[service] !== 'available'
    );

    if (missingServices.length > 0) {
      console.warn('⚠️  Some services are not available:', missingServices);
    } else {
      console.log('✅ All core services are available');
    }
  } catch (error) {
    console.warn('⚠️  Could not verify service health:', error);
  }

  console.log('✅ LocalStack global setup completed');
}

export default globalSetup;
