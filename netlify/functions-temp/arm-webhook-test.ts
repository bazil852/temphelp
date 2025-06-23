import { customAlphabet } from 'nanoid';
import { setToken } from './shared-token-store';

// Generate a URL-safe token
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

export const handler = async (event: any, context: any) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { workflowId, nodeId } = JSON.parse(event.body || '{}');

    if (!nodeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Node ID is required' }),
      };
    }

    if (!workflowId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Workflow ID is required' }),
      };
    }

    // Generate token
    const token = nanoid();
    
    // Store token with 5-minute expiration
    const expires = Date.now() + (5 * 60 * 1000);
    setToken(token, { workflowId, nodeId, expires });

    // Return webhook URL
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const webhookUrl = `${baseUrl}/.netlify/functions/capture-webhook-test/t/${token}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        webhookUrl,
        token,
        expiresAt: new Date(expires).toISOString()
      }),
    };

  } catch (error) {
    console.error('Error arming webhook test:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Token store is now handled by shared-token-store.ts 