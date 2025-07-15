import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Plus, Calendar } from 'lucide-react';
import { ViewMode, InfluencerWithLooks } from '../../types/content-planner';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterInfluencers: string[];
  onFilterChange: (influencers: string[]) => void;
  onNewSchedule: () => void;
  availableInfluencers: InfluencerWithLooks[];
}

export default function TopBar({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  searchQuery,
  onSearchChange,
  filterInfluencers,
  onFilterChange,
  onNewSchedule,
  availableInfluencers
}: TopBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handlePrevious = () => {
    switch (viewMode) {
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(subDays(currentDate, 1));
        break;
      case 'agenda':
        onDateChange(subDays(currentDate, 7));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'agenda':
        onDateChange(addDays(currentDate, 7));
        break;
    }
  };

  const getDateDisplayText = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return format(currentDate, 'MMM dd, yyyy');
      case 'day':
        return format(currentDate, 'EEEE, MMM dd, yyyy');
      case 'agenda':
        return format(currentDate, 'MMM dd, yyyy');
    }
  };

  const handleInfluencerFilterToggle = (influencerId: string) => {
    if (filterInfluencers.includes(influencerId)) {
      onFilterChange(filterInfluencers.filter(id => id !== influencerId));
    } else {
      onFilterChange([...filterInfluencers, influencerId]);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 relative z-20">
      <div className="flex items-center justify-between">
        {/* Left side - View Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-white/10 rounded-lg p-1">
            {(['month', 'week', 'day', 'agenda'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-[#4DE0F9] text-black shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Date Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevious}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-lg font-semibold text-white min-w-[200px] text-center">
            {getDateDisplayText()}
          </div>
          
          <button
            onClick={handleNext}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => onDateChange(new Date())}
            className="px-3 py-1 text-sm text-[#4DE0F9] hover:bg-[#4DE0F9]/20 rounded-md transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right side - Search, Filters, and New Schedule */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:border-[#4DE0F9] transition-colors"
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || filterInfluencers.length > 0
                  ? 'bg-[#4DE0F9]/20 text-[#4DE0F9]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl p-4 z-50 min-w-[250px]">
                <h3 className="text-sm font-medium text-white mb-3">Filter by Influencer</h3>
                <div className="space-y-2">
                  {availableInfluencers.map((influencer) => (
                    <label key={influencer.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filterInfluencers.includes(influencer.id)}
                        onChange={() => handleInfluencerFilterToggle(influencer.id)}
                        className="rounded border-white/20 bg-white/5 text-[#4DE0F9] focus:ring-[#4DE0F9]"
                      />
                      <span className="ml-2 text-sm text-white">{influencer.name}</span>
                    </label>
                  ))}
                </div>
                {filterInfluencers.length > 0 && (
                  <button
                    onClick={() => onFilterChange([])}
                    className="mt-3 text-sm text-[#4DE0F9] hover:text-[#4DE0F9]/80 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter Chips */}
          {filterInfluencers.length > 0 && (
            <div className="flex items-center space-x-2">
              {filterInfluencers.map((influencerId) => {
                const influencer = availableInfluencers.find(inf => inf.id === influencerId);
                return influencer ? (
                  <span
                    key={influencerId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/30"
                  >
                    {influencer.name}
                    <button
                      onClick={() => handleInfluencerFilterToggle(influencerId)}
                      className="ml-1 h-3 w-3 rounded-full bg-[#4DE0F9]/30 hover:bg-[#4DE0F9]/50 flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* New Schedule Button */}
          <button
            onClick={onNewSchedule}
            className="inline-flex items-center px-4 py-2 bg-[#4DE0F9] text-black text-sm font-medium rounded-lg hover:bg-[#4DE0F9]/90 focus:outline-none focus:ring-2 focus:ring-[#4DE0F9] focus:ring-offset-2 focus:ring-offset-transparent transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </button>
        </div>
      </div>
    </div>
  );
} 