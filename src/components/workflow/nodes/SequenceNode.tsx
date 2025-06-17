import React from 'react';
import { Handle, Position } from 'reactflow';
import { ArrowRightLeft } from 'lucide-react';

interface SequenceNodeProps {
  data: {
    label: string;
    config?: {
      branches?: number;
      waitForAll?: boolean;
      continueOnError?: boolean;
    };
  };
}

export function SequenceNode({ data }: SequenceNodeProps) {
  const branches = data.config?.branches || 2;
  
  return (
    <div className="glass-panel p-4 min-w-[200px] border border-[#A855F7] border-opacity-30">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30">
          <ArrowRightLeft className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">{data.label}</h3>
          <p className="text-gray-400 text-xs">Sequential Execution</p>
        </div>
      </div>

      {data.config && (
        <div className="space-y-2 text-xs">
          <div className="text-gray-300">
            Branches: <span className="text-[#4DE0F9]">{branches}</span>
          </div>
          
          {data.config.waitForAll !== undefined && (
            <div className="text-gray-300">
              Wait for all: <span className={data.config.waitForAll ? "text-green-400" : "text-red-400"}>
                {data.config.waitForAll ? "Yes" : "No"}
              </span>
            </div>
          )}

          {data.config.continueOnError !== undefined && (
            <div className="text-gray-300">
              Continue on error: <span className={data.config.continueOnError ? "text-green-400" : "text-red-400"}>
                {data.config.continueOnError ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Multiple output handles for different branches */}
      {Array.from({ length: Math.min(branches, 4) }, (_, i) => (
        <Handle 
          key={i}
          type="source" 
          position={i < 2 ? Position.Bottom : Position.Right} 
          id={`branch-${i}`}
          style={{
            [i < 2 ? 'left' : 'top']: `${25 + (i % 2) * 50}%`,
          }}
        />
      ))}
    </div>
  );
} 