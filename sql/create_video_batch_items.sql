-- Create video_batch_items table for tracking individual video items in a batch
CREATE TABLE IF NOT EXISTS video_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES video_batches(id) ON DELETE CASCADE,
  video_id TEXT,
  video_url TEXT,
  line_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  influencer_name TEXT NOT NULL,
  text TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_video_batch_items_batch_id ON video_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_video_batch_items_status ON video_batch_items(status);
CREATE INDEX IF NOT EXISTS idx_video_batch_items_line_id ON video_batch_items(line_id);
CREATE INDEX IF NOT EXISTS idx_video_batch_items_created_at ON video_batch_items(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE video_batch_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see items from their own batches
CREATE POLICY "Users can view their own video batch items" ON video_batch_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM video_batches 
      WHERE video_batches.id = video_batch_items.batch_id 
      AND video_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own video batch items" ON video_batch_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_batches 
      WHERE video_batches.id = video_batch_items.batch_id 
      AND video_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own video batch items" ON video_batch_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM video_batches 
      WHERE video_batches.id = video_batch_items.batch_id 
      AND video_batches.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_video_batch_items_updated_at 
  BEFORE UPDATE ON video_batch_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update batch progress when items are updated
CREATE OR REPLACE FUNCTION update_batch_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the batch's completed_videos count
  UPDATE video_batches 
  SET 
    completed_videos = (
      SELECT COUNT(*) 
      FROM video_batch_items 
      WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) 
      AND status = 'completed'
    ),
    status = CASE 
      WHEN (
        SELECT COUNT(*) 
        FROM video_batch_items 
        WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) 
        AND status = 'completed'
      ) = (
        SELECT total_videos 
        FROM video_batches 
        WHERE id = COALESCE(NEW.batch_id, OLD.batch_id)
      ) THEN 'completed'
      WHEN (
        SELECT COUNT(*) 
        FROM video_batch_items 
        WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) 
        AND status = 'failed'
      ) > 0 THEN 'failed'
      ELSE 'processing'
    END
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to update batch progress when items change
CREATE TRIGGER update_batch_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON video_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_progress(); 