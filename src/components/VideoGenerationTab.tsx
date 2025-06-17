import React, { useState, useRef, useEffect } from 'react';
import { useTranscript } from '../context/TranscriptContext';
import { useInfluencer } from '../context/InfluencerContext';
import { Play, Video, Pencil, Loader2, AlertCircle, Volume2, Waves } from 'lucide-react';
import VideoPlayerModal from './VideoPlayerModal';
import Waveform from './Waveform';
import VideoProgressBar from './VideoProgressBar';
import CompletedVideosGrid from './CompletedVideosGrid';
import { uploadAudioToSupabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useVideoGeneration } from '../hooks/useVideoGeneration';

// Status badge component with updated styling
type Status = 'pending' | 'processing' | 'completed' | 'failed' | 'generating' | 'error';

const STATUS_LABEL: Record<Status, string> = {
  pending:     'Pending',
  processing:  'Processing',
  completed:   'Completed',
  failed:      'Failed',
  generating:  'Generating',
  error:       'Error',
};

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-white/10 text-gray-400',
  processing: 'bg-cyan-400 text-white',
  completed: 'bg-green-400 text-white',
  failed: 'bg-red-400 text-white',
  generating: 'bg-blue-400 text-white',
  error: 'bg-red-400 text-white',
};

const StatusBadge = ({ status = 'pending' }: { status?: Status }) => (
  <span className={`rounded-full text-xs px-3 py-1 ${STATUS_STYLES[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);


interface LineStatus {
  status: Status;
  audioUrl?: string; // Local blob URL for playback
  backendAudioUrl?: string; // Backend URL for video generation
  videoUrl?: string;
  error?: string;
}

interface AudioGenerationStatus {
  isGenerating: boolean;
  error?: string;
}

interface VideoGenerationParams {
  lineId: number;
  isPreview: boolean;
  script: string;
  influencerId: string;
}

interface VideoGenerationResponse {
  success: boolean;
  error?: string;
  videoUrl?: string;
}

export default function VideoGenerationTab() {
  const { lines } = useTranscript();
  const { currentUser } = useAuthStore();
  const { name1, name2, selectedInfluencer1, selectedInfluencer2 } = useInfluencer();
  const [lineStatuses, setLineStatuses] = useState<Record<number, LineStatus>>({});
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>({});
  const [audioGenerationStatuses, setAudioGenerationStatuses] = useState<Record<number, AudioGenerationStatus>>({});
  const [isGeneratingAllAudios, setIsGeneratingAllAudios] = useState(false);
  
  // Video generation hook
  const {
    startVideoGeneration,
    progress,
    completedVideos,
    status: videoGenerationStatus,
    error: videoGenerationError,
    resetGeneration,
    cleanup
  } = useVideoGeneration();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const keepStatus = (prev: Record<number, LineStatus>, id: number): LineStatus => ({
    status: prev[id]?.status ?? 'pending',
    audioUrl: prev[id]?.audioUrl,
    backendAudioUrl: prev[id]?.backendAudioUrl,
    videoUrl: prev[id]?.videoUrl,
    error: prev[id]?.error
  });

  const generateAudioForLine = async (rowKey: number, script: string, influencer: any): Promise<string> => {
    console.log('generateAudioForLine called with:', { rowKey, script, influencer });
    
    if (!influencer?.id) {
      throw new Error('No influencer ID available');
    }

    setAudioGenerationStatuses(prev => ({
      ...prev,
      [rowKey]: { isGenerating: true }
    }));

    setLineStatuses(prev => ({
      ...prev,
      [rowKey]: {
        ...keepStatus(prev, rowKey),
        status: 'generating'
      }
    }));

    try {
      const requestBody = {
        text: script,
        influencerId: influencer.id,
        lineId: rowKey
      };
      
      console.log('Sending audio generation request:', requestBody);
      console.log('Request body stringified:', JSON.stringify(requestBody));
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate audio');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Backend failed to generate audio');
      }

      // Create a local URL for the audio
      const audioResponse = await fetch(data.audioUrl);
      const audioBlob = await audioResponse.blob();
      const localUrl = URL.createObjectURL(audioBlob);

      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          status: 'completed',
          audioUrl: localUrl,
        },
      }));

      setAudioGenerationStatuses(prev => ({
        ...prev,
        [rowKey]: { isGenerating: false }
      }));
      
      // Store the backend audio URL for video generation
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          backendAudioUrl: data.audioUrl // Store backend URL separately
        }
      }));
      
      return data.audioUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          status: 'error',
          error: errorMessage
        }
      }));
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
      // Prepare the request body
      const requestBody = {
        lines: lines.map(line => ({
          speaker: line.speaker,
          text: line.text,
          line_id: line.id
        })),
        influencerMapping: {
          [name1]: selectedInfluencer1?.id,
          [name2]: selectedInfluencer2?.id
        }
      };

      // Call the batch audio generation endpoint
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/generate-all-audios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate all audios');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Backend failed to generate all audios');
      }

      // Process each generated audio file
      for (const audioFile of data.audioFiles) {
        try {
          // Create a local URL for the audio
          const audioResponse = await fetch(audioFile.audioUrl);
          const audioBlob = await audioResponse.blob();
          const localUrl = URL.createObjectURL(audioBlob);
          
          console.log(`Created audio URL for line ${audioFile.lineId}:`, localUrl);
          console.log(`Audio blob size:`, audioBlob.size);

          setLineStatuses(prev => ({
            ...prev,
            [audioFile.lineId]: {
              ...keepStatus(prev, audioFile.lineId),
              status: 'completed',
              audioUrl: localUrl,
              backendAudioUrl: audioFile.audioUrl,
            },
          }));
        } catch (error) {
          console.error(`Failed to process audio for line ${audioFile.lineId}:`, error);
          errors.push({
            lineId: audioFile.lineId,
            error: error instanceof Error ? error.message : 'Failed to process audio file'
          });
        }
      }

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

  const generateVideoAPI = async (params: VideoGenerationParams): Promise<VideoGenerationResponse> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to generate video'
      };
    }

    const data = await response.json();
    return {
      success: true,
      videoUrl: data.videoUrl
    };
  };

  const generateVideoForLine = async (rowKey: number, isPreview: boolean) => {
    const line = lines.find(l => l.id === rowKey);
    if (!line) return;

    const influencerId = line.speaker === name1 ? selectedInfluencer1?.id : selectedInfluencer2?.id;
    if (!influencerId) {
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          status: 'error',
          error: 'No influencer ID found'
        }
      }));
      return;
    }

    setLineStatuses(prev => ({
      ...prev,
      [rowKey]: {
        ...keepStatus(prev, rowKey),
        status: 'generating'
      }
    }));

    try {
          const response = await generateVideoAPI({
      lineId: rowKey,
      isPreview,
      script: line.text,
      influencerId
    });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate video');
      }

      if (!response.videoUrl) {
        throw new Error('No video URL returned');
      }

      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          status: 'completed',
          videoUrl: response.videoUrl
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      setLineStatuses(prev => ({
        ...prev,
        [rowKey]: {
          ...keepStatus(prev, rowKey),
          status: 'error',
          error: errorMessage
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
    // Get lines that have audio generated
    const linesWithAudio = lines.filter(line => {
      const status = lineStatuses[line.id];
      return status?.backendAudioUrl && status.status === 'completed';
    }).map(line => {
      const status = lineStatuses[line.id];
      return {
        text: line.text,
        audioUrl: status?.backendAudioUrl || '',
        speaker: line.speaker,
        lineId: line.id
      };
    });

    if (linesWithAudio.length === 0) {
      alert('Please generate audio for all lines first before creating videos.');
      return;
    }

    // Prepare influencer mapping
    const influencerMapping = {
      [name1]: selectedInfluencer1?.id || '',
      [name2]: selectedInfluencer2?.id || ''
    };

    // Start video generation
    const title = `Podcast Videos - ${new Date().toLocaleDateString()}`;
    await startVideoGeneration(linesWithAudio, influencerMapping, title);
  };

  const handleAudioPlayPause = (rowKey: number, isPlaying: boolean) => {
    console.log(`Line ${rowKey} audio ${isPlaying ? 'playing' : 'paused'}`);
    
    // Debug: Test if the audio URL is valid
    const status = lineStatuses[rowKey];
    if (status?.audioUrl && !isPlaying) {
      console.log(`Testing audio URL for line ${rowKey}:`, status.audioUrl);
      const testAudio = new Audio(status.audioUrl);
      testAudio.addEventListener('canplay', () => {
        console.log(`Audio URL for line ${rowKey} is valid and can play`);
      });
      testAudio.addEventListener('error', (e) => {
        console.error(`Audio URL for line ${rowKey} failed to load:`, e);
      });
    }
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
            disabled={isGeneratingAllAudios || videoGenerationStatus === 'processing'}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <Video className="h-4 w-4" />
            Generate All Videos
          </button>
          {videoGenerationStatus !== 'idle' && (
            <button
              onClick={resetGeneration}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Video Generation Progress */}
      <VideoProgressBar
        completed={progress.completed}
        total={progress.total}
        status={videoGenerationStatus}
        error={videoGenerationError}
      />

      {/* Completed Videos Grid */}
      {completedVideos.length > 0 && (
        <CompletedVideosGrid
          videos={completedVideos}
          title="Generated Videos"
        />
      )}

      {/* Line List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {lines.map((line, idx) => {
          const rowKey = line.id;
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
                        onClick={() => {
                          const influencer = line.speaker === name1 ? selectedInfluencer1 : selectedInfluencer2;
                          if (influencer) {
                            generateAudioForLine(rowKey, line.text, influencer);
                          } else {
                            console.error('No influencer selected for', line.speaker);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                        title="Generate Audio"
                        disabled={status.status === 'processing'}
                      >
                        <Volume2 className="h-4 w-4 text-white/70 hover:text-white" />
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