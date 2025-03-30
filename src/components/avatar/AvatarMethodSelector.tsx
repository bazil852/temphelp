import React from 'react';
import { Upload, Wand2 } from 'lucide-react';
import { AvatarCreationMethod } from '../../services/heygenService';

interface AvatarMethodSelectorProps {
  selectedMethod: AvatarCreationMethod;
  onMethodChange: (method: AvatarCreationMethod) => void;
}

export const AvatarMethodSelector: React.FC<AvatarMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <button
        onClick={() => onMethodChange('generate')}
        className={`aspect-square flex flex-col items-center justify-center p-8 border-2 rounded-lg transition-all ${
          selectedMethod === 'generate'
            ? 'border-[#c9fffc] bg-gray-800'
            : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <Wand2 size={40} className={`mb-4 ${selectedMethod === 'generate' ? 'text-[#c9fffc]' : 'text-gray-400'}`} />
        <span className={`text-lg font-medium ${selectedMethod === 'generate' ? 'text-[#c9fffc]' : 'text-gray-400'}`}>
          Generate Avatar
        </span>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Create a custom AI avatar using our advanced generation system
        </p>
      </button>

      <button
        onClick={() => onMethodChange('upload')}
        className={`aspect-square flex flex-col items-center justify-center p-8 border-2 rounded-lg transition-all ${
          selectedMethod === 'upload'
            ? 'border-[#c9fffc] bg-gray-800'
            : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <Upload size={40} className={`mb-4 ${selectedMethod === 'upload' ? 'text-[#c9fffc]' : 'text-gray-400'}`} />
        <span className={`text-lg font-medium ${selectedMethod === 'upload' ? 'text-[#c9fffc]' : 'text-gray-400'}`}>
          Upload Image
        </span>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Upload your own image to create an AI avatar
        </p>
      </button>
    </div>
  );
};