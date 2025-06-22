import { supabase } from '../lib/supabase';

export interface WebhookInfo {
  token: string;
  url: string;
}

export interface TriggerActivationResult {
  token?: string;
  url?: string;
}

/**
 * New Trigger Service for workflow-runner integration
 * Implements the backend contracts for webhook, manual, and scheduled triggers
 */
export class NewTriggerService {
  
  /**
   * Activate a workflow - generates webhook token if needed, schedules cron jobs
   * @param workflowId - UUID of the workflow to activate
   * @returns Promise with token and URL for webhook triggers
   */
  async activateWorkflow(workflowId: string): Promise<TriggerActivationResult> {
    try {
      const { data, error } = await supabase.rpc('activate_workflow', {
        workflow_id: workflowId
      });

      if (error) {
        console.error('Error activating workflow:', error);
        throw new Error(`Failed to activate workflow: ${error.message}`);
      }

      return data || {};
    } catch (error) {
      console.error('Error in activateWorkflow:', error);
      throw error;
    }
  }

  /**
   * Deactivate a workflow - removes webhooks, unschedules cron jobs
   * @param workflowId - UUID of the workflow to deactivate
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('deactivate_workflow', {
        workflow_id: workflowId
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
   * Run a workflow manually - immediately inserts into wf_jobs table
   * @param workflowId - UUID of the workflow to run
   * @param payload - Optional JSON payload to pass to the workflow
   */
  async runWorkflowManual(workflowId: string, payload: any = {}): Promise<void> {
    try {
      const { error } = await supabase.rpc('run_workflow_manual', {
        workflow_id: workflowId,
        payload: payload
      });

      if (error) {
        console.error('Error running workflow manually:', error);
        throw new Error(`Failed to run workflow: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in runWorkflowManual:', error);
      throw error;
    }
  }

  /**
   * Get webhook information for a specific workflow and node
   * @param workflowId - UUID of the workflow
   * @param nodeId - ID of the webhook trigger node
   * @returns Promise with webhook token and URL
   */
  async getWebhookInfo(workflowId: string, nodeId: string): Promise<WebhookInfo> {
    try {
      const { data, error } = await supabase.rpc('get_webhook_info', {
        workflow_id: workflowId,
        node_id: nodeId
      });

      if (error) {
        console.error('Error getting webhook info:', error);
        throw new Error(`Failed to get webhook info: ${error.message}`);
      }

      if (!data || !data.token) {
        throw new Error('No webhook token found for this workflow/node');
      }

      return {
        token: data.token,
        url: data.url || this.buildWebhookUrl(data.token)
      };
    } catch (error) {
      console.error('Error in getWebhookInfo:', error);
      throw error;
    }
  }

  /**
   * Regenerate webhook token for a workflow
   * @param workflowId - UUID of the workflow
   * @param nodeId - ID of the webhook trigger node
   * @returns Promise with new webhook token and URL
   */
  async regenerateWebhookToken(workflowId: string, nodeId: string): Promise<WebhookInfo> {
    try {
      const { data, error } = await supabase.rpc('regenerate_webhook_token', {
        workflow_id: workflowId,
        node_id: nodeId
      });

      if (error) {
        console.error('Error regenerating webhook token:', error);
        throw new Error(`Failed to regenerate webhook token: ${error.message}`);
      }

      return {
        token: data.token,
        url: data.url || this.buildWebhookUrl(data.token)
      };
    } catch (error) {
      console.error('Error in regenerateWebhookToken:', error);
      throw error;
    }
  }

  /**
   * Build webhook URL from token
   * @param token - Webhook token
   * @returns Full webhook URL
   */
  private buildWebhookUrl(token: string): string {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/wf-webhook/${token}`;
  }

  /**
   * Check if a workflow has a manual trigger
   * @param workflowBoardData - The workflow board data
   * @returns boolean indicating if workflow has manual trigger
   */
  hasManualTrigger(workflowBoardData: any): boolean {
    if (!workflowBoardData || !workflowBoardData.nodes) {
      return false;
    }

    return workflowBoardData.nodes.some((node: any) => 
      node.data?.actionKind === 'manual-trigger'
    );
  }

  /**
   * Get webhook trigger node from workflow
   * @param workflowBoardData - The workflow board data
   * @returns webhook trigger node or null
   */
  getWebhookTriggerNode(workflowBoardData: any): any | null {
    if (!workflowBoardData || !workflowBoardData.nodes) {
      return null;
    }

    return workflowBoardData.nodes.find((node: any) => 
      node.data?.actionKind === 'webhook-trigger'
    ) || null;
  }

  /**
   * Get schedule trigger node from workflow
   * @param workflowBoardData - The workflow board data
   * @returns schedule trigger node or null
   */
  getScheduleTriggerNode(workflowBoardData: any): any | null {
    if (!workflowBoardData || !workflowBoardData.nodes) {
      return null;
    }

    return workflowBoardData.nodes.find((node: any) => 
      node.data?.actionKind === 'schedule-trigger'
    ) || null;
  }
}

// Export singleton instance
export const newTriggerService = new NewTriggerService(); 