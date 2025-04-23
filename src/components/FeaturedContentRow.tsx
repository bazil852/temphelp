import React from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import VideoPlayerModal from './VideoPlayerModal';

interface ContentItem {
  id: string;
  type: 'video' | 'influencer';
  title: string;
  thumbnail: string;
  duration?: string;
  avatar?: string;
  status?: string;
}

interface FeaturedContentRowProps {
  title: string;
  items: ContentItem[];
  type: 'video' | 'influencer';
}

export default function FeaturedContentRow({ title, items, type }: FeaturedContentRowProps) {
  const [selectedVideo, setSelectedVideo] = React.useState<ContentItem | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = React.useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
      
      {/* Content container with padding for arrows */}
      <div className="relative px-8">
        {/* Scroll buttons */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showArrows ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showArrows ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {/* Content container */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          onMouseEnter={() => setShowArrows(true)}
          onMouseLeave={() => setShowArrows(false)}
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05 }}
              className="flex-none"
            >
              <div
                className="relative w-[280px] cursor-pointer group"
                onClick={() => type === 'video' && setSelectedVideo(item)}
              >
                {type === 'video' ? (
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <video
                      src={item.thumbnail}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      loop
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  {type === 'video' && item.duration && (
                    <span className="text-sm text-gray-300">{item.duration}</span>
                  )}
                  {type === 'influencer' && item.status && (
                    <span className="text-sm text-gray-300">{item.status}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          videoUrl={selectedVideo.thumbnail}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
} 