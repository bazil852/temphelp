import { create } from 'zustand';
import { createWebhook, updateWebhook, deleteWebhook, getWebhooks } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { Webhook, WebhookEvent } from '../types';

interface WebhookState {
  webhooks: Webhook[];
  addWebhook: (name: string, url: string, event: WebhookEvent, influencerIds: string[]) => Promise<void>;
  updateWebhook: (id: string, updates: Partial<Webhook>) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  fetchWebhooks: () => Promise<void>;
  getWebhooksForInfluencer: (influencerId: string) => Webhook[];
}

export const useWebhookStore = create<WebhookState>((set, get) => ({
  webhooks: [],

  // addWebhook: async (name: string, url: string, event: WebhookEvent, influencerIds: string[]) => {
  //   const currentUser = useAuthStore.getState().currentUser;
  //   console.log("Webhook address: ",url);
  //   if (!currentUser) throw new Error('No user logged in');

  //   try {
  //     const newWebhooks = await createWebhook(currentUser.id, name, url, event, influencerIds);
  //     set(state => ({
  //       webhooks: [...newWebhooks, ...state.webhooks]
  //     }));
  //   } catch (error) {
  //     console.error('Failed to create webhook:', error);
  //     throw error;
  //   }
  // },

  addWebhook: async (
    name: string,
    url: string,
    event: WebhookEvent,
    influencerIds: string[],
    webhookType: string
  ) => {
    const currentUser = useAuthStore.getState().currentUser;
    console.log("Webhook address: ", url);
  
    if (!currentUser) throw new Error('No user logged in');
  
    try {
      const newWebhooks = await createWebhook(
        currentUser.id,
        name,
        url,
        event,
        influencerIds,
        webhookType // Pass the webhook type to the Supabase function
      );
  
      set((state) => ({
        webhooks: [...newWebhooks, ...state.webhooks],
      }));
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  },
  
  updateWebhook: async (id: string, updates: Partial<Webhook>) => {
    try {
      await updateWebhook(id, updates);
      set(state => ({
        webhooks: state.webhooks.map(webhook =>
          webhook.id === id ? { ...webhook, ...updates } : webhook
        )
      }));
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  },

  deleteWebhook: async (id: string) => {
    try {
      await deleteWebhook(id);
      set(state => ({
        webhooks: state.webhooks.filter(webhook => webhook.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  },

  fetchWebhooks: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    try {
      const webhooks = await getWebhooks(currentUser.id);
      set({ webhooks });
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      throw error;
    }
  },

  getWebhooksForInfluencer: (influencerId: string) => {
    return get().webhooks.filter(webhook => 
      webhook.influencerIds.includes(influencerId)
    );
  }
}));