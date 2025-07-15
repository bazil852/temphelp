import React from 'react';
import { Calendar, Copy, Trash2, X } from 'lucide-react';

interface BulkToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onReschedule: () => void;
  onDuplicate: () => void;
  onClear?: () => void;
}

export default function BulkToolbar({
  selectedCount,
  onDelete,
  onReschedule,
  onDuplicate,
  onClear
}: BulkToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-6">
          {/* Selection Info */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} event{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300"></div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onReschedule}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Reschedule selected events"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Reschedule
            </button>

            <button
              onClick={onDuplicate}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Duplicate selected events"
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </button>

            <button
              onClick={onDelete}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              title="Delete selected events"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>

          {/* Clear Selection */}
          {onClear && (
            <>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={onClear}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 