import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, AlertCircle, Volume2, Brush } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { Influencer } from '../types';
import { useInfluencerStore } from '../store/influencerStore';
import { supabase } from '../lib/supabase';
import { uploadAudioToSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { env } from '../lib/env';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateVideoModalProps {
  influencerId: string;
  templateId: string;
  influencer: Influencer | any; // Allow clone object
  onClose: () => void;
  isClone?: boolean;
}

type ScriptAction = 'write' | 'shorten' | 'longer' | 'engaging';

export default function CreateVideoModal({ influencerId, templateId, influencer, onClose, isClone = false }: CreateVideoModalProps) {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [selectedLook, setSelectedLook] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();
  const [showScriptActions, setShowScriptActions] = useState(false);
  const [showLooksDropdown, setShowLooksDropdown] = useState(false);
  const { generateScript, generateVideo } = useContentStore();
  const [hasGeneratedVoice, setHasGeneratedVoice] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { influencers } = useInfluencerStore();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentInfluencer, setCurrentInfluencer] = useState(influencer);

  const handleCloneVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !script) return;

    setIsGenerating(true);
    setError('');

    try {
      // Calculate video duration from script (rough estimate: 125 words per minute)
      const wordCount = script.trim().split(/\s+/).length;
      const durationInMinutes = Math.ceil(wordCount / 125);

      // Update user's video minutes usage
      const { error: usageError } = await supabase.rpc("increment_user_video_minutes", {
        p_user_id: currentUser?.id,
        increment_value: durationInMinutes
      });

      if (usageError) {
        throw new Error('Failed to update video minutes usage');
      }

      // Create video using Captions AI
      const response = await fetch(`${env.AI_CLONE_BACKEND_PROXY}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://api.captions.ai/api/creator/submit',
          method: 'POST',
          body: {
            script,
            creatorName: influencer.clone_id,
            resolution: "fhd"
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create video');
      }

      const data = await response.json();
      
      // Create content record
      await generateVideo({
        influencerId: influencer.id, // Use clone's actual ID
        templateId,
        title,
        script
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get all influencers that have this influencer's ID as their look_id
  const looks = [
    { id: 'default', name: 'Default', influencer: influencer },
    ...influencers
      .filter(inf => inf.look_id === influencer.id)
      .map(inf => ({
        id: inf.id,
        name: inf.name,
        influencer: inf
      }))
  ];

  // Update current influencer when a look is selected
  useEffect(() => {
    if (selectedLook === 'default') {
      setCurrentInfluencer(influencer);
    } else {
      const look = looks.find(l => l.id === selectedLook);
      if (look) {
        setCurrentInfluencer(look.influencer);
      }
    }
  }, [selectedLook, influencer]);

  // Initialize with default look
  useEffect(() => {
    setSelectedLook('default');
  }, []);

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    setIsPlayingAudio(true);
    
    audio.play();
    audio.onended = () => {
      setIsPlayingAudio(false);
    };
  };

  const handleGenerateVoice = async () => {
    if (!currentInfluencer.voice_id) {
      setError('No voice ID available');
      return;
    }

    setIsGeneratingAudio(true);
    setError('');

    try {
      // Generate audio from Eleven Labs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${currentInfluencer.voice_id}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate audio');
      }

      // Get the audio blob and create a URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      setHasGeneratedVoice(true);

      // Play the audio
      const audio = new Audio(audioUrl);
      setIsPlayingAudio(true);
      audio.play();
      audio.onended = () => setIsPlayingAudio(false);
    } catch (err) {
      console.error('Error previewing voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateAudio = async (text: string): Promise<string> => {
    try {
      // Generate audio from Eleven Labs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${currentInfluencer.voice_id}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate audio');
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Upload to Supabase storage and get public URL
      const publicUrl = await uploadAudioToSupabase(audioBlob);
      
      // Also create a local URL for preview
      const localUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(localUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !script) return;
    
    if (isClone) {
      setIsGenerating(true);
      setError('');

      try {
        // Calculate video duration from script (rough estimate: 125 words per minute)
        const wordCount = script.trim().split(/\s+/).length;
        const durationInMinutes = Math.ceil(wordCount / 125);

        // Update user's video minutes usage
        const { error: usageError } = await supabase.rpc("increment_user_video_minutes", {
          p_user_id: currentUser?.id,
          increment_value: durationInMinutes
        });

        if (usageError) {
          throw new Error('Failed to update video minutes usage');
        }

        // Create video using clone_id
        await generateVideo({
          influencerId: influencer.id,
          templateId: influencer.clone_id,
          title,
          script
        });

        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create video');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setIsGenerating(true);
    setIsGeneratingAudio(true);
    setError('');
    let audioDuration = 0;

    try {
      // First generate the audio using Eleven Labs and upload to Supabase
      const publicAudioUrl = await generateAudio(script);
      
      // Get audio duration
      const audio = new Audio(publicAudioUrl);
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          audioDuration = audio.duration;
          resolve(null);
        });
      });

      // Convert to minutes and round up to nearest minute
      const durationInMinutes = Math.ceil(audioDuration / 60);

      // First get the auth_user_id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('email', currentUser?.email)
        .single();

      if (userError) throw new Error('Failed to get user data');

      // Then update video minutes usage with auth_user_id
      const { error: usageError } = await supabase.rpc('increment_user_video_minutes', {
        p_user_id: userData.auth_user_id,
        increment_value: durationInMinutes
      });

      if (usageError) {
        throw new Error('Failed to update video minutes usage');
      }

      // Then create the video with the audio URL
      await generateVideo({
        influencerId,
        templateId: currentInfluencer.templateId,
        title,
        script,
        audioUrl: publicAudioUrl
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create video';
      setError(errorMessage);
      setIsGenerating(false);
      setIsGeneratingAudio(false);
    }
  };

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    }
  }, [audioUrl]);

  const getPromptForAction = (action: ScriptAction, currentScript: string): string => {
    switch (action) {
      case 'write':
        return currentScript;
      case 'shorten':
        return `Make this script more concise while maintaining its key message: ${currentScript}`;
      case 'longer':
        return `Expand this script with more details and examples while maintaining its tone: ${currentScript}`;
      case 'engaging':
        return `Make this script more engaging and captivating while maintaining its core message: ${currentScript}`;
      default:
        return currentScript;
    }
  };

  const handleGenerateScript = async (action: ScriptAction) => {
    if (!script) {
      setError('Please enter a prompt or script first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setShowScriptActions(false);

    try {
      const prompt = getPromptForAction(action, script);
      const generatedScript = await generateScript(prompt);
      setScript(generatedScript);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/30 px-6 py-8 w-full max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">
              Create New Video
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={isClone ? handleCloneVideoSubmit : handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Video Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                required
                placeholder="Enter video title"
              />
            </div>

            <div className="relative">
              {!isClone && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Look
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLooksDropdown(!showLooksDropdown)}
                    className="w-full flex items-center justify-between bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Brush className="h-5 w-5 text-gray-400" />
                      <span>{selectedLook ? looks.find(l => l.id === selectedLook)?.name : 'Default'}</span>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showLooksDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </>
              )}
              
              {showLooksDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl">
                  {looks.length === 1 ? (
                    <div className="px-4 py-3 text-gray-400 text-center">
                      No looks available
                    </div>
                  ) : (
                    looks.map((look) => (
                      <button
                        key={look.id}
                        type="button"
                        onClick={() => {
                          setSelectedLook(look.id);
                          setShowLooksDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      >
                        {look.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <label htmlFor="script" className="block text-sm font-medium text-gray-300">
                  Video Input Method
                </label>
              </div>

              {inputMethod === 'url' ? (
                <div className="mb-4">
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Enter video URL (e.g., https://example.com/video.mp4)"
                    className="block w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <label htmlFor="script" className="block text-sm font-medium text-gray-300">Script</label>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">              
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowScriptActions(!showScriptActions)}
                      disabled={isGenerating}
                      className="px-3 py-2 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 inline-flex items-center justify-center disabled:opacity-50 transition-colors w-full sm:w-auto"
                    >
                      Generate with AI
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                    {showScriptActions && (
                      <div className="absolute right-0 sm:right-0 mt-2 w-full sm:w-48 rounded-lg shadow-xl bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/20 z-50">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => handleGenerateScript('write')}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            Write Prompt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateScript('shorten')}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            Shorten Script
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateScript('longer')}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            Make Longer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateScript('engaging')}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            More Engaging
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <textarea
                id="script"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={6}
                className="block w-full bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition min-h-[120px]"
                required
                placeholder="Enter your script or prompt here..."
              />
            </div>

            {/* Generate Voice Button */}
            {!isClone && <div className="mb-4">
              <button
                type="button"
                onClick={handleGenerateVoice}
                disabled={isGeneratingAudio || !script.trim() || !currentInfluencer.voice_id}
                className="w-full px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Voice...
                  </>
                ) : hasGeneratedVoice ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Regenerate Voice
                  </>
                ) : (
                  'Generate Voice'
                )}
              </button>
            </div>}

            {/* Audio Preview Section */}
            {!isClone && audioUrl && (
              <div className="bg-white/15 border border-white/20 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-500'}`} />
                  <span className="text-sm text-white">Generated Audio</span>
                </div>
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  disabled={isPlayingAudio}
                  className="px-3 py-2 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 inline-flex items-center disabled:opacity-50 transition-colors"
                >
                  <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  <span className="ml-2">{isPlayingAudio ? 'Playing...' : 'Play'}</span>
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-6 py-3 border border-white/20 rounded-lg text-base font-medium text-white bg-white/10 hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !title || !script || (!isClone && !hasGeneratedVoice)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-black bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {isGeneratingAudio ? 'Generating Audio...' : 'Creating Video...'}
                  </>
                ) : (
                  'Create Video'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}