import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function CreatePhotoAvatarPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [heygenResponse, setHeygenResponse] = useState<{ id: string; image_key: string } | null>(null);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser || !name.trim()) {
      setError('Please provide both a name and photo');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1. Upload to Supabase
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('influencer-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('influencer-images')
        .getPublicUrl(filePath);

      setUploadedUrl(publicUrl);
      console.log('Supabase URL:', publicUrl);

      // 2. Upload to HeyGen
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("heygen_key")
        .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
        .single();

      if (apiKeyError || !apiKeyData?.heygen_key) {
        throw new Error("Failed to get HeyGen API key");
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const heygenResponse = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeyData.heygen_key,
        },
        body: selectedFile
      });

      if (!heygenResponse.ok) {
        throw new Error('Failed to upload to HeyGen');
      }

      const heygenData = await heygenResponse.json();
      console.log('HeyGen Response:', heygenData);
      setHeygenResponse(heygenData);
      
      // Create avatar group with the image key
      const avatarGroupResponse = await fetch(
        "https://api.heygen.com/v2/photo_avatar/avatar_group/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": apiKeyData.heygen_key,
          },
          body: JSON.stringify({
            name,
            image_key: heygenData.data.image_key,
          }),
        }
      );

      const avatarGroupData = await avatarGroupResponse.json();
      if (!avatarGroupResponse.ok || avatarGroupData.error) {
        throw new Error(avatarGroupData.error?.message || "Failed to create avatar group");
      }

      // Create influencer in Supabase
      const { error: influencerError } = await supabase
        .from('influencers')
        .insert([{
          user_id: currentUser.id,
          name: name,
          preview_url: publicUrl,
          status: 'pending',
          template_id: avatarGroupData.data.group_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (influencerError) throw influencerError;
      
      // Navigate back to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
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

      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-8">Create Avatar from Photo</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avatar Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter avatar name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Photo
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label className="relative cursor-pointer rounded-md font-medium text-[#c9fffc] hover:text-[#a0fcf9] focus-within:outline-none">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Preview</h3>
                <div className="relative w-48 h-48 mx-auto">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !name.trim() || isUploading}
              className={`w-full px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 flex items-center justify-center gap-2 ${
                isCreatingAvatar ? 'cursor-wait' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isCreatingAvatar ? 'Creating Avatar...' : 'Uploading...'}
                </>
              ) : (
                'Create Avatar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}