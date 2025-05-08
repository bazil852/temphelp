import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PromptContextType {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export function PromptProvider({ children }: { children: ReactNode }) {
  const [systemPrompt, setSystemPrompt] = useState('');

  return (
    <PromptContext.Provider value={{ systemPrompt, setSystemPrompt }}>
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
} 