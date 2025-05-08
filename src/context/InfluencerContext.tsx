import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Influencer } from '../types';

interface InfluencerContextType {
  selectedInfluencer1: Influencer | null;
  selectedInfluencer2: Influencer | null;
  setSelectedInfluencer1: (influencer: Influencer | null) => void;
  setSelectedInfluencer2: (influencer: Influencer | null) => void;
  personality1: string;
  personality2: string;
  setPersonality1: (personality: string) => void;
  setPersonality2: (personality: string) => void;
  name1: string;
  name2: string;
  setName1: (name: string) => void;
  setName2: (name: string) => void;
}

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const [selectedInfluencer1, setSelectedInfluencer1] = useState<Influencer | null>(null);
  const [selectedInfluencer2, setSelectedInfluencer2] = useState<Influencer | null>(null);
  const [personality1, setPersonality1] = useState('');
  const [personality2, setPersonality2] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');

  return (
    <InfluencerContext.Provider value={{ 
      selectedInfluencer1, 
      selectedInfluencer2, 
      setSelectedInfluencer1, 
      setSelectedInfluencer2,
      personality1,
      personality2,
      setPersonality1,
      setPersonality2,
      name1,
      name2,
      setName1,
      setName2
    }}>
      {children}
    </InfluencerContext.Provider>
  );
}

export function useInfluencer() {
  const context = useContext(InfluencerContext);
  if (context === undefined) {
    throw new Error('useInfluencer must be used within an InfluencerProvider');
  }
  return context;
} 