import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Download, 
  Subtitles, 
  Edit, 
  Trash2, 
  Upload,
  FileText
} from 'lucide-react';

interface VideoDetailModalProps {
  content: {
    id: string;
    title: string;
    video_url?: string;
    status: string;
    error?: string;
    script?: string;
  };
  onClose: () => void;
  onAddCaption: (videoUrl: string) => void;
}

export default function VideoDetailModal({ content, onClose, onAddCaption }: VideoDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-7xl mx-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Left Side - Video */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{content.title}</h2>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 group">
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
                        <Play className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    Video not available
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                {content.status === "completed" && content.video_url && (
                  <>
                    <a
                      href={content.video_url}
                      download
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => content.video_url && onAddCaption(content.video_url)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      <Subtitles className="h-5 w-5" />
                      <span>Add Captions</span>
                    </button>
                  </>
                )}
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                  <Edit className="h-5 w-5" />
                  <span>Edit</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                  <Trash2 className="h-5 w-5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Right Side - Script */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[#c9fffc]" />
                <h3 className="text-lg font-semibold text-white">Script</h3>
              </div>
              <div className="bg-white/5 rounded-lg p-4 h-[calc(100%-4rem)] overflow-y-auto">
                <p className="text-gray-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {content.script || "No script available"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 