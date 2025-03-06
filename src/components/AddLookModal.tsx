import React, { useState, useEffect } from 'react';
import { X, Loader2, Maximize2, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface AddLookModalProps {
  onClose: () => void;
  influencer: {
    id: string;
    templateId: string;
    name: string;
  };
}

interface GeneratedImages {
  urls: string[];
  keys: string[];
}

const ORIENTATION_OPTIONS = ["square", "horizontal", "vertical"] as const;
const POSE_OPTIONS = ["half_body", "full_body", "close_up"] as const;
const STYLE_OPTIONS = ["Realistic", "Pixar", "Cinematic"] as const;

export default function AddLookModal({ onClose, influencer }: AddLookModalProps) {
  const [prompt, setPrompt] = useState('');
  const [orientation, setOrientation] = useState<typeof ORIENTATION_OPTIONS[number]>("square");
  const [pose, setPose] = useState<typeof POSE_OPTIONS[number]>("half_body");
  const [style, setStyle] = useState<typeof STYLE_OPTIONS[number]>("Realistic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([]);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [lookName, setLookName] = useState('');
  const { currentUser } = useAuthStore();

  console.log("Influnecer: ",influencer);

  useEffect(() => {
    fetchGroupId();
  }, []);

  const fetchGroupId = async () => {
    try {
      const response = await fetch(
        `https://api.heygen.com/v2/photo_avatar/${influencer.templateId}`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": currentUser?.heygenApiKey || '',
          },
        }
      );
      console.log("Heygen Response: ",response);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch group ID');
      
      setGroupId(data.data.group_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group ID');
    }
  };

  const checkGenerationStatus = async (generationId: string) => {
    try {
      const response = await fetch(
        `https://api.heygen.com/v2/photo_avatar/generation/${generationId}`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": currentUser?.heygenApiKey || '',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to check generation status');

      if (data.data?.status === "success" && data.data?.image_url_list) {
        setGeneratedImages({
          urls: data.data.image_url_list,
          keys: data.data.image_key_list,
        });
        setIsPolling(false);
      } else if (data.data?.status === "failed") {
        throw new Error("Look generation failed");
      }

      return data.data.status;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check generation status');
      setIsPolling(false);
      return "failed";
    }
  };

  const startPolling = async (generationId: string) => {
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Generation timed out. Please try again.');
        setIsPolling(false);
        return;
      }

      const status = await checkGenerationStatus(generationId);
      if (status === 'success' || status === 'failed') {
        return;
      }

      attempts++;
      setTimeout(() => poll(), 3000);
    };

    await poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !groupId) return;

    setIsSubmitting(true);
    setGeneratedImages(null);
    setSelectedImageIndexes([]);
    setGenerationId(null);
    setError('');

    try {
      const response = await fetch(
        "https://api.heygen.com/v2/photo_avatar/look/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": currentUser?.heygenApiKey || '',
          },
          body: JSON.stringify({
            group_id: groupId,
            orientation,
            pose,
            style,
            prompt,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to generate look');

      const generationId = data?.data?.generation_id;
      if (!generationId) throw new Error('No generation ID received');

      setGenerationId(generationId);
      setIsSubmitting(false);
      await startPolling(generationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create look');
      setIsSubmitting(false);
    }
  };

  const handleCreateLook = async () => {
    if (selectedImageIndexes.length === 0 || !generatedImages || !lookName) return;
    
    setIsSubmitting(true);
    try {
      // Create looks with selected images
      const response = await fetch(
        "https://api.heygen.com/v2/photo_avatar/avatar_group/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": currentUser?.heygenApiKey || '',
          },
          body: JSON.stringify({
            name: lookName,
            image_keys: selectedImageIndexes.map(index => generatedImages.keys[index]),
            generation_id: generationId,
            group_id: groupId
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to create look');

      // Create new influencer records for each look
      const newInfluencers = data.data.photo_avatar_list.map((avatar: any) => ({
        user_id: currentUser?.id,
        name: lookName,
        template_id: avatar.id,
        preview_url: avatar.image_url,
        status: avatar.status,
        look_id: influencer.id,
        voice_id: influencer.voice_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('influencers')
        .insert(newInfluencers);

      if (insertError) throw insertError;
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create look');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-7xl p-6 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Look
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Customize the appearance for {influencer.name}
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

            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as typeof ORIENTATION_OPTIONS[number])}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {ORIENTATION_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pose</label>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as typeof POSE_OPTIONS[number])}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {POSE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as typeof STYLE_OPTIONS[number])}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {STYLE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Describe the look you want to create..."
                  required
                />
              </div>

              <div>
                <label htmlFor="lookName" className="block text-sm font-medium text-gray-700 mb-2">
                  Look Name
                </label>
                <input
                  type="text"
                  id="lookName"
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Enter a name for this look set..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !prompt.trim() || !groupId}
                  className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Looks'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Images Section */}
          <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Looks</h2>
            
            {isPolling ? (
              <div className="flex flex-col items-center justify-center h-[600px]">
                <Loader2 className="w-12 h-12 animate-spin text-[#c9fffc] mb-4" />
                <p className="text-gray-400">Generating your looks...</p>
              </div>
            ) : generatedImages ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.urls.map((url, index) => (
                    <div
                      key={generatedImages.keys[index]}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndexes.includes(index)
                          ? 'border-[#c9fffc] shadow-lg scale-105' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setSelectedImageIndexes(prev => 
                          prev.includes(index)
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        );
                      }}
                    >
                      {selectedImageIndexes.includes(index) && (
                        <div className="absolute top-2 left-2 z-[90] bg-[#c9fffc] rounded-full p-1">
                          <Check className="h-4 w-4 text-black" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedImageUrl(url);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-opacity z-[90]"
                      >
                        <Maximize2 className="h-4 w-4 text-white" />
                      </button>
                      <img 
                        src={url} 
                        alt={`Generated look ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>
                  ))}
                </div>
                {selectedImageIndexes.length > 0 && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleCreateLook}
                      disabled={isSubmitting || !lookName}
                      className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Look...
                        </>
                      ) : (
                        `Create ${selectedImageIndexes.length} Look${selectedImageIndexes.length > 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
                <p>Generated looks will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setExpandedImageUrl(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={expandedImageUrl}
              alt="Expanded look"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}