import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface TriggerNodeProps {
  data: {
    label: string;
    config: {
      triggerType: string;
    };
  };
}

export const TriggerNode = memo(({ data }: TriggerNodeProps) => {
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
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium text-white">{data.label}</div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Type: {data.config.triggerType}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-[#c9fffc]" />
    </div>
  );
});