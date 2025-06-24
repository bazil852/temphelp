import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Zap, Settings, Play, Grip } from 'lucide-react';
import { generateDataPaths } from '../services/templateEngine';

interface DataSource {
  id: string;
  label: string;
  icon: string;
  data: any;
  saveAs?: string;
}

interface DataBrowserProps {
  dataSources: DataSource[];
  onFieldDrag?: (fieldPath: string) => void;
  className?: string;
}

interface DataNode {
  key: string;
  value: any;
  type: string;
  path: string;
  isExpandable: boolean;
  level: number;
}

const DataBrowser: React.FC<DataBrowserProps> = ({ 
  dataSources = [], 
  onFieldDrag,
  className = ""
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Expand all sections by default
    const initialExpanded = new Set<string>();
    dataSources.forEach(source => {
      initialExpanded.add(`section-${source.id}`);
    });
    return initialExpanded;
  });
  const [activeSource, setActiveSource] = useState<string>(dataSources[0]?.id || '');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const draggedFieldRef = useRef<string | null>(null);

  // Auto-expand new data sources when they are added
  useEffect(() => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      dataSources.forEach(source => {
        newExpanded.add(`section-${source.id}`);
      });
      return newExpanded;
    });
  }, [dataSources]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const buildDataTree = (obj: any, basePath: string = '', level: number = 0): DataNode[] => {
    if (!obj || typeof obj !== 'object') return [];

    const nodes: DataNode[] = [];
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      const isExpandable = value !== null && typeof value === 'object' && !Array.isArray(value);

      nodes.push({
        key,
        value,
        type: valueType,
        path: currentPath,
        isExpandable,
        level
      });

      // Add children if expanded
      if (isExpandable && expandedNodes.has(currentPath)) {
        const children = buildDataTree(value, currentPath, level + 1);
        nodes.push(...children);
      }
    });

    return nodes;
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (type === 'string') return `"${value}"`;
    if (type === 'array') return `[${value.length} items]`;
    if (type === 'object') return `{${Object.keys(value).length} keys}`;
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-400';
      case 'number': return 'text-blue-400';
      case 'boolean': return 'text-purple-400';
      case 'array': return 'text-orange-400';
      case 'object': return 'text-gray-300';
      default: return 'text-gray-400';
    }
  };

  const getSourceIcon = (iconStr: string) => {
    if (iconStr === '⚡') return <Zap className="w-4 h-4" />;
    if (iconStr === '🔗') return <Settings className="w-4 h-4" />;
    if (iconStr === '🧪') return <Play className="w-4 h-4" />;
    return <span className="text-sm">{iconStr}</span>;
  };

  const handleCopyPath = async (fullPath: string) => {
    const templatePath = `{{ctx.${fullPath}}}`;
    await navigator.clipboard.writeText(templatePath);
    setCopiedPath(fullPath);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDragStart = (e: React.DragEvent, fieldPath: string) => {
    const templatePath = `{{ctx.${fieldPath}}}`;
    e.dataTransfer.setData('text/plain', templatePath);
    e.dataTransfer.effectAllowed = 'copy';
    draggedFieldRef.current = fieldPath;
    
    // Add visual feedback
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    draggedFieldRef.current = null;
  };

  if (dataSources.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Data Available</h3>
        <p className="text-gray-400 text-sm">
          Sample data will appear here after testing nodes or capturing webhook data.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white mb-1">Available Data</h3>
        <p className="text-xs text-gray-400">
          {dataSources.length} data sources • Drag fields to use them
        </p>
      </div>

      {/* All Data Sources - Single Scrollable View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {dataSources.map((source, sourceIndex) => {
          const contextKey = source.id === 'trigger' ? 'trigger' : source.saveAs || source.id;
          const dataTree = buildDataTree(source.data);
          const sectionId = `section-${source.id}`;
          const isExpanded = expandedNodes.has(sectionId);

          return (
            <div key={source.id} className="border border-gray-700 rounded-lg bg-gray-800/50">
              {/* Section Header - Collapsible */}
              <button
                onClick={() => toggleNode(sectionId)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getSourceIcon(source.icon)}
                  <span className="text-sm font-medium text-gray-300">{source.label}</span>
                  {contextKey && (
                    <code className="text-xs bg-gray-700 px-2 py-1 rounded text-blue-400">
                      ctx.{contextKey}
                    </code>
                  )}
                  <span className="text-xs text-gray-500">
                    ({dataTree.length} fields)
                  </span>
                </div>
                
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Section Content - Tree */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-3 space-y-1">
                  {dataTree.map((node, index) => {
                    const fullPath = contextKey ? `${contextKey}.${node.path}` : node.path;
                    const isNodeExpanded = expandedNodes.has(node.path);
                    
                    return (
                      <div
                        key={`${node.path}-${index}`}
                        className="group relative"
                        style={{ paddingLeft: `${node.level * 16}px` }}
                      >
                        <div
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-700/50 cursor-pointer transition-colors"
                          draggable={!node.isExpandable}
                          onDragStart={(e) => !node.isExpandable && handleDragStart(e, fullPath)}
                          onDragEnd={handleDragEnd}
                        >
                          {/* Expand/Collapse Toggle */}
                          {node.isExpandable ? (
                            <button
                              onClick={() => toggleNode(node.path)}
                              className="text-gray-400 hover:text-white p-0.5"
                            >
                              {isNodeExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center">
                              {!node.isExpandable && (
                                <Grip className="w-2.5 h-2.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          )}

                          {/* Key */}
                          <span className="text-xs font-mono text-gray-300 min-w-0 flex-shrink-0">
                            {node.key}
                          </span>

                          {/* Type Badge */}
                          <span className={`text-xs px-1 py-0.5 rounded font-mono flex-shrink-0 ${
                            node.type === 'string' ? 'bg-green-500/20 text-green-400' :
                            node.type === 'number' ? 'bg-blue-500/20 text-blue-400' :
                            node.type === 'boolean' ? 'bg-purple-500/20 text-purple-400' :
                            node.type === 'array' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {node.type}
                          </span>

                          {/* Value */}
                          {!node.isExpandable && (
                            <span className={`text-xs font-mono truncate flex-1 ${getTypeColor(node.type)}`}>
                              {formatValue(node.value, node.type)}
                            </span>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {!node.isExpandable && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPath(fullPath);
                                }}
                                className="p-1 text-gray-400 hover:text-white rounded"
                                title="Copy template path"
                              >
                                {copiedPath === fullPath ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage Instructions */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800/50">
        <p className="text-xs text-gray-400">
          💡 <strong>Drag fields</strong> into input boxes to use them, or <strong>click copy</strong> to get the template path
        </p>
      </div>
    </div>
  );
};

export default DataBrowser; 