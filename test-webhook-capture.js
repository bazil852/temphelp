#!/usr/bin/env node

// Simple test script for webhook capture system
const fetch = require('node-fetch');

async function testWebhookCapture() {
  console.log('🧪 Testing Webhook Capture System (Supabase Edge Functions)...\n');
  
  const testData = {
    workflowId: 'test-workflow-123',
    nodeId: 'test-node-456'
  };

  // Get Supabase URL from environment
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';

  try {
    // Step 1: Arm the webhook test
    console.log('1️⃣ Arming webhook test...');
    const armResponse = await fetch(`${supabaseUrl}/functions/v1/arm-test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'}`
      },
      body: JSON.stringify(testData)
    });

    if (!armResponse.ok) {
      throw new Error(`Arm failed: ${armResponse.status} ${await armResponse.text()}`);
    }

    const { webhookUrl, token } = await armResponse.json();
    console.log('✅ Webhook armed successfully!');
    console.log(`📡 Test URL: ${webhookUrl}`);
    console.log(`🎫 Token: ${token}\n`);

    // Step 2: Wait a moment then send test payload
    console.log('2️⃣ Waiting 2 seconds then sending test payload...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const testPayload = {
      message: 'Hello from test!',
      timestamp: new Date().toISOString(),
      data: { 
        user: 'test-user',
        action: 'webhook-test',
        items: [1, 2, 3]
      }
    };

    const captureResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Test-Header': 'test-value'
      },
      body: JSON.stringify(testPayload)
    });

    if (!captureResponse.ok) {
      throw new Error(`Capture failed: ${captureResponse.status} ${await captureResponse.text()}`);
    }

    const captureResult = await captureResponse.json();
    console.log('✅ Payload captured successfully!');
    console.log('📦 Capture result:', captureResult);

    console.log('\n🎉 Test completed successfully!');
    console.log('💡 Check your Supabase captured_events table for the stored payload.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testWebhookCapture();
}

module.exports = { testWebhookCapture }; 