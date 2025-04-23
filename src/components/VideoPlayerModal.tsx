import React from 'react';
import { X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerModalProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

export default function VideoPlayerModal({ videoUrl, title, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl mx-4 bg-black rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video container */}
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              playsInline
              controls
              autoPlay
            />
          </div>

          {/* Title */}
          <div className="p-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 