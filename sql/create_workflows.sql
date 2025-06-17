-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workflows table for workflow metadata
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_data table for storing workflow board state
CREATE TABLE IF NOT EXISTS workflow_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  board_data JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_data_updated_at
  BEFORE UPDATE ON workflow_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflows table
CREATE POLICY "Users can view their own workflows"
ON workflows FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows"
ON workflows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
ON workflows FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
ON workflows FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for workflow_data table
CREATE POLICY "Users can view their own workflow data"
ON workflow_data FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workflows w 
    WHERE w.id = workflow_data.workflow_id 
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workflow data for their workflows"
ON workflow_data FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows w 
    WHERE w.id = workflow_data.workflow_id 
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update workflow data for their workflows"
ON workflow_data FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workflows w 
    WHERE w.id = workflow_data.workflow_id 
    AND w.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows w 
    WHERE w.id = workflow_data.workflow_id 
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete workflow data for their workflows"
ON workflow_data FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workflows w 
    WHERE w.id = workflow_data.workflow_id 
    AND w.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS workflows_user_id_idx ON workflows(user_id);
CREATE INDEX IF NOT EXISTS workflows_status_idx ON workflows(status);
CREATE INDEX IF NOT EXISTS workflows_created_at_idx ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS workflows_tags_idx ON workflows USING GIN(tags);

CREATE INDEX IF NOT EXISTS workflow_data_workflow_id_idx ON workflow_data(workflow_id);
CREATE INDEX IF NOT EXISTS workflow_data_version_idx ON workflow_data(workflow_id, version DESC);

-- Grant necessary permissions
GRANT ALL ON workflows TO authenticated;
GRANT ALL ON workflow_data TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 