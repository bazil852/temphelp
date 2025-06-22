-- 001_trigger_support.sql
-- Workflow trigger support: webhook tokens, job queue, and notifications

-- 1.1 Table that maps webhook tokens to workflows
create table if not exists public.workflow_webhooks (
  token        text primary key,
  workflow_id  uuid not null references public.workflows(id) on delete cascade,
  node_id      text not null,
  captured_at  timestamptz,
  created_at   timestamptz default now()
);

create unique index if not exists workflow_webhooks_workflow_idx
  on public.workflow_webhooks(workflow_id, node_id);

-- 1.2 Job queue table (if not already created)
create table if not exists public.wf_jobs (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     uuid not null references public.workflows(id) on delete cascade,
  trigger_payload jsonb,
  status          text default 'queued',
  run_at          timestamptz default now(),
  inserted_at     timestamptz default now()
);

-- 1.3 NOTIFY helper trigger so runner picks up new jobs
create or replace function public.notify_wf_jobs() returns trigger
language plpgsql as $$
begin
  perform pg_notify('wf_jobs_new', json_build_object('id', new.id)::text);
  return new;
end $$;

drop trigger if exists wf_jobs_notify on public.wf_jobs;
create trigger wf_jobs_notify
  after insert on public.wf_jobs
  for each row execute procedure public.notify_wf_jobs();

-- 1.4 pg_cron extension (enable once)
create extension if not exists pg_cron with schema extensions; 