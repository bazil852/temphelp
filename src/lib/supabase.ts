import { createClient } from '@supabase/supabase-js';
import { Content, Webhook, WebhookEvent, Influencer } from '../types';

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with retry logic
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set');
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return client;
};

export const supabase = createSupabaseClient();


// User Management
export const createUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        email_confirmed: false
      }
    }
  });
  if (error) throw error;
  return { data, needsEmailConfirmation: true };
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      throw { code: 'email_not_confirmed', message: 'Please confirm your email before logging in.' };
    }
    throw error;
  }
  
  return data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// API Keys Management
export const upsertApiKeys = async (userId: string, openaiKey: string, heygenKey: string) => {
  const { error } = await supabase
    .from('api_keys')
    .upsert({ 
      user_id: userId, 
      openai_key: openaiKey, 
      heygen_key: heygenKey 
    });
  if (error) throw error;
};

export const getApiKeys = async (userId: string) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('openai_key, heygen_key') 
    .eq('id', '1daa0747-bf85-4a1e-82d7-808d4e2b1fa7')
    .single();
  if (error) throw error;
  return data;
};

// Influencer Management
export const createInfluencer = async (userId: string, name: string, templateId: string) => {
  const { data, error } = await supabase
    .from('influencers')
    .insert([{ 
      user_id: userId, 
      name, 
      template_id: templateId 
    }])
    .select()
    .single();
  if (error) throw error;
  
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    templateId: data.template_id
  };
};

export const updateInfluencer = async (id: string, updates: { name?: string; template_id?: string }) => {
  const { error } = await supabase
    .from('influencers')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

export const deleteInfluencer = async (id: string) => {
  const { error } = await supabase
    .from('influencers')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getInfluencers = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('influencers') 
      .select(`
        id,
        user_id,
        name,
        template_id,
        preview_url,
        status,
        voice_id,
        look_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(influencer => ({
      id: influencer.id,
      userId: influencer.user_id,
      name: influencer.name,
      templateId: influencer.template_id,
      preview_url: influencer.preview_url,
      status: influencer.status,
      voice_id: influencer.voice_id,
      look_id: influencer.look_id,
      created_at: influencer.created_at,
      updated_at: influencer.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch influencers:', error);
    throw error;
  }
};

// Content Management
export const createContent = async (influencerId: string, title: string, script: string, status: string) => {
  const { data, error } = await supabase
    .from('contents')
    .insert({ 
      influencer_id: influencerId, 
      title, 
      script, 
      status,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateContent = async (id: string, updates: Partial<Content>) => {
  const { error } = await supabase
    .from('contents')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

export const deleteContent = async (id: string) => {
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getContents = async (influencerId: string) => {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Webhook Management
export const createWebhook = async (
  userId: string,
  name: string,
  url: string,
  event: WebhookEvent,
  influencerIds: string[],
  webhookType: string // Include the webhook type as a parameter
): Promise<Webhook[]> => {
  const promises = influencerIds.map(async (influencerId) => {
    const { data, error } = await supabase
      .from('webhooks')
      .insert([
        {
          user_id: userId,
          name,
          url,
          event,
          influencer_id: influencerId,
          webhook_type: webhookType, // Save the webhook type
          active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create webhook');

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      url: data.url,
      event: data.event,
      influencerIds: [data.influencer_id],
      active: data.active,
      createdAt: data.created_at,
      type: data.webhook_type, // Include the webhook type in the response
    };
  });

  return Promise.all(promises);
};


export const updateWebhook = async (id: string, updates: Partial<Webhook>) => {
  const { error } = await supabase
    .from('webhooks')
    .update({
      name: updates.name,
      url: updates.url,
      event: updates.event,
      influencer_id: updates.influencerIds?.[0],
      active: updates.active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
};

export const deleteWebhook = async (id: string) => {
  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getWebhooks = async (userId: string): Promise<Webhook[]> => {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*, influencers(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(webhook => ({
    id: webhook.id,
    userId: webhook.user_id,
    name: webhook.name,
    url: webhook.url,
    event: webhook.event,
    influencerIds: [webhook.influencer_id].filter(Boolean),
    active: webhook.active,
    createdAt: webhook.created_at,
    type: webhook.event === 'video.create' ? 'webhook' : 'automation'
  }));
};

export const uploadAudioToSupabase = async (audioBlob: Blob): Promise<string> => {
  try {
    // Generate a unique filename
    const filename = `${crypto.randomUUID()}.mp3`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio_files')
      .upload(filename, audioBlob);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio_files')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};