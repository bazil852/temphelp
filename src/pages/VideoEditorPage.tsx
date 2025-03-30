import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useShotstack } from '../components/Shotstack/ShotstackContext';
import StudioEditor from '../components/Shotstack/StudioEditor';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  video_url: string;
}

export default function VideoEditorPage() {
  const { currentUser } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const shotstack = useShotstack();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('id, title, video_url')
        .eq('status', 'completed')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (videoUrl: string) => {
    setSelectedVideo(videoUrl);

    const newTemplate = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl
                },
                start: 0,
                length: 10 // adjust as needed
              }
            ]
          }
        ]
      }
    };

    setTemplate(newTemplate);
  };

  const style = {
    logo: {
      url: 'https://your-logo-url.svg'
    },
    stylesheet: 'https://shotstack-studio-sdk.s3.amazonaws.com/styles/sdk-custom.css'
  };

  const handleUpdateEvent = (event: any) => {
    console.log('Editor updated:', event);
  };

  const handleMetadataEvent = (event: any) => {
    console.log('Editor metadata:', event);
  };

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-[#c9fffc] mb-6">Video Editor</h1>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Video List */}
        <div className="w-64 bg-[#1a1a1a] rounded-xl p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Your Videos</h2>
          {loading ? (
            <div className="text-gray-400">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-gray-400">No videos found</div>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video.video_url)}
                  className={`w-full p-2 rounded-lg text-left transition-colors ${
                    selectedVideo === video.video_url
                      ? 'bg-[#c9fffc] text-black'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{video.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl overflow-hidden relative">
          {!template ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#c9fffc]" />
            </div>
          ) : (
            <StudioEditor
              owner="video-editor-client"
              interactive={true}
              timeline={true}
              sidepanel={true}
              controls={true}
              settings={true}
              style={style}
              template={template}
              onUpdateEvent={handleUpdateEvent}
              onMetadataEvent={handleMetadataEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
