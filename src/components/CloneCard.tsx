import React from 'react';
import { Video, Mic } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CreateVideoModal from './CreateVideoModal';

interface CloneCardProps {
  clone: {
    id: string;
    name: string;
    image_preview?: string;
    template_id?: string;
    clone_id?: string;
  };
}

export const CloneCard: React.FC<CloneCardProps> = ({ clone }) => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const navigate = useNavigate();

  const handleVideoClick = () => {
    navigate(`/clone-content/${clone.id}`);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="p-4">
        <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-700">
          {clone.image_preview ? (
            <img
              src={clone.image_preview}
              alt={clone.name}
              className="w-full h-full object-contain bg-gray-800"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No Preview</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <h3 className="text-xl font-bold text-white mb-4">{clone.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleVideoClick}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
            title="View videos"
          >
            <Video className="h-4 w-4" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
            title="Record new video"
          >
            <Mic className="h-4 w-4" />
            <span>Record</span>
          </button>
        </div>
      </div>
      
      {showCreateModal && (
        <CreateVideoModal
          influencerId={clone.id}
          templateId={clone.clone_id || ''}
          influencer={clone}
          onClose={() => setShowCreateModal(false)}
          isClone={true}
        />
      )}
    </div>
  );
}