import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { AvatarForm } from '../components/avatar/AvatarForm';
import { GeneratedAvatarsGrid } from '../components/avatar/GeneratedAvatarGrid';
import { ImageModal } from '../components/ui/ImageModal';
import { AvatarFormData } from '../constants/avatarOptions';
import { createAvatarGroup, startPolling, uploadImageToSupabase, GeneratedImages, checkGenerationStatus } from '../services/heygenServices';

const INITIAL_FORM_DATA: AvatarFormData = {
  name: '',
  age: 'Young Adult',
  gender: 'Man',
  ethnicity: 'White',
  orientation: 'square',
  pose: 'half_body',
  style: 'Realistic',
  appearance: ''
};

export default function CreateAiAvatarPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [formData, setFormData] = useState<AvatarFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFormDataChange = (updates: Partial<AvatarFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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

      try {
        const status = await checkGenerationStatus(generationId);
        if (status.state === 'success') {
          // Update the UI with generated images
          setGeneratedImages({
            urls: status.images.urls,
            keys: status.images.keys
          });
          setIsPolling(false);
        } else if (status.state === 'failed') {
          setError('Generation failed');
          setIsPolling(false);
        } else {
          attempts++;
          setTimeout(poll, 3000);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to check status');
        setIsPolling(false);
      }
    };

    await poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
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
            voice_details: formData.voiceDetails,
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
      if (!response.ok) throw new Error(data.error?.message || 'Failed to generate avatar');

      const generationId = data?.data?.generation_id;
      if (!generationId) throw new Error('No generation ID received');

      setGenerationId(generationId);
      setIsSubmitting(false);
      setIsPolling(true);

      startPolling(
        generationId,
        (progress) => {
          // Progress updates if needed
        },
        async () => {
          const { data: listData } = await supabase
            .from('avatars')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          if (listData?.[0]) {
            setGeneratedImages({
              urls: [listData[0].image_url],
              keys: [listData[0].image_key]
            });
          }
          setIsPolling(false);
        },
        (error) => {
          setError(error.message);
          setIsPolling(false);
        }
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate avatar');
      setIsSubmitting(false);
    }
  };

  const handleCreateAvatar = async () => {
    if (selectedImageIndex === null || !generatedImages) return;
    
    setIsCreatingAvatar(true);
    setError('');

    try {
      const avatarGroup = await createAvatarGroup(
        generatedImages.keys[selectedImageIndex],
        formData.name
      );
      
      const imageUrl = generatedImages.urls[selectedImageIndex];
      const publicUrl = await uploadImageToSupabase(imageUrl);
      
      const { error: influencerError } = await supabase
        .from('influencers')
        .insert([{
          user_id: currentUser?.id,
          name: formData.name,
          preview_url: publicUrl,
          status: 'pending',
          template_id: avatarGroup.group_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (influencerError) throw influencerError;
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create avatar');
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Create AI Avatar</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <AvatarForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/dashboard')}
          />
        </div>

        {/* Generated Images Section */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Generated Avatars</h2>
          
          <GeneratedAvatarsGrid
            isPolling={isPolling}
            generatedImages={generatedImages}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={setSelectedImageIndex}
            onExpandImage={setExpandedImageUrl}
            isCreatingAvatar={isCreatingAvatar}
            onCreateAvatar={handleCreateAvatar}
          />
        </div>
      </div>

      {expandedImageUrl && (
        <ImageModal
          imageUrl={expandedImageUrl}
          onClose={() => setExpandedImageUrl(null)}
        />
      )}
    </div>
  );
}