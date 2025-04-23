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
  Upload
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
}

export default function VideoCard({ content, isSelected, onSelect, onAddCaption }: VideoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -10% 0px"
  });

  const truncatedScript = content.script ? 
    content.script.split('\n').slice(0, 2).join('\n') + 
    (content.script.split('\n').length > 2 ? '...' : '') : 
    "No script available";

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      ref={cardRef}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="bg-white/5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md p-3 flex flex-col gap-3"
    >
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm truncate">
          {content.title || "Untitled"}
        </h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(content.id)}
            className="h-4 w-4 rounded border-gray-600 text-[#c9fffc] focus:ring-[#c9fffc] focus:ring-offset-0 focus:ring-1"
          />
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/20 group">
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

      {/* Script Preview */}
      <div className="flex-1">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
            {isExpanded ? content.script : truncatedScript}
          </p>
          {content.script && content.script.split('\n').length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[#c9fffc] text-xs hover:text-[#a0fcf9] transition-colors flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        {content.status === "completed" && content.video_url ? (
          <>
            <a
              href={content.video_url}
              download
              className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 text-white"
              title="Download Video"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={() => content.video_url && onAddCaption(content.video_url)}
              className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 text-white"
              title="Add Captions"
            >
              <Subtitles className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="w-8 h-8" /> // Spacer for alignment
        )}
        <button
          className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 text-white"
          title="Edit Video"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 text-white"
          title="Delete Video"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 text-white"
          title="Upload Video"
        >
          <Upload className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 