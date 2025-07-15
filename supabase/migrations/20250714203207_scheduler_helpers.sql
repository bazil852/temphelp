-- Content Plan Scheduler Helper Functions
-- Provides atomic job claiming, recurrence handling, and status management

-- 1-A | Atomically claim due jobs (max 20 per tick)
-- Uses row locking to prevent race conditions in multi-instance environments
create or replace function claim_due_content_plans(limit_n integer default 20)
returns setof content_plans
language plpgsql as $$
begin
  return query
  update content_plans
     set status     = 'processing',
         updated_at = now()
   where id in (
     select id
       from content_plans
      where status     = 'scheduled'
        and starts_at <= now()
      order by starts_at
      limit limit_n
      for update skip locked
   )
   returning *;
end; $$;

-- 1-B | Mark success + roll next occurrence (if rrule)
-- Handles both one-time and recurring content plans
create or replace function mark_plan_completed(p_id uuid)
returns void
language plpgsql as $$
declare v content_plans;
begin
  select * into v from content_plans where id = p_id;

  update content_plans
     set last_run_at = now(),
         status      = case when v.rrule is null then 'completed'
                            else 'scheduled' end,
         starts_at   = case
                         when v.rrule is null then starts_at          -- keep for history
                         else (
                           select next_occurrence
                             from extensions.rrule_next(
                                   v.rrule,
                                   v.starts_at,
                                   now()) as next_occurrence
                         ) end
   where id = p_id;
end; $$;

-- 1-C | Mark failure
-- Records error message in prompt field for debugging
create or replace function mark_plan_failed(p_id uuid, p_msg text)
returns void
language sql as $$
  update content_plans
     set status    = 'failed',
         updated_at = now(),
         prompt    = prompt || E'\n\n[ERROR] ' || p_msg
   where id = p_id;
$$;

-- Helper function to get content plans by status for monitoring
create or replace function get_content_plans_by_status(p_status text default null)
returns table(
  status text,
  count bigint,
  oldest_scheduled timestamptz
)
language sql as $$
  select 
    cp.status::text,
    count(*) as count,
    min(case when cp.status = 'scheduled' then cp.starts_at else null end) as oldest_scheduled
  from content_plans cp
  where p_status is null or cp.status = p_status
  group by cp.status
  order by cp.status;
$$; 