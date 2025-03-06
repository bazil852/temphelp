export interface CreateVideoParams {
  templateId: string;
  script: string;
  apiKey: string;
  title: string;
  audioUrl?: string;
}

export interface HeyGenResponse {
  data?: {
    video_id: string;
    status?: string;
    video_url?: string;
    error?: string;
    duration?: number;
    thumbnail_url?: string;
    gif_url?: string;
    caption_url?: string;
    video_url_caption?: string;
  };
  error?: {
    message: string;
  };
  message?: string;
}

export interface VideoStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  thumbnailUrl?: string;
  gifUrl?: string;
  duration?: number;
}