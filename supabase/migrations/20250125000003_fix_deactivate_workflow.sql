-- Fix deactivate_workflow to handle missing cron jobs gracefully
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