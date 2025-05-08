import React from 'react';
import { Webhook, Play, Filter, Video, Clock, Send, Brain, ArrowRight } from 'lucide-react';

const nodeTypes = [
  { id: 'trigger', type: 'trigger', label: 'Trigger', icon: <Webhook /> },
  { id: 'gen-ai', type: 'gen-ai', label: 'Gen AI', icon: <Brain /> },
  { id: 'generate-video', type: 'action', label: 'Generate Video', icon: <Video /> },
  { id: 'send-webhook', type: 'action', label: 'Send Webhook', icon: <Send /> },
  { id: 'delay', type: 'action', label: 'Delay', icon: <Clock /> },
  { id: 'filter', type: 'filter', label: 'Filter', icon: <Filter /> },
  { id: 'return', type: 'return', label: 'Return', icon: <ArrowRight /> },
];

interface NodeSidebarProps {
  onNodeAdd: (type: string) => void;
}

export function NodeSidebar({ onNodeAdd }: NodeSidebarProps) {
  return (
    <div className="w-16 p-2">
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            className="group relative"
            onClick={() => onNodeAdd(node.type)}
            draggable
          >
            <div className="p-3 rounded-lg bg-[#1a1a1a]/50 hover:bg-[#1a1a1a]/70 transition-colors cursor-pointer">
              {React.cloneElement(node.icon as React.ReactElement, {
                className: 'h-5 w-5 text-[#c9fffc]',
              })}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a]/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {node.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}