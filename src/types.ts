export interface User {
  id: string;
  email: string;
  openaiApiKey?: string;
  heygenApiKey?: string;
  hasPlan?: boolean;
}

export interface Influencer {
  id: string;
  name: string;
  templateId: string;
  userId: string;
  preview_url?: string;
  status?: string;
  voice_id?: string;
  look_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Content {
  id: string;
  influencerId: string;
  title: string;
  script: string;
  status: 'generating' | 'completed' | 'failed';
  video_url?: string;
  video_id?: string;
  createdAt: string;
  error?: string;
}

export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: 'webhook' | 'automation';
  event: WebhookEvent;
  influencerIds: string[];
  active: boolean;
  createdAt: string;
}

export type WebhookEvent = 
  | 'video.completed'  // Triggered when a video is completed
  | 'video.failed'     // Triggered when a video fails
  | 'video.create';    // Endpoint for creating new videos