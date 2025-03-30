import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const webhookId = event.path.split('/').pop();
    if (!webhookId) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing webhook ID' })
      };
    }

    // Verify webhook exists and is active
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (webhookError || !webhook || !webhook.active) {
      return { 
        statusCode: 404, 
        headers,
        body: JSON.stringify({ error: 'Webhook not found or inactive' })
      };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }

    // Validate required fields
    if (!payload.title || !payload.script) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: title and script' })
      };
    }

    // Process webhook request
    const { error: rpcError } = await supabase.rpc('handle_webhook_request', {
      webhook_id: webhookId,
      payload
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to process webhook request' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully'
      })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};