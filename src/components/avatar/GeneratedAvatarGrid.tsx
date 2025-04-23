import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
        <Loader2 className="w-12 h-12 animate-spin text-[#4DE0F9] mb-4" />
        <p className="text-white/60">Generating your avatars...</p>
      </div>
    );
  }

  if (!generatedImages) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-white/60">
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateAvatar}
            disabled={isCreatingAvatar}
            className="px-6 py-2 rounded-full font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingAvatar ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Avatar...</span>
              </div>
            ) : (
              'Create Avatar with Selected Image'
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
};