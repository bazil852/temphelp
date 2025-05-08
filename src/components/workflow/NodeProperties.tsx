import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeData } from './types';
import { useInfluencerStore } from '../../store/influencerStore';

interface NodePropertiesProps {
  node: Node<NodeData>;
  onClose: () => void;
  onUpdate: (config: any) => void;
  nodes: Node<NodeData>[];
  edges: any[];
}

export function NodeProperties({ node, onClose, onUpdate, nodes, edges }: NodePropertiesProps) {
  const [config, setConfig] = useState(node.data.config);
  const { influencers, fetchInfluencers } = useInfluencerStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchInfluencers()
      .then(() => {
        console.log('Influencers loaded:', influencers);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading influencers:', error);
        setIsLoading(false);
      });
  }, [fetchInfluencers]);

  // Find the connected webhook trigger node
  const getConnectedWebhookNode = () => {
    const incomingEdge = edges.find(edge => edge.target === node.id);
    if (!incomingEdge) return null;
    
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode || sourceNode.type !== 'trigger') return null;
    
    return sourceNode.data.config.triggerType === 'webhook' ? sourceNode : null;
  };

  // Find connected Generate Video node
  const getConnectedGenerateVideoNode = () => {
    const incomingEdge = edges.find(edge => edge.target === node.id);
    if (!incomingEdge) return null;
    
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode || sourceNode.type !== 'action' || sourceNode.data.config.action !== 'generate_video') return null;
    
    return sourceNode;
  };

  // Find connected Gen AI nodes
  const getConnectedGenAiNode = () => {
    const incomingEdge = edges.find(edge => edge.target === node.id);
    if (!incomingEdge) return null;
    
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode || sourceNode.type !== 'gen-ai') return null;
    
    return sourceNode;
  };

  const webhookNode = getConnectedWebhookNode();
  const generateVideoNode = getConnectedGenerateVideoNode();
  const genAiNode = getConnectedGenAiNode();
  const webhookPromptPath = webhookNode?.data.config.promptParameter;

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  const renderFields = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Trigger Type
              </label>
              <select
                value={config.triggerType || ''}
                onChange={(e) => handleChange('triggerType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="">Select trigger type</option>
                <option value="webhook">Webhook Trigger</option>
                <option value="video_generated">Video Generated</option>
                <option value="video_failed">Video Failed</option>
                <option value="influencer_created">Influencer Created</option>
              </select>
              {config.triggerType === 'webhook' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white">
                    Prompt Parameter
                  </label>
                  <input
                    type="text"
                    value={config.promptParameter || ''}
                    onChange={(e) => handleChange('promptParameter', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                    placeholder="e.g. data.prompt or message.text"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Specify the JSON path to extract the prompt from the webhook payload
                  </p>
                </div>
              )}
            </div>
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
                value={config.action || 'generate_video'}
                onChange={(e) => handleChange('action', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="generate_video">Generate Video</option>
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
                    {webhookNode && (
                      <option value="webhook">From Webhook: {webhookNode.data.config.promptParameter}</option>
                    )}
                    {genAiNode && (
                      <option value="gen-ai">From Gen AI Response</option>
                    )}
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
                {config.scriptSource === 'webhook' && webhookNode && (
                  <div className="text-sm text-gray-300">
                    Script will be automatically extracted from the webhook payload using the path: <code className="bg-white/5 px-2 py-1 rounded">{webhookNode.data.config.promptParameter}</code>
                  </div>
                )}
                {config.scriptSource === 'gen-ai' && genAiNode && (
                  <div className="text-sm text-gray-300">
                    Script will be automatically taken from the Gen AI node's response
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
                  {webhookNode && (
                    <option value="webhook">From Webhook: {webhookNode.data.config.promptParameter}</option>
                  )}
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
              {config.promptSource === 'webhook' && webhookNode && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400">
                    System prompt will be automatically extracted from the webhook payload using the path: <code className="bg-gray-800 px-1 py-0.5 rounded">{webhookNode.data.config.promptParameter}</code>
                  </p>
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
                  {generateVideoNode && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white">
                        Video Handling
                      </label>
                      <select
                        value={config.videoHandling || 'notification'}
                        onChange={(e) => handleChange('videoHandling', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                      >
                        <option value="notification">Notification Only</option>
                        <option value="include">Include Generated Video</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-400">
                        {config.videoHandling === 'notification' 
                          ? 'Only send a notification when the video is ready'
                          : 'Include the generated video in the response'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-80 bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">{node.data.label}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-300 hover:text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderFields()}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}