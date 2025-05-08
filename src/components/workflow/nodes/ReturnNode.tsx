import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ArrowRight } from 'lucide-react';

interface ReturnNodeProps {
  data: {
    label: string;
    config: {
      returnType: 'end' | 'url';
      url?: string;
      videoHandling?: 'notification' | 'include';
    };
  };
}

export const ReturnNode = memo(({ data }: ReturnNodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-[#1a1a1a] border border-gray-700 w-48">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#c9fffc]" />
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-green-500" />
          <div className="text-sm font-medium text-white">{data.label}</div>
        </div>
        {data.config.returnType === 'url' && data.config.url && (
          <>
            <div className="mt-2 text-xs text-gray-400 text-center">
              URL: {data.config.url}
            </div>
            {data.config.videoHandling && (
              <div className="mt-1 text-xs text-gray-400 text-center">
                Video: {data.config.videoHandling === 'notification' ? 'Notification Only' : 'Include Video'}
              </div>
            )}
          </>
        )}
        {data.config.returnType === 'end' && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            End Flow
          </div>
        )}
      </div>
    </div>
  );
}); 