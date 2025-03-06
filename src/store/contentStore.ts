import { create } from 'zustand';
import { createContent, updateContent, getContents, deleteContent } from '../lib/supabase';
import { createVideo, getVideoStatus } from '../lib/heygen';
import { generateAIScript } from '../lib/openai';
import { Content } from '../types';

interface ContentStore {
  contents: Record<string, Content[]>;
  addContent: (influencerId: string, title: string, script: string) => Promise<Content>;
  updateContent: (influencerId: string, contentId: string, updates: Partial<Content>) => Promise<void>;
  deleteContents: (influencerId: string, contentIds: string[]) => Promise<void>;
  getInfluencerContents: (influencerId: string) => Content[];
  generateVideo: (params: { influencerId: string; templateId: string; script: string; title: string; audioUrl?: string }) => Promise<void>;
  generateScript: (prompt: string) => Promise<string>;
  refreshContents: (influencerId: string) => Promise<void>;
  fetchContents: (influencerId: string) => Promise<void>;
}

export const useContentStore = create<ContentStore>((set, get) => ({
  contents: {},

  addContent: async (influencerId: string, title: string, script: string) => {
    try {
      const newContent = await createContent(influencerId, title, script, 'generating', 0);
      set(state => ({
        contents: {
          ...state.contents,
          [influencerId]: [newContent, ...(state.contents[influencerId] || [])]
        }
      }));
      return newContent;
    } catch (error) {
      console.error('Failed to create content:', error);
      throw error;
    }
  },

  updateContent: async (influencerId: string, contentId: string, updates: Partial<Content>) => {
    try {
      await updateContent(contentId, updates);
      set(state => ({
        contents: {
          ...state.contents,
          [influencerId]: (state.contents[influencerId] || []).map(content =>
            content.id === contentId ? { ...content, ...updates } : content
          )
        }
      }));
    } catch (error) {
      console.error('Failed to update content:', error);
      throw error;
    }
  },

  deleteContents: async (influencerId: string, contentIds: string[]) => {
    try {
      await Promise.all(contentIds.map(id => deleteContent(id)));
      set(state => ({
        contents: {
          ...state.contents,
          [influencerId]: (state.contents[influencerId] || []).filter(
            content => !contentIds.includes(content.id)
          )
        }
      }));
    } catch (error) {
      console.error('Failed to delete contents:', error);
      throw error;
    }
  },

  getInfluencerContents: (influencerId: string) => {
    const state = get();
    return (state.contents[influencerId] || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  fetchContents: async (influencerId: string) => {
    try {
      const contents = await getContents(influencerId);
      set(state => ({
        contents: {
          ...state.contents,
          [influencerId]: contents
        }
      }));
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      throw error;
    }
  },

  refreshContents: async (influencerId: string) => {
    const state = get();
    const contents = state.contents[influencerId] || [];
    const generatingContents = contents.filter(c => c.status === "generating" && c.video_id);
    console.log("content: ",generatingContents);
    for (const content of generatingContents) {
      try {
        const status = await getVideoStatus(content.video_id!);
        
        if (status.status === 'completed' && status.url) {
          await get().updateContent(influencerId, content.id, {
            status: 'completed',
            video_url: status.url
          });
        } else if (status.status === 'failed') {
          await get().updateContent(influencerId, content.id, {
            status: 'failed',
            error: status.error || 'Video generation failed'
          });
        }
      } catch (error) {
        console.error('Failed to refresh video status:', error);
      }
    }
  },

  generateVideo: async ({ influencerId, templateId, script, title, audioUrl }) => {
    const content = await get().addContent(influencerId, title, script,audioUrl);

    try {
      const videoId = await createVideo({
        templateId,
        script,
        title,
        audioUrl
      });

      await get().updateContent(influencerId, content.id, { video_id: videoId });
    } catch (error) {
      await get().updateContent(influencerId, content.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to generate video'
      });
      throw error;
    }
  },

  generateScript: async (prompt: string) => {
    try {
      return await generateAIScript(prompt);
    } catch (error) {
      console.error('Script generation error:', error);
      throw error;
    }
  }
}));