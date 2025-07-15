import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScheduleFormData, InfluencerWithLooks, RecurrenceRule } from '../../types/content-planner';
// import RecurrenceEditor from './RecurrenceEditor';

const scheduleSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  lookId: z.string().min(1, 'Please select a look'),
  dateTime: z.date(),
  generateThumbnail: z.boolean()
});

interface ScheduleComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => Promise<void>;
  prefilledData?: {
    influencerId?: string;
    dateTime?: Date;
  } | null;
  availableInfluencers: InfluencerWithLooks[];
}

export default function ScheduleComposerModal({
  isOpen,
  onClose,
  onSave,
  prefilledData,
  availableInfluencers
}: ScheduleComposerModalProps) {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ frequency: 'once' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<Omit<ScheduleFormData, 'recurrence'>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      prompt: '',
      lookId: '',
      dateTime: prefilledData?.dateTime || new Date(),
      generateThumbnail: true
    }
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefilledData?.influencerId) {
        setSelectedInfluencerId(prefilledData.influencerId);
        const influencer = availableInfluencers.find(inf => inf.id === prefilledData.influencerId);
        if (influencer && influencer.looks.length > 0) {
          setValue('lookId', influencer.looks[0].id);
        }
      } else {
        setSelectedInfluencerId(availableInfluencers[0]?.id || '');
        if (availableInfluencers[0]?.looks.length > 0) {
          setValue('lookId', availableInfluencers[0].looks[0].id);
        }
      }
      
      if (prefilledData?.dateTime) {
        setValue('dateTime', prefilledData.dateTime);
      }
    }
  }, [isOpen, prefilledData, availableInfluencers, setValue]);

  // Get current influencer
  const currentInfluencer = availableInfluencers.find(inf => inf.id === selectedInfluencerId);

  const onSubmit = async (data: Omit<ScheduleFormData, 'recurrence'>) => {
    if (!selectedInfluencerId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...data,
        recurrence,
        influencerId: selectedInfluencerId
      });
      reset();
      setRecurrence({ frequency: 'once' });
      setSelectedInfluencerId('');
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInfluencerChange = (influencerId: string) => {
    setSelectedInfluencerId(influencerId);
    const influencer = availableInfluencers.find(inf => inf.id === influencerId);
    if (influencer && influencer.looks.length > 0) {
      setValue('lookId', influencer.looks[0].id);
    }
  };

  // Format datetime for input
  const formatDateTimeForInput = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-semibold text-white">Schedule Content</h2>
            <p className="text-sm text-gray-400 mt-1">
              Create a new content plan for your influencer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Influencer Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Influencer
            </label>
            <select
              value={selectedInfluencerId}
              onChange={(e) => handleInfluencerChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:border-[#4DE0F9] placeholder-gray-400"
            >
              {availableInfluencers.map((influencer) => (
                <option key={influencer.id} value={influencer.id} className="bg-gray-800 text-white">
                  {influencer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic/Prompt */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Content Topic/Prompt *
            </label>
            <textarea
              {...register('prompt')}
              rows={4}
              placeholder="Describe what you want this content to be about..."
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:border-[#4DE0F9] placeholder-gray-400"
            />
            {errors.prompt && (
              <p className="mt-1 text-sm text-red-400">{errors.prompt.message}</p>
            )}
          </div>

          {/* Look Selection */}
          {currentInfluencer && currentInfluencer.looks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Look/Appearance
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currentInfluencer.looks.map((look) => (
                  <label
                    key={look.id}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('lookId') === look.id 
                        ? 'border-[#4DE0F9] bg-[#4DE0F9]/10' 
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      {...register('lookId')}
                      type="radio"
                      value={look.id}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      {look.thumbnailUrl && (
                        <img
                          src={look.thumbnailUrl}
                          alt={look.label}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm font-medium text-white">
                        {look.label}
                      </span>
                    </div>
                    {watch('lookId') === look.id && (
                      <div className="absolute inset-0 border-2 border-[#4DE0F9] rounded-lg pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
              {errors.lookId && (
                <p className="mt-1 text-sm text-red-400">{errors.lookId.message}</p>
              )}
            </div>
          )}

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date & Time
            </label>
            <input
              {...register('dateTime', { valueAsDate: true })}
              type="datetime-local"
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:border-[#4DE0F9] placeholder-gray-400"
            />
            {errors.dateTime && (
              <p className="mt-1 text-sm text-red-400">{errors.dateTime.message}</p>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Repeat className="h-4 w-4 inline mr-1" />
              Recurrence
            </label>
            <div className="p-3 bg-white/5 border border-white/20 rounded-lg">
              <p className="text-gray-400 text-sm">Recurrence options coming soon...</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                {...register('generateThumbnail')}
                type="checkbox"
                className="rounded border-white/20 bg-white/5 text-[#4DE0F9] focus:ring-[#4DE0F9]"
              />
              <span className="ml-2 text-sm text-white">
                Generate thumbnail automatically
              </span>
            </label>
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-black bg-[#4DE0F9] rounded-lg hover:bg-[#4DE0F9]/80 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
} 