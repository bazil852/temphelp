import React, { useState } from 'react';
import { Play, Download, ExternalLink } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';

interface CompletedVideo {
  id: string;
  video_id: string;
  video_url: string;
  line_id: number;
  status: 'processing' | 'completed' | 'failed';
  influencer_name: string;
  text: string;
  created_at: string;
}

interface CompletedVideosGridProps {
  videos: CompletedVideo[];
  title?: string;
}

const CompletedVideosGrid: React.FC<CompletedVideosGridProps> = ({ 
  videos, 
  title = "Completed Videos" 
}) => {
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const completedVideos = videos.filter(video => video.status === 'completed');

  if (completedVideos.length === 0) {
    return null;
  }

  const handleVideoClick = (video: CompletedVideo) => {
    setSelectedVideo({
      url: video.video_url,
      title: `${video.influencer_name} - Line ${video.line_id}`
    });
  };

  const handleDownload = async (video: CompletedVideo) => {
    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.influencer_name}_line_${video.line_id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <div className="text-white/60 text-sm">
          {completedVideos.length} video{completedVideos.length !== 1 ? 's' : ''} ready
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedVideos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all duration-300"
          >
            {/* Video Thumbnail/Preview */}
            <div className="relative aspect-video bg-black/20">
              <video
                src={video.video_url}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleVideoClick(video)}
                  className="p-3 rounded-full bg-cyan-400 text-black hover:bg-cyan-300 transition-colors duration-200"
                >
                  <Play className="h-6 w-6" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleDownload(video)}
                  className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors duration-200"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.open(video.video_url, '_blank')}
                  className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors duration-200"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyan-400 font-medium text-sm">
                  {video.influencer_name}
                </div>
                <div className="text-white/60 text-xs">
                  Line {video.line_id}
                </div>
              </div>
              
              <p className="text-white/80 text-sm line-clamp-2">
                {video.text}
              </p>
              
              <div className="mt-3 text-white/40 text-xs">
                {new Date(video.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default CompletedVideosGrid; 