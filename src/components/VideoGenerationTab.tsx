import React, { useState, useRef } from 'react';
import { useTranscript } from '../context/TranscriptContext';
import { useInfluencer } from '../context/InfluencerContext';
import { useContentStore } from '../store/contentStore';
import { Play, Video, Pencil, Loader2, AlertCircle, Volume2, Waves } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';
import Waveform from './Waveform';
import { uploadAudioToSupabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Status badge component with updated styling
type Status = 'pending' | 'processing' | 'completed' | 'failed';

const STATUS_LABEL: Record<Status, string> = {
  pending:     'Pending',
  processing:  'Processing',
  completed:   'Completed',
  failed:      'Failed',
};

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-white/10 text-gray-400',
  processing: 'bg-cyan-400 text-white',
  completed: 'bg-green-400 text-white',
  failed: 'bg-red-400 text-white',
};

const StatusBadge = ({ status = 'pending' }: { status?: Status }) => (
  <span className={`rounded-full text-xs px-3 py-1 ${STATUS_STYLES[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);


interface LineStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
  contentId?: string;
}

interface AudioGenerationStatus {
  isGenerating: boolean;
  error?: string;
}

export default function VideoGenerationTab() {
  const { lines } = useTranscript();
  const { currentUser } = useAuthStore();
  const { name1, name2, selectedInfluencer1, selectedInfluencer2 } = useInfluencer();
  const { generateVideo } = useContentStore();
  const [lineStatuses, setLineStatuses] = useState<Record<number, LineStatus>>({});
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>({});
  const [audioGenerationStatuses, setAudioGenerationStatuses] = useState<Record<number, AudioGenerationStatus>>({});
  const [isGeneratingAllAudios, setIsGeneratingAllAudios] = useState(false);

  const keepStatus = (prev: Record<number, LineStatus>, id: number): LineStatus =>
    ({ status: prev[id]?.status ?? 'pending', ...prev[id] });

  const generateAudioForLine = async (rowKey: number, script: string, influencer: any): Promise<string> => {
    if (!influencer?.voice_id) {
      throw new Error('No voice ID available for this influencer');
    }

    setAudioGenerationStatuses(prev => ({
      ...prev,
      [rowKey]: { isGenerating: true }
    }));

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${influencer.voice_id}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const publicUrl = await uploadAudioToSupabase(audioBlob);
      const localUrl = URL.createObjectURL(audioBlob);

      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          audioUrl: localUrl,
        },
      }));

      setAudioGenerationStatuses(prev => ({
        ...prev,
        [rowKey]: { isGenerating: false }
      }));
      
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
      setAudioGenerationStatuses(prev => ({
        ...prev,
        [rowKey]: { isGenerating: false, error: errorMessage }
      }));
      throw error;
    }
  };

  const generateAllAudios = async () => {
    setIsGeneratingAllAudios(true);
    const errors: { lineId: number; error: string }[] = [];

    try {
      // Create an array of promises for all audio generations
      const audioPromises = lines.map(async (line) => {
        const influencer = line.speaker === name1 ? selectedInfluencer1 : selectedInfluencer2;
        if (!influencer?.voice_id) {
          throw new Error(`No voice ID found for ${line.speaker}`);
        }

        try {
          await generateAudioForLine(line.id, line.text, influencer);
        } catch (error) {
          errors.push({
            lineId: line.id,
            error: error instanceof Error ? error.message : 'Failed to generate audio'
          });
        }
      });

      // Wait for all audio generations to complete
      await Promise.all(audioPromises);

      // If there were any errors, show them in the UI
      if (errors.length > 0) {
        console.error('Some audio generations failed:', errors);
      }
    } catch (error) {
      console.error('Failed to generate all audios:', error);
    } finally {
      setIsGeneratingAllAudios(false);
    }
  };

  const generateVideoForLine = async (rowKey: number, isPreview: boolean = false) => {
    const line = lines[rowKey];
    if (!line) return;

    const influencer = line.speaker === name1 ? selectedInfluencer1 : selectedInfluencer2;
    if (!influencer?.templateId) {
      console.error('No template ID found for influencer');
      return;
    }

    setLineStatuses(prev => ({
      ...prev,
      [rowKey]: { status: 'processing' }
    }));

    try {
      // First generate and upload the audio
      const publicAudioUrl = await generateAudioForLine(rowKey, line.text, influencer);
      
      // Get audio duration for billing
      const audio = new Audio(publicAudioUrl);
      let audioDuration = 0;
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          audioDuration = audio.duration;
          resolve(null);
        });
      });

      // Convert to minutes and round up
      const durationInMinutes = Math.ceil(audioDuration / 60);

      // Update video minutes usage
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('email', currentUser?.email)
        .single();

      if (userError) throw new Error('Failed to get user data');

      const { error: usageError } = await supabase.rpc('increment_user_video_minutes', {
        p_user_id: userData.auth_user_id,
        increment_value: durationInMinutes
      });

      if (usageError) {
        throw new Error('Failed to update video minutes usage');
      }

      // Generate video with the audio URL
      await generateVideo({
        influencerId: influencer.id,
        templateId: influencer.templateId,
        script: line.text,
        title: `${line.speaker} - Line ${rowKey}${isPreview ? ' (Preview)' : ''}`,
        audioUrl: publicAudioUrl
      });

      // Store the processing state
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: { 
          status: 'processing',
          audioUrl: publicAudioUrl
        }
      }));

      // Start polling for video completion using the influencer ID
      const pollInterval = setInterval(async () => {
        const { data: contents } = await supabase
          .from('contents')
          .select('*')
          .eq('influencer_id', influencer.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const latestContent = contents?.[0];
        
        if (latestContent?.status === 'completed') {
          clearInterval(pollInterval);
          setLineStatuses(prev => ({
            ...prev,
            [rowKey]: { 
              status: 'completed',
              videoUrl: latestContent.url,
              audioUrl: publicAudioUrl,
              contentId: latestContent.id
            }
          }));
        } else if (latestContent?.status === 'failed') {
          clearInterval(pollInterval);
          setLineStatuses(prev => ({
            ...prev,
            [rowKey]: { 
              status: 'failed',
              error: latestContent.error || 'Video generation failed',
              contentId: latestContent.id
            }
          }));
        }
      }, 5000);

      // Cleanup interval on component unmount
      return () => clearInterval(pollInterval);

    } catch (error) {
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to generate video'
        }
      }));
    }
  };

  const handlePlayClick = (rowKey: number) => {
    const video = videoRefs.current[rowKey];
    if (video) {
      if (playingStates[rowKey]) {
        video.pause();
      } else {
        video.play();
      }
      setPlayingStates(prev => ({
        ...prev,
        [rowKey]: !prev[rowKey]
      }));
    }
  };

  const generatePreview = (rowKey: number) => {
    generateVideoForLine(rowKey, true);
  };

  const generateFinalVideo = (rowKey: number) => {
    generateVideoForLine(rowKey, false);
  };

  const editLine = (rowKey: number) => {
    // TODO: Implement line editing functionality
    console.log('Editing line:', rowKey);
  };

  const generateAllVideos = async () => {
    for (const line of lines) {
      await generateVideoForLine(line.id, false);
    }
  };

  const handleAudioPlayPause = (rowKey: number, isPlaying: boolean) => {
    console.log(`Line ${rowKey} audio ${isPlaying ? 'playing' : 'paused'}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar with Buttons */}
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={generateAllAudios}
            disabled={isGeneratingAllAudios}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingAllAudios ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Audios...
              </>
            ) : (
              <>
                <Waves className="h-4 w-4" />
                Generate All Audios
              </>
            )}
          </button>
          <button
            onClick={generateAllVideos}
            disabled={isGeneratingAllAudios}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <Video className="h-4 w-4" />
            Generate All Videos
          </button>
        </div>
      </div>

      {/* Line List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {lines.map((line, idx) => {
          const rowKey = idx;
          const statusEntry = lineStatuses[rowKey];
          const status = statusEntry && statusEntry.status ? statusEntry : { status: 'pending' };
          const audioStatus = audioGenerationStatuses[rowKey];
          
          return (
            <div
              key={rowKey}
              className="relative group bg-white/5 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              {/* Header with Speaker and Status */}
              <div className="flex items-center justify-between mb-4">
                <div className={`text-lg font-semibold ${line.speaker === name1 ? 'text-blue-400' : 'text-purple-400'}`}>
                  {line.speaker}:
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status.status} />
                  {/* Action Buttons */}
                  {status.status !== 'processing' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => generateAudioForLine(rowKey, line.text, line.speaker === name1 ? selectedInfluencer1 : selectedInfluencer2)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                        title="Generate Preview"
                        disabled={status.status === 'processing'}
                      >
                        <Play className="h-4 w-4 text-white/70 hover:text-white" />
                      </button>
                      <button
                        onClick={() => generateFinalVideo(rowKey)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                        title="Generate Final Video"
                        disabled={status.status === 'processing'}
                      >
                        <Video className="h-4 w-4 text-white/70 hover:text-white" />
                      </button>
                      <button
                        onClick={() => editLine(rowKey)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                        title="Edit"
                        disabled={status.status === 'processing'}
                      >
                        <Pencil className="h-4 w-4 text-white/70 hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Script and Waveform */}
                <div className="flex flex-col gap-4">
                  <div className="text-white/90 bg-black/20 rounded-lg p-4 min-h-[120px]">
                    {line.text}
                  </div>
                  {/* Audio Waveform */}
                  <div className="bg-black/20 rounded-lg p-4">
                    {status.audioUrl ? (
                      <Waveform 
                        audioUrl={status.audioUrl}
                        onPlayPause={(isPlaying) => handleAudioPlayPause(rowKey, isPlaying)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[48px] text-white/40 text-sm">
                        {audioStatus?.isGenerating ? (
                          <div className="flex items-center gap-2 text-cyan-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating audio...</span>
                          </div>
                        ) : audioStatus?.error ? (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>{audioStatus.error}</span>
                          </div>
                        ) : (
                          <span>Audio waveform will appear here</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
                  {status.status === 'completed' && status.videoUrl ? (
                    <>
                      <video
                        ref={el => videoRefs.current[rowKey] = el}
                        src={status.videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        onClick={() => setSelectedVideo({ url: status.videoUrl!, title: `${line.speaker} - Line ${rowKey}` })}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClick(rowKey);
                        }}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center"
                      >
                        {!playingStates[rowKey] && (
                          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                      </button>
                    </>
                  ) : status.status === 'processing' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm">Generating...</span>
                      </div>
                    </div>
                  ) : status.status === 'failed' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={20} />
                        <span className="text-sm">{status.error || "Failed"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                      Video preview
                    </div>
                  )}
                </div>
              </div>

              {/* Error Messages */}
              {(status.error || audioStatus?.error) && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{status.error || audioStatus?.error}</span>
                </div>
              )}
            </div>
          );
        })}
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
} 