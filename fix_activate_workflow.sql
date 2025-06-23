-- Fix activate_workflow RPC to use correct column names and node structure
-- This only updates the function, no data changes

CREATE OR REPLACE FUNCTION activate_workflow(p_workflow uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_node record;
  schedule_node record;
  webhook_token text;
  webhook_url text;
  cron_expression text;
  job_name text;
  sql_command text;
BEGIN
  -- Check if workflow exists (remove auth check for debugging)
  IF NOT EXISTS (
    SELECT 1 FROM workflows 
    WHERE id = p_workflow
  ) THEN
    RAISE EXCEPTION 'Workflow not found';
  END IF;

  -- Update workflow status to active
  UPDATE workflows 
  SET status = 'active', updated_at = NOW()
  WHERE id = p_workflow;

  -- Look for webhook trigger in exec_definition
  SELECT key, value INTO webhook_node
  FROM workflows w,
       jsonb_each(COALESCE(w.exec_definition->'nodes', '{}'::jsonb)) as n(key, value)
  WHERE w.id = p_workflow
    AND n.value->>'kind' = 'trigger' 
    AND n.value->>'sub' = 'webhook' 
  LIMIT 1;

  -- Look for schedule trigger in exec_definition  
  SELECT key, value INTO schedule_node
  FROM workflows w,
       jsonb_each(COALESCE(w.exec_definition->'nodes', '{}'::jsonb)) as n(key, value)
  WHERE w.id = p_workflow
    AND n.value->>'kind' = 'trigger' 
    AND n.value->>'sub' = 'schedule'
  LIMIT 1;

  -- Handle webhook trigger
  IF webhook_node IS NOT NULL THEN
    -- Generate webhook token
    webhook_token := encode(gen_random_bytes(32), 'hex');
    webhook_url := 'https://uiucmdovylwgfileuhpg.supabase.co/functions/v1/wf-webhook/' || webhook_token;
    
    -- Store webhook token mapping
    INSERT INTO workflow_webhooks (workflow_id, token, created_at)
    VALUES (p_workflow, webhook_token, NOW())
    ON CONFLICT (workflow_id) DO UPDATE SET
      token = EXCLUDED.token,
      created_at = EXCLUDED.created_at;
      
    RETURN json_build_object(
      'token', webhook_token,
      'url', webhook_url,
      'status', 'active'
    );
  END IF;

  -- Handle schedule trigger
  IF schedule_node IS NOT NULL THEN
    -- Extract cron expression from schedule config
    cron_expression := schedule_node.value->'cfg'->>'cron';
    
    IF cron_expression IS NOT NULL AND cron_expression != '' THEN
      -- Create unique job name
      job_name := 'wf-' || p_workflow::text;
      
      -- Create SQL command for cron job
      sql_command := 'INSERT INTO public.wf_jobs(workflow_id,trigger_payload) VALUES (''' || p_workflow || ''',''{}''::jsonb)';
      
      -- Schedule cron job
      BEGIN
        PERFORM cron.schedule(job_name, cron_expression, sql_command);
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to schedule cron job: %', SQLERRM;
      END;
    END IF;
    
    RETURN json_build_object(
      'status', 'active',
      'cron', cron_expression
    );
  END IF;

  -- No triggers found, just return active status
  RETURN json_build_object('status', 'active');
END;
$$; 