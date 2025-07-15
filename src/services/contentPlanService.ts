import { supabase } from '../lib/supabase';
import { ContentPlan, CalendarEvent } from '../types/content-planner';

export interface CreateContentPlanRequest {
  influencerId: string;
  lookId: string;
  prompt: string;
  title?: string;
  startsAt: string; // ISO string
  rrule?: string;
}

export interface UpdateContentPlanRequest {
  prompt?: string;
  title?: string;
  startsAt?: string;
  rrule?: string;
  status?: 'scheduled' | 'processing' | 'completed' | 'failed';
  lastRunAt?: string;
}

/**
 * Get all content plans for the current user
 */
export const getContentPlans = async (): Promise<ContentPlan[]> => {
  const { data, error } = await supabase
    .from('content_plans')
    .select('*')
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching content plans:', error);
    throw error;
  }

  return data.map(transformDbToContentPlan);
};

/**
 * Get content plans for a specific date range
 */
export const getContentPlansByDateRange = async (
  startDate: Date, 
  endDate: Date
): Promise<ContentPlan[]> => {
  const { data, error } = await supabase
    .from('content_plans')
    .select('*')
    .gte('starts_at', startDate.toISOString())
    .lte('starts_at', endDate.toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching content plans by date range:', error);
    throw error;
  }

  return data.map(transformDbToContentPlan);
};

/**
 * Create a new content plan
 */
export const createContentPlan = async (
  request: CreateContentPlanRequest
): Promise<ContentPlan> => {
  const { data, error } = await supabase
    .from('content_plans')
    .insert({
      influencer_id: request.influencerId,
      look_id: request.lookId,
      prompt: request.prompt,
      title: request.title,
      starts_at: request.startsAt,
      rrule: request.rrule,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content plan:', error);
    throw error;
  }

  return transformDbToContentPlan(data);
};

/**
 * Update an existing content plan
 */
export const updateContentPlan = async (
  id: string,
  request: UpdateContentPlanRequest
): Promise<ContentPlan> => {
  const updateData: any = {};
  
  if (request.prompt !== undefined) updateData.prompt = request.prompt;
  if (request.title !== undefined) updateData.title = request.title;
  if (request.startsAt !== undefined) updateData.starts_at = request.startsAt;
  if (request.rrule !== undefined) updateData.rrule = request.rrule;
  if (request.status !== undefined) updateData.status = request.status;
  if (request.lastRunAt !== undefined) updateData.last_run_at = request.lastRunAt;
  
  const { data, error } = await supabase
    .from('content_plans')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content plan:', error);
    throw error;
  }

  return transformDbToContentPlan(data);
};

/**
 * Delete a content plan
 */
export const deleteContentPlan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('content_plans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content plan:', error);
    throw error;
  }
};

/**
 * Delete multiple content plans
 */
export const deleteContentPlans = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from('content_plans')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting content plans:', error);
    throw error;
  }
};

/**
 * Transform database row to ContentPlan
 */
function transformDbToContentPlan(dbRow: any): ContentPlan {
  return {
    id: dbRow.id,
    influencerId: dbRow.influencer_id,
    lookId: dbRow.look_id,
    prompt: dbRow.prompt,
    title: dbRow.title,
    startsAt: dbRow.starts_at,
    rrule: dbRow.rrule,
    status: dbRow.status,
    lastRunAt: dbRow.last_run_at,
    createdBy: dbRow.created_by,
    createdAt: dbRow.created_at,
  };
}

/**
 * Convert ContentPlan to CalendarEvent for use in the calendar component
 */
export const contentPlanToCalendarEvent = (contentPlan: ContentPlan): CalendarEvent => {
  const startDate = new Date(contentPlan.startsAt);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  return {
    ...contentPlan,
    title: contentPlan.title || contentPlan.prompt.substring(0, 50),
    start: startDate,
    end: endDate,
  };
};

/**
 * Convert multiple ContentPlans to CalendarEvents
 */
export const contentPlansToCalendarEvents = (contentPlans: ContentPlan[]): CalendarEvent[] => {
  return contentPlans.map(contentPlanToCalendarEvent);
}; 