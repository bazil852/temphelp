-- Create webhook_test_tokens table for temporary token storage
create table if not exists webhook_test_tokens (
  token        text primary key,
  workflow_id  text not null,
  node_id      text not null,
  expires_at   timestamptz not null,
  created_at   timestamptz default now()
);

-- Add index for cleanup queries
create index if not exists idx_webhook_test_tokens_expires_at on webhook_test_tokens(expires_at);

-- Enable row level security
alter table webhook_test_tokens enable row level security;

-- Allow service role to manage tokens
create policy "Service role can manage webhook test tokens" on webhook_test_tokens
  for all using (auth.role() = 'service_role'); 