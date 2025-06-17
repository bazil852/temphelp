import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface VideoProgressBarProps {
  completed: number;
  total: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error?: string | null;
}

const VideoProgressBar: React.FC<VideoProgressBarProps> = ({ 
  completed, 
  total, 
  status, 
  error 
}) => {
  const getProgressText = () => {
    switch (status) {
      case 'processing':
        return `Generating videos: ${completed}/${total}`;
      case 'completed':
        return 'All videos completed!';
      case 'failed':
        return error || 'Video generation failed';
      default:
        return 'Ready to generate videos';
    }
  };

  const getProgressPercentage = () => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-cyan-400';
      case 'completed':
        return 'bg-green-400';
      case 'failed':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="text-white font-medium">
            {getProgressText()}
          </div>
          {status === 'processing' && (
            <div className="text-white/60 text-sm">
              This may take several minutes...
            </div>
          )}
        </div>
        {status === 'processing' && (
          <div className="text-white/80 text-sm font-mono">
            {Math.round(getProgressPercentage())}%
          </div>
        )}
      </div>
      
      {total > 0 && (
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}
      
      {error && status === 'failed' && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoProgressBar; 