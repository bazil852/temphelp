-- Create captured_events table for webhook payload testing
create table if not exists captured_events (
  id           uuid default gen_random_uuid() primary key,
  workflow_id  text not null,
  node_id      text not null,
  payload      jsonb,
  headers      jsonb,
  captured_at  timestamptz default now()
);

-- Enable Realtime for captured_events
alter publication supabase_realtime add table captured_events;

-- Add index for better query performance
create index if not exists idx_captured_events_node_id on captured_events(node_id);
create index if not exists idx_captured_events_captured_at on captured_events(captured_at); 