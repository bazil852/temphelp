import React, { useState, useEffect } from 'react';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';
import ContextCard from '../components/ContextCard';
import PodcastOutput from '../components/PodcastOutput';
import VideoGenerationTab from '../components/VideoGenerationTab';
import { useInfluencer } from '../context/InfluencerContext';
import { useTranscript } from '../context/TranscriptContext';
import { Video } from 'lucide-react';

const PERSONALITIES = [
  'Excited',
  'Angry',
  'Sad',
  'Happy',
  'Calm',
  'Energetic',
  'Serious',
  'Playful',
  'Confident',
  'Nervous'
];

export default function PodcastStudioPage() {
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const { lines } = useTranscript();
  const { 
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
  } = useInfluencer();

  const [activeTab, setActiveTab] = useState<'script' | 'video'>('script');

  useEffect(() => {
    fetchInfluencers().catch(console.error);
  }, [fetchInfluencers]);

  const handleEditInfluencer = (influencer: Influencer) => {
    // Handle influencer edit if needed
  };

  const generateAllVideos = () => {
    // Implement the logic to generate all videos
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Influencer Card 1 */}
          <div className="flex-1 relative bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10">
                {selectedInfluencer1?.preview_url ? (
                  <img 
                    src={selectedInfluencer1.preview_url} 
                    alt={selectedInfluencer1.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                )}
              </div>
              
              {/* Influencer Dropdown */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Influencer</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  value={selectedInfluencer1?.id || ''}
                  onChange={(e) => {
                    const influencer = influencers.find(inf => inf.id === e.target.value);
                    setSelectedInfluencer1(influencer || null);
                    setName1(influencer?.name || '');
                  }}
                >
                  <option value="">Select influencer...</option>
                  {influencers.map(influencer => (
                    <option key={influencer.id} value={influencer.id}>
                      {influencer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Personality Dropdown */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Personality</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  value={personality1}
                  onChange={(e) => setPersonality1(e.target.value)}
                >
                  <option value="">Select personality...</option>
                  {PERSONALITIES.map(personality => (
                    <option key={personality} value={personality}>
                      {personality}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name Input */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  placeholder="Enter name..."
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Influencer Card 2 */}
          <div className="flex-1 relative bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10">
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10">
                {selectedInfluencer2?.preview_url ? (
                  <img 
                    src={selectedInfluencer2.preview_url} 
                    alt={selectedInfluencer2.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500" />
                )}
              </div>
              
              {/* Influencer Dropdown */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Influencer</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  value={selectedInfluencer2?.id || ''}
                  onChange={(e) => {
                    const influencer = influencers.find(inf => inf.id === e.target.value);
                    setSelectedInfluencer2(influencer || null);
                    setName2(influencer?.name || '');
                  }}
                >
                  <option value="">Select influencer...</option>
                  {influencers.map(influencer => (
                    <option key={influencer.id} value={influencer.id}>
                      {influencer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Personality Dropdown */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Personality</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  value={personality2}
                  onChange={(e) => setPersonality2(e.target.value)}
                >
                  <option value="">Select personality...</option>
                  {PERSONALITIES.map(personality => (
                    <option key={personality} value={personality}>
                      {personality}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name Input */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] transition-all duration-300 hover:border-[#4DE0F9]"
                  placeholder="Enter name..."
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Context Card */}
          <div className="flex-1">
            <ContextCard />
          </div>
        </div>

        {/* Output Panel */}
        <div className="mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Podcast Output</h2>
              {lines.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setActiveTab('script')}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        activeTab === 'script'
                          ? 'bg-white/10 text-white shadow-md'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Script
                    </button>
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        activeTab === 'video'
                          ? 'bg-white/10 text-white shadow-md'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Video Generation
                    </button>
                  </div>
                  <button
                    onClick={generateAllVideos}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 flex items-center gap-2 border border-white/10 backdrop-blur-sm shadow-md hover:shadow-lg"
                  >
                    <Video className="h-4 w-4" />
                    Generate All Videos
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-[200px] border-2 border-dashed border-cyan-400/50 rounded-lg p-4">
              {activeTab === 'script' ? <PodcastOutput /> : <VideoGenerationTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 