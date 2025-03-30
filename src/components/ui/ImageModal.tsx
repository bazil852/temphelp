import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full text-white hover:text-gray-300 hover:bg-opacity-75 transition-all z-[110]"
        >
          <X className="h-8 w-8" />
        </button>
        <img
          src={imageUrl}
          alt="Expanded avatar"
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
};