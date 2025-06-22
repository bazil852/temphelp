-- Fix captured_events table to use text instead of uuid for workflow_id and node_id
-- This handles the case where the table was already created with uuid columns

-- Drop the table if it exists and recreate with correct types
DROP TABLE IF EXISTS captured_events;

-- Create captured_events table with correct column types
CREATE TABLE captured_events (
  id           uuid default gen_random_uuid() primary key,
  workflow_id  text not null,
  node_id      text not null,
  payload      jsonb,
  headers      jsonb,
  captured_at  timestamptz default now()
);

-- Enable Realtime for captured_events
ALTER PUBLICATION supabase_realtime ADD TABLE captured_events;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_captured_events_node_id ON captured_events(node_id);
CREATE INDEX IF NOT EXISTS idx_captured_events_captured_at ON captured_events(captured_at); 