import React, { useState } from 'react';
import { useInView } from 'framer-motion';
import {
  Video,
  Brush,
  Mic,
  AlertCircle,
  Wand2,
  Loader2,
  RefreshCw,
  Power,
  Trash2,
  X
  Trash2,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Influencer } from '../types';
import CreateVideoModal from './CreateVideoModal';
import VoiceSetupModal from './VoiceSetupModal';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useInfluencerStore } from '../store/influencerStore';
import { CardShell } from './CardShell';
import { CardShell } from './CardShell';

interface InfluencerCardProps {
  influencer: Influencer;
  onEdit: (influencer: Influencer) => void;
  isLookPage?: boolean;
}

interface ConfirmMotionModalProps {
  onClose: () => void;
  onConfirm: (prompt: string, motionType: 'consistent' | 'expressive', name: string) => void;
  isLoading: boolean;
}

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmMotionModal({
  onClose,
  onConfirm,
  isLoading,
}: ConfirmMotionModalProps) {
  const [prompt, setPrompt] = useState('');
  const [motionType, setMotionType] = useState<'consistent' | 'expressive'>('consistent');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-white/10"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Add Motion</h3>
            <p className="mt-1 text-sm text-gray-400">
              Create a new look with motion capabilities
            </p>
          </div>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-white/10"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Add Motion</h3>
            <p className="mt-1 text-sm text-gray-400">
              Create a new look with motion capabilities
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              placeholder="Enter a name for this motion avatar"
              required
            />
          </div>

          <div>
            <label htmlFor="motionType" className="block text-sm font-medium text-gray-300 mb-2">
              Motion Type
            </label>
            <select
              id="motionType"
              value={motionType}
              onChange={(e) => setMotionType(e.target.value as 'consistent' | 'expressive')}
              className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            >
              <option value="consistent">Consistent</option>
              <option value="expressive">Expressive</option>
            </select>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              placeholder="Describe how you want the motion to look..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(prompt, motionType, name)}
              disabled={isLoading || !prompt.trim() || !name.trim()}
              className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Motion...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Add Motion
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">Delete Influencer</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete this influencer? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
  influencer,
  onEdit,
  isLookPage
}) => {
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -10% 0px"
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const [showMotionModal, setShowMotionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAddingMotion, setIsAddingMotion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { deleteInfluencer } = useInfluencerStore();

  const hasVoice = !!influencer.voice_id;
  const isProcessing = influencer.status === 'pending' || (influencer.status && influencer.status !== 'completed');

  const handleActionClick = (e: React.MouseEvent) => {
    if (!hasVoice || isProcessing) {
      e.preventDefault();
      if (!hasVoice && !isProcessing) {
        setShowVoiceSetupModal(true);
      }
      // Do nothing if processing - just prevent navigation/action
    }
  };

  const handleAddMotion = async (prompt: string, motionType: 'consistent' | 'expressive', name: string) => {
    if (!influencer || !currentUser?.heygenApiKey) return;

    setIsAddingMotion(true);

    try {
      console.log(`Adding motion to influencer "${influencer.name}" using templateId: ${influencer.templateId}`);

      // 1. Get the group_id from Heygen API using the influencer's templateId
      const groupResponse = await fetch(
        `https://api.heygen.com/v2/photo_avatar/${influencer.templateId}`,
        {
          headers: {
            accept: 'application/json',
            'x-api-key': currentUser.heygenApiKey
          }
        }
      );

      const groupData = await groupResponse.json();

      if (!groupResponse.ok) {
        throw new Error(groupData.error?.message || 'Failed to fetch group ID');
      }

      const groupId = groupData.data.group_id;
      console.log(`Fetched groupId: ${groupId}`);

      // 2. Add motion to the influencer using group_id, prompt, and motionType
      // 2. Add motion to the influencer using group_id, prompt, and motionType
      const motionResponse = await fetch(
        'https://api.heygen.com/v2/photo_avatar/add_motion',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': currentUser.heygenApiKey
          },
          body: JSON.stringify({ 
            id: groupId,
            prompt: prompt,
            motion_type: motionType
          })
          body: JSON.stringify({ 
            id: groupId,
            prompt: prompt,
            motion_type: motionType
          })
        }
      );

      const motionData = await motionResponse.json();

      if (!motionResponse.ok) {
        throw new Error(motionData.error?.message || 'Failed to add motion');
      }

      console.log(`Motion added, new template ID: ${motionData.data.id}`);

      // 3. Create new influencer entry in Supabase with the motion data
      const { error: dbError } = await supabase.from('influencers').insert([
        {
          user_id: currentUser.id,
          name: name.trim() ? name : `${influencer.name} (Motion)`, // Use provided name if available
          template_id: motionData.data.id,
          preview_url: influencer.preview_url,
          status: 'pending_motion',
          voice_id: influencer.voice_id,
          look_id: influencer.look_id || influencer.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      if (dbError) {
        throw dbError;
      }

      setShowMotionModal(false);
      // Optional: add a success notification
      console.log('New motion influencer created successfully!');
    } catch (error: any) {
      console.error('Error adding motion:', error);
      alert(`Failed to add motion: ${error.message}`);
    } finally {
      setIsAddingMotion(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInfluencer(influencer.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting influencer:', error);
      alert('Failed to delete influencer. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CardShell
        imgSrc={influencer.preview_url}
        imgAlt={influencer.name}
      >
          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl overflow-hidden" style={{pointerEvents: 'all'}}>
              <Loader2 className="h-12 w-12 text-white/80 animate-spin mb-3" />
              <p className="text-white/90 font-medium">Processing</p>
              <p className="text-white/60 text-sm mt-1">Please wait...</p>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={() => !hasVoice && setShowVoiceSetupModal(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border shadow-lg flex items-center gap-2 transition-transform hover:scale-105 ${
              hasVoice 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
            }`}
            >
              {hasVoice ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Ready
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Setup Voice
                </>
              )}
            </button>
          </div>

          {/* Add Motion Button */}
          {isLookPage && (
            <button
              disabled={!!isProcessing}
              onClick={() => !isProcessing && setShowMotionModal(true)}
              className={`absolute top-3 right-12 z-10 p-2 rounded-full transition-all ${
              className={`absolute top-3 right-12 z-10 p-2 rounded-full transition-all ${
                isProcessing
                  ? 'bg-white/10 opacity-50 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'
              }`}
              title={isProcessing ? 'Processing...' : 'Add Motion'}
            >
              <Wand2 className="h-4 w-4 text-white" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full transition-all bg-white/10 hover:bg-red-500/20 backdrop-blur-md border border-white/20 hover:border-red-500/20"
            title="Delete influencer"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>

          {/* Content Area */}
            <h3 className="text-2xl font-bold text-white mb-6 drop-shadow-lg">
              {influencer.name}
            </h3>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Link
                to={`/content/${influencer.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (!hasVoice) {
                    setShowVoiceSetupModal(true);
                  } else {
                    navigate(`/content/${influencer.id}`);
                  }
                }}
                data-tour="content-button"
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border group/button ${
                  hasVoice
                    ? 'bg-white/10 hover:bg-white/20 border-white/20'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                }`}
                title="View videos"
              >
                <Video className="h-5 w-5 text-white" />
                <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
                  {hasVoice ? 'Videos' : 'Setup Voice Required'}
                </span>
              </Link>

              {/* Looks Link (if not on Looks page already) */}
              {!isLookPage && (
                <Link
                  to={`/appearances/${influencer.id}`}
                  onClick={handleActionClick}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border group/button ${
                    hasVoice
                      ? 'bg-white/10 hover:bg-white/20 border-white/20'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                  }`}
                  title="View looks"
                >
                  <Brush className="h-5 w-5 text-white" />
                  <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
                    {hasVoice ? 'Looks' : 'Setup Voice Required'}
                  </span>
                </Link>
              )}

              {/* Record Button */}
              <button
                onClick={() => {
                  if (isProcessing) return; // Prevent actions when processing
                  hasVoice ? setShowCreateModal(true) : setShowVoiceSetupModal(true);
                }}
                disabled={isProcessing ? true : undefined}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border group/button ${
                  isProcessing
                    ? 'bg-gray-800/80 border-gray-700 cursor-not-allowed'
                    : hasVoice
                      ? 'bg-white/10 hover:bg-white/20 border-white/20'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                }`}
                title={isProcessing ? 'Influencer is processing' : 'Record new video'}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5 text-white" />
                )}
                <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
                  {isProcessing 
                    ? 'Processing' 
                    : hasVoice ? 'Record' : 'Setup Voice Required'}
                </span>
              </button>

              {/* Voice Setup Button */}
              {!hasVoice && (
                <button
                  onClick={() => setShowVoiceSetupModal(true)}
                  className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 group/button"
                  title="Setup voice"
                >
                  <Mic className="h-5 w-5 text-white" />
                  <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
                    Setup Voice
                  </span>
                </button>
              )}
            </div>
      </CardShell>
      </CardShell>

      {/* Modals */}
      {/* Only show modals if the influencer is not processing */}
      {!isProcessing && showCreateModal && (
        <CreateVideoModal
          influencerId={influencer.id}
          templateId={influencer.templateId}
          influencer={influencer}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {!isProcessing && showVoiceSetupModal && (
        <VoiceSetupModal
          influencer={influencer}
          onClose={() => setShowVoiceSetupModal(false)}
          onVoiceSelected={() => window.location.reload()}
        />
      )}

      {showMotionModal && (
        <ConfirmMotionModal
          onClose={() => setShowMotionModal(false)}
          onConfirm={handleAddMotion}
          isLoading={isAddingMotion}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};