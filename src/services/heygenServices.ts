import { supabase } from '../lib/supabase';
import { AvatarFormData } from '../constants/avatarOptions';
import { env } from '../lib/env';

export interface GeneratedImages {
  urls: string[];
  keys: string[];
}

export const createAvatarGroup = async (imageKey: string, name: string) => {
  try {
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("heygen_key")
      .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
      .single();

    if (apiKeyError || !apiKeyData?.heygen_key) {
      throw new Error("Failed to get HeyGen API key");
    }

    const response = await fetch(
      "https://api.heygen.com/v2/photo_avatar/avatar_group/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "x-api-key": apiKeyData.heygen_key,
        },
        body: JSON.stringify({
          name,
          image_key: imageKey,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "Failed to create avatar group");
    }

    return data.data;
  } catch (error) {
    console.error("Error creating avatar group:", error);
    throw error;
  }
};

export const checkGenerationStatus = async (generationId: string) => {
  try {
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("heygen_key")
      .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
      .single();

    if (apiKeyError || !apiKeyData?.heygen_key) {
      throw new Error("Failed to get HeyGen API key");
    }

    const response = await fetch(
      `https://api.heygen.com/v2/photo_avatar/generation/${generationId}`,
      {
      method: 'GET',
      headers: {
        accept: "application/json",
        "x-api-key": apiKeyData.heygen_key,
      }
    });

    if (!response.ok) throw new Error('Failed to check generation status');
    const data = await response.json();
    
    if (data.error || !data.data) {
      throw new Error(data.error.message || 'Failed to check generation status');
    }
    
    // Extract image URLs and keys from the response
    const imageUrls = data.data.image_url_list || [];
    const imageKeys = data.data.image_key_list || [];
    
    return {
      state: data.data.status,
      progress: data.data.progress || 0,
      images: {
        urls: imageUrls,
        keys: imageKeys
      }
    };
  } catch (error) {
    console.error('Error checking generation status:', error);
    throw error;
  }
};

export const startPolling = async (
  generationId: string,
  onProgress: (progress: number) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  let attempts = 0;
  const maxAttempts = 20;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      onError(new Error('Generation timed out'));
      return;
    }

    try {
      const data = await checkGenerationStatus(generationId);
      onProgress(data.progress || 0);

      if (data.state === 'success' && data.images) {
        onComplete(data.images);
      } else if (data.state === 'failed') {
        onError(new Error('Generation failed'));
      } else {
        attempts++;
        setTimeout(poll, 3000);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to check status'));
    }
  };

  await poll();
};

export const uploadImageToSupabase = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const filename = `avatars/${crypto.randomUUID()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('influencer-images')
      .upload(filename, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('influencer-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const generatePrompt = (data: AvatarFormData): string => {
  return `${data.gender}, ${data.age} years old, ${data.description}${
    data.background ? `, ${data.background}` : ''
  }, ${data.viewType.toLowerCase()} view`;
};