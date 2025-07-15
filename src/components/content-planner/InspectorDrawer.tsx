import React, { useState } from 'react';
import { X, Edit2, Trash2, Copy, ExternalLink, Play, History } from 'lucide-react';
import { CalendarEvent } from '../../types/content-planner';
import { format } from 'date-fns';

interface InspectorDrawerProps {
  event: CalendarEvent;
  onClose: () => void;
  onEventUpdate: (event: CalendarEvent) => void;
  onEventDelete: (eventId: string) => void;
}

export default function InspectorDrawer({
  event,
  onClose,
  onEventUpdate,
  onEventDelete
}: InspectorDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'preview'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    prompt: event.prompt,
    title: event.title || '',
  });

  const handleSave = () => {
    const updatedEvent = {
      ...event,
      prompt: editData.prompt,
      title: editData.title,
    };
    onEventUpdate(updatedEvent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      prompt: event.prompt,
      title: event.title || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this scheduled content?')) {
      onEventDelete(event.id);
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'PPP p'); // e.g., "Jan 1, 2024 at 10:30 AM"
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {event.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'details', label: 'Details', icon: Edit2 },
          { id: 'history', label: 'History', icon: History },
          { id: 'preview', label: 'Preview', icon: Play },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt
                    </label>
                    <textarea
                      value={editData.prompt}
                      onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm text-gray-900">{event.title || 'Untitled'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Prompt</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.prompt}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-sm text-gray-900">{formatDateTime(event.start)}</p>
                </div>
                {event.rrule && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Recurrence</label>
                    <p className="text-sm text-gray-900">Recurring event</p>
                    <p className="text-xs text-gray-500">{event.rrule}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-900">{format(new Date(event.createdAt), 'PPP')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Event History</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">{format(new Date(event.createdAt), 'PPP p')}</p>
                </div>
              </div>
              
              {event.lastRunAt && (
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Run</p>
                    <p className="text-xs text-gray-500">{format(new Date(event.lastRunAt), 'PPP p')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Preview</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Preview functionality will be available once the content is generated.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </button>
            <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              <ExternalLink className="h-4 w-4 mr-1" />
              Share
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 