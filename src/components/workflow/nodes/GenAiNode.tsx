import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from 'lucide-react';

interface GenAiNodeProps {
  data: {
    label: string;
    config: {
      model: string;
      systemPrompt?: string;
      promptSource?: string;
    };
  };
}

export const GenAiNode = memo(({ data }: GenAiNodeProps) => {
  return (
    <div 
      className="influencer-card p-4 w-48"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#c9fffc]" />
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <div className="text-sm font-medium text-white">{data.label}</div>
        </div>
        {data.config.model && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Model: {data.config.model}
          </div>
        )}
        {data.config.promptSource && (
          <div className="mt-1 text-xs text-gray-400 text-center">
            Prompt: {data.config.promptSource === 'manual' ? 'Manual' : 'From Webhook'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-[#c9fffc]" />
    </div>
  );
}); 