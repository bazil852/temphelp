import { supabase } from '../supabase';
import { BoardJson } from './types';
import { boardToExec } from './boardToExec';

export interface SaveWorkflowDto {
  workflowId?: string; // undefined = new
  name: string;
  description: string;
  tags: string[];
}

export async function saveWorkflow(board: BoardJson, dto: SaveWorkflowDto): Promise<string> {
  const exec = boardToExec(board, dto.name);
  
  if (!dto.workflowId) {
    // Create new workflow
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.from("workflows").insert({
      user_id: user.id,
      name: dto.name,
      description: dto.description,
      tags: dto.tags,
      board_data: board,
      exec_definition: exec,
      version: 1,
      status: 'inactive'
    }).select("id").single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return data!.id;
  } else {
    // Update existing workflow
    const { data: current, error: fetchError } = await supabase.from("workflows")
      .select("version").eq("id", dto.workflowId).single();

    if (fetchError) {
      console.error('Error fetching current workflow:', fetchError);
      throw new Error(`Failed to fetch workflow: ${fetchError.message}`);
    }

    const { error: updateError } = await supabase.from("workflows").update({
      name: dto.name,
      description: dto.description,
      tags: dto.tags,
      board_data: board,
      exec_definition: exec,
      version: current!.version + 1
    }).eq("id", dto.workflowId);

    if (updateError) {
      console.error('Error updating workflow:', updateError);
      throw new Error(`Failed to update workflow: ${updateError.message}`);
    }

    return dto.workflowId;
  }
} 