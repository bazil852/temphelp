import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock } from 'lucide-react';

interface DelayNodeProps {
  data: {
    label: string;
    config?: {
      duration?: number;
      unit?: 'seconds' | 'minutes' | 'hours' | 'days';
      until?: string; // For wait until specific time/date
    };
  };
}

export function DelayNode({ data }: DelayNodeProps) {
  const getDurationText = () => {
    if (!data.config?.duration || !data.config?.unit) return 'Not configured';
    const { duration, unit } = data.config;
    return `${duration} ${unit}${duration > 1 ? '' : ''}`;
  };

  return (
    <div className="glass-panel p-4 min-w-[180px] border border-[#4DE0F9] border-opacity-30">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-orange-500 bg-opacity-20 border border-orange-500 border-opacity-30">
          <Clock className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">{data.label}</h3>
          <p className="text-gray-400 text-xs">Wait / Delay</p>
        </div>
      </div>

      {data.config && (
        <div className="space-y-2 text-xs">
          {(data.config.duration || data.config.unit) && (
            <div className="text-gray-300">
              Duration: <span className="text-[#4DE0F9]">{getDurationText()}</span>
            </div>
          )}
          
          {data.config.until && (
            <div className="text-gray-300">
              Until: <span className="text-[#A855F7]">{data.config.until}</span>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 