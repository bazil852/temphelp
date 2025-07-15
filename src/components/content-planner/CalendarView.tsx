import React, { useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { ViewMode, CalendarEvent } from '../../types/content-planner';
import { User } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Create the drag and drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarViewProps {
  events: CalendarEvent[];
  viewMode: ViewMode;
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateChange: (date: Date) => void;
  onInfluencerDrop: (dateTime: Date, influencerId: string) => void;
  selectedEvents: string[];
  onEventSelect: (eventIds: string[]) => void;
  onEventMove: (eventId: string, newDateTime: Date) => void;
  onEventDuplicate: (eventId: string, newDateTime?: Date) => void;
  availableInfluencers: any[];
}

export default function CalendarView({
  events,
  viewMode,
  currentDate,
  onEventClick,
  onDateChange,
  onInfluencerDrop,
  selectedEvents,
  onEventSelect,
  onEventMove,
  onEventDuplicate,
  availableInfluencers
}: CalendarViewProps) {
  // Convert our ViewMode to react-big-calendar views
  const calendarView = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return Views.MONTH;
      case 'week':
        return Views.WEEK;
      case 'day':
        return Views.DAY;
      case 'agenda':
        return Views.AGENDA;
      default:
        return Views.MONTH;
    }
  }, [viewMode]);

  // Handle event drop (move)
  const handleEventDrop = ({ event, start, end }: any) => {
    console.log('Event dropped:', event.id, 'to:', start);
    onEventMove(event.id, start);
  };

  // Handle event resize
  const handleEventResize = ({ event, start, end }: any) => {
    console.log('Event resized:', event.id, 'new start:', start, 'new end:', end);
    // Update the event with new start/end times
    onEventMove(event.id, start);
  };

  // Handle drag start
  const handleDragStart = ({ event }: any) => {
    console.log('Drag started for event:', event.id);
  };

  // Handle drag over for influencer drops
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey || e.metaKey ? 'copy' : 'move';
  };

  // Handle drop events for influencers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (dragData.type === 'influencer') {
        // Calculate the drop position based on the calendar view
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // This is a simplified calculation - in practice you'd need to map
        // the mouse position to the actual calendar date/time
        const dropDateTime = new Date();
        
        onInfluencerDrop(dropDateTime, dragData.id);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Custom event component with influencer icon
  const EventComponent = ({ event }: any) => {
    const calEvent = event as CalendarEvent;
    const isSelected = selectedEvents.includes(calEvent.id);
    const influencer = availableInfluencers.find(inf => inf.id === calEvent.influencerId);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEventDuplicate(calEvent.id);
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEventClick(calEvent);
    };

    return (
      <div
        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors group relative select-none ${
          isSelected 
            ? 'bg-[#4DE0F9] text-black' 
            : 'bg-white/20 text-white hover:bg-white/30'
        }`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => {
          // Prevent text selection during drag
          e.preventDefault();
        }}
        title={`${calEvent.title} - ${formatTime(calEvent.start)} - Double click to duplicate`}
      >
        <div className="flex items-center space-x-1">
          {/* Influencer Avatar */}
          {influencer && (
            <div className="flex-shrink-0 w-4 h-4 rounded-full overflow-hidden bg-gradient-to-br from-[#4DE0F9] to-[#A855F7]">
              {influencer.avatar ? (
                <img
                  src={influencer.avatar}
                  alt={influencer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold">
                  {influencer.name.charAt(0)}
                </div>
              )}
            </div>
          )}
          
          {          /* Event Title */}
          <span className="truncate flex-1 min-w-0">
            {calEvent.title}
          </span>
          
          {/* Time */}
          <span className={`text-[10px] font-normal ${isSelected ? 'text-black/70' : 'text-white/70'}`}>
            {formatTime(calEvent.start)}
          </span>
        </div>
        
        {/* Recurring indicator */}
        {calEvent.rrule && (
          <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${isSelected ? 'bg-black/30' : 'bg-white/50'}`} 
               title="Recurring event" />
        )}
        
        {/* Drag indicator */}
        <div className={`absolute inset-0 border-2 border-dashed border-transparent group-hover:border-current opacity-0 group-hover:opacity-30 rounded pointer-events-none`} />
      </div>
    );
  };

  // Custom agenda event component
  const AgendaEventComponent = ({ event }: any) => {
    const calEvent = event as CalendarEvent;
    const influencer = availableInfluencers.find(inf => inf.id === calEvent.influencerId);
    
    return (
      <div className="flex items-center space-x-3 p-2 text-white select-none">
        {/* Influencer Avatar */}
        {influencer && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#4DE0F9] to-[#A855F7]">
            {influencer.avatar ? (
              <img
                src={influencer.avatar}
                alt={influencer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        )}
        
        {/* Event Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-white">{calEvent.title}</p>
            <span className="text-xs text-gray-400">
              {calEvent.start.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </span>
          </div>
          <p className="text-xs text-gray-300 truncate">{calEvent.prompt}</p>
          {influencer && (
            <p className="text-xs text-[#4DE0F9] mt-1">{influencer.name}</p>
          )}
        </div>
        
        {/* Status indicator */}
        <div className={`w-3 h-3 rounded-full ${
          calEvent.status === 'scheduled' ? 'bg-blue-500' :
          calEvent.status === 'processing' ? 'bg-amber-500' :
          calEvent.status === 'completed' ? 'bg-green-500' :
          'bg-red-500'
        }`} title={calEvent.status} />
      </div>
    );
  };

  // Custom toolbar (we'll use our TopBar instead)
  const CustomToolbar = () => null;

  // Event style getter
  const eventStyleGetter = (event: any) => {
    const calEvent = event as CalendarEvent;
    const isSelected = selectedEvents.includes(calEvent.id);
    
    let backgroundColor = '#3b82f6'; // Default blue
    
    // Color by status
    switch (calEvent.status) {
      case 'scheduled':
        backgroundColor = '#3b82f6'; // Blue
        break;
      case 'processing':
        backgroundColor = '#f59e0b'; // Amber
        break;
      case 'completed':
        backgroundColor = '#10b981'; // Green
        break;
      case 'failed':
        backgroundColor = '#ef4444'; // Red
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor: isSelected ? '#1f2937' : backgroundColor,
        borderWidth: isSelected ? '2px' : '1px',
        borderStyle: 'solid',
        color: 'white',
        borderRadius: '4px',
        padding: '2px 6px'
      }
    };
  };

  // Handle navigate (when user clicks on calendar navigation)
  const handleNavigate = (date: Date) => {
    onDateChange(date);
  };

  // Handle view change
  const handleViewChange = (view: any) => {
    // This will be handled by the TopBar, but we need to prevent default behavior
  };

  // Handle select slot (when user clicks on empty calendar slot)
  const handleSelectSlot = ({ start }: { start: Date }) => {
    // For now, just trigger new schedule modal
    // In a real implementation, you might want to pre-fill the date/time
    console.log('Selected slot at:', start);
  };

  return (
    <div 
      className="h-full bg-white/5 backdrop-blur-xl select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="h-full p-4">
        <style dangerouslySetInnerHTML={{
          __html: `
            .dark-calendar .rbc-calendar {
              background: transparent !important;
              color: white !important;
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
            .dark-calendar .rbc-month-view {
              background: transparent !important;
            }
            .dark-calendar .rbc-date-cell {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: white !important;
              user-select: none !important;
            }
            .dark-calendar .rbc-day-bg {
              background: rgba(255, 255, 255, 0.02) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            .dark-calendar .rbc-day-bg:hover {
              background: rgba(77, 224, 249, 0.1) !important;
            }
            .dark-calendar .rbc-off-range-bg {
              background: rgba(255, 255, 255, 0.01) !important;
              color: rgba(255, 255, 255, 0.3) !important;
            }
            .dark-calendar .rbc-today {
              background: rgba(77, 224, 249, 0.2) !important;
            }
            .dark-calendar .rbc-header {
              background: rgba(255, 255, 255, 0.1) !important;
              color: white !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
              font-weight: 600 !important;
              user-select: none !important;
            }
            .dark-calendar .rbc-month-header {
              background: transparent !important;
            }
            .dark-calendar .rbc-btn-group > button {
              background: rgba(255, 255, 255, 0.1) !important;
              color: white !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            .dark-calendar .rbc-btn-group > button:hover {
              background: rgba(77, 224, 249, 0.2) !important;
            }
            .dark-calendar .rbc-active {
              background: rgba(77, 224, 249, 0.3) !important;
            }
            .dark-calendar .rbc-time-view {
              background: transparent !important;
            }
            .dark-calendar .rbc-time-header {
              background: rgba(255, 255, 255, 0.05) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            .dark-calendar .rbc-time-content {
              background: transparent !important;
            }
            .dark-calendar .rbc-timeslot-group {
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .dark-calendar .rbc-time-slot {
              border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            .dark-calendar .rbc-current-time-indicator {
              background: #4DE0F9 !important;
            }
            .dark-calendar .rbc-event {
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
            .dark-calendar .rbc-event-content {
              user-select: none !important;
            }
            .dark-calendar .rbc-agenda-view {
              background: transparent !important;
            }
            .dark-calendar .rbc-agenda-table {
              background: transparent !important;
            }
            .dark-calendar .rbc-agenda-table tbody > tr {
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            .dark-calendar .rbc-agenda-table tbody > tr > td {
              color: white !important;
              background: transparent !important;
              user-select: none !important;
            }
            /* Drag and drop styles */
            .dark-calendar .rbc-addons-dnd .rbc-event.rbc-event-continues-earlier {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }
            .dark-calendar .rbc-addons-dnd .rbc-event.rbc-event-continues-later {
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }
            .dark-calendar .rbc-addons-dnd .rbc-event.rbc-addons-dnd-dragging {
              opacity: 0.5;
            }
            .dark-calendar .rbc-addons-dnd .rbc-event.rbc-addons-dnd-over {
              background: rgba(77, 224, 249, 0.3) !important;
            }
            .dark-calendar .rbc-addons-dnd .rbc-addons-dnd-drag-preview {
              background: rgba(77, 224, 249, 0.8) !important;
              color: white !important;
              border: 2px solid #4DE0F9 !important;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 12px;
              font-weight: 500;
            }
          `
        }} />
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => (event as CalendarEvent).start}
          endAccessor={(event: any) => (event as CalendarEvent).end}
          titleAccessor={(event: any) => (event as CalendarEvent).title}
          view={calendarView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={(event: any) => onEventClick(event as CalendarEvent)}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDragStart={handleDragStart}
          selectable
          popup
          draggableAccessor={() => true}
          resizable
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
            agenda: {
              event: AgendaEventComponent
            }
          }}
          eventPropGetter={eventStyleGetter}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`,
            agendaTimeFormat: 'HH:mm',
            agendaDateFormat: 'ddd MMM DD',
          }}
          min={new Date(2023, 0, 1, 8, 0)} // 8 AM
          max={new Date(2023, 0, 1, 20, 0)} // 8 PM
          step={30}
          timeslots={2}
          dayLayoutAlgorithm="no-overlap"
          showMultiDayTimes
          className="h-full dark-calendar"
          style={{ height: '100%' }}
        />
      </div>


    </div>
  );
} 