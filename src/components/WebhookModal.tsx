import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Power, PowerOff, Book, Loader2, Trash2, Zap, Webhook, Copy, Check } from 'lucide-react';
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] sm:h-[80vh] flex flex-col">
        {!automationsEnabled && !limitsLoading && (
          <>
            <div className='flex justify-end'>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upgrade Required</h2>
              <p className="text-gray-600 mb-6">
                Automations are available on our Pro plan. Upgrade your plan to access this feature.
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/update-plan');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Now
              </button>
            </div>
          </>
        )}

        {automationsEnabled && (
          <>
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div className="relative">
                <h2 className="text-xl font-semibold text-gray-900">
                  Webhooks & Automations
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your webhooks and automated workflows
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {!showCreateForm && !showCreateOptions && (
                <>
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setShowCreateOptions(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9]"
                    >
                      <Plus className="h-4 w-4" />
                      Create New
                    </button>
                    <button
                      onClick={() => setShowDocs(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9]"
                    >
                      <Book className="h-4 w-4" />
                      Documentation
                    </button>
                  </div>

                  <div className="space-y-4">
                    {webhooks.length > 0 ? webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="p-4 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                          <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                          <span className="font-xs text-gray-400">
                            {webhook.type === 'webhook' ? 'Incoming Webhook' : 'Outgoing Automation'}
                          </span>
                          <p className="text-sm text-gray-500">
                            {webhook.event === 'video.create' ? 'Generates videos via API' : 'Sends updates to webhook'}
                          </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleWebhook(webhook)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              {webhook.active ? (
                                <Power className="h-5 w-5" />
                              ) : (
                                <PowerOff className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        {(webhook.type === 'automation' || webhook.type === 'webhook') && (
                          <div className="flex items-center gap-2 mt-2 bg-gray-100 p-2 rounded">
                            <span className="text-sm text-gray-600">Webhook URL:</span>
                            <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded flex-1">
                              {webhook.type === 'webhook' 
                                ? `${import.meta.env.VITE_AI_CLONE_BACKEND_PROXY}/api/webhooks/${webhook.name.toLowerCase().replace(/\s+/g, '-')}`
                                : webhook.url}
                            </code>
                            <button
                              onClick={() => copyToClipboard(
                                webhook.type === 'webhook'
                                  ? `${import.meta.env.VITE_AI_CLONE_BACKEND_PROXY}/api/webhooks/${webhook.name.toLowerCase().replace(/\s+/g, '-')}`
                                  : webhook.url,
                                webhook.id
                              )}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy webhook URL"
                            >
                              {copiedId === webhook.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        No automations created yet
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
      </div>
    </div>
  );
}