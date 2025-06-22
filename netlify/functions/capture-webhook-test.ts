import { createClient } from '@supabase/supabase-js';
import { getToken, deleteToken } from './shared-token-store';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const handler = async (event: any, context: any) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Extract token from path: /capture-webhook-test/t/{token}
    const pathParts = event.path.split('/');
    const token = pathParts[pathParts.length - 1];

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token is required' }),
      };
    }

    // Look up token in store
    const tokenData = getToken(token);
    
    if (!tokenData) {
      return {
        statusCode: 410,
        headers,
        body: JSON.stringify({ error: 'Token expired or not found' }),
      };
    }

    const { workflowId, nodeId } = tokenData;

    // Get request body and headers
    const body = event.body || '';
    const requestHeaders = event.headers || {};

    // Parse payload
    const payload = tryParseJson(body);

    // Insert into captured_events table
    const { error } = await supabase
      .from('captured_events')
      .insert({
        workflow_id: workflowId,
        node_id: nodeId,
        payload: payload,
        headers: requestHeaders,
      });

    if (error) {
      console.error('Error inserting captured event:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to capture event' }),
      };
    }

    // Clean up token after successful capture
    deleteToken(token);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Payload captured successfully',
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Error in capture webhook test:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 