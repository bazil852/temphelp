import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface SwitchNodeProps {
  data: {
    label: string;
    config?: {
      field?: string;
      conditions?: Array<{
        operator: string;
        value: string;
        output: string;
      }>;
    };
  };
}

export function SwitchNode({ data }: SwitchNodeProps) {
  const conditions = data.config?.conditions || [];
  
  return (
    <div className="glass-panel p-4 min-w-[220px] border border-[#A855F7] border-opacity-30">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30">
          <GitBranch className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">{data.label}</h3>
          <p className="text-gray-400 text-xs">Conditional Logic</p>
        </div>
      </div>

      {data.config && (
        <div className="space-y-2 text-xs">
          {data.config.field && (
            <div className="text-gray-300">
              Field: <span className="text-[#4DE0F9]">{data.config.field}</span>
            </div>
          )}
          
          {conditions.length > 0 && (
            <div className="space-y-1">
              <div className="text-gray-400">Conditions:</div>
              {conditions.slice(0, 2).map((condition, index) => (
                <div key={index} className="text-gray-300 text-xs">
                  {condition.operator} <span className="text-[#A855F7]">{condition.value}</span>
                </div>
              ))}
              {conditions.length > 2 && (
                <div className="text-gray-400">+{conditions.length - 2} more</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Multiple output handles for different conditions */}
      <Handle type="source" position={Position.Bottom} id="true" />
      <Handle type="source" position={Position.Right} id="false" />
      {conditions.length > 2 && (
        <Handle type="source" position={Position.Left} id="default" />
      )}
    </div>
  );
} 