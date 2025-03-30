import React from 'react';
import { Maximize2, Check } from 'lucide-react';

interface GeneratedAvatarItemProps {
  url: string;
  isSelected: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

export const GeneratedAvatarItem: React.FC<GeneratedAvatarItemProps> = ({
  url,
  isSelected,
  onSelect,
  onExpand,
}) => {
  return (
    <div
      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-[#c9fffc] shadow-lg scale-105'
          : 'border-gray-700 hover:border-gray-500'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-2 left-2 z-[90] bg-[#c9fffc] rounded-full p-1">
          <Check className="h-4 w-4 text-black" />
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-opacity z-[90]"
      >
        <Maximize2 className="h-4 w-4 text-white" />
      </button>
      <img 
        src={url} 
        alt="Generated avatar"
        className="w-full aspect-square object-cover"
      />
    </div>
  );
};