-- Create video_batches table for tracking video generation progress
CREATE TABLE IF NOT EXISTS video_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  total_videos INTEGER NOT NULL DEFAULT 0,
  completed_videos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_batches_user_id ON video_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_video_batches_status ON video_batches(status);
CREATE INDEX IF NOT EXISTS idx_video_batches_created_at ON video_batches(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE video_batches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own batches
CREATE POLICY "Users can view their own video batches" ON video_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video batches" ON video_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video batches" ON video_batches
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_batches_updated_at 
  BEFORE UPDATE ON video_batches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 