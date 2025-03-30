import React from 'react';
import { X, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '../hooks/usePlanLimits';

interface MultiStepModalProps {
  onClose: () => void;
}

export default function MultiStepModal({ onClose }: MultiStepModalProps) {
  const navigate = useNavigate();
  const {
    avatars: avatarLimit,
    avatarsUsed,
    aiCloning: aiCloningLimit,
    aiCloningUsed,
    loading: limitsLoading
  } = usePlanLimits();

  const canCreateAvatar = !limitsLoading && (avatarLimit === -1 || avatarsUsed < avatarLimit);
  const canScheduleCall = !limitsLoading && (aiCloningLimit === -1 || aiCloningUsed < aiCloningLimit);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Create New Influencer
              </h2>
              {!limitsLoading && avatarLimit !== -1 && (
                <div className="mt-2 text-sm text-gray-400">
                  <div>Avatars: {avatarsUsed}/{avatarLimit === -1 ? '∞' : avatarLimit}</div>
                  <div>AI Cloning: {aiCloningUsed}/{aiCloningLimit === -1 ? '∞' : aiCloningLimit}</div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AI Avatar */}
            <button
              onClick={() => {
                navigate('/create-ai-avatar');
                onClose();
              }}
              disabled={!canCreateAvatar}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                canCreateAvatar 
                  ? 'border-gray-700 hover:border-[#c9fffc] hover:bg-gray-800' 
                  : 'border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus className="h-8 w-8 mb-3 text-gray-400" />
              <span className="text-sm font-medium text-white text-center">Create AI Avatar</span>
              <span className="text-xs text-gray-400 mt-1 text-center">Generate custom AI avatar</span>
            </button>

            {/* Photo Avatar */}
            <button
              onClick={() => {
                navigate('/create-photo-avatar');
                onClose();
              }}
              disabled={!canCreateAvatar}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                canCreateAvatar 
                  ? 'border-gray-700 hover:border-[#c9fffc] hover:bg-gray-800' 
                  : 'border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus className="h-8 w-8 mb-3 text-gray-400" />
              <span className="text-sm font-medium text-white text-center">Create from Photo</span>
              <span className="text-xs text-gray-400 mt-1 text-center">Upload your own photo</span>
            </button>

            {/* AI Clone */}
            <button
              onClick={() => {
                if (canScheduleCall) {
                  navigate('/create-ai-clone');
                  onClose();
                }
              }}
              disabled={!canScheduleCall}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all ${
                canScheduleCall 
                  ? 'border-gray-700 hover:border-[#c9fffc] hover:bg-gray-800' 
                  : 'border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <User className="h-8 w-8 mb-3 text-gray-400" />
              <span className="text-sm font-medium text-white text-center">Book AI Clone Consultation</span>
              <span className="text-xs text-gray-400 mt-1 text-center">
                {canScheduleCall
                  ? "Talk to our team"
                  : aiCloningLimit === -1
                    ? "Loading..."
                    : "AI Cloning limit reached"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}