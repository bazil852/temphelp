import React from 'react';
import { ChevronDown } from 'lucide-react';
// import { VoiceDetails } from './VoiceDetails';
import { AppearanceField } from './AppearenceField';
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
  onFormDataChange: (data: Partial<AvatarFormData>) => void;
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
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
          required
          placeholder="Enter avatar name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <select
            value={formData.age}
            onChange={(e) => onFormDataChange({ age: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
            required
          >
            <option value="">Select age range</option>
            {AGE_OPTIONS.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => onFormDataChange({ gender: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
            required
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ethnicity</label>
          <select
            value={formData.ethnicity}
            onChange={(e) => onFormDataChange({ ethnicity: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
            required
          >
            <option value="">Select ethnicity</option>
            {ETHNICITY_OPTIONS.map(ethnicity => (
              <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Orientation</label>
          <select
            value={formData.orientation}
            onChange={(e) => onFormDataChange({ orientation: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
            required
          >
            <option value="">Select orientation</option>
            {ORIENTATION_OPTIONS.map(orientation => (
              <option key={orientation} value={orientation}>{orientation}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pose</label>
          <select
            value={formData.pose}
            onChange={(e) => onFormDataChange({ pose: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
            required
          >
            <option value="">Select pose</option>
            {POSE_OPTIONS.map(pose => (
              <option key={pose} value={pose}>{pose}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Style</label>
          <select
            value={formData.style}
            onChange={(e) => onFormDataChange({ style: e.target.value as any })}
            className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2 focus:border-[#c9fffc] focus:ring-[#c9fffc] transition-colors"
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
        onChange={(value) => onFormDataChange({ appearance: value })}
      />

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-700 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium"
        >
          {isSubmitting ? 'Generating...' : 'Generate Avatar'}
        </button>
      </div>
    </form>
  );
};