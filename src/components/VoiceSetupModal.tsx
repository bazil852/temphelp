import React, { useState } from 'react';
import { X, Loader2, Volume2, Wand2, AlertCircle } from 'lucide-react';
import { Influencer } from '../types';
import { useAuthStore } from '../store/authStore';
import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

interface VoicePreview {
  audio_base_64: string;
  generated_voice_id: string;
  media_type: string;
  duration_secs: number;
}

interface VoiceSetupModalProps {
  influencer: Influencer;
  onClose: () => void;
  onVoiceSelected: () => void;
}

export default function VoiceSetupModal({ influencer, onClose, onVoiceSelected }: VoiceSetupModalProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<VoicePreview[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const { currentUser } = useAuthStore();
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  const generateVoicePrompt = async () => {
    if (!currentUser?.openaiApiKey || !description) return;
    
    setIsGeneratingPrompt(true);
    setError('');

    try {
      const openai = new OpenAI({
        apiKey: currentUser.openaiApiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert voice director specializing in creating concise but detailed voice profiles for AI-generated voices. Your task is to expand user descriptions into voice specifications that cover key aspects of voice characteristics.

Your descriptions should cover:
1. Voice Fundamentals: pitch range, tempo, resonance
2. Emotional Qualities: emotional baseline, range of expression, confidence level
3. Speaking Style: accent specifications, speech patterns, articulation

MAKE SURE YOU ONLY RETURN THE RESPONSE IN ONE PARAGRAPH AND dont exceed 1000 characters`
          },
          {
            role: "user",
            content: `Create a detailed voice description based on: ${description}`
          }
        ]
      });

      setDescription(response.choices[0]?.message?.content || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate voice description');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const generateVoicePreviews = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Get enhanced description from GPT
      // const enhancedDescription = await generateVoiceDescription(description);

      // Call Eleven Labs API
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice_description: description,
          text: "Hi, I'm an Ai Generated Influencer Created from Ai Influencer Platform. I'm here to help you scale your content through automations."
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice previews');
      }

      const data = await response.json();
      setPreviews(data.previews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate voice previews');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create a ref to store audio elements
  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  // Track audio progress
  React.useEffect(() => {
    if (!currentlyPlaying) return;
    
    const intervalId = setInterval(() => {
      const audio = audioRefs.current[currentlyPlaying];
      if (audio) {
        setProgress(prev => ({
          ...prev,
          [currentlyPlaying]: (audio.currentTime / audio.duration) * 100 || 0
        }));
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [currentlyPlaying]);

  const playPreview = (preview: VoicePreview) => {
    // If this audio is currently playing, pause it
    if (currentlyPlaying === preview.generated_voice_id) {
      const audio = audioRefs.current[preview.generated_voice_id];
      if (audio) {
        audio.pause();
        setCurrentlyPlaying(null);
      }
      return;
    }

    // If another audio is playing, pause it first
    if (currentlyPlaying && audioRefs.current[currentlyPlaying]) {
      audioRefs.current[currentlyPlaying]?.pause();
    }

    // Create audio element if it doesn't exist yet
    if (!audioRefs.current[preview.generated_voice_id]) {
      const audio = new Audio(`data:${preview.media_type};base64,${preview.audio_base_64}`);
      audio.onended = () => {
        setCurrentlyPlaying(null);
        setProgress(prev => ({
          ...prev,
          [preview.generated_voice_id]: 0
        }));
      };
      audioRefs.current[preview.generated_voice_id] = audio;
    }

    // Play the audio
    const audio = audioRefs.current[preview.generated_voice_id];
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(err => console.error("Error playing audio:", err));
      setCurrentlyPlaying(preview.generated_voice_id);
    }
  };
  
  // Clean up audio elements when component unmounts
  React.useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, []);

  const handleSelectVoice = async (voiceId: string) => {
    setIsSavingVoice(true);
    setError('');

    try {
      // First create the voice in Eleven Labs
      const preview = previews.find(p => p.generated_voice_id === voiceId);
      if (!preview) throw new Error('Selected voice preview not found');

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-voice-from-preview', {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice_name: influencer.name,
          voice_description: 'AI Generated Voice created on Ai influencers platform',
          generated_voice_id: voiceId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create voice in Eleven Labs');
      }

      const data = await response.json();
      const permanentVoiceId = data.voice_id;

      // Then save to Supabase
      const { error } = await supabase
        .from('influencers')
        .update({ voice_id: permanentVoiceId })
        .eq('id', influencer.id);

      if (error) throw error;
      
      onVoiceSelected();
      onClose();
    } catch (err) {
      console.error('Error saving voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to save voice');
    } finally {
      setIsSavingVoice(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="relative bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/30 px-6 py-8 w-[800px] min-h-[600px] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Set up voice for {influencer.name}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Describe the voice you want for your influencer
            </p>
          </div>
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

        <div className="flex gap-6 mb-6">
          <div className="flex-1 min-w-0 flex flex-col">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Voice Description
              <span className="text-gray-400 text-xs ml-2">(max 1000 characters)</span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                maxLength={1000}
                rows={4}
                className="block w-full bg-white/15 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none flex-1 pr-12"
                placeholder="Describe the voice characteristics (e.g., gender, age, tone, accent, etc.)"
                disabled={isGenerating}
              />
              <button
                onClick={generateVoicePrompt}
                disabled={!description.trim() || isGeneratingPrompt}
                className="absolute right-2 top-2 p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                title="Generate detailed voice description"
              >
                <Wand2 className={`h-5 w-5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-400 text-right">
              {description.length}/1000 characters
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={generateVoicePreviews}
                disabled={!description.trim() || isGenerating}
                className="flex-1 px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  'Generate Voices'
                )}
              </button>
              {previews.length > 0 && (
                <button
                  onClick={generateVoicePreviews}
                  disabled={!description.trim() || isGenerating}
                  className="px-4 py-2 border border-white/20 text-white rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>

          <div className="w-48 flex-shrink-0">
            <div className="aspect-square rounded-lg overflow-hidden border border-white/20 bg-white/10">
              {influencer.preview_url ? (
                <img
                  src={influencer.preview_url}
                  alt={influencer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Preview
                </div>
              )}
            </div>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Generated Voice Options
              </h3>
              <span className="text-xs text-gray-400">
                {previews.length} voices generated
              </span>
            </div>
            <div className="bg-white/5 border border-white/15 rounded-lg p-3 overflow-hidden flex flex-col flex-1">
              <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
              {previews.map((preview) => (
                <div
                  key={preview.generated_voice_id}
                  className={`p-4 rounded-lg transition-all ${
                    selectedPreview === preview.generated_voice_id
                      ? 'border border-cyan-500/70 bg-white/10 shadow-md'
                      : 'border border-white/10 hover:border-white/30 hover:bg-white/5'
                  } transition-all duration-200`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => playPreview(preview)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        currentlyPlaying === preview.generated_voice_id
                          ? 'bg-cyan-500 text-black shadow-md scale-110'
                          : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                      }`}
                      title={currentlyPlaying === preview.generated_voice_id ? 'Pause' : 'Play'}
                      aria-label={currentlyPlaying === preview.generated_voice_id ? 'Pause voice sample' : 'Play voice sample'}
                    >
                      {currentlyPlaying === preview.generated_voice_id ? (
                        <Volume2 className="h-5 w-5 animate-[pulse_1.5s_ease-in-out_infinite]" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {`Voice Sample ${previews.indexOf(preview) + 1}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        {currentlyPlaying === preview.generated_voice_id ? 'Now playing...' : `${preview.duration_secs.toFixed(1)}s`}
                      </span>
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={() => setSelectedPreview(preview.generated_voice_id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selectedPreview === preview.generated_voice_id
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {selectedPreview === preview.generated_voice_id
                        ? 'Selected'
                        : 'Select'}
                    </button>
                  </div>
                  
                  {/* Audio progress bar */}
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${currentlyPlaying === preview.generated_voice_id ? 'bg-cyan-500' : 'bg-white/20'} transition-all`}
                      style={{ width: `${currentlyPlaying === preview.generated_voice_id ? progress[preview.generated_voice_id] || 0 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            </div>
            
            <div className="flex justify-end mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => selectedPreview && handleSelectVoice(selectedPreview)}
                disabled={!selectedPreview || isSavingVoice}
                className="px-6 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors text-sm font-medium"
              > 
                {isSavingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Saving Voice...
                  </>
                ) : (
                  'Confirm Selection'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}