import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
      if (!selectedFile) {
        setError('No file selected.'); // Should be caught by earlier check, but good practice
        setIsUploading(false);
        return;
      }

      console.log('Original file instanceof File', selectedFile instanceof File);
      console.log(`Original file size ${selectedFile.size / 1024 / 1024} MB`);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      let compressedFile = selectedFile;
      try {
        compressedFile = await imageCompression(selectedFile, options);
        console.log('Compressed file instanceof File', compressedFile instanceof File);
        console.log(`Compressed file size ${compressedFile.size / 1024 / 1024} MB`);
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Proceed with original file if compression fails, or set error
        // setError('Failed to compress image. Please try again.');
        // setIsUploading(false);
        // return;
      }

      // 1. Upload to Supabase
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('influencer-images')
        .upload(filePath, compressedFile);

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
      formData.append('file', compressedFile);

      const heygenResponse = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: {
          'x-api-key': apiKeyData.heygen_key,
        },
        body: compressedFile
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
    <div className="container mx-auto px-6 sm:px-12 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D1117]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-6 sm:p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-8">Create Avatar from Photo</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Avatar Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter avatar name"
                className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Upload Photo
              </label>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative group"
              >
                <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-white/10 rounded-2xl bg-white/5 hover:border-[#4DE0F9] transition-all duration-200">
                  <div className="space-y-3 text-center">
                    <Upload className="mx-auto h-12 w-12 text-white/60 group-hover:text-[#4DE0F9] transition-colors duration-200" />
                    <div className="flex text-sm text-white/60">
                      <label className="relative cursor-pointer rounded-full font-medium text-[#4DE0F9] hover:text-[#4DE0F9]/80 focus-within:outline-none">
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
                    <p className="text-xs text-white/40">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl p-4 border border-white/10"
              >
                <h3 className="text-sm font-medium text-white/80 mb-3">Preview</h3>
                <div className="relative w-full max-w-xs mx-auto aspect-square">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-xl object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-[#4DE0F9]/20" />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={!selectedFile || !name.trim() || isUploading}
              className={`w-full px-6 py-3 rounded-full font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
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
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}