import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebhookDataViewerProps {
  data: any;
  onPathSelect?: (path: string) => void;
}

interface TreeNodeProps {
  data: any;
  path: string;
  level: number;
  onPathSelect?: (path: string) => void;
}

function TreeNode({ data, path, level, onPathSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [copied, setCopied] = useState(false);

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePathSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPathSelect?.(path);
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValuePreview = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return 'Object';
    if (typeof value === 'string') return `"${value.length > 30 ? value.substring(0, 30) + '...' : value}"`;
    return String(value);
  };

  const isExpandable = (value: any): boolean => {
    return value !== null && (typeof value === 'object' || Array.isArray(value));
  };

  const renderValue = (value: any, currentPath: string): React.ReactNode => {
    if (!isExpandable(value)) {
      return (
        <div className="flex items-center space-x-2 group">
          <span className={`px-2 py-1 text-xs rounded ${
            getValueType(value) === 'string' ? 'bg-green-500/20 text-green-400' :
            getValueType(value) === 'number' ? 'bg-blue-500/20 text-blue-400' :
            getValueType(value) === 'boolean' ? 'bg-purple-500/20 text-purple-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {getValueType(value)}
          </span>
          <span className="text-gray-300 flex-1 font-mono text-sm">
            {getValuePreview(value)}
          </span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyPath}
              className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
              title="Copy path"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            {onPathSelect && (
              <button
                onClick={handlePathSelect}
                className="px-2 py-1 text-xs bg-[#4DE0F9]/20 text-[#4DE0F9] rounded hover:bg-[#4DE0F9]/30"
                title="Use this path"
              >
                Use
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 rounded p-1 group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className={`px-2 py-1 text-xs rounded ${
            Array.isArray(value) ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {getValueType(value)}
          </span>
          <span className="text-gray-300 flex-1 font-mono text-sm">
            {getValuePreview(value)}
          </span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyPath}
              className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
              title="Copy path"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            {onPathSelect && (
              <button
                onClick={handlePathSelect}
                className="px-2 py-1 text-xs bg-[#4DE0F9]/20 text-[#4DE0F9] rounded hover:bg-[#4DE0F9]/30"
                title="Use this path"
              >
                Use
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 border-l border-white/10"
            >
              <div className="ml-4 space-y-1">
                {Array.isArray(value) ? (
                  value.map((item, index) => (
                    <TreeNode
                      key={index}
                      data={item}
                      path={`${currentPath}[${index}]`}
                      level={level + 1}
                      onPathSelect={onPathSelect}
                    />
                  ))
                ) : (
                  Object.entries(value).map(([key, childValue]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#A855F7] font-medium text-sm">{key}:</span>
                      </div>
                      <TreeNode
                        data={childValue}
                        path={currentPath ? `${currentPath}.${key}` : key}
                        level={level + 1}
                        onPathSelect={onPathSelect}
                      />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      {renderValue(data, path)}
    </div>
  );
}

export function WebhookDataViewer({ data, onPathSelect }: WebhookDataViewerProps) {
  if (!data) {
    return (
      <div className="p-4 text-center text-gray-400">
        No webhook data captured yet
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 max-h-96 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-white font-medium">Captured Webhook Data</h3>
        <span className="text-xs text-gray-400">Click paths to copy or use</span>
      </div>
      
      <div className="space-y-2">
        <TreeNode
          data={data}
          path=""
          level={0}
          onPathSelect={onPathSelect}
        />
      </div>
    </div>
  );
} 