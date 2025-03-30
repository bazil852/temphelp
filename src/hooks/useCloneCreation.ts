import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';
import { useAuthStore } from '../store/authStore';

export interface UseCloneCreationProps {
  onStepComplete: (step: 'script' | 'video' | 'images') => void;
  onError: (error: string) => void;
}

export const useCloneCreation = ({ onStepComplete, onError }: UseCloneCreationProps) => {
  const { currentUser } = useAuthStore();
  const [cloneId, setCloneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCalibrationScript = async (cloneName: string) => {
    setIsLoading(true);
    
    try {
      if (!cloneName.trim()) {
        throw new Error('Please enter a name for your clone');
      }
  
      const response = await fetch(`${env.AI_CLONE_BACKEND_PROXY}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://api.captions.ai/api/twin/script',
          method: 'POST',
          body: {
            language: 'English'
          }
        })
      });
  
      if (!response.ok) throw new Error('Failed to fetch calibration script');
  
      const data = await response.json();
      const script = data.script || data.calibrationScript;
  
      // Save to Supabase
      const { error: dbError, data: newClone } = await supabase
        .from('clones')
        .insert([{
          user_id: currentUser?.id,
          name: cloneName,
          script,
          status: 'script_ready'
        }])
        .select()
        .single();
  
      if (dbError) throw dbError;
      
      setCloneId(newClone.id);
      onStepComplete('script');
      return script;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch script');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSubmit = async (videoFile: File) => {
    if (!videoFile || !currentUser || !cloneId) return;
    
    setIsLoading(true);

    try {
      const timestamp = Date.now();
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `videos/${currentUser.id}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('clones')
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clones')
        .getPublicUrl(filePath);

      await supabase
        .from('clones')
        .update({
          status: 'video_uploaded'
        })
        .eq('id', cloneId);

      onStepComplete('video');
      return publicUrl;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload video');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagesSubmit = async (images: File[], videoUrl: string) => {
    if (images.length !== 5 || !videoUrl || !cloneId) return;
    
    setIsLoading(true);

    try {
      const uploadedUrls = await Promise.all(images.map(async (image, index) => {
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const filePath = `images/${currentUser?.id}-${timestamp}-${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('clones')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('clones')
          .getPublicUrl(filePath);

        if (index === 0) {
          await supabase
            .from('clones')
            .update({ image_preview: publicUrl })
            .eq('id', cloneId);
        }

        return publicUrl;
      }));

      const response = await fetch(`${env.AI_CLONE_BACKEND_PROXY}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://api.captions.ai/api/twin/create',
          method: 'POST',
          body: {
            name: cloneName,
            videoUrl: videoUrl,
            calibrationImageUrls: uploadedUrls,
            language: 'English'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create AI Twin');

      const data = await response.json();
      
      await supabase
        .from('clones')
        .update({
          clone_id: data.twinId,
          template_id: data.operationId,
          status: 'creation_started'
        })
        .eq('id', cloneId);

      onStepComplete('images');
      return {
        operationId: data.operationId,
        uploadedUrls
      };
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create AI Twin');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cloneId,
    isLoading,
    fetchCalibrationScript,
    handleVideoSubmit,
    handleImagesSubmit
  };
};