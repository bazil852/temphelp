import React from 'react';
import { 
  Webhook, 
  Play, 
  Filter, 
  Video, 
  Clock, 
  Send, 
  Brain, 
  ArrowRight, 
  RotateCcw, 
  GitBranch, 
  Globe, 
  ArrowRightLeft 
} from 'lucide-react';

const nodeTypes = [
  // Core Triggers & Actions
  { id: 'trigger', type: 'trigger', label: 'Trigger', icon: <Webhook /> },
  { id: 'http-request', type: 'http-request', label: 'HTTP Request', icon: <Globe /> },
  { id: 'gen-ai', type: 'gen-ai', label: 'Gen AI', icon: <Brain /> },
  { id: 'generate-video', type: 'action', label: 'Generate Video', icon: <Video /> },
  { id: 'send-webhook', type: 'action', label: 'Send Webhook', icon: <Send /> },
  
  // Control Flow
  { id: 'switch', type: 'switch', label: 'Switch', icon: <GitBranch /> },
  { id: 'loop', type: 'loop', label: 'Loop', icon: <RotateCcw /> },
  { id: 'sequence', type: 'sequence', label: 'Sequence', icon: <ArrowRightLeft /> },
  { id: 'filter', type: 'filter', label: 'Filter', icon: <Filter /> },
  
  // Utilities
  { id: 'delay', type: 'delay', label: 'Delay', icon: <Clock /> },
  { id: 'return', type: 'return', label: 'Return', icon: <ArrowRight /> },
];

interface NodeSidebarProps {
  onNodeAdd: (type: string) => void;
}

export function NodeSidebar({ onNodeAdd }: NodeSidebarProps) {
  return (
    <div className="w-16 p-2">
    <div className="w-16 p-2">
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            className="group relative"
            className="group relative"
            onClick={() => onNodeAdd(node.type)}
            draggable
          >
            <div className="p-3 rounded-lg bg-[#1a1a1a]/50 hover:bg-[#1a1a1a]/70 transition-colors cursor-pointer">
            <div className="p-3 rounded-lg bg-[#1a1a1a]/50 hover:bg-[#1a1a1a]/70 transition-colors cursor-pointer">
              {React.cloneElement(node.icon as React.ReactElement, {
                className: 'h-5 w-5 text-[#c9fffc]',
                className: 'h-5 w-5 text-[#c9fffc]',
              })}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a]/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {node.label}
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