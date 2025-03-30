import React from 'react';
import { Loader2 } from 'lucide-react';
import { GeneratedAvatarItem } from './GeneratedAvatarItem';
import { GeneratedImages } from '../../services/heygenService';

interface GeneratedAvatarsGridProps {
  isPolling: boolean;
  generatedImages: GeneratedImages | null;
  selectedImageIndex: number | null;
  onSelectImage: (index: number) => void;
  onExpandImage: (url: string) => void;
  isCreatingAvatar: boolean;
  onCreateAvatar: () => void;
}

export const GeneratedAvatarsGrid: React.FC<GeneratedAvatarsGridProps> = ({
  isPolling,
  generatedImages,
  selectedImageIndex,
  onSelectImage,
  onExpandImage,
  isCreatingAvatar,
  onCreateAvatar,
}) => {
  if (isPolling) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#c9fffc] mb-4" />
        <p className="text-gray-400">Generating your avatars...</p>
      </div>
    );
  }

  if (!generatedImages) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
        <p>Generated avatars will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {generatedImages.urls.map((url, index) => (
          <GeneratedAvatarItem
            key={generatedImages.keys[index]}
            url={url}
            isSelected={selectedImageIndex === index}
            onSelect={() => onSelectImage(index)}
            onExpand={() => onExpandImage(url)}
          />
        ))}
      </div>
      
      {selectedImageIndex !== null && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onCreateAvatar}
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
  );
};