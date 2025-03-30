import React from 'react';

interface AppearanceFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const AppearanceField: React.FC<AppearanceFieldProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Appearance
        <span className="text-gray-500 text-xs ml-2">(max 1000 characters)</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 1000))}
        maxLength={1000}
        rows={4}
        className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
        placeholder="Describe the appearance in detail..."
        required
      />
      <div className="mt-2 text-sm text-gray-500 text-right">
        {value.length}/1000 characters
      </div>
    </div>
  );
};