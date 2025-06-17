import React, { useState } from 'react';
import { useTranscript } from '../context/TranscriptContext';
import { usePrompt } from '../context/PromptContext';
import { useInfluencer } from '../context/InfluencerContext';
import { useAuthStore } from '../store/authStore';

export default function ContextCard() {
  const [activeTab, setActiveTab] = useState<'upload' | 'urls' | 'prompt'>('upload');
  const [showManual, setShowManual] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setLines, lines } = useTranscript();
  const { systemPrompt, setSystemPrompt } = usePrompt();
  const { selectedInfluencer1, selectedInfluencer2, personality1, personality2, name1, name2 } = useInfluencer();
  const { currentUser } = useAuthStore();

  const tabs = [
    { id: 'upload', label: 'Upload', icon: 'cloud-upload' },
    { id: 'urls', label: 'URLs', icon: 'link' },
    { id: 'prompt', label: 'Prompt', icon: 'terminal' }
  ];

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://workflows.thementorprogram.xyz/webhook/20ecb13c-14f5-4350-a3df-dceca6072297', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }

      const data = await response.json();
      console.log('Transcript response:', data);

      // Update the transcript lines with the received transcript
      if (data.transcript) {
        const newLines = data.transcript.split('\n').map((line: string, index: number) => {
          // Assuming the transcript format is "Speaker: Text"
          const [speaker, text] = line.split(':').map(s => s.trim());
          return {
            id: index + 1,
            speaker: speaker || 'Unknown',
            text: text || line,
            speakerColor: index % 2 === 0 ? 'bg-blue-400' : 'bg-purple-400'
          };
        });
        setLines(newLines);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    } finally {
      setIsLoading(false);
    }
  };

  function extractJsonFromGpt(content: string) {
    try {
      // Remove any backticks and trim extra whitespace
      const cleaned = content
        .replace(/^```(json)?/, '')   // remove starting ``` or ```json
        .replace(/```$/, '')           // remove ending ```
        .trim();
  
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse GPT response as JSON:', error);
      throw new Error('Invalid JSON format in GPT response');
    }
  }
  

  const handleRecordClick = async () => {
    if (!selectedInfluencer1 || !selectedInfluencer2) {
      console.error('Please select both influencers before recording');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API to generate podcast script
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/podcast/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: systemPrompt,
          influencer1: {
            name: name1,
            personality: personality1
          },
          influencer2: {
            name: name2,
            personality: personality2
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate podcast script');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Backend failed to generate script');
      }
      
      // Ensure each line has a proper id field
      const scriptWithIds = data.script.map((line: any, index: number) => ({
        ...line,
        id: line.id || index + 1, // Use existing id or generate one
        speakerColor: line.speaker === name1 ? 'bg-blue-400' : 'bg-purple-400'
      }));
      
      setLines(scriptWithIds);
      console.log('Podcast script generated:', scriptWithIds);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10 flex-1 flex flex-col">
        {/* Top-right pencil button */}
        <button
          onClick={() => setShowManual(!showManual)}
          className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {showManual ? (
          <div className="flex flex-col h-full">
            <textarea
              className="flex-1 w-full bg-white/10 rounded-md p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
              placeholder="Enter full context manually..."
            />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'upload' | 'urls' | 'prompt')}
                  className={`inline-flex items-center px-4 py-2 text-sm text-gray-200 transition-colors duration-200 ${
                    activeTab === tab.id ? 'border-b-2 border-cyan-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {tab.icon === 'cloud-upload' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    )}
                    {tab.icon === 'link' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    )}
                    {tab.icon === 'terminal' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    )}
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 mb-4">
              {activeTab === 'upload' && (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-cyan-400/50 rounded-lg p-8 cursor-pointer hover:border-cyan-400 transition-colors duration-200">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-300 text-sm">Drag & drop a DOC, DOCX, or PDF here or click to browse</p>
                  </div>
                </div>
              )}

              {activeTab === 'urls' && (
                <div className="flex flex-col h-full">
                  <textarea
                    className="w-full flex-1 bg-white/10 rounded-md p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none mb-2"
                    placeholder="Paste one URL per line..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={isLoading || !urlInput.trim()}
                    className="w-full py-2 rounded-md bg-cyan-400 text-white font-medium hover:bg-cyan-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Fetching transcript...' : 'Fetch Transcript'}
                  </button>
                </div>
              )}

              {activeTab === 'prompt' && (
                <textarea
                  className="w-full h-full bg-white/10 rounded-md p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  placeholder="Enter system prompt..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Footer with Record Button */}
        <button 
          onClick={handleRecordClick}
          className="w-full py-3 rounded-full border-2 border-cyan-400 text-white text-lg font-semibold hover:bg-cyan-400/20 transition-colors duration-200"
        >
          Record
        </button>
      </div>
    </div>
  );
} 