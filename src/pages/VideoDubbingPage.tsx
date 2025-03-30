import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Download, Languages } from 'lucide-react';
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
  const { videoMinutes, videoMinutesUsed } = usePlanLimits();
  const { currentUser } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Chinese');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [videoTranslateId, setVideoTranslateId] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URL when component unmounts or new URL is created
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, MOV, or AVI)');
      return;
    }

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

  const pollTranslationStatus = async (id: string) => {
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
        setTimeout(() => pollTranslationStatus(id), 5000);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to check translation status');
      setIsProcessing(false);
    }
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#c9fffc]">Video Dubbing</h1>
          <div className="text-gray-400">
            {videoMinutes === -1 ? 
              'Unlimited minutes' : 
              `${videoMinutesUsed}/${videoMinutes} minutes used`}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-xl shadow-xl p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Video
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                  <label className="relative cursor-pointer rounded-md font-medium text-[#c9fffc] hover:text-[#a0fcf9] focus-within:outline-none">
                    <span>Upload a file</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-400">
                  MP4, MOV up to 100MB
                </p>
                {selectedFile && (
                  <p className="text-sm text-[#c9fffc]">{selectedFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Source Language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2"
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800 text-white px-3 py-2"
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            {downloadUrl ? (
              <a
                href={`${import.meta.env.VITE_AI_CLONE_BACKEND_PROXY}/api/proxy/heygen/video?url=${encodeURIComponent(downloadUrl)}`}
                download={`dubbed_video_${targetLang}.mp4`}
                className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Download Dubbed Video
              </a>
            ) : (
              <button
                onClick={handleTranslation}
                disabled={!selectedFile || isProcessing}
                className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-5 w-5" />
                    Translate Video
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}