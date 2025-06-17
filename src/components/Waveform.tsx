import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Loader2 } from 'lucide-react';

interface WaveformProps {
  audioUrl: string;
  onPlayPause?: (isPlaying: boolean) => void;
}

const Waveform: React.FC<WaveformProps> = ({ audioUrl, onPlayPause }) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (!waveformRef.current) return;

    console.log('Waveform loading audio URL:', audioUrl);

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.3)',
      progressColor: '#06b6d4',
      cursorColor: '#06b6d4',
      height: 48,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.current.load(audioUrl);

    const readyHandler = () => {
      setIsLoading(false);
    };

    const playHandler = () => {
      setIsPlaying(true);
      onPlayPause?.(true);
    };

    const pauseHandler = () => {
      setIsPlaying(false);
      onPlayPause?.(false);
    };

    const finishHandler = () => {
      setIsPlaying(false);
      onPlayPause?.(false);
    };

    const errorHandler = (error: any) => {
      console.error('Waveform error for URL:', audioUrl, error);
      setIsLoading(false);
    };

    wavesurfer.current.on('ready', readyHandler);
    wavesurfer.current.on('play', playHandler);
    wavesurfer.current.on('pause', pauseHandler);
    wavesurfer.current.on('finish', finishHandler);
    wavesurfer.current.on('error', errorHandler);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.un('ready', readyHandler);
        wavesurfer.current.un('play', playHandler);
        wavesurfer.current.un('pause', pauseHandler);
        wavesurfer.current.un('finish', finishHandler);
        wavesurfer.current.un('error', errorHandler);
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, onPlayPause]);

  const handlePlayPause = () => {
    if (!wavesurfer.current) return;
    wavesurfer.current.playPause();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 text-cyan-400" />
          ) : (
            <Play className="h-4 w-4 text-cyan-400" />
          )}
        </button>
        <div 
          ref={waveformRef} 
          className="flex-1 rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
};

export default Waveform; 