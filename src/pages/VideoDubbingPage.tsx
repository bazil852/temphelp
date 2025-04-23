import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Download, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const LANGUAGE_OPTIONS = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Spanish' },
  { code: 'French', name: 'French' },
  { code: 'Hindi', name: 'Hindi' },
  { code: 'Italian', name: 'Italian' },
  { code: 'German', name: 'German' },
  { code: 'Polish', name: 'Polish' },
  { code: 'Portuguese', name: 'Portuguese' },
  { code: 'Chinese', name: 'Chinese' },
  { code: 'Japanese', name: 'Japanese' },
  { code: 'Dutch', name: 'Dutch' },
  { code: 'Turkish', name: 'Turkish' },
  { code: 'Korean', name: 'Korean' },
  { code: 'Danish', name: 'Danish' },
  { code: 'Arabic', name: 'Arabic' },
  { code: 'Romanian', name: 'Romanian' },
  { code: 'Mandarin', name: 'Mandarin' },
  { code: 'Filipino', name: 'Filipino' },
  { code: 'Swedish', name: 'Swedish' },
  { code: 'Indonesian', name: 'Indonesian' },
  { code: 'Ukrainian', name: 'Ukrainian' },
  { code: 'Greek', name: 'Greek' },
  { code: 'Czech', name: 'Czech' },
  { code: 'Bulgarian', name: 'Bulgarian' },
  { code: 'Malay', name: 'Malay' },
  { code: 'Slovak', name: 'Slovak' },
  { code: 'Croatian', name: 'Croatian' },
  { code: 'Tamil', name: 'Tamil' },
  { code: 'Finnish', name: 'Finnish' },
  { code: 'Russian', name: 'Russian' },
  { code: 'Custom Accent English', name: 'Custom Accent English' },
  { code: 'American English', name: 'American English' },
  { code: 'audio', name: 'Audio' },
  { code: 'Afrikaans (South Africa)', name: 'Afrikaans (South Africa)' },
  { code: 'Albanian (Albania)', name: 'Albanian (Albania)' },
  { code: 'Amharic (Ethiopia)', name: 'Amharic (Ethiopia)' },
  { code: 'Arabic (Algeria)', name: 'Arabic (Algeria)' },
  { code: 'Arabic (Bahrain)', name: 'Arabic (Bahrain)' },
  { code: 'Arabic (Egypt)', name: 'Arabic (Egypt)' },
  { code: 'Arabic (Iraq)', name: 'Arabic (Iraq)' },
  { code: 'Arabic (Jordan)', name: 'Arabic (Jordan)' },
  { code: 'Arabic (Kuwait)', name: 'Arabic (Kuwait)' },
  { code: 'Arabic (Lebanon)', name: 'Arabic (Lebanon)' },
  { code: 'Arabic (Libya)', name: 'Arabic (Libya)' },
  { code: 'Arabic (Morocco)', name: 'Arabic (Morocco)' },
  { code: 'Arabic (Oman)', name: 'Arabic (Oman)' },
  { code: 'Arabic (Qatar)', name: 'Arabic (Qatar)' },
  { code: 'Arabic (Saudi Arabia)', name: 'Arabic (Saudi Arabia)' },
  { code: 'Arabic (Syria)', name: 'Arabic (Syria)' },
  { code: 'Arabic (Tunisia)', name: 'Arabic (Tunisia)' },
  { code: 'Arabic (United Arab Emirates)', name: 'Arabic (United Arab Emirates)' },
  { code: 'Arabic (Yemen)', name: 'Arabic (Yemen)' },
  { code: 'Armenian (Armenia)', name: 'Armenian (Armenia)' },
  { code: 'Azerbaijani (Latin, Azerbaijan)', name: 'Azerbaijani (Latin, Azerbaijan)' },
  { code: 'Bangla (Bangladesh)', name: 'Bangla (Bangladesh)' },
  { code: 'Basque', name: 'Basque' },
  { code: 'Bengali (India)', name: 'Bengali (India)' },
  { code: 'Bosnian (Bosnia and Herzegovina)', name: 'Bosnian (Bosnia and Herzegovina)' },
  { code: 'Bulgarian (Bulgaria)', name: 'Bulgarian (Bulgaria)' },
  { code: 'Burmese (Myanmar)', name: 'Burmese (Myanmar)' },
  { code: 'Catalan', name: 'Catalan' },
  { code: 'Chinese (Cantonese, Traditional)', name: 'Chinese (Cantonese, Traditional)' },
  { code: 'Chinese (Jilu Mandarin, Simplified)', name: 'Chinese (Jilu Mandarin, Simplified)' },
  { code: 'Chinese (Mandarin, Simplified)', name: 'Chinese (Mandarin, Simplified)' },
  { code: 'Chinese (Northeastern Mandarin, Simplified)', name: 'Chinese (Northeastern Mandarin, Simplified)' },
  { code: 'Chinese (Southwestern Mandarin, Simplified)', name: 'Chinese (Southwestern Mandarin, Simplified)' },
  { code: 'Chinese (Taiwanese Mandarin, Traditional)', name: 'Chinese (Taiwanese Mandarin, Traditional)' },
  { code: 'Chinese (Wu, Simplified)', name: 'Chinese (Wu, Simplified)' },
  { code: 'Chinese (Zhongyuan Mandarin Henan, Simplified)', name: 'Chinese (Zhongyuan Mandarin Henan, Simplified)' },
  { code: 'Chinese (Zhongyuan Mandarin Shaanxi, Simplified)', name: 'Chinese (Zhongyuan Mandarin Shaanxi, Simplified)' },
  { code: 'Croatian (Croatia)', name: 'Croatian (Croatia)' },
  { code: 'Czech (Czechia)', name: 'Czech (Czechia)' },
  { code: 'Danish (Denmark)', name: 'Danish (Denmark)' },
  { code: 'Dutch (Belgium)', name: 'Dutch (Belgium)' },
  { code: 'Dutch (Netherlands)', name: 'Dutch (Netherlands)' },
  { code: 'English (Australia)', name: 'English (Australia)' },
  { code: 'English (Canada)', name: 'English (Canada)' },
  { code: 'English (Hong Kong SAR)', name: 'English (Hong Kong SAR)' },
  { code: 'English (India)', name: 'English (India)' },
  { code: 'English (Ireland)', name: 'English (Ireland)' },
  { code: 'English (Kenya)', name: 'English (Kenya)' },
  { code: 'English (New Zealand)', name: 'English (New Zealand)' },
  { code: 'English (Nigeria)', name: 'English (Nigeria)' },
  { code: 'English (Philippines)', name: 'English (Philippines)' },
  { code: 'English (Singapore)', name: 'English (Singapore)' },
  { code: 'English (South Africa)', name: 'English (South Africa)' },
  { code: 'English (Tanzania)', name: 'English (Tanzania)' },
  { code: 'English (UK)', name: 'English (UK)' },
  { code: 'English (United States)', name: 'English (United States)' },
  { code: 'Estonian (Estonia)', name: 'Estonian (Estonia)' },
  { code: 'Filipino (Philippines)', name: 'Filipino (Philippines)' },
  { code: 'Finnish (Finland)', name: 'Finnish (Finland)' },
  { code: 'French (Belgium)', name: 'French (Belgium)' },
  { code: 'French (Canada)', name: 'French (Canada)' },
  { code: 'French (France)', name: 'French (France)' },
  { code: 'French (Switzerland)', name: 'French (Switzerland)' },
  { code: 'Galician', name: 'Galician' },
  { code: 'Georgian (Georgia)', name: 'Georgian (Georgia)' },
  { code: 'German (Austria)', name: 'German (Austria)' },
  { code: 'German (Germany)', name: 'German (Germany)' },
  { code: 'German (Switzerland)', name: 'German (Switzerland)' },
  { code: 'Greek (Greece)', name: 'Greek (Greece)' },
  { code: 'Gujarati (India)', name: 'Gujarati (India)' },
  { code: 'Hebrew (Israel)', name: 'Hebrew (Israel)' },
  { code: 'Hindi (India)', name: 'Hindi (India)' },
  { code: 'Hungarian (Hungary)', name: 'Hungarian (Hungary)' },
  { code: 'Icelandic (Iceland)', name: 'Icelandic (Iceland)' },
  { code: 'Indonesian (Indonesia)', name: 'Indonesian (Indonesia)' },
  { code: 'Irish (Ireland)', name: 'Irish (Ireland)' },
  { code: 'Italian (Italy)', name: 'Italian (Italy)' },
  { code: 'Japanese (Japan)', name: 'Japanese (Japan)' },
  { code: 'Javanese (Latin, Indonesia)', name: 'Javanese (Latin, Indonesia)' },
  { code: 'Kannada (India)', name: 'Kannada (India)' },
  { code: 'Kazakh (Kazakhstan)', name: 'Kazakh (Kazakhstan)' },
  { code: 'Khmer (Cambodia)', name: 'Khmer (Cambodia)' },
  { code: 'Korean (Korea)', name: 'Korean (Korea)' },
  { code: 'Lao (Laos)', name: 'Lao (Laos)' },
  { code: 'Latvian (Latvia)', name: 'Latvian (Latvia)' },
  { code: 'Lithuanian (Lithuania)', name: 'Lithuanian (Lithuania)' },
  { code: 'Macedonian (North Macedonia)', name: 'Macedonian (North Macedonia)' },
  { code: 'Malay (Malaysia)', name: 'Malay (Malaysia)' },
  { code: 'Malayalam (India)', name: 'Malayalam (India)' },
  { code: 'Maltese (Malta)', name: 'Maltese (Malta)' },
  { code: 'Marathi (India)', name: 'Marathi (India)' },
  { code: 'Mongolian (Mongolia)', name: 'Mongolian (Mongolia)' },
  { code: 'Nepali (Nepal)', name: 'Nepali (Nepal)' },
  { code: 'Norwegian Bokmål (Norway)', name: 'Norwegian Bokmål (Norway)' },
  { code: 'Pashto (Afghanistan)', name: 'Pashto (Afghanistan)' },
  { code: 'Persian (Iran)', name: 'Persian (Iran)' },
  { code: 'Polish (Poland)', name: 'Polish (Poland)' },
  { code: 'Portuguese (Brazil)', name: 'Portuguese (Brazil)' },
  { code: 'Portuguese (Portugal)', name: 'Portuguese (Portugal)' },
  { code: 'Romanian (Romania)', name: 'Romanian (Romania)' },
  { code: 'Russian (Russia)', name: 'Russian (Russia)' },
  { code: 'Serbian (Latin, Serbia)', name: 'Serbian (Latin, Serbia)' },
  { code: 'Sinhala (Sri Lanka)', name: 'Sinhala (Sri Lanka)' },
  { code: 'Slovak (Slovakia)', name: 'Slovak (Slovakia)' },
  { code: 'Slovenian (Slovenia)', name: 'Slovenian (Slovenia)' },
  { code: 'Somali (Somalia)', name: 'Somali (Somalia)' },
  { code: 'Spanish (Argentina)', name: 'Spanish (Argentina)' },
  { code: 'Spanish (Bolivia)', name: 'Spanish (Bolivia)' },
  { code: 'Spanish (Chile)', name: 'Spanish (Chile)' },
  { code: 'Spanish (Colombia)', name: 'Spanish (Colombia)' },
  { code: 'Spanish (Costa Rica)', name: 'Spanish (Costa Rica)' },
  { code: 'Spanish (Cuba)', name: 'Spanish (Cuba)' },
  { code: 'Spanish (Dominican Republic)', name: 'Spanish (Dominican Republic)' },
  { code: 'Spanish (Ecuador)', name: 'Spanish (Ecuador)' },
  { code: 'Spanish (El Salvador)', name: 'Spanish (El Salvador)' },
  { code: 'Spanish (Equatorial Guinea)', name: 'Spanish (Equatorial Guinea)' },
  { code: 'Spanish (Guatemala)', name: 'Spanish (Guatemala)' },
  { code: 'Spanish (Honduras)', name: 'Spanish (Honduras)' },
  { code: 'Spanish (Mexico)', name: 'Spanish (Mexico)' },
  { code: 'Spanish (Nicaragua)', name: 'Spanish (Nicaragua)' },
  { code: 'Spanish (Panama)', name: 'Spanish (Panama)' },
  { code: 'Spanish (Paraguay)', name: 'Spanish (Paraguay)' },
  { code: 'Spanish (Peru)', name: 'Spanish (Peru)' },
  { code: 'Spanish (Puerto Rico)', name: 'Spanish (Puerto Rico)' },
  { code: 'Spanish (Spain)', name: 'Spanish (Spain)' },
  { code: 'Spanish (United States)', name: 'Spanish (United States)' },
  { code: 'Spanish (Uruguay)', name: 'Spanish (Uruguay)' },
  { code: 'Spanish (Venezuela)', name: 'Spanish (Venezuela)' },
  { code: 'Sundanese (Indonesia)', name: 'Sundanese (Indonesia)' },
  { code: 'Swahili (Kenya)', name: 'Swahili (Kenya)' },
  { code: 'Swahili (Tanzania)', name: 'Swahili (Tanzania)' },
  { code: 'Swedish (Sweden)', name: 'Swedish (Sweden)' },
  { code: 'Tamil (India)', name: 'Tamil (India)' },
  { code: 'Tamil (Malaysia)', name: 'Tamil (Malaysia)' },
  { code: 'Tamil (Singapore)', name: 'Tamil (Singapore)' },
  { code: 'Tamil (Sri Lanka)', name: 'Tamil (Sri Lanka)' },
  { code: 'Telugu (India)', name: 'Telugu (India)' },
  { code: 'Thai (Thailand)', name: 'Thai (Thailand)' },
  { code: 'Turkish (Türkiye)', name: 'Turkish (Türkiye)' },
  { code: 'Ukrainian (Ukraine)', name: 'Ukrainian (Ukraine)' },
  { code: 'Urdu (India)', name: 'Urdu (India)' },
  { code: 'Urdu (Pakistan)', name: 'Urdu (Pakistan)' },
  { code: 'Uzbek (Latin, Uzbekistan)', name: 'Uzbek (Latin, Uzbekistan)' },
  { code: 'Vietnamese (Vietnam)', name: 'Vietnamese (Vietnam)' },
  { code: 'Welsh (United Kingdom)', name: 'Welsh (United Kingdom)' },
  { code: 'Zulu (South Africa)', name: 'Zulu (South Africa)' },
  { code: 'English - Your Accent', name: 'English - Your Accent' },
  { code: 'English - American Accent', name: 'English - American Accent' }
];

export default function VideoDubbingPage() {
  const { currentUser } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Chinese');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [videoTranslateId, setVideoTranslateId] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs when component unmounts or new URLs are created
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [videoPreviewUrl, downloadUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, MOV, or AVI)');
      return;
    }

    // Create preview URL
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
    setSelectedFile(file);
    setError('');
    setDownloadUrl(null);
  };

  const handleTranslation = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError('');

    try {
      // First upload file to get a URL
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `videos/dubbing/${currentUser?.id}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Get HeyGen API key
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("heygen_key")
        .eq("id", "1daa0747-bf85-4a1e-82d7-808d4e2b1fa7")
        .single();

      if (apiKeyError || !apiKeyData?.heygen_key) {
        throw new Error("Failed to get HeyGen API key");
      }

      // Start translation with HeyGen
      const response = await fetch(
        'https://api.heygen.com/v2/video_translate',
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': apiKeyData.heygen_key
          },
          body: JSON.stringify({
            video_url: publicUrl,
            title: selectedFile.name,
            output_language: targetLang
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start video translation');
      }

      const data = await response.json();
      console.log('Translation response:', data);
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to start translation');
      }

      setVideoTranslateId(data.data.video_translate_id);
      pollTranslationStatus(data.data.video_translate_id, apiKeyData.heygen_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setIsProcessing(false);
    }
  };

  const pollTranslationStatus = async (id: string, apiKey: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_AI_CLONE_BACKEND_PROXY}/api/proxy/heygen`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://api.heygen.com/v2/video_translate/${id}`,
            method: 'GET',
            headers: {
              'x-api-key': apiKey
            }
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to check translation status');
      }
  
      const data = await response.json();
      console.log('Status response:', data);
  
      if (data?.data?.status === 'success') {
        setTranslationStatus('success');
        setDownloadUrl(data.data.url);
        setIsProcessing(false);
      } else if (data?.data?.status === 'failed') {
        setTranslationStatus('failed');
        setError('Translation process failed');
        setIsProcessing(false);
      } else {
        // Continue polling after 5 seconds
        setTimeout(() => pollTranslationStatus(id, apiKey), 5000);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to check translation status');
      setIsProcessing(false);
    }
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Video Dubbing</h1>
            <p className="text-white/60">
              Translate your videos into multiple languages with AI
            </p>
          </div>

          {/* Video Display Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Input Video */}
            <div className="space-y-4">
              <h3 className="text-white/80 font-medium">Original Video</h3>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  selectedFile
                    ? 'border-[#4DE0F9]/30 bg-[#4DE0F9]/5'
                    : 'border-white/20 hover:border-[#4DE0F9]/20 hover:bg-white/5'
                }`}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <motion.div
                  animate={selectedFile ? { scale: 1 } : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-[#4DE0F9]" />
                </motion.div>
                <p className="text-white/80 mb-2">
                  {selectedFile ? selectedFile.name : 'Drop your video here or click to upload'}
                </p>
                <p className="text-sm text-white/60">
                  {selectedFile ? 'Click to change video' : 'MP4, MOV, or AVI up to 500MB'}
                </p>
              </div>

              {videoPreviewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl overflow-hidden bg-black/20"
                >
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full max-h-[300px] object-contain"
                  />
                </motion.div>
              )}
            </div>

            {/* Output Video */}
            <div className="space-y-4">
              <h3 className="text-white/80 font-medium">Translated Video</h3>
              {downloadUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl overflow-hidden bg-black/20"
                >
                  <video
                    src={downloadUrl}
                    controls
                    className="w-full max-h-[300px] object-contain"
                  />
                </motion.div>
              ) : (
                <div className="h-[300px] flex items-center justify-center rounded-xl bg-black/20 border border-white/10">
                  {isProcessing ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 text-[#4DE0F9] animate-spin" />
                      <p className="text-white/60">Processing translation...</p>
                    </div>
                  ) : (
                    <p className="text-white/40">Translated video will appear here</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Source Language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full bg-black/30 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/50"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Target Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-black/30 text-white rounded-full px-4 py-2 border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4DE0F9]/50"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTranslation}
              disabled={!selectedFile || isProcessing}
              className={`px-8 py-3 rounded-full font-medium text-white transition-all duration-200 ${
                !selectedFile || isProcessing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  <span>Translate Video</span>
                </div>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}