import React, { useState, useEffect } from 'react';
import { X, Loader2, Maximize2, Check, Brush, Minus, Plus } from 'lucide-react';
import { uploadImageToSupabase } from '../services/heygenServices';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface AddLookModalProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback to refresh the parent component
  influencer: {
    id: string;
    templateId: string;
    name: string;
    voice_id?: string;
  };
}

interface GeneratedImages {
  urls: string[];
  keys: string[];
}

const ORIENTATION_OPTIONS = ["square", "horizontal", "vertical"] as const;
const POSE_OPTIONS = ["half_body", "full_body", "close_up"] as const;
const STYLE_OPTIONS = ["Realistic", "Pixar", "Cinematic"] as const;

export default function AddLookModal({ onClose, onSuccess, influencer }: AddLookModalProps) {
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
  const [showGeneratedSection, setShowGeneratedSection] = useState(false);
  const [imageScale, setImageScale] = useState(1);

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
    if (!prompt.trim() || !groupId || !lookName.trim()) return;

    setIsSubmitting(true);
    setGeneratedImages(null);
    setSelectedImageIndexes([]);
    setGenerationId(null);
    setError('');
    setShowGeneratedSection(true);

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

      // Upload images to Supabase and create influencer records
      const newInfluencers = [];
      
      // Process each avatar sequentially to upload images
      for (const avatar of data.data.photo_avatar_list) {
        try {
          // Upload image to Supabase storage
          const supabaseImageUrl = await uploadImageToSupabase(avatar.image_url);
          
          // Create influencer record with Supabase URL
          newInfluencers.push({
            user_id: currentUser?.id,
            name: lookName,
            template_id: avatar.id,
            preview_url: supabaseImageUrl, // Use Supabase URL instead of HeyGen URL
            status: avatar.status,
            look_id: influencer.id,
            voice_id: influencer.voice_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } catch (uploadErr) {
          console.error('Failed to upload image to Supabase:', uploadErr);
          // Fallback to original URL if upload fails
          newInfluencers.push({
            user_id: currentUser?.id,
            name: lookName,
            template_id: avatar.id,
            preview_url: avatar.image_url, // Use original URL as fallback
            status: avatar.status,
            look_id: influencer.id,
            voice_id: influencer.voice_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      const { error: insertError } = await supabase
        .from('influencers')
        .insert(newInfluencers);

      if (insertError) throw insertError;
    
    // Call the onSuccess callback to refresh the parent component
    if (onSuccess) {
      onSuccess();
    }
    
    // Close the modal
    onClose();
  } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create look');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`bg-[#1a1a1a] rounded-xl p-6 my-8 border border-white/10 transition-all duration-300 ${
            showGeneratedSection ? 'w-full max-w-[63rem]' : 'w-full max-w-[28.8rem]'
          }`}
        >
          <div className={`grid gap-8 ${
            showGeneratedSection ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Form Section */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-xl p-6 overflow-y-auto border border-white/10 max-h-[calc(100vh-8rem)]">
              <div className="flex justify-between items-start mb-6 sticky top-0 z-10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Create New Look
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Customize the appearance for {influencer.name}
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
                <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 pb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Orientation</label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as typeof ORIENTATION_OPTIONS[number])}
                      className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      {ORIENTATION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pose</label>
                    <select
                      value={pose}
                      onChange={(e) => setPose(e.target.value as typeof POSE_OPTIONS[number])}
                      className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      {POSE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as typeof STYLE_OPTIONS[number])}
                      className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                      {STYLE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    placeholder="Describe the look you want to create..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lookName" className="block text-sm font-medium text-gray-300 mb-2">
                    Look Name
                  </label>
                  <input
                    type="text"
                    id="lookName"
                    value={lookName}
                    onChange={(e) => setLookName(e.target.value)}
                    className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    placeholder="Enter a name for this look set..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !prompt.trim() || !groupId}
                    className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors inline-flex items-center"
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

            {/* Generated Images Section - Only show after clicking Generate */}
            <AnimatePresence>
              {showGeneratedSection && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl shadow-xl p-6 overflow-y-auto border border-white/10 max-h-[calc(100vh-8rem)]"
                >
                  <h2 className="text-xl font-semibold text-white mb-6 sticky top-0 z-10 pb-4">Generated Looks</h2>
                  
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
                                : 'border-white/20 hover:border-white/40'
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
                              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/75 transition-opacity z-[90]"
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
                        <div className="flex justify-center sticky bottom-0 pt-4">
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
                      <Brush className="w-12 h-12 mb-4 text-gray-500" />
                      <p>Generated looks will appear here</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Expanded Image Modal */}
        <AnimatePresence>
          {expandedImageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
              onClick={() => setExpandedImageUrl(null)} // Close on backdrop click
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
              >
                {/* Controls bar */}
                <div className="absolute top-0 left-0 right-0 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent p-4 rounded-t-lg">
                  <div className="flex items-center space-x-4">
                    {/* Zoom controls */}
                    <div className="flex items-center space-x-2 bg-black/50 rounded-full p-1">
                      <button
                        onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.1))}
                        className="p-2 text-white hover:bg-white/10 rounded-full transition-all"
                        aria-label="Zoom out"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <div className="text-white text-sm font-medium">{Math.round(imageScale * 100)}%</div>
                      <button
                        onClick={() => setImageScale(prev => Math.min(2, prev + 0.1))}
                        className="p-2 text-white hover:bg-white/10 rounded-full transition-all"
                        aria-label="Zoom in"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Reset zoom */}
                    <button
                      onClick={() => setImageScale(1)}
                      className="p-2 px-3 bg-black/50 text-white hover:bg-black/70 rounded-full transition-all text-sm"
                      aria-label="Reset zoom"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setExpandedImageUrl(null);
                      setImageScale(1); // Reset zoom when closing
                    }}
                    className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-600 transition-all"
                    aria-label="Close image preview"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Image container with zoom applied */}
                <div className="flex-1 flex items-center justify-center overflow-hidden p-4 mt-12 mb-8">
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <img
                      src={expandedImageUrl}
                      alt="Expanded look"
                      style={{ transform: `scale(${imageScale})`, transformOrigin: 'center' }}
                      className="rounded-lg transition-transform duration-200 max-h-[calc(90vh-120px)] max-w-full object-contain"
                    />
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-full z-10">
                  Press ESC or click outside to close
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}