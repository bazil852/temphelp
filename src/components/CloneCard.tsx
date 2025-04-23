import React from 'react';
import { useInView } from 'framer-motion';
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
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -10% 0px"
  });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleVideoClick = () => {
    navigate(`/clone-content/${clone.id}`);
  };

  return (
    <>
      <div
        ref={cardRef}
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all duration-200"
      >
        <div 
          className="group relative overflow-hidden rounded-xl aspect-[2/3] bg-[#0D1117]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
          }}
        >
          {/* Full-bleed Background Image */}
          {clone.image_preview ? (
            <img
              src={clone.image_preview}
              alt={clone.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No Preview</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <h3 className="text-xl font-bold text-white mb-4">{clone.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={handleVideoClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-200"
                title="View videos"
              >
                <Video className="h-4 w-4" />
                <span>Videos</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-200"
                title="Record new video"
              >
                <Mic className="h-4 w-4" />
                <span>Record</span>
              </button>
            </div>
          </div>
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
    </>
  );
}