-- Drop existing policies and functions
DROP POLICY IF EXISTS "Allow webhook access" ON webhooks;
DROP FUNCTION IF EXISTS handle_webhook_request;

-- Create webhook_requests table
CREATE TABLE IF NOT EXISTS webhook_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhook_requests ENABLE ROW LEVEL SECURITY;

-- Create webhook handling function
CREATE OR REPLACE FUNCTION handle_webhook_request(webhook_id UUID, payload JSONB)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  webhook_record RECORD;
  influencer_record RECORD;
BEGIN
  -- Get webhook details
  SELECT * INTO webhook_record 
  FROM webhooks 
  WHERE id = webhook_id 
  AND active = true;

  IF webhook_record IS NOT NULL THEN
    -- Insert request
    INSERT INTO webhook_requests (webhook_id, title, script)
    VALUES (
      webhook_id,
      payload->>'title',
      payload->>'script'
    );

    -- Process for each linked influencer
    FOR influencer_record IN 
      SELECT i.* 
      FROM influencers i
      WHERE i.id = webhook_record.influencer_id
    LOOP
      -- Insert content for processing
      INSERT INTO contents (
        influencer_id,
        title,
        script,
        status,
        created_at
      ) VALUES (
        influencer_record.id,
        payload->>'title',
        payload->>'script',
        'generating',
        NOW()
      );
    END LOOP;
  END IF;
END;
$$;

-- Create policies
CREATE POLICY "Allow public webhook access"
ON webhooks
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public webhook request access"
ON webhook_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON webhook_requests TO anon;
GRANT ALL ON webhook_requests TO authenticated;
GRANT EXECUTE ON FUNCTION handle_webhook_request TO anon;
GRANT EXECUTE ON FUNCTION handle_webhook_request TO authenticated;