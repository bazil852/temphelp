import React from 'react';
import { useTranscript } from '../context/TranscriptContext';
import { useInfluencer } from '../context/InfluencerContext';
import { Pencil, Volume2, Video } from 'lucide-react';

export default function PodcastOutput() {
  const { lines } = useTranscript();
  const { name1, name2 } = useInfluencer();

  return (
    <div className="space-y-4">
      {lines.map((line, index) => (
        <div 
          key={index} 
          className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 transition-all duration-300 hover:bg-white/10"
        >
          {/* Speaker Name */}
          <div className={`absolute left-4 top-4 font-semibold ${line.speaker === name1 ? 'text-blue-400' : 'text-purple-400'}`}>
            {line.speaker}:
          </div>

          {/* Action Icons */}
          <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              title="Edit"
            >
              <Pencil className="h-4 w-4 text-white/70 hover:text-white" />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              title="Generate Voice"
            >
              <Volume2 className="h-4 w-4 text-white/70 hover:text-white" />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              title="Generate Video"
            >
              <Video className="h-4 w-4 text-white/70 hover:text-white" />
            </button>
          </div>

          {/* Message Text */}
          <div className="mt-8 text-white/90">
            {line.text}
          </div>
        </div>
      ))}
    </div>
  );
} 