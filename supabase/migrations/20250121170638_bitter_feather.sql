/*
  # Create support webhook table
  
  1. New Tables
    - `support_webhook`
      - `id` (uuid, primary key)
      - `url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `support_webhook` table
    - Add policies for authenticated users
*/

-- Create support webhook table
CREATE TABLE IF NOT EXISTS support_webhook (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_support_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_webhook_updated_at
  BEFORE UPDATE ON support_webhook
  FOR EACH ROW
  EXECUTE FUNCTION update_support_webhook_updated_at();

-- Enable RLS
ALTER TABLE support_webhook ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users"
ON support_webhook
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);