import React from 'react';
import { Clock, User, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { CalendarEvent } from '../../types/content-planner';

interface EventChipProps {
  event: CalendarEvent;
  isSelected: boolean;
  onClick: () => void;
  onSelect: (selected: boolean) => void;
}

export default function EventChip({ event, isSelected, onClick, onSelect }: EventChipProps) {
  const getStatusIcon = () => {
    switch (event.status) {
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-amber-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(!isSelected);
  };

  // Truncate long prompts
  const truncatedPrompt = event.prompt.length > 30 
    ? event.prompt.substring(0, 30) + '...'
    : event.prompt;

  return (
    <div
      className={`relative p-2 rounded text-white text-xs cursor-pointer transition-all hover:opacity-90 ${getStatusColor()} ${
        isSelected ? 'ring-2 ring-gray-800 ring-offset-1' : ''
      }`}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-1 right-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-white bg-white bg-opacity-20"
        />
      </div>

      {/* Content */}
      <div className="pr-4">
        {/* Header with status icon */}
        <div className="flex items-center space-x-1 mb-1">
          {getStatusIcon()}
          <span className="font-medium truncate">{event.title || 'Untitled'}</span>
        </div>

        {/* Prompt preview */}
        <div className="text-white text-opacity-90 leading-tight">
          {truncatedPrompt}
        </div>

        {/* Footer with time if available */}
        {event.start && (
          <div className="flex items-center justify-between mt-1 text-white text-opacity-75">
            <span className="text-xs">
              {new Date(event.start).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {event.rrule && (
              <span className="text-xs">↻</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 