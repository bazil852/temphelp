import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDataPaths } from '../services/templateEngine';

interface DataPath {
  path: string;
  type: string;
  value?: any;
}

interface DataSource {
  id: string;
  label: string;
  icon: string;
  data: any;
}

interface InsertValueDropdownProps {
  onInsert: (template: string) => void;
  dataSources: DataSource[];
  className?: string;
  disabled?: boolean;
}

export default function InsertValueDropdown({ 
  onInsert, 
  dataSources, 
  className = '',
  disabled = false 
}: InsertValueDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSource = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const handleInsert = (path: string) => {
    onInsert(`{{ ctx.${path} }}`);
    setIsOpen(false);
    setSearchTerm('');
    setExpandedSources(new Set());
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setExpandedSources(new Set());
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'array': return '📋';
      case 'object': return '📦';
      default: return '❓';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'text-blue-400';
      case 'number': return 'text-green-400';
      case 'boolean': return 'text-purple-400';
      case 'array': return 'text-orange-400';
      case 'object': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  // Filter and generate paths for all sources
  const allPaths = dataSources.flatMap(source => {
    if (!source.data) return [];
    
    const paths = generateDataPaths(source.data);
    return paths.map(path => ({
      ...path,
      sourceId: source.id,
      sourceLabel: source.label,
      sourceIcon: source.icon,
      fullPath: `${source.id === 'trigger' ? 'trigger' : source.id}.${path.path}`
    }));
  });

  // Filter paths based on search term
  const filteredPaths = searchTerm 
    ? allPaths.filter(path => 
        path.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.sourceLabel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (disabled || dataSources.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 hover:border-gray-500 transition-colors"
          disabled={disabled}
        >
          <span className="hidden sm:inline">Insert Value</span>
          <span className="sm:hidden">Insert</span>
          <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Full Screen Overlay Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-white">Insert Value</h3>
                  <p className="text-gray-400 text-sm">Select a field to insert into your template</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-700">
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {searchTerm ? (
                  // Search results view
                  <div>
                    {filteredPaths.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-8">
                        No fields found matching "{searchTerm}"
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400 mb-3">
                          {filteredPaths.length} field{filteredPaths.length !== 1 ? 's' : ''} found
                        </div>
                        {filteredPaths.map((path, index) => (
                          <button
                            key={`${path.sourceId}-${path.path}-${index}`}
                            onClick={() => handleInsert(path.fullPath)}
                            className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="text-sm">{path.sourceIcon}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-gray-300 truncate">
                                    {path.sourceLabel} → {path.path}
                                  </div>
                                  <div className="font-mono text-xs text-gray-500 truncate">
                                    {`{{ ctx.${path.fullPath} }}`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-3">
                                <span className="text-sm">{getTypeIcon(path.type)}</span>
                                <span className={`text-xs font-medium ${getTypeColor(path.type)}`}>
                                  {path.type}
                                </span>
                                {path.value !== undefined && (
                                  <span className="text-xs text-gray-500 max-w-24 truncate">
                                    {typeof path.value === 'string' ? `"${path.value}"` : String(path.value)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Tree view
                  <div className="space-y-3">
                    {dataSources.map(source => {
                      const isExpanded = expandedSources.has(source.id);
                      const sourcePaths = source.data ? generateDataPaths(source.data) : [];

                      return (
                        <div key={source.id} className="bg-gray-800 rounded-lg border border-gray-700">
                          {/* Source header */}
                          <button
                            onClick={() => toggleSource(source.id)}
                            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <span className="mr-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                            <span className="text-sm mr-3">{source.icon}</span>
                            <span className="flex-1 text-left">{source.label}</span>
                            {sourcePaths.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {sourcePaths.length} field{sourcePaths.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </button>

                          {/* Source paths */}
                          {isExpanded && (
                            <div className="border-t border-gray-700">
                              {sourcePaths.length > 0 ? (
                                <div className="p-2 space-y-1">
                                  {sourcePaths.map((path, index) => (
                                    <button
                                      key={`${source.id}-${path.path}-${index}`}
                                      onClick={() => handleInsert(
                                        source.id === 'trigger' 
                                          ? `trigger.${path.path}`
                                          : `${source.id}.${path.path}`
                                      )}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded flex items-center justify-between group transition-colors"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="font-mono text-sm text-gray-200 truncate">
                                          {path.path}
                                        </div>
                                        <div className="font-mono text-xs text-gray-500 truncate">
                                          {`{{ ctx.${source.id === 'trigger' ? 'trigger' : source.id}.${path.path} }}`}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2 ml-3">
                                        <span className="text-sm">{getTypeIcon(path.type)}</span>
                                        <span className={`text-xs font-medium ${getTypeColor(path.type)}`}>
                                          {path.type}
                                        </span>
                                        {path.value !== undefined && (
                                          <span className="text-xs text-gray-500 max-w-20 truncate">
                                            {typeof path.value === 'string' ? `"${path.value}"` : String(path.value)}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="px-4 py-3 text-xs text-gray-500">
                                  No data available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dataSources.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-8">
                        No data sources available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with helper text */}
              <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                <div className="text-xs text-gray-400">
                  <div className="mb-2">
                    <strong className="text-gray-300">Template helpers:</strong>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="text-gray-500">{'{{ uuid() }}'} - Generate UUID</div>
                    <div className="text-gray-500">{'{{ now("iso") }}'} - Current timestamp</div>
                    <div className="text-gray-500">{'{{ formatDate(ctx.trigger.date, "YYYY-MM-DD") }}'} - Format date</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 