import React from 'react';
import { Video, Brush, Mic, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Influencer } from '../types';
import { useState } from 'react';
import CreateVideoModal from './CreateVideoModal';
import VoiceSetupModal from './VoiceSetupModal';

interface InfluencerCardProps {
  influencer: Influencer;
  onEdit: (influencer: Influencer) => void;
  isLookPage?: boolean;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer, onEdit, isLookPage }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const hasVoice = !!influencer.voice_id;

  const handleActionClick = (e: React.MouseEvent) => {
    if (!hasVoice) {
      e.preventDefault();
      setShowVoiceSetupModal(true);
    }
  };

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        {/* Image Container with Border */}
        <div className="p-4">
          <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-700">
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

        {/* Name and Actions Container */}
        <div className="p-4 pt-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{influencer.name}</h3>
            {!hasVoice && (
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
            <Link
              to={`/content/${influencer.id}`}
              onClick={handleActionClick}
              data-tour="content-button"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasVoice 
                  ? 'bg-[#c9fffc] text-black hover:bg-[#a0fcf9]' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title="View videos"
            >
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </Link>
            {!isLookPage && <Link
              to={`/appearances/${influencer.id}`}
              onClick={handleActionClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasVoice 
                  ? 'bg-[#c9fffc] text-black hover:bg-[#a0fcf9]' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Brush className="h-4 w-4" />
              <span>Looks</span>
            </Link>}
            <button
              onClick={hasVoice ? () => setShowCreateModal(true) : handleActionClick}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasVoice 
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
    </>
  );
};