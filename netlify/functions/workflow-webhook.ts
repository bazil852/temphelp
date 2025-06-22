import { handleWebhookTrigger } from '../../src/services/triggerService';

export const handler = async (event: any, context: any) => {
  console.log('🔗 Webhook trigger received:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    query: event.queryStringParameters
  });

  try {
    // Extract the webhook path from the URL
    // URL format: /.netlify/functions/workflow-webhook/incoming/order
    const pathParts = event.path.split('/');
    const webhookPath = '/' + pathParts.slice(4).join('/'); // Remove /.netlify/functions/workflow-webhook

    if (!webhookPath || webhookPath === '/') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Webhook path not specified',
          message: 'Use format: /.netlify/functions/workflow-webhook/your/webhook/path'
        })
      };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: ''
      };
    }

    // Parse the request body
    let payload: any = {};
    if (event.body) {
      try {
        payload = JSON.parse(event.body);
      } catch (error) {
        // If JSON parsing fails, use raw body
        payload = event.body;
      }
    }

    // Extract headers (convert to lowercase for consistency)
    const headers: Record<string, string> = {};
    Object.keys(event.headers || {}).forEach(key => {
      headers[key.toLowerCase()] = event.headers![key];
    });

    // Extract query parameters
    const query = event.queryStringParameters || {};

    // Call the trigger handler
    const result = await handleWebhookTrigger(
      webhookPath,
      event.httpMethod,
      payload,
      headers,
      query
    );

    if (result.success) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
          webhook: webhookPath
        })
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: result.message,
          webhook: webhookPath
        })
      };
    }

  } catch (error) {
    console.error('❌ Webhook trigger error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 