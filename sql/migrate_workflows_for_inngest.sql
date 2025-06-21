-- Migration to adapt workflows table for Inngest Workflow Kit
-- This converts the definition column to TEXT for storing TypeScript source

BEGIN;

-- Add a new column for Inngest workflow definition
ALTER TABLE workflows 
ADD COLUMN inngest_definition TEXT;

-- Comment explaining the change
COMMENT ON COLUMN workflows.inngest_definition IS 'TypeScript source code for Inngest workflow function';

-- The existing workflow_data table can still be used for UI state
-- but we'll use the new inngest_definition column for the actual executable workflow

COMMIT; 