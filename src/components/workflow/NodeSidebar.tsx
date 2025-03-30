import React from 'react';
import { Webhook, Play, Filter, Video, Clock, Send } from 'lucide-react';

const nodeTypes = [
  { id: 'trigger', type: 'trigger', label: 'Trigger', icon: <Webhook /> },
  { id: 'generate-video', type: 'action', label: 'Generate Video', icon: <Video /> },
  { id: 'send-webhook', type: 'action', label: 'Send Webhook', icon: <Send /> },
  { id: 'delay', type: 'action', label: 'Delay', icon: <Clock /> },
  { id: 'filter', type: 'filter', label: 'Filter', icon: <Filter /> },
];

interface NodeSidebarProps {
  onNodeAdd: (type: string) => void;
}

export function NodeSidebar({ onNodeAdd }: NodeSidebarProps) {
  return (
    <div className="w-64 bg-[#1a1a1a] p-4 border-r border-gray-700">
      <h3 className="font-medium text-white mb-4">Nodes</h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg shadow-sm cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => onNodeAdd(node.type)}
            draggable
          >
            <div className="p-2 rounded-lg bg-gray-700">
              {React.cloneElement(node.icon as React.ReactElement, {
                className: 'h-4 w-4',
              })}
            </div>
            <span className="text-sm font-medium text-white">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}