import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ShotstackProvider from './components/Shotstack/ShotstackContext.tsx';
import { TranscriptProvider } from './context/TranscriptContext';
import { PromptProvider } from './context/PromptContext';
import { InfluencerProvider } from './context/InfluencerContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InfluencerProvider>
      <PromptProvider>
        <TranscriptProvider>
          <ShotstackProvider>
  <App />
          </ShotstackProvider>
        </TranscriptProvider>
      </PromptProvider>
    </InfluencerProvider>
</StrictMode>
);
