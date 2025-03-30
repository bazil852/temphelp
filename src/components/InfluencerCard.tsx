import React, { useState } from 'react';
import {
  Video,
  Brush,
  Mic,
  AlertCircle,
  Wand2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Influencer } from '../types';
import CreateVideoModal from './CreateVideoModal';
import VoiceSetupModal from './VoiceSetupModal';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface InfluencerCardProps {
  influencer: Influencer;
  onEdit: (influencer: Influencer) => void;
  isLookPage?: boolean;
}

interface ConfirmMotionModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmMotionModal({
  onClose,
  onConfirm,
  isLoading,
}: ConfirmMotionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">Add Motion</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to add motion to this influencer? This will
          create a new look with motion capabilities.
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
            className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 flex items-center gap-2"
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
    </div>
  );
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
  influencer,
  onEdit,
  isLookPage
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const [showMotionModal, setShowMotionModal] = useState(false);
  const [isAddingMotion, setIsAddingMotion] = useState(false);
  const { currentUser } = useAuthStore();

  const hasVoice = !!influencer.voice_id;
  const isProcessing = influencer.status && influencer.status !== 'completed';

  const handleActionClick = (e: React.MouseEvent) => {
    if (!hasVoice || isProcessing) {
      e.preventDefault();
      if (!hasVoice) {
        setShowVoiceSetupModal(true);
      }
    }
  };

  const handleAddMotion = async () => {
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

      // 2. Add motion to the influencer using group_id
      const motionResponse = await fetch(
        'https://api.heygen.com/v2/photo_avatar/add_motion',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-api-key': currentUser.heygenApiKey
          },
          body: JSON.stringify({ id: groupId })
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
          name: `${influencer.name} (Motion)`,
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

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        {/* Image Container */}
        <div className="p-4">
          <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-700 relative">
            {/* Add Motion Button (Always visible) */}
            {isLookPage && (<button
              disabled={isProcessing}
              onClick={() => !isProcessing && setShowMotionModal(true)}
              className={`absolute top-2 right-2 z-10 p-2 rounded-lg transition-all group ${
                isProcessing
                  ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                  : 'bg-black bg-opacity-50 hover:bg-opacity-75'
              }`}
              title={isProcessing ? 'Processing...' : 'Add Motion'}
            >
              <Wand2 className="h-4 w-4 text-[#c9fffc] group-hover:scale-110 transition-transform" />
            </button>)}

            {/* Influencer Preview */}
            {influencer.preview_url ? (
              <img
                src={influencer.preview_url}
                alt={influencer.name}
                className="w-full h-full object-contain bg-gray-800"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No Preview</span>
              </div>
            )}
          </div>
        </div>

        {/* Details and Actions */}
        <div className="p-4 pt-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{influencer.name}</h3>

            {isProcessing ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-500 rounded-full text-xs font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Processing
              </div>
            ) : !hasVoice && (
              <button
                onClick={() => setShowVoiceSetupModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500 bg-opacity-20 hover:bg-opacity-30 text-yellow-500 rounded-full text-xs font-medium transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Setup Voice
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Content Link */}
            <Link
              to={`/content/${influencer.id}`}
              onClick={handleActionClick}
              data-tour="content-button"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasVoice && !isProcessing
                  ? 'bg-[#c9fffc] text-black hover:bg-[#a0fcf9]'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title="View videos"
            >
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </Link>

            {/* Looks Link (if not on Looks page already) */}
            {!isLookPage && (
              <Link
                to={`/appearances/${influencer.id}`}
                onClick={handleActionClick}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasVoice && !isProcessing
                    ? 'bg-[#c9fffc] text-black hover:bg-[#a0fcf9]'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Brush className="h-4 w-4" />
                <span>Looks</span>
              </Link>
            )}

            {/* Record Button */}
            <button
              onClick={
                hasVoice ? () => setShowCreateModal(true) : handleActionClick
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasVoice && !isProcessing
                  ? 'bg-[#c9fffc] text-black hover:bg-[#a0fcf9]'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title="Record new video"
            >
              <Mic className="h-4 w-4" />
              <span>Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateVideoModal
          influencerId={influencer.id}
          templateId={influencer.templateId}
          influencer={influencer}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showVoiceSetupModal && (
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
    </>
  );
};
