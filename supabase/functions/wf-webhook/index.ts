// supabase/functions/wf-webhook/index.ts
// Deno Edge Function - imports are resolved at runtime by Deno
import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_KEY')!
);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // Extract token from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 1]; // Last part of path

    if (!token) {
      return new Response('Token required', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Look up workflow by token
    const { data: webhookData, error: lookupError } = await supabase
      .from('workflow_webhooks')
      .select('workflow_id')
      .eq('token', token)
      .single();

    if (lookupError || !webhookData) {
      console.error('Token lookup failed:', lookupError);
      return new Response('Invalid token', { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Parse request body
    const bodyText = await req.text();
    let bodyJson = {};
    
    if (bodyText) {
      try {
        bodyJson = JSON.parse(bodyText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response('Invalid JSON payload', { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Insert job into queue
    const { error: insertError } = await supabase
      .from('wf_jobs')
      .insert({
        workflow_id: webhookData.workflow_id,
        trigger_payload: bodyJson
      });

    if (insertError) {
      console.error('Job insertion failed:', insertError);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Update captured timestamp
    const { error: updateError } = await supabase
      .from('workflow_webhooks')
      .update({ captured_at: new Date().toISOString() })
      .eq('token', token);

    if (updateError) {
      console.error('Timestamp update failed:', updateError);
      // Don't fail the request for this
    }

    return new Response('Accepted', {
      status: 202,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}); 