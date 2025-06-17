import React from 'react';
import { Handle, Position } from 'reactflow';
import { Globe, Lock } from 'lucide-react';

interface HttpRequestNodeProps {
  data: {
    label: string;
    config?: {
      method?: string;
      url?: string;
      authentication?: string;
      headers?: Record<string, string>;
      body?: string;
    };
  };
}

export function HttpRequestNode({ data }: HttpRequestNodeProps) {
  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'text-green-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="glass-panel p-4 min-w-[240px] border border-[#4DE0F9] border-opacity-30">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30">
          <Globe className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium">{data.label}</h3>
          <p className="text-gray-400 text-xs">HTTP Request</p>
        </div>
        {data.config?.authentication && (
          <Lock className="w-3 h-3 text-yellow-400" />
        )}
      </div>

      {data.config && (
        <div className="space-y-2 text-xs">
          {data.config.method && (
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${getMethodColor(data.config.method)}`}>
                {data.config.method.toUpperCase()}
              </span>
              {data.config.url && (
                <span className="text-[#4DE0F9] truncate flex-1">
                  {data.config.url.length > 25 
                    ? `${data.config.url.substring(0, 25)}...` 
                    : data.config.url
                  }
                </span>
              )}
            </div>
          )}
          
          {data.config.authentication && (
            <div className="text-gray-300">
              Auth: <span className="text-yellow-400">{data.config.authentication}</span>
            </div>
          )}

          {data.config.headers && Object.keys(data.config.headers).length > 0 && (
            <div className="text-gray-300">
              Headers: <span className="text-[#A855F7]">{Object.keys(data.config.headers).length}</span>
            </div>
          )}

          {data.config.body && (
            <div className="text-gray-300">
              Body: <span className="text-green-400">✓</span>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
} 