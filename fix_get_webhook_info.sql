-- Fix get_webhook_info RPC to return correct full URL
-- The issue: current_setting('app.supabase.url','t') is not returning the full domain

CREATE OR REPLACE FUNCTION get_webhook_info(p_workflow uuid, p_node text)
RETURNS json 
LANGUAGE sql 
STABLE AS $$
  SELECT json_build_object(
           'token', token,
           'url', 'https://uiucmdovylwgfileuhpg.supabase.co/functions/v1/wf-webhook/' || token,
           'captured_at', captured_at)
  FROM public.workflow_webhooks
  WHERE workflow_id = p_workflow AND node_id = p_node;
$$;

-- Also fix regenerate_webhook_token for consistency
CREATE OR REPLACE FUNCTION regenerate_webhook_token(p_workflow uuid, p_node text)
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
DECLARE
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_url   text;
BEGIN
  INSERT INTO public.workflow_webhooks(token, workflow_id, node_id)
    VALUES (v_token, p_workflow, p_node)
    ON CONFLICT (workflow_id, node_id) DO UPDATE SET token = EXCLUDED.token;
    
  v_url := 'https://uiucmdovylwgfileuhpg.supabase.co/functions/v1/wf-webhook/' || v_token;
  
  RETURN json_build_object('token', v_token, 'url', v_url);
END $$; 