import React, { useState } from 'react';
import { Copy, Check, Eye, Zap, Settings, Play } from 'lucide-react';
import { generateDataPaths } from '../services/templateEngine';

interface DataSource {
  id: string;
  label: string;
  icon: string;
  data: any;
  saveAs?: string; // The context key where this data will be saved
}

interface SampleDataTabProps {
  sampleData?: any; // Legacy prop for backward compatibility
  dataSources?: DataSource[]; // New prop for multiple data sources
  title?: string;
  onUseField?: (path: string) => void;
}

export default function SampleDataTab({ 
  sampleData, 
  dataSources = [],
  title = "Sample Data",
  onUseField 
}: SampleDataTabProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [activeSource, setActiveSource] = useState<string | null>(null);

  // Handle legacy sampleData prop
  const finalDataSources = dataSources.length > 0 ? dataSources : 
    sampleData ? [{ id: 'trigger', label: 'Trigger', icon: '⚡', data: sampleData }] : [];

  const handleCopyPath = (path: string) => {
    const templatePath = `{{ ctx.${path} }}`;
    navigator.clipboard.writeText(templatePath);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleUseField = (path: string) => {
    if (onUseField) {
      onUseField(`{{ ctx.${path} }}`);
    }
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const getSourceIcon = (iconStr: string) => {
    if (iconStr === '⚡') return <Zap className="w-4 h-4" />;
    if (iconStr === '🔗') return <Settings className="w-4 h-4" />;
    if (iconStr === '🧪') return <Play className="w-4 h-4" />;
    return <span className="text-sm">{iconStr}</span>;
  };

  if (finalDataSources.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Sample Data</h3>
        <p className="text-gray-400 text-sm">
          Sample data will appear here after testing this node or capturing webhook data.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <h3 className="text-lg font-medium text-white truncate">{title}</h3>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
          {finalDataSources.length} data sources
        </span>
      </div>

      {/* Data Source Tabs */}
      {finalDataSources.length > 1 && (
        <div className="bg-gray-800 p-1 rounded-lg overflow-hidden">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {finalDataSources.map((source) => (
              <button
                key={source.id}
                onClick={() => setActiveSource(activeSource === source.id ? null : source.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSource === source.id || (activeSource === null && source.id === finalDataSources[0].id)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {getSourceIcon(source.icon)}
                <span className="truncate max-w-[120px]">{source.label}</span>
                {source.saveAs && (
                  <code className="text-xs bg-black/20 px-1 rounded flex-shrink-0">
                    {source.saveAs}
                  </code>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render each data source */}
      {finalDataSources.map((source, sourceIndex) => {
        const isActive = finalDataSources.length === 1 || 
                        activeSource === source.id || 
                        (activeSource === null && sourceIndex === 0);
        
        if (!isActive) return null;

        const paths = generateDataPaths(source.data);
        const contextKey = source.id === 'trigger' ? 'trigger' : source.saveAs || source.id;

        return (
          <div key={source.id} className="space-y-4">
            {/* Source Header */}
            <div className="flex items-center gap-2 min-w-0">
              {getSourceIcon(source.icon)}
              <h4 className="text-sm font-medium text-gray-300 truncate">{source.label}</h4>
              {source.saveAs && (
                <code className="text-xs bg-gray-700 px-2 py-1 rounded text-blue-400 flex-shrink-0">
                  ctx.{source.saveAs}
                </code>
              )}
              <span className="text-xs text-gray-500 flex-shrink-0">
                ({paths.length} fields)
              </span>
            </div>

            {/* Raw JSON View */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Raw JSON</span>
                <button
                  onClick={() => handleCopyPath(contextKey)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  {copiedPath === contextKey ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-gray-300 overflow-auto max-h-32 font-mono">
                {JSON.stringify(source.data, null, 2)}
              </pre>
            </div>

            {/* Field Browser */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-300">Available Fields</h5>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {paths.map((path: any, index: number) => {
                  const hasValue = path.value !== undefined;
                  const fullPath = `${contextKey}.${path.path}`;
                  
                  return (
                    <div
                      key={`${fullPath}-${index}`}
                      className="bg-gray-800 rounded p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <code className="text-sm text-blue-400 font-mono truncate">
                            {path.path}
                          </code>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            path.type === 'string' ? 'bg-blue-500/20 text-blue-400' :
                            path.type === 'number' ? 'bg-green-500/20 text-green-400' :
                            path.type === 'boolean' ? 'bg-purple-500/20 text-purple-400' :
                            path.type === 'array' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {path.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {onUseField && (
                            <button
                              onClick={() => handleUseField(fullPath)}
                              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap"
                            >
                              Use Field
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyPath(fullPath)}
                            className="text-xs text-gray-400 hover:text-white flex-shrink-0"
                          >
                            {copiedPath === fullPath ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {hasValue && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-400 mb-1">Sample value:</div>
                          <code className="text-xs text-gray-300 bg-gray-900 px-2 py-1 rounded">
                            {typeof path.value === 'string' 
                              ? `"${path.value}"` 
                              : JSON.stringify(path.value)
                            }
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {paths.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No fields found in this data source</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 