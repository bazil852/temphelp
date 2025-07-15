-- Create content_plans table for storing calendar events and scheduled content
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  look_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  title TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  rrule TEXT, -- iCal RRULE string for recurring events
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'failed')),
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_influencer_id ON content_plans(influencer_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_starts_at ON content_plans(starts_at);
CREATE INDEX IF NOT EXISTS idx_content_plans_status ON content_plans(status);
CREATE INDEX IF NOT EXISTS idx_content_plans_created_at ON content_plans(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own content plans" ON content_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content plans" ON content_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content plans" ON content_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content plans" ON content_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_content_plans_updated_at();

-- Grant necessary permissions
GRANT ALL ON content_plans TO authenticated; 