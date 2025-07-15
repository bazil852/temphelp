import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Search, Plus, Settings } from 'lucide-react';
import TopBar from '../components/content-planner/TopBar';
import InfluencerSidebar from '../components/content-planner/InfluencerSidebar';
import CalendarView from '../components/content-planner/CalendarView';
import InspectorDrawer from '../components/content-planner/InspectorDrawer';
import ScheduleComposerModal from '../components/content-planner/ScheduleComposerModal';
import BulkToolbar from '../components/content-planner/BulkToolbar';
import ToastCenter from '../components/content-planner/ToastCenter';
import { ViewMode, CalendarEvent, InfluencerWithLooks, DraggedInfluencer } from '../types/content-planner';
import { useInfluencerStore } from '../store/influencerStore';
import { useAuthStore } from '../store/authStore';
import { 
  getContentPlans, 
  createContentPlan, 
  updateContentPlan,
  deleteContentPlans,
  contentPlansToCalendarEvents,
  CreateContentPlanRequest 
} from '../services/contentPlanService';

export default function ContentPlannerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const influencers = useInfluencerStore((state) => state.getInfluencersForCurrentUser());
  
  // URL-based view mode management
  const viewMode: ViewMode = (searchParams.get('view') as ViewMode) || 'month';
  
  // State management
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composerData, setComposerData] = useState<{
    influencerId?: string;
    dateTime?: Date;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInfluencers, setFilterInfluencers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert influencers to the required format
  const influencersWithLooks: InfluencerWithLooks[] = influencers.map(inf => ({
    id: inf.id,
    name: inf.name,
    looks: [
      {
        id: inf.id,
        label: 'Default Look',
        thumbnailUrl: inf.preview_url || '/default-avatar.png'
      }
    ],
    avatar: inf.preview_url
  }));

  useEffect(() => {
    // Load content plans from backend
    fetchContentPlans();
  }, [currentUser]);

  const fetchContentPlans = async () => {
    setIsLoading(true);
    try {
      const contentPlans = await getContentPlans();
      const calendarEvents = contentPlansToCalendarEvents(contentPlans);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch content plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setSearchParams({ view: mode });
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleInfluencerDrop = (dateTime: Date, influencerId: string) => {
    setComposerData({ influencerId, dateTime });
    setShowComposer(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowInspector(true);
  };

  const handleNewSchedule = () => {
    setComposerData(null);
    setShowComposer(true);
  };

  const handleEventSave = async (eventData: any) => {
    try {
      console.log('Saving event:', eventData);
      
      const createRequest: CreateContentPlanRequest = {
        influencerId: eventData.influencerId,
        lookId: eventData.lookId,
        prompt: eventData.prompt,
        title: eventData.prompt.substring(0, 50),
        startsAt: eventData.dateTime.toISOString(),
        rrule: eventData.recurrence?.rruleString,
      };
      
      const contentPlan = await createContentPlan(createRequest);
      const newEvent: CalendarEvent = {
        ...contentPlan,
        title: contentPlan.title || contentPlan.prompt.substring(0, 50),
        start: new Date(contentPlan.startsAt),
        end: new Date(new Date(contentPlan.startsAt).getTime() + 60 * 60 * 1000), // 1 hour duration
      };
      
      setEvents(prev => [...prev, newEvent]);
      setShowComposer(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteContentPlans(selectedEvents);
      setEvents(prev => prev.filter(event => !selectedEvents.includes(event.id)));
      setSelectedEvents([]);
    } catch (error) {
      console.error('Failed to delete events:', error);
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await updateContentPlan(updatedEvent.id, {
        prompt: updatedEvent.prompt,
        title: updatedEvent.title,
        startsAt: updatedEvent.start.toISOString(),
        status: updatedEvent.status,
      });
      
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteContentPlans([eventId]);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setShowInspector(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleEventMove = async (eventId: string, newDateTime: Date) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      await updateContentPlan(eventId, {
        startsAt: newDateTime.toISOString(),
      });

      // Update local state
      const updatedEvent = {
        ...event,
        start: newDateTime,
        end: new Date(newDateTime.getTime() + 60 * 60 * 1000), // 1 hour duration
        startsAt: newDateTime.toISOString(),
      };

      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      console.log(`✅ Event "${event.title}" moved to ${newDateTime.toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to move event:', error);
        }
  };

  const handleEventDuplicate = async (eventId: string, newDateTime?: Date) => {
    try {
      const originalEvent = events.find(e => e.id === eventId);
      if (!originalEvent) return;

      const duplicateDateTime = newDateTime || new Date(originalEvent.start.getTime() + 24 * 60 * 60 * 1000); // Next day if no date specified

      const createRequest = {
        influencerId: originalEvent.influencerId,
        lookId: originalEvent.lookId,
        prompt: originalEvent.prompt,
        title: `${originalEvent.title} (Copy)`,
        startsAt: duplicateDateTime.toISOString(),
        rrule: originalEvent.rrule,
      };

      const contentPlan = await createContentPlan(createRequest);
      const newEvent = {
        ...contentPlan,
        title: contentPlan.title || contentPlan.prompt.substring(0, 50),
        start: new Date(contentPlan.startsAt),
        end: new Date(new Date(contentPlan.startsAt).getTime() + 60 * 60 * 1000),
      };

      setEvents(prev => [...prev, newEvent]);
      console.log(`✅ Event "${originalEvent.title}" duplicated to ${duplicateDateTime.toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to duplicate event:', error);
    }
  };

  return (
    <div className="h-screen bg-[#0D1117] flex flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-[#4DE0F9]/10 via-[#A855F7]/5 to-transparent opacity-50 -z-10"></div>
      
      {/* Top Bar */}
      <TopBar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterInfluencers={filterInfluencers}
        onFilterChange={setFilterInfluencers}
        onNewSchedule={handleNewSchedule}
        availableInfluencers={influencersWithLooks}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Influencer Sidebar */}
        <div className="w-80 bg-white/5 border-r border-white/10 flex-shrink-0">
          <InfluencerSidebar
            influencers={influencersWithLooks}
            searchQuery={searchQuery}
            onDragStart={(id: string) => console.log('Drag started:', id)}
                      />
                  </div>

        {/* Calendar View */}
        <div className="flex-1 flex flex-col">
          <CalendarView
            events={events}
            viewMode={viewMode}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateChange={handleDateChange}
            onInfluencerDrop={handleInfluencerDrop}
            selectedEvents={selectedEvents}
            onEventSelect={setSelectedEvents}
            onEventMove={handleEventMove}
            onEventDuplicate={handleEventDuplicate}
            availableInfluencers={influencersWithLooks}
                  />
        </div>

        {/* Inspector Drawer */}
        {showInspector && selectedEvent && (
          <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
            <InspectorDrawer
              event={selectedEvent}
              onClose={() => setShowInspector(false)}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
            />
                      </div>
                    )}
      </div>

      {/* Bulk Toolbar */}
      {selectedEvents.length > 0 && (
        <BulkToolbar
          selectedCount={selectedEvents.length}
          onDelete={handleBulkDelete}
          onReschedule={() => console.log('Reschedule bulk')}
          onDuplicate={() => console.log('Duplicate bulk')}
        />
      )}

      {/* Schedule Composer Modal */}
      {showComposer && (
        <ScheduleComposerModal
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          onSave={handleEventSave}
          prefilledData={composerData}
          availableInfluencers={influencersWithLooks}
        />
      )}

      {/* Toast Center */}
      <ToastCenter />
    </div>
  );
}