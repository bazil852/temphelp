import { supabase } from '../lib/supabase';

export interface ActivationResult {
  token: string;
  url: string;
  status: string;
}

export interface WebhookInfo {
  token: string;
  url: string;
  captured_at?: string;
}

export interface RegenerateResult {
  token: string;
  url: string;
}

/**
 * Trigger Service for workflow-runner integration
 * Implements the exact backend contracts specified
 */

/**
 * Activate a workflow - generates webhook token if needed, schedules cron jobs
 * RPC: activate_workflow(p_workflow UUID) RETURNS record (token text, url text, status text)
 */
export async function activateWorkflow(id: string): Promise<ActivationResult> {
  try {
    const { data, error } = await supabase.rpc('activate_workflow', {
      p_workflow: id
    });

    if (error) {
      console.error('Error activating workflow:', error);
      throw new Error(`Failed to activate workflow: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in activateWorkflow:', error);
    throw error;
  }
}

/**
 * Deactivate a workflow - unschedules cron, keeps webhook token
 * RPC: deactivate_workflow(p_workflow UUID) RETURNS void
 */
export async function deactivateWorkflow(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('deactivate_workflow', {
      p_workflow: id
    });

    if (error) {
      console.error('Error deactivating workflow:', error);
      throw new Error(`Failed to deactivate workflow: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deactivateWorkflow:', error);
    throw error;
  }
}

/**
 * Regenerate webhook token for a workflow
 * RPC: regenerate_webhook_token(p_workflow UUID, p_node text) RETURNS record (token text, url text)
 */
export async function regenerateWebhookToken(workflowId: string, nodeId: string): Promise<RegenerateResult> {
  try {
    const { data, error } = await supabase.rpc('regenerate_webhook_token', {
      p_workflow: workflowId,
      p_node: nodeId
    });

    if (error) {
      console.error('Error regenerating webhook token:', error);
      throw new Error(`Failed to regenerate webhook token: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in regenerateWebhookToken:', error);
    throw error;
  }
}

/**
 * Get webhook information for a specific workflow and node
 * RPC: get_webhook_info(p_workflow UUID, p_node text) RETURNS record (token text, url text, captured_at timestamptz)
 */
export async function getWebhookInfo(workflowId: string, nodeId: string): Promise<WebhookInfo> {
  try {
    const { data, error } = await supabase.rpc('get_webhook_info', {
      p_workflow: workflowId,
      p_node: nodeId
    });

    if (error) {
      console.error('Error getting webhook info:', error);
      throw new Error(`Failed to get webhook info: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getWebhookInfo:', error);
    throw error;
  }
}

/**
 * Run a workflow manually - immediately inserts into wf_jobs table
 * RPC: run_workflow_manual(p_workflow UUID, p_payload JSONB DEFAULT '{}') RETURNS void
 */
export async function runWorkflow(workflowId: string, payload: any = {}): Promise<void> {
  try {
    const { error } = await supabase.rpc('run_workflow_manual', {
      p_workflow: workflowId,
      p_payload: payload
    });

    if (error) {
      console.error('Error running workflow manually:', error);
      throw new Error(`Failed to run workflow: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in runWorkflow:', error);
    throw error;
  }
}

/**
 * Helper function to check if a workflow has a manual trigger
 */
export function hasManualTrigger(workflowBoardData: any): boolean {
  if (!workflowBoardData || !workflowBoardData.nodes) {
    return false;
  }

  return workflowBoardData.nodes.some((node: any) => 
    node.data?.actionKind === 'manual-trigger'
  );
}

/**
 * Helper function to get webhook trigger node from workflow
 */
export function getWebhookTriggerNode(workflowBoardData: any): any | null {
  if (!workflowBoardData || !workflowBoardData.nodes) {
    return null;
  }

  return workflowBoardData.nodes.find((node: any) => 
    node.data?.actionKind === 'webhook-trigger'
  ) || null;
}

/**
 * Helper function to get schedule trigger node from workflow
 */
export function getScheduleTriggerNode(workflowBoardData: any): any | null {
  if (!workflowBoardData || !workflowBoardData.nodes) {
    return null;
  }

  return workflowBoardData.nodes.find((node: any) => 
    node.data?.actionKind === 'schedule-trigger'
  ) || null;
} 