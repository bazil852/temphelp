import React from 'react';
import { X, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadStepProps {
  images: File[];
  imagePreviewUrls: string[];
  selectedImageIndex: number | null;
  isLoading: boolean;
  imageInstructions: Array<{
    title: string;
    image: string;
  }>;
  onImageUpload: (files: FileList) => void;
  onImageRemove: (index: number) => void;
  onImageSelect: (index: number) => void;
  onSubmit: () => void;
}

export const ImageUploadStep: React.FC<ImageUploadStepProps> = ({
  images,
  imagePreviewUrls,
  selectedImageIndex,
  isLoading,
  imageInstructions,
  onImageUpload,
  onImageRemove,
  onImageSelect,
  onSubmit
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upload Calibration Images
        </h2>
        <p className="text-gray-400 mb-6">
          Upload 5 clear photos of yourself. These will be used to create your AI Twin.
        </p>

        <div className="space-y-4">
          {images.length < 5 && (
            <label className="block">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                Click to upload image {images.length + 1}: {imageInstructions[images.length].title}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && onImageUpload(e.target.files)}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-medium
                  file:bg-[#c9fffc] file:text-black
                  hover:file:bg-[#a0fcf9]"
              />
            </label>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uploaded Images */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Your Photos</h3>
              <div className="grid grid-cols-5 gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div 
                    key={url} 
                    className="relative cursor-pointer"
                    onClick={() => onImageSelect(index)}
                  >
                    <img
                      src={url}
                      alt={`Calibration image ${index + 1}`}
                      className={`w-full aspect-square object-cover rounded-lg transition-all ${
                        selectedImageIndex === index ? 'ring-2 ring-[#c9fffc]' : ''
                      }`}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageRemove(index);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: 5 - images.length }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center"
                  >
                    <ImageIcon className="h-8 w-8 text-gray-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Instructions</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                {selectedImageIndex !== null ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">
                      {imageInstructions[selectedImageIndex].title}
                    </h4>
                    <img
                      src={imageInstructions[selectedImageIndex].image}
                      alt="Instruction example"
                      className="w-full rounded-lg"
                    />
                  </div>
                ) : images.length < 5 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">
                      {imageInstructions[images.length].title}
                    </h4>
                    <img
                      src={imageInstructions[images.length].image}
                      alt="Instruction example"
                      className="w-full rounded-lg"
                    />
                  </div>
                ) : (
                  <p className="text-gray-400">
                    Click on any uploaded photo to see its instructions
                  </p>
                )}
              </div>
            </div>
          </div>

          {images.length === 5 && (
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className="mt-4 w-full px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating AI Twin...
                </>
              ) : (
                'Create AI Twin'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};