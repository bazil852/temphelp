import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface VideoProgress {
  completed: number;
  total: number;
}

interface CompletedVideo {
  id: string;
  video_id: string;
  video_url: string;
  line_id: number;
  status: 'processing' | 'completed' | 'failed';
  influencer_name: string;
  text: string;
  created_at: string;
}

interface VideoBatch {
  id: string;
  title: string;
  total_videos: number;
  completed_videos: number;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  user_id: string;
  video_batch_items?: CompletedVideo[];
}

export const useVideoGeneration = () => {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<VideoProgress>({ completed: 0, total: 0 });
  const [completedVideos, setCompletedVideos] = useState<CompletedVideo[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Backend handles batch creation, so this function is no longer needed

  const fetchBatchProgress = async (batchId: string): Promise<VideoBatch> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/batch-status/${batchId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch batch progress');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Backend failed to fetch batch progress');
    }
    
    // Transform backend response to match our interface
    return {
      id: data.batchId,
      title: data.title,
      total_videos: data.totalVideos,
      completed_videos: data.completedVideos,
      status: data.status,
      created_at: data.createdAt,
      user_id: currentUser?.id || '',
      video_batch_items: data.videos?.map((video: any) => ({
        id: video.id,
        video_id: video.video_id,
        video_url: video.video_url,
        line_id: video.line_id,
        status: video.status,
        influencer_name: video.influencer_name,
        text: video.text,
        created_at: video.created_at
      })) || []
    };
  };

  const startPolling = useCallback((batchId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const batchData = await fetchBatchProgress(batchId);
        
        setProgress({
          completed: batchData.completed_videos,
          total: batchData.total_videos
        });
        
        setCompletedVideos(batchData.video_batch_items || []);
        setStatus(batchData.status);
        
        // Stop polling when complete
        if (batchData.status === 'completed' || batchData.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setError(error instanceof Error ? error.message : 'Polling failed');
      }
    }, 10000); // Poll every 10 seconds
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startVideoGeneration = async (
    linesWithAudio: any[], 
    influencerMapping: Record<string, string>, 
    title: string
  ) => {
    try {
      setError(null);
      setStatus('processing');

      // 1. Call the API to start generation
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/generate-all-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linesWithAudio, 
          influencerMapping, 
          title,
          userId: currentUser?.id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start video generation');
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error('Backend failed to start video generation');
      }
      
      // Use the batchId returned from the backend
      const backendBatchId = responseData.batchId;
      const totalVideos = responseData.totalVideos;
      
      setBatchId(backendBatchId);
      setProgress({ completed: 0, total: totalVideos });
      setCompletedVideos([]);
      
      // Start polling using the backend batchId
      startPolling(backendBatchId);
      
      return { success: true, batchId: backendBatchId };
      
    } catch (error) {
      console.error('Video generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start video generation');
      setStatus('failed');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const resetGeneration = () => {
    stopPolling();
    setBatchId(null);
    setProgress({ completed: 0, total: 0 });
    setCompletedVideos([]);
    setStatus('idle');
    setError(null);
  };

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopPolling();
  }, [stopPolling]);

  return {
    startVideoGeneration,
    progress,
    completedVideos,
    status,
    error,
    batchId,
    resetGeneration,
    cleanup
  };
}; 