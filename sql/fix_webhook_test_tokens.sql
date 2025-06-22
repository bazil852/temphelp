-- Fix webhook_test_tokens table to use text instead of uuid for IDs
-- This handles the case where the table was already created with uuid columns

-- Drop the table if it exists and recreate with correct types
DROP TABLE IF EXISTS webhook_test_tokens;

-- Create webhook_test_tokens table with correct column types
CREATE TABLE webhook_test_tokens (
  token        text primary key,
  workflow_id  text not null,
  node_id      text not null,
  expires_at   timestamptz not null,
  created_at   timestamptz default now()
);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_test_tokens_expires_at ON webhook_test_tokens(expires_at);

-- Enable row level security
ALTER TABLE webhook_test_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens
CREATE POLICY "Service role can manage webhook test tokens" ON webhook_test_tokens
  FOR ALL USING (auth.role() = 'service_role'); 