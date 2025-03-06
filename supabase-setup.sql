-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('video.completed', 'video.failed', 'video.create')),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on webhooks table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhooks
CREATE POLICY "Users can view their own webhooks"
ON webhooks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks"
ON webhooks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON webhooks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON webhooks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS webhooks_user_id_idx ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS webhooks_influencer_id_idx ON webhooks(influencer_id);

-- Ensure contents table has video_id column
ALTER TABLE contents ADD COLUMN IF NOT EXISTS video_id TEXT;

-- Add indexes for contents table
CREATE INDEX IF NOT EXISTS contents_influencer_id_idx ON contents(influencer_id);
CREATE INDEX IF NOT EXISTS contents_status_idx ON contents(status);
CREATE INDEX IF NOT EXISTS contents_created_at_idx ON contents(created_at DESC);

-- Grant necessary permissions
GRANT ALL ON webhooks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE webhooks_id_seq TO authenticated;