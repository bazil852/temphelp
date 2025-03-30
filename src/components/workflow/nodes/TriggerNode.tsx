import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Webhook } from 'lucide-react';

export const TriggerNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-gray-200">
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 text-white">
        <Webhook className="h-4 w-4 text-blue-500" />
        <div>
          <div className="font-bold text-white">{data.label}</div>
          {data.config.url && (
            <div className="text-xs text-gray-300">{data.config.url}</div>
          )}
        </div>
      </div>
    </div>
  );
});