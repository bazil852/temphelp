import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Download, 
  Subtitles, 
  Edit, 
  Trash2, 
  Upload,
  FileText,
  Volume2,
  VolumeX
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
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize video when it's loaded
  useEffect(() => {
    if (videoRef.current) {
      // Set initial volume state
      videoRef.current.muted = false;
      
      // Add event listeners for video state changes
      const videoElement = videoRef.current;
      
      const playHandler = () => setIsPlaying(true);
      const pauseHandler = () => setIsPlaying(false);
      const volumeChangeHandler = () => setIsMuted(videoElement.muted);
      
      videoElement.addEventListener('play', playHandler);
      videoElement.addEventListener('pause', pauseHandler);
      videoElement.addEventListener('volumechange', volumeChangeHandler);
      
      return () => {
        // Clean up event listeners
        videoElement.removeEventListener('play', playHandler);
        videoElement.removeEventListener('pause', pauseHandler);
        videoElement.removeEventListener('volumechange', volumeChangeHandler);
      };
    }
  }, [videoRef.current]);

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

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, videoUrl: string) => {
    e.preventDefault();
    // Create a direct download link
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${content.title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    />
                    <div className="absolute inset-0 flex flex-col">
                      <button
                        onClick={handlePlayClick}
                        className="flex-grow bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center"
                      >
                        {!isPlaying && (
                          <Play className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                      </button>
                      {/* Volume control */}
                      <div className="relative p-3 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button
                          onClick={handleMuteToggle}
                          className="rounded-full p-2 bg-white/20 hover:bg-white/30 transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="h-5 w-5 text-white" />
                          ) : (
                            <Volume2 className="h-5 w-5 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
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
                      onClick={(e) => content.video_url && handleDownload(e, content.video_url)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>Download</span>
                    </a>
                    {/* <button
                      onClick={() => content.video_url && onAddCaption(content.video_url)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      <Subtitles className="h-5 w-5" />
                      <span>Add Captions</span>
                    </button> */}
                  </>
                )}
                {/* <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                  <Edit className="h-5 w-5" />
                  <span>Edit</span>
                </button> */}
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