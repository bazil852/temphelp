/**
 * POST /arm-test
 * 
 * Arms a webhook test by generating a token and storing test metadata
 * Returns a temporary webhook URL for external services to POST to
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Generate a URL-safe token
function generateToken(): string {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Parse request body
    const { workflowId, nodeId } = await req.json();

    if (!nodeId) {
      return new Response(JSON.stringify({ error: 'Node ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'Workflow ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Generate token
    const token = generateToken();
    
    // Store token with 5-minute expiration in database
    const expiresAt = new Date(Date.now() + (5 * 60 * 1000));
    
    const { error: insertError } = await supabase
      .from('webhook_test_tokens')
      .insert({
        token,
        workflow_id: workflowId,
        node_id: nodeId,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('❌ Error storing token:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store token' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get the Supabase project URL to construct the webhook URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
    // Construct the webhook URL pointing to the capture-test edge function
    const webhookUrl = `${supabaseUrl}/functions/v1/capture-test/t/${token}`;

    console.log('🔧 Armed webhook test:', {
      token,
      nodeId,
      workflowId,
      webhookUrl,
      expiresAt: expiresAt.toISOString()
    });

    return new Response(JSON.stringify({ 
      webhookUrl,
      token,
      expiresAt: expiresAt.toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Error arming webhook test:', error);
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

// Tokens are now stored in database, no need for shared store 