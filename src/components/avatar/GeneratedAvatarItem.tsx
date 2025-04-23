import React from 'react';
import { motion } from 'framer-motion';
import { Expand } from 'lucide-react';

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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative group cursor-pointer rounded-2xl overflow-hidden ${
        isSelected ? 'ring-2 ring-[#4DE0F9]' : 'hover:ring-2 hover:ring-white/20'
      }`}
      onClick={onSelect}
    >
      <img
        src={url}
        alt="Generated avatar"
        className="w-full aspect-square object-cover"
      />
      
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors duration-200"
          >
            <Expand className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};