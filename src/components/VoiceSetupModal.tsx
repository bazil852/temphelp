import React, { useState } from 'react';
import { X, Loader2, Volume2 ,Wand2} from 'lucide-react';
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

  const playPreview = (preview: VoicePreview) => {
    if (currentlyPlaying === preview.generated_voice_id) {
      setCurrentlyPlaying(null);
      return;
    }

    setCurrentlyPlaying(preview.generated_voice_id);
    const audio = new Audio(`data:${preview.media_type};base64,${preview.audio_base_64}`);
    audio.onended = () => setCurrentlyPlaying(null);
    audio.play();
  };

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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-[800px] p-6 min-h-[600px] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Set up voice for {influencer.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Describe the voice you want for your influencer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-6 mb-6">
          <div className="flex-1 min-w-0 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Description
              <span className="text-gray-500 text-xs ml-2">(max 1000 characters)</span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                maxLength={1000}
                rows={4}
                className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 resize-none flex-1 pr-12"
                placeholder="Describe the voice characteristics (e.g., gender, age, tone, accent, etc.)"
                disabled={isGenerating}
              />
              <button
                onClick={generateVoicePrompt}
                disabled={!description.trim() || isGeneratingPrompt}
                className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                title="Generate detailed voice description"
              >
                <Wand2 className={`h-5 w-5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500 text-right">
              {description.length}/1000 characters
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={generateVoicePreviews}
                disabled={!description.trim() || isGenerating}
                className="flex-1 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transform hover:translate-y-[-1px] transition-all text-sm font-medium"
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
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-sm font-medium"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>

          <div className="w-48 flex-shrink-0">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
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
              <h3 className="text-sm font-medium text-gray-700">
                Generated Voice Options
              </h3>
              <span className="text-xs text-gray-500">
                {previews.length} voices generated
              </span>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-3 overflow-hidden flex flex-col flex-1">
              <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
              {previews.map((preview) => (
                <div
                  key={preview.generated_voice_id}
                  className={`p-2.5 rounded-lg border-2 transition-all ${
                    selectedPreview === preview.generated_voice_id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-100 hover:border-blue-300 hover:shadow-sm'
                  } transition-all duration-200`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playPreview(preview)}
                      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                        currentlyPlaying === preview.generated_voice_id
                          ? 'bg-blue-100 text-blue-600 scale-110'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                      }`}
                      title={currentlyPlaying === preview.generated_voice_id ? 'Stop' : 'Play'}
                    >
                      <Volume2 className={`h-4 w-4 ${
                        currentlyPlaying === preview.generated_voice_id
                          ? 'animate-[pulse_1.5s_ease-in-out_infinite]'
                          : ''
                      }`} />
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentlyPlaying === preview.generated_voice_id ? 'Playing...' : `Sample ${previews.indexOf(preview) + 1}`}
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={() => setSelectedPreview(preview.generated_voice_id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selectedPreview === preview.generated_voice_id
                          ? 'bg-blue-600 text-white shadow-sm scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {selectedPreview === preview.generated_voice_id
                        ? 'Selected'
                        : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
            
            <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => selectedPreview && handleSelectVoice(selectedPreview)}
                disabled={!selectedPreview || isSavingVoice}
                className="px-6 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md transform hover:translate-y-[-1px] transition-all text-sm font-medium"
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