import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Video } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCloneCreation } from '../hooks/useCloneCreation';
import { supabase } from '../lib/supabase';
import { CloneNameInput } from '../components/clone/CloneNameInput';
import { ProgressBar } from '../components/clone/ProgressBar';
import { ScriptStep } from '../components/clone/ScriptStep';
import { VideoStep } from '../components/clone/VideoStep';
import { ImageUploadStep } from '../components/clone/ImageUploadStep';
import { CompleteStep } from '../components/clone/CompleteStep';
import { TeleprompterRecorder } from '../components/clone/TeleprompterRecorder';
import { useClonePolling } from '../hooks/useClonePolling';
import { CloneStep, ImageInstruction } from '../types/clone';
import { env } from '../lib/env';
import { motion } from 'framer-motion';

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
  const [recordingMethod, setRecordingMethod] = useState<'upload' | 'teleprompter'>('upload');

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

  const handleTeleprompterRecording = async (blob: Blob) => {
    setIsLoading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const filePath = `videos/${currentUser?.id}-${timestamp}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('clones')
        .upload(filePath, blob);

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
      setCurrentStep('images');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloneImageUpload = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrls(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
    
    setImages(prev => [...prev, file]);
  };

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
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

  const handleNameSubmit = () => {
    if (cloneName.trim()) {
      setProgress(33);
      setCurrentStep('script');
    }
  };

  const handleScriptSubmit = () => {
    if (script.trim()) {
      setProgress(66);
      setCurrentStep('video');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            Create AI Clone
          </motion.h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar currentStep={currentStep} progress={progress} steps={STEPS} />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Step 1: Name Input */}
          {currentStep === 'script' && (
            <CloneNameInput
              value={cloneName}
              onChange={setCloneName}
            />
          )}

          {/* Step 2: Script Generation */}
          {currentStep === 'script' && (
            <ScriptStep
              script={script}
              isLoading={isLoading}
              onGenerateScript={handleGenerateScript}
            />
          )}

          {/* Step 3: Video Upload */}
          {currentStep === 'video' && (
            <div className="space-y-6">
              {/* Recording Method Toggle */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRecordingMethod('upload')}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    recordingMethod === 'upload'
                      ? 'bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Upload Video
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRecordingMethod('teleprompter')}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    recordingMethod === 'teleprompter'
                      ? 'bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  Record with Teleprompter
                </motion.button>
              </div>

              {/* Video Upload or Teleprompter */}
              {recordingMethod === 'upload' ? (
                <VideoStep
                  script={script}
                  videoPreviewUrl={videoPreviewUrl}
                  isLoading={isLoading}
                  onVideoUpload={handleVideoUpload}
                  onVideoUrlSubmit={handleVideoUrlSubmit}
                  onSubmit={handleVideoUploadSubmit}
                />
              ) : (
                <TeleprompterRecorder
                  script={script}
                  onRecordingComplete={handleTeleprompterRecording}
                />
              )}
            </div>
          )}

          {/* Step 4: Image Upload */}
          {currentStep === 'images' && (
            <ImageUploadStep
              images={images}
              imagePreviewUrls={imagePreviewUrls}
              selectedImageIndex={selectedImageIndex}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              onSubmit={handleImageSubmit}
              isLoading={isLoading}
              imageInstructions={IMAGE_INSTRUCTIONS}
              onImageUpload={handleCloneImageUpload}
            />
          )}

          {/* Step 5: Complete */}
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

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-full backdrop-blur-sm shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}