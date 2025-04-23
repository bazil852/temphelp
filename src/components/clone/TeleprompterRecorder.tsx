import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Loader2, Video, Square, Camera, Mic } from 'lucide-react';

interface TeleprompterRecorderProps {
  script: string;
  onRecordingComplete: (blob: Blob) => void;
}

interface Device {
  deviceId: string;
  label: string;
}

export const TeleprompterRecorder: React.FC<TeleprompterRecorderProps> = ({
  script,
  onRecordingComplete,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoDevices, setVideoDevices] = useState<Device[]>([]);
  const [audioDevices, setAudioDevices] = useState<Device[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
          }));
        
        const audioInputs = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`
          }));

        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);

        // Set default devices
        if (videoInputs.length > 0) setSelectedVideoDevice(videoInputs[0].deviceId);
        if (audioInputs.length > 0) setSelectedAudioDevice(audioInputs[0].deviceId);
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    getDevices();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoDevice },
        audio: { deviceId: selectedAudioDevice },
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        onRecordingComplete(blob);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onRecordingComplete, selectedVideoDevice, selectedAudioDevice]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {/* Script Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(77,224,249,0.08)] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Script</h3>
        <div className="h-[calc(100vh-300px)] overflow-y-auto pr-4 space-y-4">
          {script.split('\n').map((line, index) => (
            <p key={index} className="text-white/90 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </motion.div>

      {/* Webcam Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(77,224,249,0.08)] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Camera Preview</h3>
          
          {/* Device Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Camera className="w-4 h-4 inline-block mr-1" />
                Camera
              </label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                disabled={isRecording}
              >
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Mic className="w-4 h-4 inline-block mr-1" />
                Microphone
              </label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                disabled={isRecording}
              >
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="aspect-video rounded-xl overflow-hidden bg-black/20">
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{
                deviceId: selectedVideoDevice,
                width: 1280,
                height: 720,
              }}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(77,224,249,0.08)] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
          <ul className="space-y-2 text-white/80">
            <li>• Position yourself in the center of the frame</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Speak clearly and at a natural pace</li>
            <li>• Follow the script on the left</li>
          </ul>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20'
              : 'bg-[#4DE0F9]/20 text-[#4DE0F9] hover:bg-[#4DE0F9]/30 border border-[#4DE0F9]/20'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <>
              <Square className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Start Recording
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}; 