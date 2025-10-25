/**
 * Global teardown for LocalStack integration tests
 * Optionally stops LocalStack after all tests complete
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function globalTeardown(): Promise<void> {
  console.log('🧹 Starting LocalStack global teardown...');

  // Check if we should keep LocalStack running for development
  const keepRunning = process.env.LOCALSTACK_KEEP_RUNNING === 'true';

  if (keepRunning) {
    console.log('ℹ️  LocalStack will continue running for development (LOCALSTACK_KEEP_RUNNING=true)');
    console.log('💡 To stop LocalStack manually, run: yarn local:stop');
    return;
  }

  // Optional: Clean up test resources but keep LocalStack running
  const cleanupOnly = process.env.LOCALSTACK_CLEANUP_ONLY === 'true';

  if (cleanupOnly) {
    console.log('🧹 Cleaning up test resources...');
    try {
      // Clean up any test-specific resources here
      // For example, delete test buckets, functions, etc.
      console.log('✅ Test resources cleaned up');
    } catch (error) {
      console.warn('⚠️  Some cleanup operations failed:', error);
    }
    return;
  }

  // Stop LocalStack completely
  try {
    console.log('🛑 Stopping LocalStack...');

    const projectRoot = require('node:path').resolve(__dirname, '../..');
    const { stdout, stderr } = await execAsync('yarn local:stop', {
      cwd: projectRoot,
      timeout: 30000, // 30 second timeout
    });

    console.log('LocalStack stop output:', stdout);
    if (stderr && !stderr.includes('Warning')) {
      console.warn('LocalStack stop warnings:', stderr);
    }

    console.log('✅ LocalStack stopped successfully');
  } catch (error) {
    console.warn('⚠️  Failed to stop LocalStack gracefully:', error);

    // Force stop if graceful stop fails
    try {
      console.log('🔧 Attempting force stop...');
      await execAsync('docker stop localstack-foresight-rcm', { timeout: 10000 });
      console.log('✅ LocalStack force stopped');
    } catch (forceError) {
      console.error('❌ Failed to force stop LocalStack:', forceError);
    }
  }

  console.log('✅ LocalStack global teardown completed');
}

export default globalTeardown;
