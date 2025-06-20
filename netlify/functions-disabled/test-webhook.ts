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
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const testId = event.queryStringParameters?.testId;
    
    if (event.httpMethod === 'GET') {
      // Retrieve captured test data
      if (!testId) {
        return { 
          statusCode: 400, 
          headers,
          body: JSON.stringify({ error: 'Missing testId parameter' })
        };
      }

      const { data, error } = await supabase
        .from('webhook_test_data')
        .select('*')
        .eq('test_id', testId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { 
          statusCode: 404, 
          headers,
          body: JSON.stringify({ error: 'No test data found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          data: data.payload,
          capturedAt: data.created_at
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Capture test webhook data
      if (!testId) {
        return { 
          statusCode: 400, 
          headers,
          body: JSON.stringify({ error: 'Missing testId parameter' })
        };
      }

      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch (e) {
        // If not JSON, store as raw text
        payload = { rawBody: event.body || '' };
      }

      // Store the captured data
      const { error } = await supabase
        .from('webhook_test_data')
        .insert({
          test_id: testId,
          payload: payload,
          headers: event.headers,
          method: event.httpMethod,
          query_params: event.queryStringParameters
        });

      if (error) {
        console.error('Error storing test webhook data:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to store test data' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'Test webhook data captured successfully',
          testId: testId
        })
      };
    }

    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('Test webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 