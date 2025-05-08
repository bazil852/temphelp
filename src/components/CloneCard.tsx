import React from 'react';
import { Video, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateVideoModal from './CreateVideoModal';
import { CardShell } from './CardShell';

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
    <>
      <CardShell
        imgSrc={clone.image_preview}
        imgAlt={clone.name}
      >
        <h3 className="text-2xl font-bold text-white mb-6 drop-shadow-lg">
          {clone.name}
        </h3>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
              <button
                onClick={handleVideoClick}
            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border bg-white/10 hover:bg-white/20 border-white/20 group/button"
                title="View videos"
              >
            <Video className="h-5 w-5 text-white" />
            <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
              Videos
            </span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border bg-white/10 hover:bg-white/20 border-white/20 group/button"
                title="Record new video"
              >
            <Mic className="h-5 w-5 text-white" />
            <span className="absolute -top-8 scale-0 group-hover/button:scale-100 transition-transform bg-black/80 text-white text-xs py-1 px-2 rounded">
              Record
            </span>
              </button>
        </div>
      </CardShell>
      
      {showCreateModal && (
        <CreateVideoModal
          influencerId={clone.id}
          templateId={clone.clone_id || ''}
          influencer={clone}
          onClose={() => setShowCreateModal(false)}
          isClone={true}
        />
      )}
    </>
  );
};