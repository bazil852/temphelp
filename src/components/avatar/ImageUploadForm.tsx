import React, { useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadFormProps {
  onImageUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  name: string;
  onNameChange: (name: string) => void;
}

export const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  onImageUpload,
  isUploading,
  name,
  onNameChange,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload file
    await onImageUpload(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Avatar Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
          required
          placeholder="Enter avatar name"
        />
      </div>

      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-[#c9fffc] transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={isUploading}
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-lg"
            />
            <label
              htmlFor="image-upload"
              className="block w-full text-center px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Choose Different Image</span>
                </div>
              )}
            </label>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center h-64 cursor-pointer"
          >
            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
            <span className="text-gray-400">Click to upload an image</span>
            <span className="text-sm text-gray-500 mt-2">JPG, PNG up to 10MB</span>
          </label>
        )}
      </div>
    </div>
  );
};