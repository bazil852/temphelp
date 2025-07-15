// Content Planner Data Contracts

export interface Look {
  id: string;
  label: string;
  thumbnailUrl: string;
}

export interface InfluencerWithLooks {
  id: string;
  name: string;
  looks: Look[];
  avatar?: string;
}

export interface ContentPlan {
  id: string;
  influencerId: string;
  lookId: string;
  prompt: string;
  startsAt: string;          // ISO 8601
  rrule?: string;            // iCal RRULE, null => one-off
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  lastRunAt?: string;
  createdBy: string;
  createdAt: string;
  title?: string;
}

export interface CalendarEvent extends ContentPlan {
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface RecurrenceRule {
  frequency: 'once' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
  interval?: number;
  until?: Date;
  count?: number;
  rruleString?: string;
}

export interface DraggedInfluencer {
  id: string;
  name: string;
  lookId?: string;
}

export interface ScheduleFormData {
  influencerId: string;
  prompt: string;
  lookId: string;
  dateTime: Date;
  recurrence: RecurrenceRule;
  generateThumbnail: boolean;
} 