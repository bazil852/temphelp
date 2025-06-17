import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader2, Save, Download, Play, Check, AlertCircle, Scissors, Plus, Trash2, RotateCcw, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Basic video model from database
interface Video {
  id: string;
  title: string;
  video_url: string;
  duration?: number;
  thumbnail_url?: string;
}

// Alert notification model
interface Alert {
  type: 'success' | 'error' | 'info';
  message: string;
}

// Clip type represents a segment of video in the timeline
interface Clip {
  id: string;
  videoId: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  startTime: number; // Start time in the source video (seconds)
  endTime: number;   // End time in the source video (seconds)
  duration: number;  // Duration of this clip (seconds)
  position: number;  // Position in the timeline (seconds)
  volume: number;    // Volume level 0-1
  muted: boolean;    // Whether audio is muted
  selected: boolean; // Whether clip is currently selected
  trimming: boolean; // Whether clip is currently being trimmed
}

// Timeline track - can contain multiple clips
interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  clips: Clip[];
  name: string;
}

// Project represents the entire editing session
interface Project {
  id: string;
  title: string;
  duration: number;
  tracks: Track[];
  videoWidth: number;
  videoHeight: number;
  framerate: number;
}

// Position on timeline for drag operations
type TimelinePosition = {
  x: number;
  time: number;
};

// Video edit state for preview
interface VideoEditState {
  playing: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}

export default function VideoEditorPage() {
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  
  // References for video player and timeline
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Custom video editor state
  const [project, setProject] = useState<Project | null>(null);
  const [editState, setEditState] = useState<VideoEditState>({
    playing: false,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1
  });
  
  // Drag state for timeline operations
  const [dragState, setDragState] = useState({
    isDragging: false,
    clipId: '',
    startPosition: { x: 0, time: 0 },
    currentPosition: { x: 0, time: 0 }
  });

  useEffect(() => {
    fetchVideos();
    
    // Clean up studio editor on unmount
    return () => {
      const editorElement = document.getElementById('studio-sdk-editor');
      if (editorElement) {
        while (editorElement.firstChild) {
          editorElement.removeChild(editorElement.firstChild);
        }
      }
    };
  }, []);

  const fetchVideos = async () => {
    try {
      // Force console log to see the videos being loaded
      console.log('Fetching videos...');
      
      // Add mock data for development purposes
      const mockVideos = [
        {
          id: '1',
          title: 'Product Introduction',
          video_url: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/examples/stock-footage/pexels-drone.mp4',
          duration: 30,
          thumbnail_url: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        },
        {
          id: '2',
          title: 'Customer Testimonial',
          video_url: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/examples/stock-footage/pexels-business-meeting.mp4',
          duration: 24,
          thumbnail_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        },
        {
          id: '3',
          title: 'Product Demo',
          video_url: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/examples/stock-footage/pexels-gadgets.mp4',
          duration: 18,
          thumbnail_url: 'https://images.pexels.com/photos/3178938/pexels-photo-3178938.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        }
      ];
      
      // Try to get data from Supabase first
      const { data, error } = await supabase
        .from('contents')
        .select('id, title, video_url, duration, thumbnail_url')
        .eq('status', 'completed')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      // If there's an error or no data, use the mock data
      if (error || !data || data.length === 0) {
        console.log('Using mock video data');
        setVideos(mockVideos);
      } else {
        setVideos(data);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      
      // Fallback to mock data in case of any error
      const mockVideos = [
        {
          id: '1',
          title: 'Fallback Video 1',
          video_url: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/examples/stock-footage/pexels-drone.mp4',
          duration: 30,
          thumbnail_url: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        },
        {
          id: '2',
          title: 'Fallback Video 2',
          video_url: 'https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/examples/stock-footage/pexels-business-meeting.mp4',
          duration: 24,
          thumbnail_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
        }
      ];
      setVideos(mockVideos);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setSelectedVideoId(video.id);
    setEditedTitle(video.title);
    
    // Reset alerts and states
    setAlert(null);
    setIsSaving(false);
    setIsRendering(false);
    
    // Create a new project with the selected video
    const defaultDuration = video.duration || 30;
    const videoTrack: Track = {
      id: uuidv4(),
      type: 'video',
      name: 'Video Track',
      clips: [
        {
          id: uuidv4(),
          videoId: video.id,
          sourceUrl: video.video_url,
          thumbnailUrl: video.thumbnail_url,
          startTime: 0,
          endTime: defaultDuration,
          duration: defaultDuration,
          position: 0,
          volume: 1,
          muted: false,
          selected: false,
          trimming: false
        }
      ]
    };
    
    const audioTrack: Track = {
      id: uuidv4(),
      type: 'audio',
      name: 'Audio Track',
      clips: []
    };
    
    const newProject: Project = {
      id: uuidv4(),
      title: video.title,
      duration: defaultDuration,
      tracks: [videoTrack, audioTrack],
      videoWidth: 1920,
      videoHeight: 1080,
      framerate: 30
    };
    
    setProject(newProject);
    
    // Reset playback state
    setEditState({
      playing: false,
      currentTime: 0,
      volume: 1,
      muted: false,
      playbackRate: 1
    });
    
    // Load the video into the player
    if (videoPlayerRef.current) {
      videoPlayerRef.current.src = video.video_url;
      videoPlayerRef.current.load();
    }
  };

  // Timeline dimensions and scale
  const TIMELINE_SCALE = 100; // pixels per second
  
  // Format seconds to MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle playback controls
  const handlePlayPause = () => {
    if (!videoPlayerRef.current) return;
    
    const newPlaying = !editState.playing;
    setEditState({ ...editState, playing: newPlaying });
    
    if (newPlaying) {
      videoPlayerRef.current.play();
    } else {
      videoPlayerRef.current.pause();
    }
  };
  
  // Seek to a specific time in the video
  const handleSeek = (time: number) => {
    if (!videoPlayerRef.current || !project) return;
    
    // Ensure time is within project bounds
    const clampedTime = Math.max(0, Math.min(time, project.duration));
    
    videoPlayerRef.current.currentTime = clampedTime;
    setEditState({ ...editState, currentTime: clampedTime });
  };
  
  // Handle volume changes
  const handleVolumeChange = (volume: number) => {
    if (!videoPlayerRef.current) return;
    
    const newVolume = Math.max(0, Math.min(volume, 1));
    videoPlayerRef.current.volume = newVolume;
    setEditState({ ...editState, volume: newVolume });
  };
  
  // Toggle mute
  const handleMuteToggle = () => {
    if (!videoPlayerRef.current) return;
    
    const newMuted = !editState.muted;
    videoPlayerRef.current.muted = newMuted;
    setEditState({ ...editState, muted: newMuted });
  };
  
  // Update time during playback
  const handleTimeUpdate = () => {
    if (!videoPlayerRef.current) return;
    
    setEditState(prev => ({
      ...prev,
      currentTime: videoPlayerRef.current?.currentTime || 0
    }));
  };
  
  // Timeline interaction handlers
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !project) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = clickX / TIMELINE_SCALE;
    
    // Seek to the clicked time
    handleSeek(clickTime);
  };
  
  // Start dragging a clip
  const handleClipDragStart = (e: React.MouseEvent<HTMLDivElement>, clipId: string) => {
    if (!timelineRef.current || !project) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startTime = startX / TIMELINE_SCALE;
    
    setDragState({
      isDragging: true,
      clipId,
      startPosition: { x: startX, time: startTime },
      currentPosition: { x: startX, time: startTime }
    });
    
    // Mark the clip as selected
    const updatedTracks = project.tracks.map(track => {
      return {
        ...track,
        clips: track.clips.map(clip => ({
          ...clip,
          selected: clip.id === clipId
        }))
      };
    });
    
    setProject({ ...project, tracks: updatedTracks });
    
    // Add event listeners for drag and drop
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse movement during drag
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!timelineRef.current || !dragState.isDragging || !project) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentTime = Math.max(0, currentX / TIMELINE_SCALE);
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x: currentX, time: currentTime }
    }));
    
    // Update clip position in real-time
    const timeDiff = currentTime - dragState.startPosition.time;
    
    const updatedTracks = project.tracks.map(track => {
      return {
        ...track,
        clips: track.clips.map(clip => {
          if (clip.id === dragState.clipId) {
            // Calculate new position, ensuring it doesn't go negative
            const newPosition = Math.max(0, clip.position + timeDiff);
            return { ...clip, position: newPosition };
          }
          return clip;
        })
      };
    });
    
    setProject({ ...project, tracks: updatedTracks });
  };
  
  // End dragging
  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Save the current edit session
  const handleSaveEdit = async () => {
    if (!selectedVideo || !project) {
      setAlert({
        type: 'error',
        message: 'No edits to save'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save the project to the database
      const { error } = await supabase
        .from('video_edits')
        .upsert([
          {
            id: selectedVideoId || uuidv4(),
            video_id: selectedVideo.id,
            title: editedTitle || selectedVideo.title,
            project: project, // Save entire project structure
            user_id: currentUser?.id,
            updated_at: new Date().toISOString()
          }
        ]);
        
      if (error) throw error;
      
      setAlert({
        type: 'success',
        message: 'Edits saved successfully'
      });
    } catch (err) {
      console.error('Error saving edits:', err);
      setAlert({
        type: 'error',
        message: 'Failed to save edits'
      });
    } finally {
      setIsSaving(false);
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert(null), 3000);
    }
  };
  
  // Clip operations
  const handleAddClip = () => {
    if (!project || !selectedVideo) return;
    
    // Add a new clip to the video track
    const videoTrack = project.tracks.find(t => t.type === 'video');
    if (!videoTrack) return;
    
    const defaultDuration = selectedVideo.duration || 30;
    const lastClip = videoTrack.clips[videoTrack.clips.length - 1];
    const position = lastClip ? lastClip.position + lastClip.duration : 0;
    
    const newClip: Clip = {
      id: uuidv4(),
      videoId: selectedVideo.id,
      sourceUrl: selectedVideo.video_url,
      thumbnailUrl: selectedVideo.thumbnail_url,
      startTime: 0,
      endTime: defaultDuration,
      duration: defaultDuration,
      position: position,
      volume: 1,
      muted: false,
      selected: false,
      trimming: false
    };
    
    const updatedTracks = project.tracks.map(track => {
      if (track.id === videoTrack.id) {
        return {
          ...track,
          clips: [...track.clips, newClip]
        };
      }
      return track;
    });
    
    // Update project duration if needed
    const newDuration = Math.max(
      project.duration,
      position + defaultDuration
    );
    
    setProject({
      ...project,
      tracks: updatedTracks,
      duration: newDuration
    });
  };
  
  const handleDeleteClip = (clipId: string) => {
    if (!project) return;
    
    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.id !== clipId)
    }));
    
    // Recalculate project duration
    let maxDuration = 0;
    updatedTracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEndTime = clip.position + clip.duration;
        maxDuration = Math.max(maxDuration, clipEndTime);
      });
    });
    
    setProject({
      ...project,
      tracks: updatedTracks,
      duration: maxDuration
    });
  };
  
  const handleTrimClip = (clipId: string, startTime: number, endTime: number) => {
    if (!project) return;
    
    const updatedTracks = project.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        if (clip.id === clipId) {
          const newDuration = endTime - startTime;
          return {
            ...clip,
            startTime,
            endTime,
            duration: newDuration
          };
        }
        return clip;
      })
    }));
    
    // Recalculate project duration
    let maxDuration = 0;
    updatedTracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEndTime = clip.position + clip.duration;
        maxDuration = Math.max(maxDuration, clipEndTime);
      });
    });
    
    setProject({
      ...project,
      tracks: updatedTracks,
      duration: maxDuration
    });
  };
  
  // Render the video with current edits
  const handleRenderVideo = async () => {
    if (!selectedVideo || !project) {
      setAlert({
        type: 'error',
        message: 'No edits to render'
      });
      return;
    }
    
    setIsRendering(true);
    setAlert({
      type: 'info',
      message: 'Starting video render...'
    });
    
    try {
      // In a real implementation, we would call an API to render the video using ffmpeg
      // For example: POST to /api/videos/render with project data
      // This would trigger a backend process to generate the final video
      
      // For now, we'll simulate the render process with a timeout
      setTimeout(() => {
        setIsRendering(false);
        setAlert({
          type: 'success',
          message: 'Video rendered successfully! Check your dashboard for the rendered video.'
        });
        
        // Clear the alert after 3 seconds
        setTimeout(() => setAlert(null), 3000);
      }, 2000);
    } catch (err) {
      console.error('Error rendering video:', err);
      setIsRendering(false);
      setAlert({
        type: 'error',
        message: 'Failed to render video'
      });
    }
  };
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  // Render alert component
  const AlertMessage = () => {
    if (!alert) return null;
    
    const bgColors = {
      success: 'bg-green-500/20 border-green-500',
      error: 'bg-red-500/20 border-red-500',
      info: 'bg-blue-500/20 border-blue-500'
    };
    
    const icons = {
      success: <Check className="w-5 h-5" />,
      error: <AlertCircle className="w-5 h-5" />,
      info: <AlertCircle className="w-5 h-5" />
    };
    
    return (
      <div className={`fixed top-4 right-4 p-3 rounded-md border ${bgColors[alert.type]} text-white flex items-center space-x-2 z-50`}>
        {icons[alert.type]}
        <span>{alert.message}</span>
      </div>
    );
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#141414] overflow-hidden">
      <AlertMessage />
      
      {/* Top navbar */}
      <div className="flex items-center justify-between h-16 px-4 bg-[#1a1a1a] border-b border-gray-800 z-10">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#c9fffc] mr-4">Video Editor</h1>
          {selectedVideo && (
            <input 
              type="text" 
              value={editedTitle} 
              onChange={handleTitleChange}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white w-64"
              placeholder="Video title"
            />
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedVideo && (
            <>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-[#c9fffc] text-black px-4 py-1 rounded-md hover:bg-[#c9fffc]/80 transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleRenderVideo}
                disabled={isRendering}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-1 rounded-md hover:bg-green-700 transition-colors"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </>
                )}
              </button>
            </>
          )}
          
          {/* Toggle sidebar button */}
          <button
            onClick={toggleSidebar}
            className="ml-2 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <path d="M13 8l4 4-4 4"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <path d="M16 16l-4-4 4-4"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with videos - collapsible but always showing content */}
        {sidebarOpen && (
          <div className="w-64 bg-[#1a1a1a] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Your Videos</h2>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c9fffc]" />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No videos found</div>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleVideoSelect(video)}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        selectedVideo && selectedVideo.id === video.id
                          ? 'bg-[#c9fffc] text-black'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {video.thumbnail_url && (
                        <div className="w-full h-20 mb-1 rounded overflow-hidden">
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="text-sm font-medium truncate">{video.title}</div>
                      {video.duration && (
                        <div className="text-xs text-gray-400 mt-1">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor - full-screen */}
        <div className="flex-1 bg-[#1a1a1a] overflow-hidden relative flex flex-col">
          {!project ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <Play className="w-20 h-20 mb-6 text-[#c9fffc]/50" />
              <p className="text-xl">Select a video from the sidebar to start editing</p>
            </div>
          ) : (
            <>
              {/* Video preview area */}
              <div className="flex-1 relative flex justify-center items-center bg-black">
                <video
                  ref={videoPlayerRef}
                  className="max-h-full max-w-full"
                  src={selectedVideo?.video_url}
                  onTimeUpdate={handleTimeUpdate}
                  onClick={handlePlayPause}
                />
                
                {/* Playback controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={handlePlayPause}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      >
                        {editState.playing ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={handleMuteToggle}
                          className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        >
                          {editState.muted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : editState.volume > 0.5 ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <Volume1 className="w-5 h-5" />
                          )}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={editState.volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-24 accent-[#c9fffc]"
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      {formatTime(editState.currentTime)} / {formatTime(project.duration)}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden cursor-pointer"
                       onClick={handleTimelineClick}>
                    <div 
                      className="h-full bg-[#c9fffc]"
                      style={{ width: `${(editState.currentTime / project.duration) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Editing tools */}
              <div className="h-10 bg-[#1a1a1a] border-t border-b border-gray-800 flex items-center px-4 space-x-4">
                <button 
                  onClick={handleAddClip}
                  className="flex items-center space-x-1 text-sm text-white hover:text-[#c9fffc] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Clip</span>
                </button>
                
                <button className="flex items-center space-x-1 text-sm text-white hover:text-[#c9fffc] transition-colors">
                  <Scissors className="w-4 h-4" />
                  <span>Split</span>
                </button>
                
                <button className="flex items-center space-x-1 text-sm text-white hover:text-[#c9fffc] transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                
                <button className="flex items-center space-x-1 text-sm text-white hover:text-[#c9fffc] transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo</span>
                </button>
              </div>
              
              {/* Timeline */}
              <div 
                ref={timelineRef}
                className="h-64 bg-[#252525] overflow-auto relative"
                onClick={handleTimelineClick}
              >
                {/* Time ruler */}
                <div className="h-6 border-b border-gray-700 relative">
                  {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 bottom-0 flex flex-col items-center"
                      style={{ left: `${i * TIMELINE_SCALE}px` }}
                    >
                      <div className="h-3 w-px bg-gray-500" />
                      <div className="text-xs text-gray-400">{formatTime(i)}</div>
                    </div>
                  ))}
                </div>
                
                {/* Current time indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-[#c9fffc] z-10"
                  style={{ left: `${editState.currentTime * TIMELINE_SCALE}px` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#c9fffc] -ml-1.5 -mt-1" />
                </div>
                
                {/* Tracks */}
                <div className="pt-1">
                  {project.tracks.map((track) => (
                    <div 
                      key={track.id}
                      className="h-20 border-b border-gray-700 mb-1 relative group"
                    >
                      {/* Track label */}
                      <div className="absolute left-2 top-1 text-xs text-gray-400 z-10">
                        {track.name}
                      </div>
                      
                      {/* Clips */}
                      {track.clips.map((clip) => (
                        <div
                          key={clip.id}
                          className={`absolute h-16 rounded top-2 cursor-move ${clip.selected ? 'ring-2 ring-[#c9fffc]' : ''}`}
                          style={{
                            left: `${clip.position * TIMELINE_SCALE}px`,
                            width: `${clip.duration * TIMELINE_SCALE}px`,
                            backgroundColor: track.type === 'video' ? '#3b82f6' : '#10b981'
                          }}
                          onMouseDown={(e) => handleClipDragStart(e, clip.id)}
                        >
                          {/* Clip thumbnail or icon */}
                          {clip.thumbnailUrl && track.type === 'video' && (
                            <div className="absolute inset-0 overflow-hidden rounded opacity-50">
                              <img
                                src={clip.thumbnailUrl}
                                alt="Clip thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Clip label */}
                          <div className="absolute inset-0 p-1 flex items-center justify-center">
                            <span className="text-xs text-white font-medium truncate z-10">
                              {track.type === 'video' ? 'Video' : 'Audio'} Clip
                            </span>
                          </div>
                          
                          {/* Clip duration */}
                          <div className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded">
                            {formatTime(clip.duration)}
                          </div>
                          
                          {/* Delete button - shows on hover */}
                          <button 
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClip(clip.id);
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
