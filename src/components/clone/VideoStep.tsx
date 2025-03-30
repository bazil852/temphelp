import React, { useState } from 'react';
import { Loader2, Link } from 'lucide-react';

interface VideoStepProps {
  script: string;
  videoPreviewUrl: string | null;
  isLoading: boolean;
  onVideoUpload: (file: File) => void;
  onVideoUrlSubmit?: (url: string) => void;
  onSubmit: () => void;
}

export const VideoStep: React.FC<VideoStepProps> = ({
  script,
  videoPreviewUrl,
  isLoading,
  onVideoUpload,
  onVideoUrlSubmit,
  onSubmit
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'upload' | 'url'>('upload');

  const handleVideoUrlSubmit = () => {
    if (videoUrl.trim()) {
      if (onVideoUrlSubmit) {
        onVideoUrlSubmit(videoUrl.trim());
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Upload Calibration Video
        </h2>
        <p className="text-gray-400 mb-6">
          Record yourself reading the script below clearly and either upload a video file or provide a video URL.
        </p>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Your Script:</h3>
          <p className="text-white">{script}</p>
        </div>

        {/* Input Method Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setInputMethod('upload')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              inputMethod === 'upload'
                ? 'bg-[#c9fffc] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setInputMethod('url')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              inputMethod === 'url'
                ? 'bg-[#c9fffc] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Video URL
          </button>
        </div>

        <div className="space-y-4">
          {inputMethod === 'upload' ? (
            <label className="block">
              <span className="sr-only">Choose video file</span>
              <input
                type="file"
                accept="video/mp4,video/mov"
                onChange={(e) => e.target.files?.[0] && onVideoUpload(e.target.files[0])}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-medium
                  file:bg-[#c9fffc] file:text-black
                  hover:file:bg-[#a0fcf9]"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL (e.g., https://example.com/video.mp4)"
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                />
                <button
                  onClick={handleVideoUrlSubmit}
                  disabled={!videoUrl.trim() || isLoading}
                  className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Link className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-400">
                Make sure the URL points directly to a video file (MP4 or MOV format)
              </p>
            </div>
          )}

          {videoPreviewUrl && (
            <div className="mt-4">
              <video
                src={videoPreviewUrl}
                controls
                className="w-full rounded-lg"
              />
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="mt-4 w-full px-6 py-3 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};