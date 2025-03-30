export type CloneStep = 'script' | 'video' | 'images' | 'complete';
export type CloneStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageInstruction {
  title: string;
  image: string;
}

export interface Clone {
  id: string;
  user_id: string;
  name: string;
  script: string;
  status: string;
  clone_id?: string;
  template_id?: string;
  image_preview?: string;
  created_at: string;
  updated_at: string;
}