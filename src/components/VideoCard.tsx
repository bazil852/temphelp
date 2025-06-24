import React, { useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { 
  Loader2, 
  AlertCircle, 
  Download, 
  Subtitles,
  Play,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Upload,
  FileText
} from 'lucide-react';

interface VideoCardProps {
  content: {
    id: string;
    title: string;
    video_url?: string;
    status: string;
    error?: string;
    script?: string;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAddCaption: (videoUrl: string) => void;
  onOpenModal: (content: VideoCardProps['content']) => void;
}

export default function VideoCard({ content, isSelected, onSelect, onAddCaption, onOpenModal }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -10% 0px"
  });

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenModal(content);
  };

  return (
    <div
      ref={cardRef}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="bg-white/5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-white/5 transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Video Preview */}
      <div className="relative aspect-video bg-black/20 group">
        {content.status === "completed" && content.video_url ? (
          <>
            <video
              ref={videoRef}
              src={content.video_url}
              className="w-full h-full object-cover"
              loop
              muted
            />
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center"
            >
              {!isPlaying && (
                <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          </>
        ) : content.status === "generating" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-[#c9fffc]">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm">Generating...</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={24} />
              <span className="text-sm">{content.error || "Generation failed"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-white font-semibold text-sm truncate flex-1">
            {content.title || "Untitled"}
          </h3>
          <input
            type="checkbox"
            checked={isSelected}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(content.id);
            }}
            className="h-4 w-4 rounded border-gray-600 text-[#c9fffc] focus:ring-[#c9fffc] focus:ring-offset-0 focus:ring-1"
          />
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <FileText className="h-3 w-3" />
          <span className="truncate">
            {content.script?.split('\n')[0] || "No script available"}
          </span>
        </div>
      </div>
    </div>
  );
} 