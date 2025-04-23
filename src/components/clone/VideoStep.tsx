import React, { useState } from 'react';
import { Loader2, Link } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-6"
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Script */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] p-6"
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <span className="text-2xl">📜</span> Your Script
          </h2>
          <div className="max-h-[300px] overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10 text-white text-sm leading-relaxed">
            {script}
          </div>
        </motion.div>

        {/* Right Column - Upload */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] p-6 flex flex-col"
        >
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">
              Upload Your Video
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Record yourself reading the script clearly and either upload a video file or provide a video URL.
            </p>

            {/* Input Method Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setInputMethod('upload')}
                className={`flex-1 px-4 py-2 rounded-full transition-all duration-200 ${
                  inputMethod === 'upload'
                    ? 'bg-[#4DE0F9]/90 text-black shadow-[0_0_20px_rgba(77,224,249,0.3)]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMethod('url')}
                className={`flex-1 px-4 py-2 rounded-full transition-all duration-200 ${
                  inputMethod === 'url'
                    ? 'bg-[#4DE0F9]/90 text-black shadow-[0_0_20px_rgba(77,224,249,0.3)]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                Video URL
              </button>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              {inputMethod === 'upload' ? (
                <label className="block">
                  <span className="sr-only">Choose video file</span>
                  <input
                    type="file"
                    accept="video/mp4,video/mov"
                    onChange={(e) => e.target.files?.[0] && onVideoUpload(e.target.files[0])}
                    className="block w-full text-sm text-white/60
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-medium
                      file:bg-[#4DE0F9]/90 file:text-black
                      hover:file:bg-[#4DE0F9] hover:file:shadow-[0_0_20px_rgba(77,224,249,0.3)]"
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
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-full border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/40 placeholder:text-white/40 transition-all duration-200"
                    />
                    <button
                      onClick={handleVideoUrlSubmit}
                      disabled={!videoUrl.trim() || isLoading}
                      className="px-4 py-2 bg-[#4DE0F9]/90 text-black rounded-full hover:bg-[#4DE0F9] hover:shadow-[0_0_20px_rgba(77,224,249,0.3)] disabled:opacity-50 transition-all duration-200"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Link className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-white/40">
                    Make sure the URL points directly to a video file (MP4 or MOV format)
                  </p>
                </div>
              )}

              {videoPreviewUrl && (
                <div className="mt-6">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full rounded-xl bg-black/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {videoPreviewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mt-6 lg:mt-auto lg:flex lg:justify-end"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full lg:w-auto px-8 py-3 bg-[#4DE0F9]/90 text-black rounded-full hover:bg-[#4DE0F9] hover:shadow-[0_0_20px_rgba(77,224,249,0.3)] disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};