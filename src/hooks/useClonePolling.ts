import { useState, useEffect, useCallback } from 'react';
import { env } from '../lib/env';
import { supabase } from '../lib/supabase';

interface UseClonePollingProps {
  operationId: string | null;
  cloneId: string | null;
  cloneName: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const useClonePolling = ({
  operationId,
  cloneId,
  cloneName,
  onComplete,
  onError
}: UseClonePollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  // Wrap the polling function in useCallback to prevent unnecessary recreations
  const pollStatus = useCallback(async () => {
    if (!operationId || !cloneId || !cloneName) return;

    console.log('Polling clone status...', { operationId, cloneId, cloneName, status: status });

    try {
      const response = await fetch(`${env.AI_CLONE_BACKEND_PROXY}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://api.captions.ai/api/twin/status',
          method: 'POST',
          body: {
            operationId
          }
        })
      });

      if (!response.ok) throw new Error('Failed to check clone status');

      const data = await response.json();
      console.log('Poll response:', data);

      // Update progress (multiply by 100 since API returns 0-1)
      const currentProgress = data.progress;
      setProgress(currentProgress);

      if (data.state === 'COMPLETE') {
        // Get the list of clones
        const listResponse = await fetch(`${env.AI_CLONE_BACKEND_PROXY}/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: 'https://api.captions.ai/api/twin/list',
            method: 'POST'
          })
        });

        if (!listResponse.ok) throw new Error('Failed to get clone list');

        const listData = await listResponse.json();
        console.log('Clone list:', listData);
        
        // Find the clone that matches our name
        const matchingClone = listData.twins.find((twin: string) => {
            return twin.toLowerCase().includes(cloneName.toLowerCase());
          });
          

        console.log('Matching clone and influencer:', matchingClone, cloneId);

        if (matchingClone) {
          await supabase
            .from('clones')
            .update({
              clone_id: matchingClone,
              status: 'completed'
            })
            .eq('id', cloneId);

          setStatus('completed');
          setIsPolling(false);
          // onComplete();
          return true;
        } else {
          throw new Error('Could not find matching clone');
        }
      } else if (data.state === 'FAILED') {
        await supabase
          .from('clones')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', cloneId);

        setStatus('failed');
        setIsPolling(false);
        onError('Clone creation failed');
        return true;
      } else if (data.state === 'PROCESSING') {
        // Update status in database to reflect processing state
        await supabase
          .from('clones')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', cloneId);
        
        setStatus('processing');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error polling clone status:', error);
      return false;
    }
  }, [operationId, cloneId, cloneName, onComplete, onError]);

  useEffect(() => {
    if (!operationId || !cloneId) return;

    const POLLING_INTERVAL = 15000; // 15 seconds
    const MAX_DURATION = 1800000; // 30 minutes
    const startTime = Date.now();
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!isActive) return;

      try {
        const isComplete = await pollStatus();
        
        if (!isActive) return;

        if (!isComplete) {
          if (Date.now() - startTime >= MAX_DURATION) {
            throw new Error('Clone creation timed out');
          } else {
            console.log(`Polling - elapsed time: ${Math.round((Date.now() - startTime) / 1000)}s`);
            timeoutId = setTimeout(poll, POLLING_INTERVAL);
          }
        }
      } catch (error) {
        if (!isActive) return;

        console.error('Polling error:', error);
        setStatus('failed');
        setIsPolling(false);
        onError(error instanceof Error ? error.message : 'Failed to check clone status');

        await supabase
          .from('clones')
          .update({ status: 'failed' })
          .eq('id', cloneId);
      }
    };

    setIsPolling(true);
    console.log('Starting polling...');
    poll();

    // Cleanup function
    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [operationId, cloneId, pollStatus]);

  return {
    isPolling,
    progress,
    status
  };
};