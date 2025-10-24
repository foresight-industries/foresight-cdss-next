#!/usr/bin/env tsx

/**
 * Local Browserbase Testing Script (TypeScript)
 *
 * This script allows you to test the Browserbase integration locally
 * without needing to deploy to AWS or trigger the full prior auth workflow.
 */

import { LLMClient, Stagehand } from '@browserbasehq/stagehand';
import { StagehandAutomation, StagehandConfig, PortalSessionManager } from '@foresight-cdss-next/db/services';

async function testBrowserbaseLocal() {
  console.log('🧪 Testing Browserbase locally...');

  // Test with LOCAL env first
  const stagehandLocal = new Stagehand({
    env: 'LOCAL',
    localBrowserLaunchOptions: {
      headless: false, // Set false to see the browser window
    },
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    enableCaching: true,
    disablePino: true,
    logger: (message: any) => console.log('🤖 Stagehand:', message)
  });

  try {
    console.log('📍 Initializing Stagehand (LOCAL mode)...');
    await stagehandLocal.init();

    console.log('🌐 Navigating to CoverMyMeds...');
    await stagehandLocal.page.goto('https://covermymeds.health');

    // Wait a bit to see the page load
    console.log('⏳ Waiting 8 seconds to see the page...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log('🔍 Looking for Portal Login...');
    // Use simpler approach - try to observe first
    try {
      console.log('👀 Checking page content...');
      const buttons = await stagehandLocal.page.observe('Find the Portal Login button');
      console.log('📄 Page loaded, attempting to find Portal Login...');
      console.log(buttons);

      // Try clicking Portal Login
      console.log('🔑 Attempting to click Portal Login...');
      await stagehandLocal.page.act(buttons[0]);

      // Wait for potential page change
      console.log('⏳ Waiting 3 seconds for login page...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('✅ Portal Login interaction attempted successfully!');

    } catch (actError) {
      console.log('⚠️ Portal Login click failed, but navigation test completed');
      console.log('Error details:', actError.message);
    }

    console.log('✅ Local test completed successfully!');

  } catch (error) {
    console.error('❌ Local test failed:', error);
  } finally {
    await stagehandLocal.close();
  }
}

async function testBrowserbaseRemote() {
  // Only test if you have actual Browserbase credentials
  if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
    console.log('⚠️  Skipping Browserbase remote test - missing credentials');
    console.log('   Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID to test remote');
    return;
  }

  console.log('☁️  Testing Browserbase remote...');

  const stagehandRemote = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    enableCaching: true,
    modelName: 'gpt-4o',
    disablePino: true,
    logger: (message: any) => console.log('🤖 Stagehand Remote:', message)
  });

  try {
    console.log('📍 Initializing Stagehand (BROWSERBASE mode)...');
    await stagehandRemote.init();

    console.log('🌐 Navigating to test page...');
    await stagehandRemote.page.goto('https://covermymeds.health');

    console.log('👀 Testing observe() method...');
    try {
      await stagehandRemote.page.observe('Find the Portal Login button');
      console.log('📄 Page observation successful');

      console.log('🔑 Clicking Portal Login button...');
      await stagehandRemote.page.act('Click the Portal Login button');

      // Wait for login page to load
      console.log('⏳ Waiting for login page to load...');
      await stagehandRemote.page.waitForSelector('input[name="username"]');

      console.log('👤 Filling in username...');
      const testUsername = process.env.TEST_PORTAL_USERNAME || 'testuser@example.com';
      await stagehandRemote.page.act(`Type "${testUsername}" in the username or email field`);

      console.log('🔒 Filling in password...');
      const testPassword = process.env.TEST_PORTAL_PASSWORD || 'testpassword123';
      await stagehandRemote.page.act(`Type "${testPassword}" in the password field`);

      console.log('🚀 Clicking LOG IN button...');
      await stagehandRemote.page.act('Click the LOG IN button');

      // Wait to see the result
      console.log('⏳ Waiting 3 seconds to see login result...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('✅ Remote test completed successfully!');
    } catch (observeError) {
      console.log('⚠️ Remote test failed, but connection test completed');
      console.log('Error details:', observeError.message);
    }

  } catch (error) {
    console.error('❌ Remote test failed:', error);
  } finally {
    await stagehandRemote.close();
  }
}

async function testPriorAuthWorkflow() {
  console.log('🏥 Testing Prior Auth workflow components...');

  const config: StagehandConfig = {
    apiKey: process.env.BROWSERBASE_API_KEY || '',
    projectId: process.env.BROWSERBASE_PROJECT_ID || '',
    env: 'LOCAL',
    headless: false,
    logger: (message: any) => console.log('🤖 Workflow:', message)
  };

  const sessionManager = new PortalSessionManager({
    apiKey: process.env.BROWSERBASE_API_KEY || '',
    projectId: process.env.BROWSERBASE_PROJECT_ID || ''
  });
  const automation = new StagehandAutomation(config, sessionManager);

  // Mock test data with valid UUID format - replace with actual test IDs
  const testOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const testPriorAuthId = '123e4567-e89b-12d3-a456-426614174001';
  const testFormData = {
    patientName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    memberNumber: 'TEST123'
  };

  try {
    console.log('🔄 Running prior auth submission test...');
    const result = await automation.submitPriorAuth(
      testOrgId,
      testPriorAuthId,
      testFormData,
      [],
      'human_in_loop'
    );

    console.log('📋 Workflow result:', result);

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    console.log('   This is expected if you don\'t have test data in your database');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Browserbase Integration Tests (TypeScript)\n');

  // await testBrowserbaseLocal();
  // console.log('\n' + '='.repeat(50) + '\n');

  await testBrowserbaseRemote();
  console.log('\n' + '='.repeat(50) + '\n');

  // await testPriorAuthWorkflow();

  console.log('\n✨ All tests completed!');
}

if (require.main === module) {
  main().catch(console.error);
}
