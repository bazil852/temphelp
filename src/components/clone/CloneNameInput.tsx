import React from 'react';
import { motion } from 'framer-motion';

interface CloneNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CloneNameInput: React.FC<CloneNameInputProps> = ({ value, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(77,224,249,0.08)] p-6"
    >
      <h2 className="text-sm font-semibold text-white mb-4">Name Your Clone</h2>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a name for your clone"
        className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-white/40 transition-all duration-200"
        required
      />
    </motion.div>
  );
};