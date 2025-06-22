/**
 * POST /hook/t/{token}
 *
 * 1. Look up token from shared store
 * 2. Insert captured payload into captured_events table
 * 3. Respond with success (payload will be pushed via Realtime)
 * 4. Do NOT enqueue real workflow - this is test mode only
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tokens are stored in database table webhook_test_tokens

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    });
  }

  try {
    // Extract token from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 1]; // Last part should be the token

    console.log('🔍 Extracting token from path:', url.pathname, '→', token);

    if (!token || token === 'capture-test') {
      return new Response(JSON.stringify({ error: 'Token is required in URL path' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Look up token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('webhook_test_tokens')
      .select('workflow_id, node_id, expires_at')
      .eq('token', token)
      .single();
    
    if (tokenError || !tokenData) {
      console.log('❌ Token not found:', token, tokenError);
      return new Response(JSON.stringify({ error: 'Token expired or not found' }), {
        status: 410,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (Date.now() > expiresAt.getTime()) {
      // Clean up expired token
      await supabase.from('webhook_test_tokens').delete().eq('token', token);
      console.log('⏰ Token expired:', token);
      return new Response(JSON.stringify({ error: 'Token expired' }), {
        status: 410,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { workflow_id: workflowId, node_id: nodeId } = tokenData;

    // Get request body and headers
    const body = await req.text();
    const headers: Record<string, string> = {};
    
    // Convert Headers to plain object
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse payload
    const payload = tryParseJson(body);

    console.log('📦 Capturing payload for workflow:', workflowId, 'node:', nodeId);
    console.log('📄 Payload:', payload);

    // Insert into captured_events table
    const { error } = await supabase
      .from('captured_events')
      .insert({
        workflow_id: workflowId,
        node_id: nodeId,
        payload: payload,
        headers: headers,
      });

    if (error) {
      console.error('❌ Error inserting captured event:', error);
      return new Response(JSON.stringify({ error: 'Failed to capture event', details: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Clean up token after successful capture
    await supabase.from('webhook_test_tokens').delete().eq('token', token);
    console.log('✅ Payload captured and token cleaned up');

    return new Response(JSON.stringify({ 
      message: 'Payload captured successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('💥 Error in capture webhook test:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

// Token management is now handled via database
// No need for in-memory token functions 