import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Settings, Globe, Filter, Code, Database, Mail, FileText, Clock, Repeat } from 'lucide-react';
import TriggerConfigModal from './TriggerConfigModal';
import NewTriggerConfigModal from './NewTriggerConfigModal';
import ActionFlowConfigModal from './ActionFlowConfigModal';

interface NodeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: any;
  onSave: (nodeId: string, config: any) => void;
  onDelete?: (nodeId: string) => void;
  workflowId?: string;
  // Data mapping props
  triggerData?: any;
  nodeOutputs?: Record<string, any>;
  availableNodes?: Array<{ id: string; label: string }>;
}

const NodeConfigModal: React.FC<NodeConfigModalProps> = ({ 
  isOpen, onClose, node, onSave, onDelete, workflowId,
  triggerData, nodeOutputs, availableNodes = []
}) => {
  const [config, setConfig] = useState<any>({});

  const getDefaultConfig = (actionKind: string) => {
    switch (actionKind) {
      case 'http-request':
        return {
          method: 'GET',
          url: '',
          headers: {},
          body: '',
          timeout: 30000
        };
      case 'filter':
        return {
          conditions: [{ field: '', operator: 'equals', value: '' }],
          mode: 'keep' // 'keep' or 'remove'
        };
      case 'loop':
        return {
          inputData: '',
          batchSize: 1,
          maxIterations: 1000
        };
      case 'condition':
        return {
          conditions: [{ field: '', operator: 'equals', value: '' }],
          logic: 'AND'
        };
      case 'delay':
        return {
          duration: 1000,
          unit: 'milliseconds'
        };
      case 'set-variable':
        return {
          variables: [{ name: '', value: '' }]
        };
      case 'transform-data':
        return {
          transformations: [{ field: '', operation: 'rename', value: '' }]
        };
      case 'code-execution':
        return {
          code: '// Your JavaScript code here\nreturn data;',
          language: 'javascript'
        };
      case 'send-email':
        return {
          to: '',
          subject: '',
          body: '',
          smtp: {
            host: '',
            port: 587,
            secure: false,
            auth: { user: '', pass: '' }
          }
        };
      case 'database-query':
        return {
          connection: {
            type: 'postgresql',
            host: '',
            port: 5432,
            database: '',
            username: '',
            password: ''
          },
          query: 'SELECT * FROM table_name;'
        };
      default:
        return {};
    }
  };

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || getDefaultConfig(node.data.actionKind));
    }
  }, [node]);

  // Check if this is a trigger node
  const isTriggerNode = node?.data?.actionKind?.includes('trigger');
  
  // Check if this is a new trigger node (webhook, manual, schedule)
  const isNewTriggerNode = node?.data?.actionKind && ['webhook-trigger', 'manual-trigger', 'schedule-trigger'].includes(node.data.actionKind);
  
  // Check if this is an action/flow node (new spec)
  const isActionFlowNode = node?.data?.actionKind && ['http', 'filter', 'js', 'switch', 'wait', 'merge', 'generate-video'].includes(node.data.actionKind);
  
  // If it's a new trigger node, use the NewTriggerConfigModal
  if (isNewTriggerNode) {
    return (
      <NewTriggerConfigModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        onSave={onSave}
        onDelete={onDelete}
        workflowId={workflowId}
      />
    );
  }
  
  // If it's a legacy trigger node, use the old TriggerConfigModal
  if (isTriggerNode) {
    return (
      <TriggerConfigModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        onSave={onSave}
        onDelete={onDelete}
        workflowId={workflowId}
      />
    );
  }
  
  // If it's an action/flow node, use the ActionFlowConfigModal
  if (isActionFlowNode) {
    return (
      <ActionFlowConfigModal
        isOpen={isOpen}
        onClose={onClose}
        node={node}
        onSave={onSave}
        onDelete={onDelete}
        availableNodes={availableNodes}
        triggerData={triggerData}
        nodeOutputs={nodeOutputs}
      />
    );
  }

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const renderConfigForm = () => {
    if (!node) return null;

    const actionKind = node.data.actionKind;

    switch (actionKind) {
      case 'http-request':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Method</label>
              <select
                value={config.method}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Headers (JSON)</label>
              <textarea
                value={JSON.stringify(config.headers, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, headers: JSON.parse(e.target.value) });
                  } catch {}
                }}
                placeholder='{"Content-Type": "application/json"}'
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-20"
              />
            </div>
            {config.method !== 'GET' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Body</label>
                <textarea
                  value={config.body}
                  onChange={(e) => setConfig({ ...config, body: e.target.value })}
                  placeholder="Request body"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-24"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timeout (ms)</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        );

      case 'filter':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter Mode</label>
              <select
                value={config.mode}
                onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="keep">Keep matching items</option>
                <option value="remove">Remove matching items</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Conditions</label>
              {config.conditions?.map((condition: any, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={condition.field}
                    onChange={(e) => {
                      const newConditions = [...config.conditions];
                      newConditions[index].field = e.target.value;
                      setConfig({ ...config, conditions: newConditions });
                    }}
                    placeholder="Field name"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                  <select
                    value={condition.operator}
                    onChange={(e) => {
                      const newConditions = [...config.conditions];
                      newConditions[index].operator = e.target.value;
                      setConfig({ ...config, conditions: newConditions });
                    }}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => {
                      const newConditions = [...config.conditions];
                      newConditions[index].value = e.target.value;
                      setConfig({ ...config, conditions: newConditions });
                    }}
                    placeholder="Value"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'loop':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Input Data Path</label>
              <input
                type="text"
                value={config.inputData}
                onChange={(e) => setConfig({ ...config, inputData: e.target.value })}
                placeholder="data.items"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Batch Size</label>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Iterations</label>
              <input
                type="number"
                value={config.maxIterations}
                onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        );

      case 'code-execution':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">JavaScript Code</label>
              <textarea
                value={config.code}
                onChange={(e) => setConfig({ ...config, code: e.target.value })}
                placeholder="// Your JavaScript code here&#10;return data;"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-40 font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                />
                <select
                  value={config.unit}
                  onChange={(e) => setConfig({ ...config, unit: e.target.value })}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="milliseconds">Milliseconds</option>
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Configuration for this node type is not yet implemented.</p>
          </div>
        );
    }
  };

  const getNodeIcon = (actionKind: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'http-request': <Globe className="w-5 h-5" />,
      'filter': <Filter className="w-5 h-5" />,
      'loop': <Repeat className="w-5 h-5" />,
      'code-execution': <Code className="w-5 h-5" />,
      'delay': <Clock className="w-5 h-5" />,
      'database-query': <Database className="w-5 h-5" />,
      'send-email': <Mail className="w-5 h-5" />,
      'file-operations': <FileText className="w-5 h-5" />
    };
    return iconMap[actionKind] || <Settings className="w-5 h-5" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center">
                <div className="text-[#4DE0F9] mr-3">
                  {node && getNodeIcon(node.data.actionKind)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {node?.data.label || 'Configure Node'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {node?.data.actionKind || 'Unknown node type'}
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

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {renderConfigForm()}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NodeConfigModal; 