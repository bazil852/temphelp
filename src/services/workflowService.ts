import { supabase } from '../lib/supabase';
import { saveWorkflow as saveWorkflowNew, SaveWorkflowDto } from '../lib/workflows/saveWorkflow';
import { BoardJson } from '../lib/workflows/types';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  tags: string[];
  status: 'active' | 'inactive';
  board_data?: any; // React-Flow board data
  exec_definition?: any; // Optimized execution definition
  version?: number; // Auto-incrementing version
  created_at: string;
  updated_at: string;
}

export interface WorkflowData {
  id: string;
  workflow_id: string;
  board_data: any;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  tags?: string[];
  board_data?: any;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
}

// Workflow CRUD Operations
export const workflowService = {
  // Get all workflows for the current user
  async getWorkflows(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    return data || [];
  },

  // Get a specific workflow by ID
  async getWorkflow(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Workflow not found
      }
      console.error('Error fetching workflow:', error);
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }

    return data;
  },

  // Create a new workflow
  async createWorkflow(request: CreateWorkflowRequest): Promise<Workflow> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create workflow metadata
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        name: request.name,
        description: request.description,
        tags: request.tags || [],
        status: 'inactive'
      })
      .select()
      .single();

    if (workflowError) {
      console.error('Error creating workflow:', workflowError);
      throw new Error(`Failed to create workflow: ${workflowError.message}`);
    }

    // Create initial workflow data if provided
    if (request.board_data) {
      await this.saveWorkflowData(workflow.id, request.board_data);
    }

    return workflow;
  },

  // Update workflow metadata
  async updateWorkflow(id: string, request: UpdateWorkflowRequest): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      throw new Error(`Failed to update workflow: ${error.message}`);
    }

    // Note: Trigger management is now handled via RPC functions in the editor
    // See activateWorkflow() and deactivateWorkflow() in triggerService.ts

    return data;
  },

  // Delete a workflow (and its data)
  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workflow:', error);
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  },

  // Duplicate a workflow
  async duplicateWorkflow(id: string): Promise<Workflow> {
    // Get original workflow
    const originalWorkflow = await this.getWorkflow(id);

    if (!originalWorkflow) {
      throw new Error('Workflow not found');
    }

    // Create new workflow with copied data
    const newWorkflow = await this.createWorkflow({
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      tags: originalWorkflow.tags,
      board_data: originalWorkflow.board_data
    });

    return newWorkflow;
  },

  // Save workflow board data (moved here for proper access)
  async saveWorkflowData(workflowId: string, boardData: any): Promise<WorkflowData> {
    return workflowDataService.saveWorkflowData(workflowId, boardData);
  },

  // New optimized save function that saves both board_data and exec_definition
  async saveWorkflowOptimized(board: BoardJson, dto: SaveWorkflowDto): Promise<string> {
    return saveWorkflowNew(board, dto);
  }
};

// Workflow Data Operations
export const workflowDataService = {
  // Get workflow board data
  async getWorkflowData(workflowId: string): Promise<WorkflowData | null> {
    const { data, error } = await supabase
      .from('workflow_data')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No data found
      }
      console.error('Error fetching workflow data:', error);
      throw new Error(`Failed to fetch workflow data: ${error.message}`);
    }

    return data;
  },

  // Save workflow board data
  async saveWorkflowData(workflowId: string, boardData: any): Promise<WorkflowData> {
    // Get current version
    const currentData = await this.getWorkflowData(workflowId);
    const nextVersion = currentData ? currentData.version + 1 : 1;

    const { data, error } = await supabase
      .from('workflow_data')
      .insert({
        workflow_id: workflowId,
        board_data: boardData,
        version: nextVersion
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving workflow data:', error);
      throw new Error(`Failed to save workflow data: ${error.message}`);
    }

    return data;
  },

  // Get workflow data history (all versions)
  async getWorkflowDataHistory(workflowId: string): Promise<WorkflowData[]> {
    const { data, error } = await supabase
      .from('workflow_data')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching workflow data history:', error);
      throw new Error(`Failed to fetch workflow data history: ${error.message}`);
    }

    return data || [];
  }
};

// Export both services as a single object for convenience
export default {
  ...workflowService,
  ...workflowDataService
}; 

// Export the new types and function for direct use
export { saveWorkflowNew as saveWorkflow };
export type { SaveWorkflowDto, BoardJson }; 