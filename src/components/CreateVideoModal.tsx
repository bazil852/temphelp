import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, AlertCircle, Volume2, Brush } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { Influencer } from '../types';
import { useInfluencerStore } from '../store/influencerStore';
import { supabase } from '../lib/supabase';
import { uploadAudioToSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface CreateVideoModalProps {
  influencerId: string;
  templateId: string;
  influencer: Influencer;
  onClose: () => void;
}

type ScriptAction = 'write' | 'shorten' | 'longer' | 'engaging';

export default function CreateVideoModal({ influencerId, templateId, influencer, onClose }: CreateVideoModalProps) {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [selectedLook, setSelectedLook] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();
  const [showScriptActions, setShowScriptActions] = useState(false);
  const [showLooksDropdown, setShowLooksDropdown] = useState(false);
  const { generateScript, generateVideo } = useContentStore();
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { influencers } = useInfluencerStore();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentInfluencer, setCurrentInfluencer] = useState(influencer);

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

  const handlePreviewVoice = async () => {
    if (!currentInfluencer.voice_id) {
      setError('No voice ID available');
      return;
    }

    setIsPreviewingVoice(true);
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
          text: "This is how I sound",
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

      // Play the audio
      const audio = new Audio(audioUrl);
      setIsPlayingAudio(true);
      audio.play();
      audio.onended = () => setIsPlayingAudio(false);
    } catch (err) {
      console.error('Error previewing voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview voice');
    } finally {
      setIsPreviewingVoice(false);
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
        audioUrl: publicAudioUrl,
        durationInMinutes
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Video
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Video Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
              required
              placeholder="Enter video title"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Look
            </label>
            <button
              type="button"
              onClick={() => setShowLooksDropdown(!showLooksDropdown)}
              className="w-full flex items-center justify-between rounded-lg border-2 border-gray-300 px-4 py-3 text-base hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brush className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">{selectedLook ? looks.find(l => l.id === selectedLook)?.name : 'Default'}</span>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${showLooksDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLooksDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg">
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
                    className="w-full px-4 py-3 text-left text-gray-400 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg"
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
              <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                Script
              </label>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  disabled={isPreviewingVoice || !currentInfluencer.voice_id}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  {isPreviewingVoice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Previewing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Preview Voice
                    </>
                  )}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowScriptActions(!showScriptActions)}
                    disabled={isGenerating}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-black hover:bg-blue-700 inline-flex items-center justify-center disabled:opacity-50 transition-colors w-full sm:w-auto"
                  >
                    Generate with AI
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </button>
                  {showScriptActions && (
                    <div className="absolute right-0 sm:right-0 mt-2 w-full sm:w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => handleGenerateScript('write')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Write Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateScript('shorten')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Shorten Script
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateScript('longer')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Make Longer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateScript('engaging')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
              required
              placeholder="Enter your script or prompt here..."
            />
          </div>

          {/* Audio Preview Section */}
          {audioUrl && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isPlayingAudio ? 'bg-green-500 animate-pulse' : 'bg-blue-600'}`} />
                <span className="text-sm text-gray-700">Generated Audio</span>
              </div>
              <button
                type="button"
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="px-3 py-2 rounded-lg bg-blue-600 text-black hover:bg-blue-700 inline-flex items-center disabled:opacity-50 transition-colors"
              >
                <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                <span className="ml-2">{isPlayingAudio ? 'Playing...' : 'Play'}</span>
              </button>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !title || !script}
              className="inline-flex items-center px-6 py-3 border-2 border-transparent rounded-lg text-base font-medium text-black bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
      </div>
    </div>
  );
}