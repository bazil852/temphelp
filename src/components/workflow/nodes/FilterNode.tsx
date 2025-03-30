import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Filter } from 'lucide-react';

export const FilterNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-gray-200">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 text-white">
        <Filter className="h-4 w-4 text-yellow-500" />
        <div>
          <div className="font-bold text-white">{data.label}</div>
          {data.config.condition && (
            <div className="text-xs text-gray-300">{data.config.condition}</div>
          )}
        </div>
      </div>
    </div>
  );
});