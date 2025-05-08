import React from 'react';
import TranscriptLine from './TranscriptLine';
import { useTranscript } from '../context/TranscriptContext';

export default function TranscriptList() {
  const { lines, updateLine } = useTranscript();

  const handleTextChange = (id: number, newText: string) => {
    updateLine(id, newText);
  };

  const handleGenerateVoice = (id: number) => {
    // TODO: Implement voice generation
    console.log('Generating voice for line:', id);
  };

  const handleGenerateVideo = (id: number) => {
    // TODO: Implement video generation
    console.log('Generating video for line:', id);
  };

  return (
    <div className="max-h-96 overflow-y-auto space-y-2">
      {lines.map(line => (
        <TranscriptLine
          key={line.id}
          speaker={line.speaker}
          text={line.text}
          speakerColor={line.speakerColor}
          onTextChange={(newText) => handleTextChange(line.id, newText)}
          onGenerateVoice={() => handleGenerateVoice(line.id)}
          onGenerateVideo={() => handleGenerateVideo(line.id)}
        />
      ))}
    </div>
  );
} 