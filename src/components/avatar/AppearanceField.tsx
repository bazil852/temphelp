import React from 'react';

interface AppearanceFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const AppearanceField: React.FC<AppearanceFieldProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">
        Appearance
        <span className="text-white/40 text-xs ml-2">(max 1000 characters)</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 1000))}
        maxLength={1000}
        rows={4}
        className="w-full bg-white/10 text-white rounded-2xl px-4 py-3 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-white/40 transition-all duration-200"
        placeholder="Describe the appearance in detail..."
        required
      />
      <div className="mt-2 text-sm text-white/40 text-right">
        {value.length}/1000 characters
      </div>
    </div>
  );
};