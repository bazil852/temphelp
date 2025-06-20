-- Create webhook_test_data table for storing captured test webhook data
CREATE TABLE IF NOT EXISTS webhook_test_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    method TEXT DEFAULT 'POST',
    query_params JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_test_data_test_id ON webhook_test_data(test_id);
CREATE INDEX IF NOT EXISTS idx_webhook_test_data_created_at ON webhook_test_data(created_at);

-- Add RLS (Row Level Security)
ALTER TABLE webhook_test_data ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to manage their test data
-- Note: Test webhook data is temporary and not user-specific, so we allow broader access
CREATE POLICY "Allow test webhook data access" ON webhook_test_data
    FOR ALL USING (true);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_test_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_test_data_updated_at
    BEFORE UPDATE ON webhook_test_data
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_test_data_updated_at(); 