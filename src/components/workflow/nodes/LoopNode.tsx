import React from 'react';
import { Handle, Position } from 'reactflow';
import { RotateCcw } from 'lucide-react';

interface LoopNodeProps {
  data: {
    label: string;
    config?: {
      iterations?: number;
      collection?: string;
      itemName?: string;
    };
  };
}

export function LoopNode({ data }: LoopNodeProps) {
  return (
    <div className="glass-panel p-4 min-w-[200px] border border-[#4DE0F9] border-opacity-30">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-30">
          <RotateCcw className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">{data.label}</h3>
          <p className="text-gray-400 text-xs">For Each / Iterate</p>
        </div>
      </div>

      {data.config && (
        <div className="space-y-2 text-xs">
          {data.config.iterations && (
            <div className="text-gray-300">
              Iterations: <span className="text-[#4DE0F9]">{data.config.iterations}</span>
            </div>
          )}
          {data.config.collection && (
            <div className="text-gray-300">
              Collection: <span className="text-[#4DE0F9]">{data.config.collection}</span>
            </div>
          )}
          {data.config.itemName && (
            <div className="text-gray-300">
              Item: <span className="text-[#4DE0F9]">{data.config.itemName}</span>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="loop-body" />
    </div>
  );
} 