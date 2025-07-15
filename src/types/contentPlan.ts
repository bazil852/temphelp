// Content Plan TypeScript Types
// Matches the content_plans database table schema

export type ContentPlanStatus = "scheduled" | "processing" | "completed" | "failed";

export interface ContentPlan {
  id: string;
  user_id: string;
  influencer_id: string;
  look_id: string;
  prompt: string;
  title: string | null;
  starts_at: string;
  rrule: string | null;
  status: ContentPlanStatus;
  last_run_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContentPlanRequest {
  influencer_id: string;
  look_id: string;
  prompt: string;
  title?: string;
  starts_at: string;
  rrule?: string;
  status?: ContentPlanStatus;
}

export interface UpdateContentPlanRequest {
  influencer_id?: string;
  look_id?: string;
  prompt?: string;
  title?: string;
  starts_at?: string;
  rrule?: string;
  status?: ContentPlanStatus;
}

// Real-time subscription payload
export interface ContentPlanRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: ContentPlan;
  old?: ContentPlan;
}

// Scheduler monitoring types
export interface ContentPlanStatusSummary {
  status: ContentPlanStatus;
  count: number;
  oldest_scheduled?: string;
}

export interface SchedulerDispatchResult {
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    planId: string;
    status: 'success' | 'failed';
    message: string;
  }>;
} 