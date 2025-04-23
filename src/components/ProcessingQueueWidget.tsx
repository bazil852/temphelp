import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { useInfluencerStore } from '../store/influencerStore';

interface ProcessingItem {
  id: string;
  name: string;
  progress: number;
  time: string;
  influencerName: string;
}

export default function ProcessingQueueWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingItems, setProcessingItems] = useState<ProcessingItem[]>([]);
  const { contents, fetchContents, refreshContents } = useContentStore();
  const { influencers } = useInfluencerStore();

  useEffect(() => {
    // Fetch contents for all influencers
    const fetchAllContents = async () => {
      for (const influencer of influencers) {
        try {
          await fetchContents(influencer.id);
        } catch (error) {
          console.error(`Error fetching contents for influencer ${influencer.id}:`, error);
        }
      }
    };

    if (influencers.length > 0) {
      fetchAllContents();
    }

    // Set up polling for content status updates
    const interval = setInterval(() => {
      influencers.forEach(influencer => {
        refreshContents(influencer.id)
          .catch(error => console.error(`Error refreshing contents for influencer ${influencer.id}:`, error));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [influencers, fetchContents, refreshContents]);

  useEffect(() => {
    // Update processing items whenever contents change
    const items: ProcessingItem[] = [];
    Object.entries(contents).forEach(([influencerId, influencerContents]) => {
      const influencer = influencers.find(inf => inf.id === influencerId);
      if (!influencer) return;

      influencerContents
        .filter(content => content.status === 'generating')
        .forEach(content => {
          items.push({
            id: content.id,
            name: content.title,
            progress: 50, // Default progress, can be updated based on actual progress if available
            time: new Date(content.createdAt).toLocaleTimeString(),
            influencerName: influencer.name
          });
        });
    });

    setProcessingItems(items);
  }, [contents, influencers]);

  return (
    <motion.div
      layout
      initial={{ borderRadius: 16 }}
      animate={{ borderRadius: isExpanded ? 24 : 16 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 shadow-md cursor-pointer ${
        isExpanded ? 'min-h-[280px] flex-[2]' : 'w-[160px] h-[160px] flex-none'
      }`}
      onClick={() => setIsExpanded(true)}
    >
      <div className="relative h-full">
        {/* Default State */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              <div className="text-center">
                <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                <span className="text-white text-sm font-medium">Processing Queue</span>
                <span className="text-cyan-500 text-xs block mt-1">{processingItems.length} Items</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded State */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Processing Queue
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <AnimatePresence>
                {processingItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 last:mb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-gray-300 text-sm">{item.name}</span>
                        <span className="text-gray-500 text-xs block">{item.influencerName}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{item.time}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-cyan-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 