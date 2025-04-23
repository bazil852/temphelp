import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Power, PowerOff, Book, Loader2, Trash2, Zap, Webhook, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebhookStore } from '../store/webhookStore';
import { useInfluencerStore } from '../store/influencerStore';
import { WebhookEvent } from '../types';
import { usePlanLimits } from '../hooks/usePlanLimits';
import WebhookDocs from './WebhookDocs';
import AutomationBuilder from './AutomationBuilder';

interface WebhookModalProps {
  onClose: () => void;
  influencerId?: string;
}

type CreateType = 'webhook' | 'automation' | null;

export default function WebhookModal({ onClose, influencerId }: WebhookModalProps) {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [createType, setCreateType] = useState<CreateType>(null);
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isIncoming, setIsIncoming] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>(influencerId || '');
  const [error, setError] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { automationsEnabled, loading: limitsLoading } = usePlanLimits();
  const { webhooks, fetchWebhooks, addWebhook, updateWebhook, deleteWebhook } = useWebhookStore();
  const { influencers } = useInfluencerStore();

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (!limitsLoading) {
      setTimeout(() => setIsModalLoading(false), 500);
    }
  }, [limitsLoading]);

  useEffect(() => {
    fetchWebhooks().catch(console.error);
  }, [fetchWebhooks]);

  const handleCreateAutomation = async () => {
    try {
      const event: WebhookEvent = createType === 'webhook' ? 'video.create' : 'video.completed';
      await addWebhook(name, webhookUrl, event, [selectedInfluencer], createType === 'webhook' ? 'automation' : 'webhook');
      setShowCreateForm(false);
      setShowCreateOptions(false);
      setName('');
      setWebhookUrl('');
      setSelectedInfluencer('');
      setCreateType(null);
      setIsIncoming(false);
      setError('');
    } catch (err) {
      setError('Failed to create webhook');
    }
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      await updateWebhook(webhook.id, { active: !webhook.active });
    } catch (err) {
      setError('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook(id);
    } catch (err) {
      setError('Failed to delete webhook');
    }
  };

  if (showDocs) {
    return <WebhookDocs onClose={() => setShowDocs(false)} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] sm:h-[80vh] flex flex-col"
        >
          {!automationsEnabled && !limitsLoading && (
            <>
              <div className="flex justify-end p-4">
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white/80 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-white mb-4">Upgrade Required</h2>
                <p className="text-white/60 mb-6">
                  Automations are available on our Pro plan. Upgrade your plan to access this feature.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/update-plan');
                  }}
                  className="inline-flex items-center px-6 py-2 rounded-full bg-[#4DE0F9]/10 text-[#4DE0F9] border border-[#4DE0F9]/20 hover:bg-[#4DE0F9]/20 transition-all duration-200"
                >
                  Upgrade Now
                </button>
              </div>
            </>
          )}

          {automationsEnabled && (
            <>
              <div className="flex justify-between items-start p-6 border-b border-white/5">
                <div className="relative">
                  <h2 className="text-xl font-semibold text-white">
                    Webhooks & Automations
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Manage your webhooks and automated workflows
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white/80 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {!showCreateForm && !showCreateOptions && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <button
                        onClick={() => setShowCreateOptions(true)}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#4DE0F9]/10 text-[#4DE0F9] border border-[#4DE0F9]/20 hover:bg-[#4DE0F9]/20 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Create New
                      </button>
                      <button
                        onClick={() => setShowDocs(true)}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#4DE0F9]/10 text-[#4DE0F9] border border-[#4DE0F9]/20 hover:bg-[#4DE0F9]/20 transition-all duration-200"
                      >
                        <Book className="h-4 w-4" />
                        Documentation
                      </button>
                    </div>

                    <div className="space-y-4">
                      {webhooks.length > 0 ? webhooks.map((webhook) => (
                        <motion.div
                          key={webhook.id}
                          className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl space-y-2 hover:scale-[1.01] transition-transform duration-200 shadow-lg relative group overflow-hidden"
                          whileHover={{ y: -2 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#4DE0F9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="flex items-center justify-between relative">
                            <div className="flex items-center gap-3">
                              {webhook.type === 'webhook' ? (
                                <Webhook className="h-5 w-5 text-[#4DE0F9]" />
                              ) : (
                                <Zap className="h-5 w-5 text-[#4DE0F9]" />
                              )}
                              <div>
                                <h3 className="font-medium text-white">{webhook.name}</h3>
                                <span className="text-xs text-white/60">
                                  {webhook.type === 'webhook' ? 'Incoming Webhook' : 'Outgoing Automation'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleWebhook(webhook)}
                                className={`p-2 transition-colors ${
                                  webhook.active 
                                    ? 'text-green-400 hover:text-green-500' 
                                    : 'text-white/40 hover:text-white/60'
                                }`}
                              >
                                {webhook.active ? (
                                  <Power className="h-5 w-5" />
                                ) : (
                                  <PowerOff className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-white/60">
                            {webhook.event === 'video.create' ? 'Generates videos via API' : 'Sends updates to webhook'}
                          </p>

                          <div className="flex items-center gap-2 mt-4">
                            <div className="flex-1 bg-white/5 rounded-full px-3 py-1 overflow-x-auto scrollbar-hide">
                              <code className="text-xs font-mono text-white/80">
                                {webhook.url}
                              </code>
                            </div>
                            <button
                              onClick={() => copyToClipboard(webhook.url, webhook.id)}
                              className="p-1.5 text-white/60 hover:text-white/80 transition-colors"
                              title="Copy URL"
                            >
                              {copiedId === webhook.id ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-white/60">
                          No webhooks configured yet
                        </div>
                      )}
                    </div>
                  </>
                )}

                {showCreateOptions && !showCreateForm && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setCreateType('webhook');
                        setIsIncoming(true);
                        setShowCreateForm(true);
                        setShowCreateOptions(false);
                      }}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#c9fffc] hover:bg-gray-50 transition-all"
                    >
                      <Zap className="h-8 w-8 mb-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">Incoming Webhook</span>
                      <span className="text-xs text-gray-500 mt-1">Create videos via API</span>
                    </button>
                    <button
                      onClick={() => {
                        setCreateType('automation');
                        setIsIncoming(false);
                        setShowCreateForm(true);
                        setShowCreateOptions(false);
                      }}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#c9fffc] hover:bg-gray-50 transition-all"
                    >
                      <Webhook className="h-8 w-8 mb-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">Outgoing Automation</span>
                      <span className="text-xs text-gray-500 mt-1">Send video updates to your endpoint</span>
                    </button>
                  </div>
                )}
            
                {showCreateForm && createType && (
                  <AutomationBuilder
                    name={name}
                    onNameChange={setName}
                    influencers={influencers}
                    selectedInfluencer={selectedInfluencer}
                    onInfluencerChange={setSelectedInfluencer}
                    webhookUrl={webhookUrl}
                    onWebhookUrlChange={setWebhookUrl}
                    onSubmit={handleCreateAutomation}
                    isIncoming={createType === 'webhook'}
                    onCancel={() => {
                      setShowCreateForm(false);
                      setShowCreateOptions(true);
                      setCreateType(null);
                    }}
                    error={error}
                  />
                )}
              </div>
            </>
          )}

          {isModalLoading && (
            <div className="absolute -right-12 top-1/2 -translate-y-1/2">
              <Loader2 className="h-6 w-6 animate-spin text-[#c9fffc]" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}