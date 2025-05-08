import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TranscriptLine {
  id: number;
  speaker: string;
  text: string;
  speakerColor: string;
}

interface TranscriptContextType {
  lines: TranscriptLine[];
  setLines: (lines: TranscriptLine[]) => void;
  addLine: (line: TranscriptLine) => void;
  updateLine: (id: number, text: string) => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export function TranscriptProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);

  const addLine = (line: TranscriptLine) => {
    setLines(prev => [...prev, line]);
  };

  const updateLine = (id: number, text: string) => {
    setLines(prev => prev.map(line => 
      line.id === id ? { ...line, text } : line
    ));
  };

  return (
    <TranscriptContext.Provider value={{ lines, setLines, addLine, updateLine }}>
      {children}
    </TranscriptContext.Provider>
  );
}

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (context === undefined) {
    throw new Error('useTranscript must be used within a TranscriptProvider');
  }
  return context;
} 