import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { NodeData } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { WebhookDataViewer } from './WebhookDataViewer';

interface NodePropertiesProps {
  node: Node<NodeData>;
  onClose: () => void;
  onUpdate: (config: any) => void;
  nodes: Node<NodeData>[];
  edges: any[];
}

export function NodeProperties({ node, onClose, onUpdate, nodes, edges }: NodePropertiesProps) {
  const [config, setConfig] = useState(node.data.config);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWebhookTest, setShowWebhookTest] = useState(false);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (node.data.type === 'action' && config.action === 'generate_video') {
      fetchInfluencers();
    }
  }, [node.data.type, config.action]);

  const fetchInfluencers = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      setInfluencers(data || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  const renderFields = () => {
    switch (node.data.type) {
      case 'trigger':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Trigger Type
              </label>
              <select
                value={config.triggerType || 'webhook'}
                onChange={(e) => handleChange('triggerType', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="webhook">Webhook</option>
                <option value="manual">Manual</option>
                <option value="schedule">Schedule</option>
              </select>
            </div>

            {config.triggerType === 'webhook' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Webhook URL
                  </label>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <code className="text-[#c9fffc] text-sm break-all">
                      {`https://your-domain.netlify.app/.netlify/functions/webhook?workflowId=${node.id}`}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Test Webhook
                  </label>
                  <button
                    onClick={() => setShowWebhookTest(true)}
                    className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] transition-colors"
                  >
                    Listen for Test Webhook
                  </button>
                </div>

                {showWebhookTest && (
                  <WebhookDataViewer
                    onClose={() => setShowWebhookTest(false)}
                    onUseData={(path) => {
                      // Handle using the selected data path
                      console.log('Using path:', path);
                      setShowWebhookTest(false);
                    }}
                  />
                )}
              </div>
            )}
          </>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Action Type
              </label>
              <select
                value={config.action || ''}
                onChange={(e) => handleChange('action', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="">Select action</option>
                <option value="generate_video">Generate Video</option>
                <option value="send_email">Send Email</option>
                <option value="webhook">Send Webhook</option>
              </select>
            </div>

            {config.action === 'generate_video' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Influencer
                  </label>
                  {isLoading ? (
                    <div className="text-sm text-gray-400">Loading influencers...</div>
                  ) : influencers.length === 0 ? (
                    <div className="text-sm text-gray-400">No influencers available</div>
                  ) : (
                    <select
                      value={config.influencerId || ''}
                      onChange={(e) => handleChange('influencerId', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                    >
                      <option value="">Select an influencer</option>
                      {influencers.map((influencer) => (
                        <option key={influencer.id} value={influencer.id}>
                          {influencer.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Script Source
                  </label>
                  <select
                    value={config.scriptSource || 'manual'}
                    onChange={(e) => handleChange('scriptSource', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  >
                    <option value="manual">Manual Input</option>
                  </select>
                </div>
                {config.scriptSource === 'manual' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Script
                    </label>
                    <textarea
                      value={config.script || ''}
                      onChange={(e) => handleChange('script', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                      rows={4}
                      placeholder="Enter the script for the video..."
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'filter':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Condition
              </label>
              <input
                type="text"
                value={config.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="Enter condition"
              />
            </div>
          </>
        );

      case 'gen-ai':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Model Selection
              </label>
              <select
                value={config.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="">Select a model</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
              <div className="mt-4">
                <label className="block text-sm font-medium text-white">
                  System Prompt Source
                </label>
                <select
                  value={config.promptSource || 'manual'}
                  onChange={(e) => handleChange('promptSource', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                >
                  <option value="manual">Manual Input</option>
                </select>
              </div>
              {config.promptSource === 'manual' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white">
                    System Prompt
                  </label>
                  <textarea
                    value={config.systemPrompt || ''}
                    onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                    rows={4}
                    placeholder="Enter the system prompt for the AI model..."
                  />
                </div>
              )}
            </div>
          </>
        );

      case 'return':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Return Type
              </label>
              <select
                value={config.returnType || 'end'}
                onChange={(e) => handleChange('returnType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="end">End Flow</option>
                <option value="url">Return URL</option>
              </select>
              {config.returnType === 'url' && (
                <>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white">
                      URL
                    </label>
                    <input
                      type="text"
                      value={config.url || ''}
                      onChange={(e) => handleChange('url', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                      placeholder="Enter the return URL..."
                    />
                  </div>
                </>
              )}
            </div>
          </>
        );

      case 'http-request':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                HTTP Method
              </label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                URL
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Authentication
              </label>
              <select
                value={config.authentication || 'none'}
                onChange={(e) => handleChange('authentication', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>
            {config.authentication === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bearer Token
                </label>
                <input
                  type="password"
                  value={config.bearerToken || ''}
                  onChange={(e) => handleChange('bearerToken', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  placeholder="Enter bearer token"
                />
              </div>
            )}
            {['POST', 'PUT', 'PATCH'].includes(config.method) && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  value={config.body || ''}
                  onChange={(e) => handleChange('body', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
            )}
          </div>
        );

      case 'switch':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Field to Check
              </label>
              <input
                type="text"
                value={config.field || ''}
                onChange={(e) => handleChange('field', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="e.g., $.data.status"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Operator
              </label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="not_equals">Not Equals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Conditions
              </label>
              {(config.conditions || []).map((condition: any, index: number) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={condition.value || ''}
                    onChange={(e) => {
                      const newConditions = [...(config.conditions || [])];
                      newConditions[index] = { ...condition, value: e.target.value };
                      handleChange('conditions', newConditions);
                    }}
                    className="flex-1 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                    placeholder="Condition value"
                  />
                  <button
                    onClick={() => {
                      const newConditions = [...(config.conditions || [])];
                      newConditions.splice(index, 1);
                      handleChange('conditions', newConditions);
                    }}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newConditions = [...(config.conditions || []), { value: '', output: `output_${Date.now()}` }];
                  handleChange('conditions', newConditions);
                }}
                className="px-3 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9]"
              >
                Add Condition
              </button>
            </div>
          </div>
        );

      case 'loop':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Loop Type
              </label>
              <select
                value={config.loopType || 'for_each'}
                onChange={(e) => handleChange('loopType', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="for_each">For Each</option>
                <option value="fixed_count">Fixed Count</option>
              </select>
            </div>
            {config.loopType === 'for_each' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Collection Path
                </label>
                <input
                  type="text"
                  value={config.collection || ''}
                  onChange={(e) => handleChange('collection', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  placeholder="$.data.items"
                />
              </div>
            )}
            {config.loopType === 'fixed_count' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Count
                </label>
                <input
                  type="number"
                  value={config.count || 1}
                  onChange={(e) => handleChange('count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  min="1"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Item Variable Name
              </label>
              <input
                type="text"
                value={config.itemName || 'item'}
                onChange={(e) => handleChange('itemName', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="item"
              />
            </div>
          </div>
        );

      case 'sequence':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Number of Branches
              </label>
              <select
                value={config.branchCount || 2}
                onChange={(e) => handleChange('branchCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value={2}>2 Branches</option>
                <option value={3}>3 Branches</option>
                <option value={4}>4 Branches</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="waitForAll"
                checked={config.waitForAll || false}
                onChange={(e) => handleChange('waitForAll', e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-[#c9fffc] focus:ring-[#c9fffc]"
              />
              <label htmlFor="waitForAll" className="text-sm text-white">
                Wait for all branches to complete
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="continueOnError"
                checked={config.continueOnError || false}
                onChange={(e) => handleChange('continueOnError', e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-[#c9fffc] focus:ring-[#c9fffc]"
              />
              <label htmlFor="continueOnError" className="text-sm text-white">
                Continue on error
              </label>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duration
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={config.duration || 5}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  min="1"
                />
                <select
                  value={config.unit || 'seconds'}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Wait Until (Optional)
              </label>
              <input
                type="datetime-local"
                value={config.until || ''}
                onChange={(e) => handleChange('until', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              />
              <p className="mt-1 text-xs text-gray-400">
                If set, will wait until this specific time instead of using duration
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-400">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4DE0F9] to-[#A855F7] flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {node.data.type === 'trigger' ? '⚡' : 
                   node.data.type === 'action' ? '🎬' :
                   node.data.type === 'gen-ai' ? '🧠' :
                   node.data.type === 'http-request' ? '🌐' :
                   node.data.type === 'switch' ? '🔀' :
                   node.data.type === 'loop' ? '🔄' :
                   node.data.type === 'sequence' ? '📋' :
                   node.data.type === 'delay' ? '⏱️' :
                   node.data.type === 'filter' ? '🔍' : '⚙️'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{node.data.label}</h2>
                <p className="text-sm text-gray-400 capitalize">{node.data.type} Node</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
            >
              <X className="h-5 w-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {renderFields()}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
            <div className="text-sm text-gray-400">
              Node ID: <code className="text-[#4DE0F9]">{node.id}</code>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#4DE0F9] text-black rounded-lg hover:bg-[#A855F7] transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}