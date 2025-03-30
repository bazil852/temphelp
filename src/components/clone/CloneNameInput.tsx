import React from 'react';

interface CloneNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CloneNameInput: React.FC<CloneNameInputProps> = ({ value, onChange }) => {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Name Your Clone</h2>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a name for your clone"
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
        required
      />
    </div>
  );
};