import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Trash2, Plus, Minus, Globe, Filter, Code, 
  GitBranch, Clock, Merge, Play, Settings, Video, FileText, Copy, ChevronDown, ChevronRight 
} from 'lucide-react';
import { ActionFlowNode, getDefaultNodeConfig, NODE_METADATA, GenerateVideoConfig } from '../types/nodes';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';
import MappableInput from './MappableInput';
import TemplateInput from './TemplateInput';
import DataBrowser from './DataBrowser';
import { parseCurlCommand } from '../services/templateEngine';
import { interpolateConfig } from '../services/templateEngine';

interface ActionFlowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: any; // The action/flow node
  onSave: (nodeId: string, config: any) => void;
  onDelete?: (nodeId: string) => void;
  availableNodes?: Array<{ id: string; label: string; kind?: string; saveAs?: string }>; // For dropdowns
  // Data mapping props
  triggerData?: any; // Sample payload from trigger
  nodeOutputs?: Record<string, any>; // Outputs from previous nodes
}

// Utility functions for handling nested objects
const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        // For arrays and primitive values, store as string
        flattened[newKey] = Array.isArray(value) ? JSON.stringify(value) : String(value);
      }
    }
  }
  
  return flattened;
};

const unflattenObject = (flattened: Record<string, any>): any => {
  const result: any = {};
  
  for (const key in flattened) {
    const value = flattened[key];
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }
    
    const lastKey = keys[keys.length - 1];
    
    // Try to parse as JSON for arrays, otherwise use as string
    try {
      if (value.startsWith('[') && value.endsWith(']')) {
        current[lastKey] = JSON.parse(value);
      } else if (value === 'true' || value === 'false') {
        current[lastKey] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '') {
        current[lastKey] = Number(value);
      } else {
        current[lastKey] = value;
      }
    } catch {
      current[lastKey] = value;
    }
  }
  
  return result;
};

const ActionFlowConfigModal: React.FC<ActionFlowConfigModalProps> = ({ 
  isOpen, onClose, node, onSave, onDelete, availableNodes = [],
  triggerData, nodeOutputs = {}
}) => {
  const [config, setConfig] = useState<any>({});
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [curlError, setCurlError] = useState('');
  const [isTestingHttp, setIsTestingHttp] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState('');
  const { influencers, fetchInfluencers } = useInfluencerStore();

  // Build data sources for mapping
  const dataSources = React.useMemo(() => {
    const sources = [];
    
    // Add trigger data if available
    if (triggerData) {
      sources.push({
        id: 'trigger',
        label: 'Trigger',
        icon: '⚡',
        data: triggerData
      });
    }
    
    // Add previous node outputs with their saveAs keys
    Object.entries(nodeOutputs).forEach(([nodeId, data]) => {
      const nodeInfo = availableNodes.find(n => n.id === nodeId);
      // Try to get the saveAs key from the node configuration
      const saveAsKey = nodeInfo?.saveAs || nodeId;
      
      sources.push({
        id: nodeId,
        label: nodeInfo?.label || `Node ${nodeId.slice(0, 8)}...`,
        icon: '🔗',
        data: data,
        saveAs: saveAsKey
      });
    });

    // Add current node's test response if available
    if (testResponse) {
      sources.push({
        id: 'current-test',
        label: 'Current Test Response',
        icon: '🧪',
        data: testResponse,
        saveAs: config.saveAs || 'httpResponse'
      });
    }
    
    return sources;
  }, [triggerData, nodeOutputs, availableNodes, testResponse, config.saveAs]);

  // Convert dataSources to the format expected by TemplateInput
  const templateDataSources = React.useMemo(() => {
    const combined: Record<string, any> = {};
    dataSources.forEach(source => {
      combined[source.id] = source.data;
    });
    return combined;
  }, [dataSources]);

  useEffect(() => {
    if (node && isOpen) {
      const nodeKind = node.data?.actionKind || node.data?.kind || 'http';
      const existingConfig = node.data?.config || {};
      const defaultConfig = getDefaultNodeConfig(nodeKind);
      let finalConfig = { ...defaultConfig, ...existingConfig };
      
      // Convert existing body to bodyParams for HTTP nodes
      if (nodeKind === 'http' && finalConfig.body && typeof finalConfig.body === 'object' && !Array.isArray(finalConfig.body)) {
        finalConfig.bodyParams = flattenObject(finalConfig.body);
        finalConfig.bodyType = finalConfig.bodyType || 'json';
      } else if (nodeKind === 'http' && !finalConfig.bodyParams) {
        finalConfig.bodyParams = {};
        finalConfig.bodyType = finalConfig.bodyType || 'json';
      }
      
      console.log('🔧 ActionFlowConfigModal loading config for:', nodeKind);
      console.log('🔧 Existing config:', existingConfig);
      console.log('🔧 Default config:', defaultConfig);
      console.log('🔧 Final config:', finalConfig);
      
      setConfig(finalConfig);
      
      // Fetch influencers if this is a generate-video node
      if (nodeKind === 'generate-video') {
        fetchInfluencers();
      }
    }
  }, [node, isOpen, fetchInfluencers]);

  const handleSave = () => {
    if (node) {
      console.log('💾 ActionFlowConfigModal saving config for node:', node.id);
      console.log('💾 Config being saved:', config);
      
      // Convert bodyParams to body for HTTP nodes
      let finalConfig = { ...config };
      
      if (getNodeKind() === 'http' && config.bodyParams && (config.bodyType || 'json') === 'json') {
        // Convert flattened bodyParams back to nested object
        const filteredParams: Record<string, any> = {};
        Object.entries(config.bodyParams).forEach(([key, value]) => {
          if (key.trim() !== '') { // Skip empty keys
            filteredParams[key] = value;
          }
        });
        finalConfig.body = unflattenObject(filteredParams);
        // Remove bodyParams from the final config
        delete finalConfig.bodyParams;
      }
      
      onSave(node.id, finalConfig);
      onClose();
    }
  };

  const handleDelete = () => {
    if (node && onDelete) {
      onDelete(node.id);
      onClose();
    }
  };

  const getNodeKind = (): string => {
    return node?.data?.actionKind || node?.data?.kind || 'http';
  };

  const getNodeIcon = (kind: string) => {
    const iconMap = {
      http: <Globe className="w-5 h-5" />,
      filter: <Filter className="w-5 h-5" />,
      js: <Code className="w-5 h-5" />,
      switch: <GitBranch className="w-5 h-5" />,
      wait: <Clock className="w-5 h-5" />,
      merge: <Merge className="w-5 h-5" />,
      'generate-video': <Video className="w-5 h-5" />
    };
    return iconMap[kind as keyof typeof iconMap] || <Settings className="w-5 h-5" />;
  };

  const handlePasteCurl = () => {
    setCurlError('');
    const result = parseCurlCommand(curlInput);
    
    if (result.success) {
      // Update the config with parsed values
      setConfig({
        ...config,
        url: result.url,
        method: result.method,
        headers: result.headers,
        body: result.body
      });
      setShowCurlModal(false);
      setCurlInput('');
    } else {
      setCurlError(result.error || 'Failed to parse cURL command');
    }
  };

  const handleTestHttp = async () => {
    setIsTestingHttp(true);
    setTestError('');
    setTestResponse(null);

    try {
      // Build context for interpolation
      const context = { trigger: triggerData || {}, ...nodeOutputs };
      
      // Prepare config for interpolation - convert bodyParams to body if needed
      let configForTest = { ...config };
      if (config.bodyParams && (config.bodyType || 'json') === 'json') {
        const filteredParams: Record<string, any> = {};
        Object.entries(config.bodyParams).forEach(([key, value]) => {
          if (key.trim() !== '') { // Skip empty keys
            filteredParams[key] = value;
          }
        });
        configForTest.body = unflattenObject(filteredParams);
      }
      
      // Interpolate the current config with sample data
      const interpolatedConfig = interpolateConfig(configForTest, context);
      
      console.log('🧪 Testing HTTP request with interpolated config:', interpolatedConfig);
      
      // Make the actual HTTP request
      const requestOptions: RequestInit = {
        method: interpolatedConfig.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...interpolatedConfig.headers
        }
      };

      // Add body for non-GET requests
      if (interpolatedConfig.method !== 'GET' && interpolatedConfig.body) {
        if (typeof interpolatedConfig.body === 'object') {
          requestOptions.body = JSON.stringify(interpolatedConfig.body);
        } else {
          requestOptions.body = interpolatedConfig.body;
        }
      }

      const response = await fetch(interpolatedConfig.url, requestOptions);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const fullResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      };

      setTestResponse(fullResponse);
      
      // Also save this as sample output for the node
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          sampleOutput: fullResponse,
          lastTestResult: fullResponse,
          lastTestedAt: new Date().toISOString()
        }
      };

      console.log('✅ HTTP test successful, response saved as sample output');

    } catch (error) {
      console.error('❌ HTTP test failed:', error);
      setTestError(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsTestingHttp(false);
    }
  };

  const renderHttpConfig = () => (
    <div className="space-y-4">
      {/* Header with Test Step Button */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-300">Configuration</h4>
          <button
            type="button"
            onClick={() => setShowCurlModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-3 h-3 mr-1" />
            Paste cURL
          </button>
        </div>

        {/* Test Step Button */}
        <button
          type="button"
          onClick={handleTestHttp}
          disabled={!config.url || isTestingHttp}
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          <Play className="w-5 h-5 mr-2" />
          {isTestingHttp ? 'Testing Step...' : 'Test Step'}
        </button>
      </div>

      {/* Test Results */}
      {testResponse && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-sm font-medium">✅ Test Successful</span>
            <span className="text-xs text-gray-400">Status: {testResponse.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Response saved and available in the data browser →
          </p>
        </div>
      )}

      {testError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center mb-1">
            <span className="text-red-400 text-sm font-medium">❌ Test Failed</span>
          </div>
          <p className="text-red-400 text-sm">{testError}</p>
        </div>
      )}

      {/* URL */}
      <div>
        <MappableInput
          label="URL *"
          value={config.url || ''}
          onChange={(value) => setConfig({ ...config, url: value })}
          placeholder="https://api.example.com/endpoint"
          dataSources={dataSources}
          description="Supports templating: https://api.com/user/{{ctx.trigger.userId}}"
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>

      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">HTTP Method</label>
        <select
          value={config.method || 'GET'}
          onChange={(e) => setConfig({ ...config, method: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Headers */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Headers</label>
        <div className="space-y-2">
          {Object.entries(config.headers || {}).map(([key, value], index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newHeaders = { ...config.headers };
                  delete newHeaders[key];
                  newHeaders[e.target.value] = value;
                  setConfig({ ...config, headers: newHeaders });
                }}
                placeholder="Header name"
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
              />
              <input
                type="text"
                value={value as string}
                onChange={(e) => {
                  const newHeaders = { ...config.headers };
                  newHeaders[key] = e.target.value;
                  setConfig({ ...config, headers: newHeaders });
                }}
                placeholder="Header value"
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const newHeaders = { ...config.headers };
                  delete newHeaders[key];
                  setConfig({ ...config, headers: newHeaders });
                }}
                className="p-1.5 text-red-400 hover:text-red-300"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newHeaders = { ...config.headers, '': '' };
              setConfig({ ...config, headers: newHeaders });
            }}
            className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Header
          </button>
        </div>
      </div>

      {/* Body */}
      {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Request Body</label>
          <div className="space-y-2">
            {/* Body Type Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, bodyType: 'json' })}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  (config.bodyType || 'json') === 'json' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, bodyType: 'raw' })}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  config.bodyType === 'raw' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Raw
              </button>
            </div>

            {/* JSON Body Builder */}
            {(config.bodyType || 'json') === 'json' && (
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-700 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-gray-300 border-b border-gray-600">
                  <div className="col-span-5 flex items-center gap-2">
                    <span>Key</span>
                    <span className="text-xs text-gray-400">(use dot notation for nested: user.name)</span>
                  </div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Body Rows */}
                <div className="bg-gray-800">
                  {Object.entries(config.bodyParams || {}).map(([key, value], index) => {
                    const isNested = key.includes('.');
                    const depth = key.split('.').length - 1;
                    
                    return (
                      <div key={index} className="px-3 py-2 grid grid-cols-12 gap-2 border-b border-gray-700 last:border-b-0">
                        <div className="col-span-5">
                          <div className="flex items-center gap-1">
                            {/* Nested indicator */}
                            {depth > 0 && (
                              <div className="flex items-center">
                                {Array.from({ length: depth }).map((_, i) => (
                                  <div key={i} className="w-3 h-px bg-gray-500 mr-1"></div>
                                ))}
                                <ChevronRight className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                            
                            <MappableInput
                              value={String(key || '')}
                              onChange={(newKey) => {
                                const newBodyParams = { ...config.bodyParams };
                                delete newBodyParams[key];
                                newBodyParams[newKey] = value;
                                setConfig({ ...config, bodyParams: newBodyParams });
                              }}
                              placeholder={depth === 0 ? "key" : "nested.key"}
                              dataSources={dataSources}
                              className={`bg-gray-700 border-gray-600 text-white text-xs ${
                                isNested ? 'font-mono text-blue-300' : ''
                              }`}
                              compact={true}
                            />
                          </div>
                        </div>
                        <div className="col-span-6">
                          <MappableInput
                            value={String(value || '')}
                            onChange={(newValue) => {
                              const newBodyParams = { ...config.bodyParams };
                              newBodyParams[key] = newValue;
                              setConfig({ ...config, bodyParams: newBodyParams });
                            }}
                            placeholder="value"
                            dataSources={dataSources}
                            className="bg-gray-700 border-gray-600 text-white text-xs"
                            compact={true}
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newBodyParams = { ...config.bodyParams };
                              delete newBodyParams[key];
                              setConfig({ ...config, bodyParams: newBodyParams });
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Row Buttons */}
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const newBodyParams = { ...config.bodyParams, '': '' };
                          setConfig({ ...config, bodyParams: newBodyParams });
                        }}
                        className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Parameter
                      </button>
                      
                      {/* Quick presets for common nested structures */}
                      <button
                        type="button"
                        onClick={() => {
                          const newBodyParams = { 
                            ...config.bodyParams, 
                            'user.name': '',
                            'user.email': ''
                          };
                          setConfig({ ...config, bodyParams: newBodyParams });
                        }}
                        className="flex items-center text-gray-400 hover:text-gray-300 text-xs border border-gray-600 px-2 py-1 rounded"
                      >
                        + User Object
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newBodyParams = { 
                            ...config.bodyParams, 
                            'data.items': '[]',
                            'data.total': '',
                            'data.page': ''
                          };
                          setConfig({ ...config, bodyParams: newBodyParams });
                        }}
                        className="flex items-center text-gray-400 hover:text-gray-300 text-xs border border-gray-600 px-2 py-1 rounded"
                      >
                        + Data Object
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Body Input */}
            {config.bodyType === 'raw' && (
              <MappableInput
                value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body || {}, null, 2)}
                onChange={(value) => {
                  try {
                    const parsed = JSON.parse(value);
                    setConfig({ ...config, body: parsed });
                  } catch {
                    setConfig({ ...config, body: value });
                  }
                }}
                placeholder='{\n  "key": "value"\n}'
                dataSources={dataSources}
                multiline={true}
                rows={4}
                className="bg-gray-800 border-gray-600 text-white font-mono"
              />
            )}

            <p className="text-xs text-gray-400 mt-1">
              {(config.bodyType || 'json') === 'json' 
                ? 'Build JSON object using key-value pairs. Use dot notation (user.name, data.items) for nested objects. Use {{ctx.trigger.data}} for dynamic values.'
                : 'Raw JSON or string body. Use {{ctx.trigger.data}} to insert dynamic values.'
              }
            </p>
            
            {/* JSON Preview for dot notation */}
            {(config.bodyType || 'json') === 'json' && config.bodyParams && Object.keys(config.bodyParams).length > 0 && (
              <div className="mt-3 p-3 bg-gray-900 border border-gray-600 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-300">JSON Preview:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const filteredParams: Record<string, any> = {};
                      Object.entries(config.bodyParams || {}).forEach(([key, value]) => {
                        if (key.trim() !== '') {
                          filteredParams[key] = value;
                        }
                      });
                      const jsonStr = JSON.stringify(unflattenObject(filteredParams), null, 2);
                      navigator.clipboard.writeText(jsonStr);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                  {(() => {
                    try {
                      const filteredParams: Record<string, any> = {};
                      Object.entries(config.bodyParams || {}).forEach(([key, value]) => {
                        if (key.trim() !== '') {
                          filteredParams[key] = value;
                        }
                      });
                      return JSON.stringify(unflattenObject(filteredParams), null, 2);
                    } catch (e) {
                      return '{ /* Invalid structure */ }';
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Timeout (ms)</label>
        <input
          type="number"
          value={config.timeoutMs || 15000}
          onChange={(e) => setConfig({ ...config, timeoutMs: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          min="1000"
          step="1000"
        />
      </div>

      {/* Save As */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Save result to</label>
        <TemplateInput
          value={config.saveAs || 'httpResponse'}
          onChange={(value) => setConfig({ ...config, saveAs: value })}
          placeholder="httpResponse"
          className="w-full"
          dataSources={templateDataSources}
        />
        <p className="text-xs text-gray-400 mt-1">
          Context key where HTTP response will be stored
        </p>
      </div>
    </div>
  );

  const renderFilterConfig = () => (
    <div className="space-y-3">
      {/* Expression */}
      <div>
        <MappableInput
          label="Condition Expression *"
          value={config.expression || ''}
          onChange={(value) => setConfig({ ...config, expression: value })}
          placeholder="ctx.trigger.order.total > 100"
          dataSources={dataSources}
          multiline={true}
          rows={3}
          className="bg-gray-800 border-gray-600 text-white font-mono"
          description="JavaScript expression that returns true/false. Access trigger data with ctx.trigger"
        />
      </div>

      {/* Success Path */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Success Path (True)</label>
        <select
          value={config.nextTrue || ''}
          onChange={(e) => setConfig({ ...config, nextTrue: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">Select next node...</option>
          {availableNodes.map(node => (
            <option key={node.id} value={node.id}>{node.label}</option>
          ))}
        </select>
      </div>

      {/* Failure Path */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Failure Path (False)</label>
        <select
          value={config.nextFalse || ''}
          onChange={(e) => setConfig({ ...config, nextFalse: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">Stop workflow</option>
          {availableNodes.map(node => (
            <option key={node.id} value={node.id}>{node.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderJsConfig = () => (
    <div className="space-y-3">
      {/* Code */}
      <div>
        <MappableInput
          label="JavaScript Code *"
          value={config.code || ''}
          onChange={(value) => setConfig({ ...config, code: value })}
          placeholder="// Access trigger data: ctx.trigger.userId&#10;// Access previous nodes: ctx.httpResponse.data&#10;return { result: ctx.trigger.name.toUpperCase() };"
          dataSources={dataSources}
          multiline={true}
          rows={6}
          className="bg-gray-800 border-gray-600 text-white font-mono"
          description="JavaScript code that can access ctx object. Return a value to save to context."
        />
      </div>

      {/* Save As */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Save result to</label>
        <TemplateInput
          value={config.saveAs || 'result'}
          onChange={(value) => setConfig({ ...config, saveAs: value })}
          placeholder="result"
          className="w-full"
          dataSources={templateDataSources}
        />
      </div>
    </div>
  );

  const renderSwitchConfig = () => {
    // Filter out the current switch node from available nodes
    const filteredNodes = availableNodes.filter(n => n.id !== node.id);
    
    return (
      <div className="space-y-3">
        {/* Key Expression */}
        <div>
          <MappableInput
            label="Key Expression *"
            value={config.keyExpr || ''}
            onChange={(value) => setConfig({ ...config, keyExpr: value })}
            placeholder="ctx.trigger.user.plan"
            dataSources={dataSources}
            className="bg-gray-800 border-gray-600 text-white font-mono"
            description="Expression to evaluate for switching. Result will be matched against case values."
          />
        </div>

        {/* Cases */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cases</label>
          <div className="space-y-2">
            {(config.cases || []).map((caseItem: any, index: number) => (
              <div key={index} className="flex gap-2">
                <TemplateInput
                  value={caseItem.value}
                  onChange={(value) => {
                    const newCases = [...(config.cases || [])];
                    newCases[index].value = value;
                    setConfig({ ...config, cases: newCases });
                  }}
                  placeholder="Case value"
                  className="flex-1"
                  dataSources={templateDataSources}
                />
                <select
                  value={caseItem.next || ''}
                  onChange={(e) => {
                    const newCases = [...(config.cases || [])];
                    newCases[index].next = e.target.value;
                    setConfig({ ...config, cases: newCases });
                  }}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="">Select next node...</option>
                  {filteredNodes.map(node => (
                    <option key={node.id} value={node.id}>{node.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const newCases = (config.cases || []).filter((_: any, i: number) => i !== index);
                    setConfig({ ...config, cases: newCases });
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newCases = [...(config.cases || []), { value: '', next: '' }];
                setConfig({ ...config, cases: newCases });
              }}
              className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Case
            </button>
          </div>
        </div>

        {/* Default Path */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Default Path</label>
          <select
            value={config.defaultNext || ''}
            onChange={(e) => setConfig({ ...config, defaultNext: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">Stop workflow</option>
            {filteredNodes.map(node => (
              <option key={node.id} value={node.id}>{node.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderWaitConfig = () => (
    <div className="space-y-3">
      {/* Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Wait Mode</label>
        <div className="flex gap-2">
          {['delay', 'until'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setConfig({ ...config, mode })}
              className={`px-3 py-1.5 text-sm rounded capitalize ${
                config.mode === mode 
                  ? 'bg-[#4DE0F9] text-black' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Delay Mode */}
      {config.mode === 'delay' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Delay (seconds)</label>
          <input
            type="number"
            value={config.delaySeconds || 60}
            onChange={(e) => setConfig({ ...config, delaySeconds: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            min="1"
          />
        </div>
      )}

      {/* Until Mode */}
      {config.mode === 'until' && (
        <>
          <div>
            <MappableInput
              label="Until Expression"
              value={config.untilExpr || ''}
              onChange={(value) => setConfig({ ...config, untilExpr: value })}
              placeholder="ctx.trigger.status === 'completed'"
              dataSources={dataSources}
              multiline={true}
              rows={3}
              className="bg-gray-800 border-gray-600 text-white font-mono"
              description="JavaScript expression that returns true when ready to continue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Check Every (seconds)</label>
            <input
              type="number"
              value={config.checkEverySeconds || 30}
              onChange={(e) => setConfig({ ...config, checkEverySeconds: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              min="1"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderMergeConfig = () => (
    <div className="space-y-3">
      {/* Strategy */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Merge Strategy</label>
        <select
          value={config.strategy || 'pass-through'}
          onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="pass-through">Pass Through (first completed)</option>
          <option value="combine">Combine (merge all contexts)</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {config.strategy === 'pass-through' 
            ? 'Forward the first completed source context'
            : 'Deep-merge all source contexts into one object'
          }
        </p>
      </div>

      {/* Sources */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Source Branches</label>
        <div className="space-y-2">
          {(config.sources || []).map((sourceId: string, index: number) => (
            <div key={index} className="flex gap-2">
              <select
                value={sourceId}
                onChange={(e) => {
                  const newSources = [...(config.sources || [])];
                  newSources[index] = e.target.value;
                  setConfig({ ...config, sources: newSources });
                }}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
              >
                <option value="">Select source node...</option>
                {availableNodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const newSources = (config.sources || []).filter((_: string, i: number) => i !== index);
                  setConfig({ ...config, sources: newSources });
                }}
                className="p-1.5 text-red-400 hover:text-red-300"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newSources = [...(config.sources || []), ''];
              setConfig({ ...config, sources: newSources });
            }}
            className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Source
          </button>
        </div>
      </div>
    </div>
  );

  const renderGenerateVideoConfig = () => (
    <div className="space-y-3">
      {/* Influencer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Select Influencer <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={config.influencerId || ''}
            onChange={(e) => setConfig({ ...config, influencerId: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm appearance-none"
            required
          >
            <option value="">Select an influencer...</option>
            {influencers.map((influencer) => (
              <option key={influencer.id} value={influencer.id}>
                {influencer.name}
              </option>
            ))}
          </select>
          {influencers.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No influencers found. Create an influencer first.
            </p>
          )}
        </div>
        
        {/* Show selected influencer preview */}
        {config.influencerId && (
          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-600">
            {(() => {
              const selectedInfluencer = influencers.find(inf => inf.id === config.influencerId);
              if (!selectedInfluencer) return null;
              
              return (
                <div className="flex items-center space-x-3">
                  {selectedInfluencer.preview_url && (
                    <img 
                      src={selectedInfluencer.preview_url} 
                      alt={selectedInfluencer.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{selectedInfluencer.name}</p>
                    <p className="text-gray-400 text-xs">
                      Status: {selectedInfluencer.status || 'Unknown'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Script Source */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Script Source</label>
        <div className="space-y-2">
          {[
            { value: 'manual', label: 'Manual Input', description: 'Enter script directly' },
            { value: 'previous-node', label: 'Previous Node', description: 'Get script from previous workflow step' },
            { value: 'webhook', label: 'Webhook', description: 'Receive script via webhook' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-2 cursor-pointer">
              <input
                type="radio"
                name="scriptSource"
                value={option.value}
                checked={config.scriptSource === option.value}
                onChange={(e) => setConfig({ ...config, scriptSource: e.target.value })}
                className="mt-1"
              />
              <div>
                <span className="text-white text-sm">{option.label}</span>
                <p className="text-gray-400 text-xs">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Script Source Configuration */}
      {config.scriptSource === 'manual' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Script Content</label>
          <TemplateInput
            value={config.scriptValue || ''}
            onChange={(value) => setConfig({ ...config, scriptValue: value })}
            placeholder="Enter your video script here..."
            className="w-full h-24"
            multiline={true}
            rows={4}
            dataSources={templateDataSources}
          />
        </div>
      )}

      {config.scriptSource === 'previous-node' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Context Key</label>
          <TemplateInput
            value={config.scriptContextKey || 'script'}
            onChange={(value) => setConfig({ ...config, scriptContextKey: value })}
            placeholder="script"
            className="w-full"
            dataSources={templateDataSources}
          />
          <p className="text-xs text-gray-400 mt-1">
            The context key where the script will be read from (e.g., ctx.script)
          </p>
        </div>
      )}

      {config.scriptSource === 'webhook' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Webhook Path</label>
          <TemplateInput
            value={config.webhookPath || '/video/script'}
            onChange={(value) => setConfig({ ...config, webhookPath: value })}
            placeholder="/video/script"
            className="w-full"
            dataSources={templateDataSources}
          />
          <p className="text-xs text-gray-400 mt-1">
            Webhook endpoint path where script will be received
          </p>
        </div>
      )}

      {/* Save As */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Save result to</label>
        <TemplateInput
          value={config.saveAs || 'videoResult'}
          onChange={(value) => setConfig({ ...config, saveAs: value })}
          placeholder="videoResult"
          className="w-full"
          dataSources={templateDataSources}
        />
        <p className="text-xs text-gray-400 mt-1">
          Context key where video generation result will be stored
        </p>
      </div>
    </div>
  );

  const currentKind = getNodeKind();
  const metadata = NODE_METADATA[currentKind as keyof typeof NODE_METADATA];

  const renderConfigContent = () => {
    switch (currentKind) {
      case 'http': return renderHttpConfig();
      case 'filter': return renderFilterConfig();
      case 'js': return renderJsConfig();
      case 'switch': return renderSwitchConfig();
      case 'wait': return renderWaitConfig();
      case 'merge': return renderMergeConfig();
      case 'generate-video': return renderGenerateVideoConfig();
      default: return <div>Unknown node type</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-7xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center">
                <div className="text-[#4DE0F9] mr-3">
                  {getNodeIcon(currentKind)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {metadata?.title || 'Node Configuration'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {metadata?.description || 'Configure node settings'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Split layout for ALL node types */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Configuration */}
              <div className="w-1/2 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(currentKind)}
                    <h3 className="text-lg font-semibold text-white">Configuration</h3>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {renderConfigContent()}
                </div>
              </div>

              {/* Right Panel - Data Browser */}
              <div className="w-1/2 flex flex-col">
                <DataBrowser 
                  dataSources={dataSources}
                  className="h-full"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-700 flex-shrink-0">
              <div>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-sm bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* cURL Paste Modal */}
      {showCurlModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={() => setShowCurlModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-[#4DE0F9] mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Paste cURL Command</h3>
                  <p className="text-gray-400 text-sm">Convert your cURL command to HTTP configuration</p>
                </div>
              </div>
              <button
                onClick={() => setShowCurlModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  cURL Command
                </label>
                <textarea
                  value={curlInput}
                  onChange={(e) => setCurlInput(e.target.value)}
                  placeholder={`curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono h-32 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste your cURL command here. Supports -X, -H, -d, --data, --header options.
                </p>
              </div>

              {curlError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{curlError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowCurlModal(false)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteCurl}
                disabled={!curlInput.trim()}
                className="px-4 py-1.5 text-sm bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Copy className="w-4 h-4 mr-1" />
                Parse & Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionFlowConfigModal; 