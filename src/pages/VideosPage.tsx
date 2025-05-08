import React, { useState, useEffect } from 'react';
import { useContentStore } from '../store/contentStore';
import { useInfluencerStore } from '../store/influencerStore';
import { useAuthStore } from '../store/authStore';
import { 
  Filter, 
  Search, 
  Loader2, 
  AlertCircle,
  Video,
  Trash2,
  Download,
  Subtitles
} from 'lucide-react';
import VideoCard from '../components/VideoCard';
import VideoPlayerModal from '../components/VideoPlayerModal';
import VideoDetailModal from '../components/VideoDetailModal';
import type { VideoCardProps } from '../components/VideoCard';

export default function VideosPage() {
  const { currentUser } = useAuthStore();
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const { contents, fetchContents, refreshContents, deleteContents } = useContentStore();
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'generating' | 'failed'>('all');
  const [influencerFilter, setInfluencerFilter] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [selectedContent, setSelectedContent] = useState<VideoCardProps['content'] | null>(null);

  useEffect(() => {
    fetchInfluencers().then(() => {
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error fetching influencers:', error);
      setIsLoading(false);
    });
  }, [fetchInfluencers]);

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

  const handleDeleteSelected = async () => {
    if (selectedContents.length === 0) return;
    try {
      // Group contents by influencer ID
      const contentsByInfluencer = selectedContents.reduce((acc, contentId) => {
        for (const [influencerId, influencerContents] of Object.entries(contents)) {
          const content = influencerContents.find(c => c.id === contentId);
          if (content) {
            if (!acc[influencerId]) acc[influencerId] = [];
            acc[influencerId].push(contentId);
            break;
          }
        }
        return acc;
      }, {} as Record<string, string[]>);

      // Delete contents for each influencer
      await Promise.all(
        Object.entries(contentsByInfluencer).map(([influencerId, contentIds]) =>
          deleteContents(influencerId, contentIds)
        )
      );
      setSelectedContents([]);
    } catch (error) {
      console.error("Failed to delete contents:", error);
    }
  };

  const handleAddCaption = (videoUrl: string) => {
    const content = Object.values(contents)
      .flat()
      .find(c => c.video_url === videoUrl);
    
    if (content) {
      setSelectedVideo({
        url: videoUrl,
        title: content.title
      });
    }
  };

  const toggleSelectAll = () => {
    const allContents = Object.values(contents).flat();
    if (selectedContents.length === allContents.length) {
      setSelectedContents([]);
    } else {
      setSelectedContents(allContents.map(content => content.id));
    }
  };

  // Get all contents from all influencers
  const allContents = Object.values(contents).flat();

  // Filter contents based on search query and filters
  const filteredContents = allContents.filter(content => {
    const influencer = influencers.find(inf => inf.id === content.influencerId);
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesInfluencer = influencerFilter === 'all' || content.influencerId === influencerFilter;
    return matchesSearch && matchesStatus && matchesInfluencer;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Videos</h1>
        <div className="flex gap-4">
          {selectedContents.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="generating">Generating</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={influencerFilter}
          onChange={(e) => setInfluencerFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
        >
          <option value="all">All Influencers</option>
          {influencers.map(influencer => (
            <option key={influencer.id} value={influencer.id}>
              {influencer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredContents.map(content => {
          const influencer = influencers.find(inf => inf.id === content.influencerId);
          return (
            <VideoCard
              key={content.id}
              content={content}
              isSelected={selectedContents.includes(content.id)}
              onSelect={() => {
                setSelectedContents(prev =>
                  prev.includes(content.id)
                    ? prev.filter(id => id !== content.id)
                    : [...prev, content.id]
                );
              }}
              onAddCaption={handleAddCaption}
              onOpenModal={setSelectedContent}
            />
          );
        })}
      </div>

      {filteredContents.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No videos found</h3>
          <p className="text-gray-400">
            {searchQuery || statusFilter !== 'all' || influencerFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first video to get started'}
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Video Detail Modal */}
      {selectedContent && (
        <VideoDetailModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onAddCaption={handleAddCaption}
        />
      )}
    </div>
  );
} 