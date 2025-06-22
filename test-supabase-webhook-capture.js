#!/usr/bin/env node

// Test script for Supabase Edge Functions webhook capture system
const fetch = require('node-fetch');

async function testSupabaseWebhookCapture() {
  console.log('🧪 Testing Supabase Edge Functions Webhook Capture...\n');
  
  // You'll need to set these environment variables or replace with your actual values
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
  
  if (SUPABASE_URL.includes('your-project') || SUPABASE_SERVICE_ROLE_KEY.includes('your-service')) {
    console.log('❌ Please set your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    console.log('   export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
  }

  const testData = {
    workflowId: 'test-workflow-123',
    nodeId: 'test-node-456'
  };

  try {
    // Step 1: Test the arm-test function
    console.log('1️⃣ Testing arm-test function...');
    console.log(`   URL: ${SUPABASE_URL}/functions/v1/arm-test`);
    
    const armResponse = await fetch(`${SUPABASE_URL}/functions/v1/arm-test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(testData)
    });

    console.log(`   Status: ${armResponse.status}`);
    
    if (!armResponse.ok) {
      const errorText = await armResponse.text();
      throw new Error(`Arm failed: ${armResponse.status} ${errorText}`);
    }

    const { webhookUrl, token, expiresAt } = await armResponse.json();
    console.log('✅ Arm function working!');
    console.log(`📡 Generated webhook URL: ${webhookUrl}`);
    console.log(`🎫 Token: ${token}`);
    console.log(`⏰ Expires: ${expiresAt}\n`);

    // Step 2: Test the capture-test function
    console.log('2️⃣ Testing capture-test function...');
    console.log(`   URL: ${webhookUrl}`);
    
    const testPayload = {
      message: 'Hello from Supabase Edge Function test!',
      timestamp: new Date().toISOString(),
      data: { 
        user: 'test-user',
        action: 'supabase-webhook-test',
        items: [1, 2, 3]
      }
    };

    const captureResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Test-Header': 'supabase-test-value'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Status: ${captureResponse.status}`);

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      throw new Error(`Capture failed: ${captureResponse.status} ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log('✅ Capture function working!');
    console.log('📦 Capture result:', captureResult);

    console.log('\n🎉 All Supabase Edge Functions are working correctly!');
    console.log('💡 Next steps:');
    console.log('   1. Make sure your database tables are created (captured_events, webhook_test_tokens)');
    console.log('   2. Test the webhook capture in your UI');
    console.log('   3. Check your Supabase dashboard for the captured data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check that your Supabase Edge Functions are deployed');
    console.log('   2. Verify your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('   3. Check the Supabase Edge Function logs for errors');
    console.log('   4. Make sure the database tables exist');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSupabaseWebhookCapture();
}

module.exports = { testSupabaseWebhookCapture }; 