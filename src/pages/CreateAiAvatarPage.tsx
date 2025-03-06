import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Maximize2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore'; 
import { supabase } from '../lib/supabase';

const AGE_OPTIONS = [
  "Young Adult",
  "Early Middle Age",
  "Late Middle Age",
  "Senior",
  "Unspecified"
];

const GENDER_OPTIONS = [
  "Woman",
  "Man",
];

const ETHNICITY_OPTIONS = [
  "White",
  "Black",
  "South Asian",
  "South East Asian",
  "Asian American",
  "East Asian",
  "Middle Eastern",
  "Hispanic"
];

const ORIENTATION_OPTIONS = [
  "square",
  "horizontal",
  "vertical"
];

const POSE_OPTIONS = [
  "half_body",
  "close_up",
  "full_body"
];

const STYLE_OPTIONS = [
  "Realistic",
  "Pixar",
  "Cinematic",

];

interface FormData {
  name: string;
  age: string;
  gender: string;
  ethnicity: string;
  orientation: string;
  pose: string;
  style: string;
  appearance: string;
}

interface GeneratedImages {
  urls: string[];
  keys: string[];
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  age: '',
  gender: '',
  ethnicity: '',
  orientation: '',
  pose: '',
  style: '',
  appearance: ''
};

export default function CreateAiAvatarPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [voiceDetails, setVoiceDetails] = useState('');

  const createAvatarGroup = async (imageKey: string) => {
    try {
      // Get HeyGen API key
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("heygen_key")
        .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
        .single();

      if (apiKeyError || !apiKeyData?.heygen_key) {
        throw new Error("Failed to get HeyGen API key");
      }

      const response = await fetch(
        "https://api.heygen.com/v2/photo_avatar/avatar_group/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": apiKeyData.heygen_key,
          },
          body: JSON.stringify({
            name: formData.name,
            image_key: imageKey,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to create avatar group");
      }

      return data.data;
    } catch (error) {
      console.error("Error creating avatar group:", error);
      throw error;
    }
  };

  const handleCreateAvatar = async () => {
    if (selectedImageIndex === null || !generatedImages) return;
    
    setIsCreatingAvatar(true);
    setError("");

    try {
      // Create avatar group
      const avatarGroup = await createAvatarGroup(generatedImages.keys[selectedImageIndex]);
      
      // Upload image to Supabase
      const imageUrl = generatedImages.urls[selectedImageIndex];
      
      // Create influencer record
      const { error: influencerError } = await supabase
        .from('influencers')
        .insert([{
          user_id: currentUser?.id,
          name: formData.name,
          preview_url: imageUrl,
          status:"pending",
          template_id: avatarGroup.group_id, // Use group_id as template_id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (influencerError) throw influencerError;

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error creating avatar:", error);
      setError(error instanceof Error ? error.message : "Failed to create avatar");
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  const uploadImageToSupabase = async (imageUrl: string) => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Generate a unique filename
      const filename = `avatars/${crypto.randomUUID()}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('influencer-images')
        .upload(filename, blob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('influencer-images')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const checkGenerationStatus = async (apiKey: string, generationId: string) => {
    try {
      console.log("Checking status for generation ID:", generationId);
  
      const response = await fetch(
        `https://api.heygen.com/v2/photo_avatar/generation/${generationId}`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        }
      );
  
      const data = await response.json();
      console.log("Status check response:", data);
  
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to check generation status");
      }
  
      if (data.data?.status === "success" && data.data?.image_url_list) {
        setGeneratedImages({
          urls: data.data.image_url_list,
          keys: data.data.image_key_list,
        });
        setIsPolling(false);
      } else if (data.data?.status === "failed") {
        throw new Error("Avatar generation failed");
      }
  
      return data.data.status;
    } catch (error) {
      console.error("Error checking generation status:", error);
      setError(
        error instanceof Error ? error.message : "Failed to check generation status"
      );
      setIsPolling(false);
      return "failed";
    }
  };
  
  const startPolling = async (apiKey: string, generationId: string) => {
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 20; // 1 minute total (3s * 20)
  
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Generation timed out. Please try again.');
        setIsPolling(false);
        return;
      }
  
      const status = await checkGenerationStatus(apiKey, generationId);
      if (status === 'success' || status === 'failed') {
        return;
      }
  
      attempts++;
      setTimeout(() => poll(), 3000); // Poll every 3 seconds
    };
  
    await poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setGeneratedImages(null);
    setSelectedImageIndex(null);
    setGenerationId(null);
  
    try {
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("heygen_key")
        .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
        .single();
  
      if (apiKeyError || !apiKeyData?.heygen_key) {
        throw new Error("Failed to get HeyGen API key");
      }
  
      const response = await fetch(
        "https://api.heygen.com/v2/photo_avatar/photo/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": apiKeyData.heygen_key,
          },
          body: JSON.stringify({
            age: formData.age,
            gender: formData.gender,
            voice_details: voiceDetails || undefined,
            ethnicity: formData.ethnicity,
            orientation: formData.orientation,
            pose: formData.pose,
            style: formData.style,
            appearance: formData.appearance,
            name: formData.name,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate avatar");
      }
  
      const generationId = data?.data?.generation_id;
      if (!generationId) {
        throw new Error("No generation ID received");
      }
  
      setGenerationId(generationId);
      console.log("Generation ID:", generationId);
  
      setIsSubmitting(false);
      await startPolling(apiKeyData.heygen_key, generationId);
    } catch (error) {
      console.error("Error generating avatar:", error);
      setError(error instanceof Error ? error.message : "Failed to generate avatar");
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Create AI Avatar</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field - full width */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                required
                placeholder="Enter avatar name"
              />
            </div>

            {/* Grid for short inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <select
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select age range</option>
                  {AGE_OPTIONS.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select gender identity</option>
                  {GENDER_OPTIONS.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ethnicity</label>
                <select
                  value={formData.ethnicity}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select ethnicity</option>
                  {ETHNICITY_OPTIONS.map(ethnicity => (
                    <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Orientation</label>
                <select
                  value={formData.orientation}
                  onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select orientation</option>
                  {ORIENTATION_OPTIONS.map(orientation => (
                    <option key={orientation} value={orientation}>{orientation}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pose</label>
                <select
                  value={formData.pose}
                  onChange={(e) => setFormData({ ...formData, pose: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select pose</option>
                  {POSE_OPTIONS.map(pose => (
                    <option key={pose} value={pose}>{pose}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                  required
                >
                  <option value="">Select style</option>
                  {STYLE_OPTIONS.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Voice Details Section */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-[#c9fffc] hover:text-[#a0fcf9] transition-colors"
              >
                {showAdvanced ? '- Hide' : '+ Show'} Advanced Voice Details
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Voice Description
                      <span className="text-gray-500 text-xs ml-2">(optional)</span>
                    </label>
                    <textarea
                      value={voiceDetails}
                      onChange={(e) => setVoiceDetails(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                      placeholder="Describe the voice characteristics (e.g., pitch, tone, pace, accent, etc.)"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Example: Deep voice with a confident tone, speaks at a medium pace with slight British accent
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Appearance textarea - full width */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Appearance
                <span className="text-gray-500 text-xs ml-2">(max 1000 characters)</span>
              </label>
              <textarea
                value={formData.appearance}
                onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                maxLength={1000}
                rows={4}
                className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
                placeholder="Describe the appearance in detail..."
                required
              />
              <div className="mt-2 text-sm text-gray-500 text-right">
                {formData.appearance.length}/1000 characters
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border-2 border-gray-700 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800 transition-colors mr-3"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium"
              >
                {isSubmitting ? 'Generating...' : 'Generate Avatar'}
              </button>
            </div>
          </form>
        </div>

        {/* Generated Images Section */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Generated Avatars</h2>
          
          {isPolling ? (
            <div className="flex flex-col items-center justify-center h-[600px]">
              <Loader2 className="w-12 h-12 animate-spin text-[#c9fffc] mb-4" />
              <p className="text-gray-400">Generating your avatars...</p>
            </div>
          ) : generatedImages ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.urls.map((url, index) => (
                  <div
                    key={generatedImages.keys[index]}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-[#c9fffc] shadow-lg scale-105' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedImageUrl(url);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-opacity z-[10]"
                    >
                      <Maximize2 className="h-4 w-4 text-white" />
                    </button>
                    <img 
                      src={url} 
                      alt={`Generated avatar ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                ))}
              </div>
              {selectedImageIndex !== null && (
                <div className="mt-6 flex justify-center z-[5]">
                  <button
                    onClick={handleCreateAvatar}
                    disabled={isCreatingAvatar}
                    className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium flex items-center"
                  >
                    {isCreatingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Avatar...
                      </>
                    ) : (
                      'Create Avatar with Selected Image'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
              <p>Generated avatars will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setExpandedImageUrl(null)}
              className="fixed top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full text-white hover:text-gray-300 hover:bg-opacity-75 transition-all z-[110]"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={expandedImageUrl}
              alt="Expanded avatar"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}