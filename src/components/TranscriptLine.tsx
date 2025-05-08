import React, { useState } from 'react';

interface TranscriptLineProps {
  speaker: string;
  text: string;
  speakerColor: string;
  onTextChange?: (newText: string) => void;
  onGenerateVoice?: () => void;
  onGenerateVideo?: () => void;
}

export default function TranscriptLine({ 
  speaker, 
  text, 
  speakerColor, 
  onTextChange,
  onGenerateVoice,
  onGenerateVideo
}: TranscriptLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onTextChange) {
      onTextChange(editedText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <div 
      className="flex gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200 group"
      onClick={handleClick}
    >
      <div className="w-1 bg-cyan-400 rounded-l" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${speakerColor}`} />
            <span className="font-semibold text-white">{speaker}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateVoice?.();
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
              title="Generate Voice"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateVideo?.();
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
              title="Generate Video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        {isEditing ? (
          <textarea
            className="w-full bg-transparent text-white focus:outline-none resize-none"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <p className="text-gray-300">{text}</p>
        )}
      </div>
    </div>
  );
} 