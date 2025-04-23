import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
// import { VoiceDetails } from './VoiceDetails';
import { AppearanceField } from './AppearanceField';
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  ETHNICITY_OPTIONS,
  ORIENTATION_OPTIONS,
  POSE_OPTIONS,
  STYLE_OPTIONS,
  AvatarFormData
} from '../../constants/avatarOptions';

interface AvatarFormProps {
  formData: AvatarFormData;
  onFormDataChange: (updates: Partial<AvatarFormData>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const AvatarForm: React.FC<AvatarFormProps> = ({
  formData,
  onFormDataChange,
  showAdvanced,
  onToggleAdvanced,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-gray-400"
          required
          placeholder="Enter avatar name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Age</label>
          <select
            value={formData.age}
            onChange={(e) => onFormDataChange({ age: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select age range</option>
            {AGE_OPTIONS.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => onFormDataChange({ gender: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Ethnicity</label>
          <select
            value={formData.ethnicity}
            onChange={(e) => onFormDataChange({ ethnicity: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select ethnicity</option>
            {ETHNICITY_OPTIONS.map(ethnicity => (
              <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Orientation</label>
          <select
            value={formData.orientation}
            onChange={(e) => onFormDataChange({ orientation: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select orientation</option>
            {ORIENTATION_OPTIONS.map(orientation => (
              <option key={orientation} value={orientation}>{orientation}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Pose</label>
          <select
            value={formData.pose}
            onChange={(e) => onFormDataChange({ pose: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select pose</option>
            {POSE_OPTIONS.map(pose => (
              <option key={pose} value={pose}>{pose}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Style</label>
          <select
            value={formData.style}
            onChange={(e) => onFormDataChange({ style: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40"
            required
          >
            <option value="">Select style</option>
            {STYLE_OPTIONS.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>
      </div>

      {/* <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex items-center text-sm font-medium text-[#c9fffc] hover:text-[#a0fcf9] transition-colors"
      >
        <ChevronDown
          className={`h-5 w-5 transform transition-transform ${
            showAdvanced ? 'rotate-180' : ''
          }`}
        />
        <span className="ml-2">Advanced Voice Details</span>
      </button> */}

      {/* {showAdvanced && (
        <VoiceDetails
          value={formData.voiceDetails || ''}
          onChange={(value) => onFormDataChange({ voiceDetails: value })}
        />
      )} */}

      <AppearanceField
        value={formData.appearance}
        onChange={(value: string) => onFormDataChange({ appearance: value })}
      />

      <div className="flex justify-end gap-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-full font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-full font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Generating...' : 'Generate Avatar'}
        </motion.button>
      </div>
    </form>
  );
};