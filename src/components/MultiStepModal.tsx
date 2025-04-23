import React from 'react';
import { X, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40 px-6 py-8 w-full max-w-lg"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Create New Influencer
              </h2>
              {!limitsLoading && avatarLimit !== -1 && (
                <div className="text-sm text-gray-400">
                  <div>Avatars: {avatarsUsed}/{avatarLimit === -1 ? '∞' : avatarLimit}</div>
                  <div>AI Cloning: {aiCloningUsed}/{aiCloningLimit === -1 ? '∞' : aiCloningLimit}</div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Avatar */}
            <button
              onClick={() => {
                navigate('/create-ai-avatar');
                onClose();
              }}
              disabled={!canCreateAvatar}
              className={`flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 ${
                !canCreateAvatar ? 'opacity-50 cursor-not-allowed' : 'hover:ring-1 hover:ring-cyan-500/50'
              }`}
            >
              <Plus className="h-8 w-8 mb-2 text-white" />
              <span className="text-sm font-semibold text-white text-center">Generate Influencer</span>
              <span className="text-xs text-gray-400 mt-1 text-center">Generate an Influencer from a prompt</span>
            </button>

            {/* Photo Avatar */}
            <button
              onClick={() => {
                navigate('/create-photo-avatar');
                onClose();
              }}
              disabled={!canCreateAvatar}
              className={`flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 ${
                !canCreateAvatar ? 'opacity-50 cursor-not-allowed' : 'hover:ring-1 hover:ring-cyan-500/50'
              }`}
            >
              <Plus className="h-8 w-8 mb-2 text-white" />
              <span className="text-sm font-semibold text-white text-center">Upload Photo</span>
              <span className="text-xs text-gray-400 mt-1 text-center">Turn your photo into an AI Influencer</span>
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
              className={`flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 ${
                !canScheduleCall ? 'opacity-50 cursor-not-allowed' : 'hover:ring-1 hover:ring-cyan-500/50'
              }`}
            >
              <User className="h-8 w-8 mb-2 text-white" />
              <span className="text-sm font-semibold text-white text-center">AI Clone</span>
              <span className="text-xs text-gray-400 mt-1 text-center">
                {canScheduleCall
                  ? "Clone Yourself With AI"
                  : aiCloningLimit === -1
                    ? "Loading..."
                    : "AI Cloning limit reached"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}