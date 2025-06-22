-- 002_trigger_rpcs.sql
-- SECURITY DEFINER so they can use service-role privileges
-- but callable by 'authenticated' role.

-- 2.1 activate_workflow (creates webhook token, schedules cron job)
create or replace function public.activate_workflow(p_workflow uuid)
returns json language plpgsql security definer as $$
declare
  v_token text;
  v_node  text;
  v_url   text;
  v_cron  text;
begin
  update public.workflows set status = 'active' where id = p_workflow;

  -- 2.1.a create token for FIRST webhook trigger node (simplified)
  select n->>'id', n->'cfg'->>'token'
    into v_node, v_token
  from jsonb_each((select exec_definition from public.workflows w where w.id=p_workflow)) as t(k,n)
  where n->>'kind' = 'trigger' and n->>'sub' = 'webhook' limit 1;

  if v_node is not null and v_token is null then
     v_token := substr(md5(random()::text),1,10);
     insert into public.workflow_webhooks(token,workflow_id,node_id)
       values (v_token,p_workflow,v_node)
       on conflict (workflow_id,node_id) do update set token=excluded.token;
  end if;
  if v_token is not null then
     v_url := concat(
       current_setting('app.supabase.url','t'), -- will be set in Edge
       '/functions/v1/wf-webhook/', v_token);
  end if;

  -- 2.1.b schedule cron if schedule-trigger exists
  select n->'cfg'->>'cron' into v_cron
  from jsonb_each((select exec_definition from public.workflows w where w.id=p_workflow)) as t(k,n)
  where n->>'kind' = 'trigger' and n->>'sub' = 'schedule' limit 1;

  if v_cron is not null then
    perform cron.unschedule('wf-'||p_workflow); -- idempotent
    perform cron.schedule('wf-'||p_workflow, v_cron,
      format($$insert into public.wf_jobs(workflow_id,trigger_payload)
              values ('%s','{}');$$, p_workflow));
  end if;

  return json_build_object('token', v_token, 'url', v_url, 'status','active');
end $$;

-- 2.2 deactivate_workflow
create or replace function public.deactivate_workflow(p_workflow uuid)
returns void language plpgsql security definer as $$
begin
  update public.workflows set status='inactive' where id=p_workflow;
  
  -- Safely unschedule cron job - ignore if it doesn't exist
  begin
    perform cron.unschedule('wf-'||p_workflow);
  exception when others then
    -- Job doesn't exist or other error - that's fine for deactivation
    null;
  end;
end $$;

-- 2.3 regenerate_webhook_token
create or replace function public.regenerate_webhook_token(p_workflow uuid, p_node text)
returns json language plpgsql security definer as $$
declare
  v_token text := substr(md5(random()::text),1,10);
  v_url   text;
begin
  insert into public.workflow_webhooks(token,workflow_id,node_id)
    values (v_token,p_workflow,p_node)
    on conflict (workflow_id,node_id) do update set token=excluded.token;
  v_url := concat(current_setting('app.supabase.url','t'),'/functions/v1/wf-webhook/',v_token);
  return json_build_object('token',v_token,'url',v_url);
end $$;

-- 2.4 get_webhook_info
create or replace function public.get_webhook_info(p_workflow uuid, p_node text)
returns json language sql stable as $$
  select json_build_object(
           'token', token,
           'url',   concat(current_setting('app.supabase.url','t'),'/functions/v1/wf-webhook/',token),
           'captured_at', captured_at)
  from public.workflow_webhooks
  where workflow_id=p_workflow and node_id=p_node;
$$;

-- 2.5 run_workflow_manual
create or replace function public.run_workflow_manual(p_workflow uuid, p_payload jsonb default '{}'::jsonb)
returns void language sql security definer as $$
  insert into public.wf_jobs(workflow_id, trigger_payload)
    values (p_workflow, coalesce(p_payload,'{}'::jsonb));
$$; 