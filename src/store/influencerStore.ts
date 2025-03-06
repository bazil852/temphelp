import { create } from 'zustand';
import { createInfluencer, updateInfluencer, deleteInfluencer, getInfluencers, supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { Influencer } from '../types';

interface InfluencerState {
  influencers: Influencer[];
  addInfluencer: (name: string, templateId: string) => Promise<void>;
  updateInfluencer: (id: string, updates: Partial<Influencer>) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  pollInfluencerStatus: (influencerId: string) => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  getInfluencersForCurrentUser: () => Influencer[];
}

export const useInfluencerStore = create<InfluencerState>((set, get) => ({
  influencers: [],

  addInfluencer: async (name: string, templateId: string) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) throw new Error('No user logged in');

    try {
      // Start a transaction to create influencer and update usage
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('avatars_created')
        .eq('user_id', currentUser.id)
        .single();

      if (usageError) throw usageError;

      // Update the usage count
      const { error: updateError } = await supabase
        .from('user_usage')
        .update({ avatars_created: (usageData?.avatars_created || 0) + 1 })
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      // Create the influencer
      const newInfluencer = await createInfluencer(currentUser.id, name, templateId);
      set(state => ({
        influencers: [newInfluencer, ...state.influencers]
      }));
      
      // Start polling for status updates if influencer is pending
      if (newInfluencer.status === 'pending') {
        pollInfluencerStatus(newInfluencer.id);
      }
    } catch (error) {
      console.error('Failed to create influencer:', error);
      throw error;
    }
  },

  // Add polling function for status updates
  pollInfluencerStatus: async (influencerId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('influencers')
          .select('status')
          .eq('id', influencerId)
          .single();

        if (error) throw error;
        
        // If status is no longer pending, stop polling
        if (data && data.status !== 'pending') {
          clearInterval(pollInterval);
          // Refresh influencers list
          get().fetchInfluencers();
        }
      } catch (err) {
        console.error('Error polling influencer status:', err);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  },

  updateInfluencer: async (id: string, updates: Partial<Influencer>) => {
    try {
      await updateInfluencer(id, {
        name: updates.name,
        template_id: updates.templateId
      });
      set(state => ({
        influencers: state.influencers.map(inf =>
          inf.id === id ? { ...inf, ...updates } : inf
        )
      }));
    } catch (error) {
      console.error('Failed to update influencer:', error);
      throw error;
    }
  },

  deleteInfluencer: async (id: string) => {
    try {
      await deleteInfluencer(id);
      set(state => ({
        influencers: state.influencers.filter(inf => inf.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete influencer:', error);
      throw error;
    }
  },

  fetchInfluencers: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    try {
      const influencers = await getInfluencers(currentUser.id);
      set({ influencers });
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      throw error;
    }
  },

  getInfluencersForCurrentUser: () => {
    return get().influencers;
  }
}));