import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

export const ActionNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-gray-200">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 text-white">
        <Play className="h-4 w-4 text-green-500" />
        <div>
          <div className="font-bold text-white">{data.label}</div>
          {data.config.action && (
            <div className="text-xs text-gray-300">{data.config.action}</div>
          )}
        </div>
      </div>
    </div>
  );
});