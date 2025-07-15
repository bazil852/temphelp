import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import { InfluencerWithLooks } from '../../types/content-planner';

interface InfluencerTileProps {
  influencer: InfluencerWithLooks;
  onDragStart: (id: string) => void;
}

function InfluencerTile({ influencer, onDragStart }: InfluencerTileProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'influencer',
      id: influencer.id,
      name: influencer.name
    }));
    onDragStart(influencer.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 cursor-grab hover:bg-white/10 hover:border-[#4DE0F9]/50 transition-colors active:cursor-grabbing group"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#4DE0F9] to-[#A855F7] rounded-full flex items-center justify-center overflow-hidden">
        {influencer.avatar ? (
          <img
            src={influencer.avatar}
            alt={influencer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Info */}
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {influencer.name}
        </p>
        <p className="text-xs text-gray-400">
          {influencer.looks.length} look{influencer.looks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Look Badge */}
      {influencer.looks.length > 0 && (
        <div className="flex-shrink-0 ml-2">
          <div className="w-6 h-6 bg-[#4DE0F9]/20 rounded-full flex items-center justify-center border border-[#4DE0F9]/30">
            <span className="text-xs text-[#4DE0F9] font-medium">
              {influencer.looks.length}
            </span>
          </div>
        </div>
      )}

      {/* Drag Indicator */}
      <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col space-y-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

interface InfluencerSidebarProps {
  influencers: InfluencerWithLooks[];
  searchQuery: string;
  onDragStart: (id: string) => void;
}

export default function InfluencerSidebar({
  influencers,
  searchQuery,
  onDragStart
}: InfluencerSidebarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use local search if provided, otherwise use global search
  const effectiveSearchQuery = localSearchQuery || searchQuery;

  // Filter influencers based on search query
  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(effectiveSearchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white mb-3">
          Influencers
        </h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search influencers..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:border-[#4DE0F9] transition-colors"
          />
        </div>

        {/* Instructions */}
        <p className="mt-3 text-xs text-gray-400">
          Drag influencers to calendar to schedule content
        </p>
      </div>

      {/* Influencer List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredInfluencers.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {effectiveSearchQuery 
                ? 'No influencers match your search'
                : 'No influencers available'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInfluencers.map((influencer) => (
              <InfluencerTile
                key={influencer.id}
                influencer={influencer}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total: {influencers.length}</span>
          {effectiveSearchQuery && (
            <span>Showing: {filteredInfluencers.length}</span>
          )}
        </div>
      </div>
    </div>
  );
} 