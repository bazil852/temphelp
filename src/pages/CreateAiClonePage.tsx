import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCloneCreation } from '../hooks/useCloneCreation';
import { supabase } from '../lib/supabase';
import { CloneNameInput } from '../components/clone/CloneNameInput';
import { ProgressBar } from '../components/clone/ProgressBar';
import { ScriptStep } from '../components/clone/ScriptStep';
import { VideoStep } from '../components/clone/VideoStep';
import { ImageUploadStep } from '../components/clone/ImageUploadStep';
import { CompleteStep } from '../components/clone/CompleteStep';
import { useClonePolling } from '../hooks/useClonePolling';
import { CloneStep, ImageInstruction } from '../types/clone';
import { env } from '../lib/env';

const STEPS = [
  { key: 'script', label: 'Script' },
  { key: 'video', label: 'Video & Images' },
  { key: 'complete', label: 'Complete' }
];

const IMAGE_INSTRUCTIONS: ImageInstruction[] = [
  {
    title: 'Make a neutral face',
    image: 'https://i.postimg.cc/3rLqXFwj/image.png'
  },
  {
    title: 'Make an \'ooh\' sound',
    image: 'https://i.postimg.cc/ncCP09sy/image.png'
  },
  {
    title: 'Show your top and bottom teeth',
    image: 'https://i.postimg.cc/mrNXtQqH/image.png'
  },
  {
    title: 'Make an \'aah\' sound',
    image: 'https://i.postimg.cc/rpJj8q0G/image.png'
  },
  {
    title: 'Purse your lips completely',
    image: 'https://i.postimg.cc/MT3YQtYv/image.png'
  }
];

export default function CreateAiClonePage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [cloneName, setCloneName] = useState('');
  const [currentStep, setCurrentStep] = useState<CloneStep>('script');
  const [script, setScript] = useState('');
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [operationId, setOperationId] = useState<string | null>(null);
  const [showLeaveWarning] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const navigate = useNavigate();
  const [cloneId, setCloneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { handleVideoSubmit } = useCloneCreation({
    onStepComplete: (step) => {
      if (step === 'video') {
        setProgress(66);
        setCurrentStep('images');
      }
    },
    onError: (error) => setError(error)
  });

  const { isPolling: isStatusPolling, progress: pollProgress, status: pollStatus } = useClonePolling({
    operationId,
    cloneId,
    cloneName,
    onComplete: () => {
      navigate('/dashboard');
    },
    onError: (error) => {
      setError(error);
    }
  });

  useEffect(() => {
    if (isStatusPolling) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isStatusPolling]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleGenerateScript = async () => {
    setIsLoading(true);
    setError('');

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
      const generatedScript = data.script || data.calibrationScript;
      setScript(generatedScript);

      // Save to Supabase
      const { error: dbError, data: newClone } = await supabase
        .from('clones')
        .insert([{
          user_id: currentUser?.id,
          name: cloneName,
          script: generatedScript,
          status: 'script_ready'
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      setCloneId(newClone.id);
      setProgress(33);
      setCurrentStep('video');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch script');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUrlSubmit = async (url: string) => {
    setVideoUrl(url);
    setUploadedVideoUrl(url);
    setProgress(66);
    setCurrentStep('images');
  };

  const handleVideoUploadSubmit = async () => {
    if (!videoFile) return;
    setIsLoading(true);
    setError('');
    console.log("workinggg");

    try {
      const timestamp = Date.now();
      const fileExt = videoFile.name.split('.').pop();
      const filePath = `videos/${currentUser?.id}-${timestamp}.${fileExt}`;
      console.log("workinggg 2");
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

      setUploadedVideoUrl(publicUrl);
      setProgress(66);
      console.log("workinggg 3 ",publicUrl);
      setCurrentStep('images');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageSelect = (files: FileList) => {
    const newImages = Array.from(files).slice(0, 5 - images.length);
    setImages(prev => [...prev, ...newImages]);
    
    // Create preview URLs
    const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleImageSubmit = async () => {
    if (images.length !== 5 || !uploadedVideoUrl || !cloneId) return;
    setIsLoading(true);
    setError('');

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
            videoUrl: uploadedVideoUrl,
            calibrationImageUrls: uploadedUrls,
            language: 'English'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create AI Twin');

      const data = await response.json();
      console.log('Clone creation response:', data);
      
      setOperationId(data.operationId);

      await supabase
        .from('clones')
        .update({
          template_id: data.operationId,
          status: 'creation_started'
        })
        .eq('id', cloneId);

      setProgress(100);
      setCurrentStep('complete');
      
      // Start polling immediately
      setIsPolling(true);
      console.log('Starting polling with:', { operationId: data.operationId, cloneId, cloneName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create AI Twin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#c9fffc]">Create AI Clone</h1>

        <CloneNameInput
          value={cloneName}
          onChange={setCloneName}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Script Step */}
        {currentStep === 'script' && (
          <ScriptStep
            onGenerateScript={handleGenerateScript}
            isLoading={isLoading || isStatusPolling}
            script={script}
          />
        )}

        {/* Video Upload Step */}
        {currentStep === 'video' && (
          <VideoStep
            script={script}
            videoPreviewUrl={videoPreviewUrl}
            isLoading={isLoading || isStatusPolling}
            onVideoUpload={handleFileSelect}
            onVideoUrlSubmit={handleVideoUrlSubmit}
            // onVideoUrlSubmit={handleVideoUrlSubmit}
            onSubmit={handleVideoUploadSubmit}
          />
        )}

        {/* Image Upload Step */}
        {currentStep === 'images' && (
          <ImageUploadStep
            images={images}
            imagePreviewUrls={imagePreviewUrls}
            selectedImageIndex={selectedImageIndex}
            isLoading={isLoading || isStatusPolling}
            imageInstructions={IMAGE_INSTRUCTIONS}
            onImageUpload={handleImageSelect}
            onImageRemove={handleImageRemove}
            onImageSelect={setSelectedImageIndex}
            onSubmit={handleImageSubmit}
          />
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <CompleteStep
            status={pollStatus}
            progress={pollProgress}
            isPolling={isStatusPolling}
            showWarning={showLeaveWarning}
            onNavigateBack={() => navigate('/dashboard')}
          />
        )}
      </div>
    </div>
  );
}