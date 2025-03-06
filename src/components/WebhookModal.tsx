import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Power, PowerOff, Copy, Check, Book, Loader2 } from 'lucide-react';
import { useWebhookStore } from '../store/webhookStore';
import { useInfluencerStore } from '../store/influencerStore';
import { WebhookEvent } from '../types';
import { usePlanLimits } from '../hooks/usePlanLimits';
import WebhookDocs from './WebhookDocs';

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
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [createType, setCreateType] = useState<CreateType>(null);
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>(
    influencerId ? [influencerId] : []
  );
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { automationsEnabled, loading: limitsLoading } = usePlanLimits();
  const { webhooks, fetchWebhooks, addWebhook, updateWebhook, deleteWebhook } = useWebhookStore();
  const { influencers } = useInfluencerStore();
  console.log("Usage : ", automationsEnabled);
  
  useEffect(() => {
    // When limitsLoading changes to false, wait a bit then hide modal loading
    if (!limitsLoading) {
      setTimeout(() => setIsModalLoading(false), 500);
    }
  }, [limitsLoading]);

  useEffect(() => {
    fetchWebhooks().catch(console.error);
  }, [fetchWebhooks]);

  const generateWebhookUrl = (name) => {
    const serverBaseUrl = 'https://aiinfluencer-a54d7599fa86.herokuapp.com'; // Replace with your actual server URL
    const id = name.toLowerCase().replace(/\s+/g, '-'); // Create an identifier from the name
    return `${serverBaseUrl}/api/webhooks/${id}`;
  };

  console.log("Webhook: ", webhooks);

  const handleCreateWebhook = async () => {
    if (!name) {
      setError('Name is required');
      return;
    }

    if (selectedInfluencers.length === 0) {
      setError('Please select at least one influencer');
      return;
    }

    try {
      const event: WebhookEvent = createType === 'webhook' ? 'video.create' : 'video.completed';

      // Auto-generate the webhook URL for 'webhook' type
      const finalWebhookUrl = createType === 'webhook' ? generateWebhookUrl(name) : webhookUrl;

      // Check for missing URL only for 'automation'
      if (createType === 'automation' && !webhookUrl) {
        setError('Webhook URL is required for automations');
        return;
      }

      await addWebhook(name, finalWebhookUrl, event, selectedInfluencers, createType);

      // Reset state after successful creation
      setShowCreateForm(false);
      setShowCreateOptions(false);
      setName('');
      setWebhookUrl('');
      setSelectedInfluencers([]);
      setCreateType(null);
      setError('');
    } catch (err) {
      setError('Failed to create webhook');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6">
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
            <div className="flex justify-between items-start mb-6">
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
                    className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create New
                  </button>
                  <button
                    onClick={() => setShowDocs(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
                  >
                    <Book className="h-4 w-4" />
                    Documentation
                  </button>
                </div>

                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                        <span className="font-xs text-gray-400">
                          {webhook.type}
                        </span>
                        {webhook.event === 'video.create' ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={generateWebhookUrl(webhook.name)}
                              readOnly
                              className="text-sm text-gray-500 bg-transparent border-none p-0"
                            />
                            <button
                              onClick={() => copyToClipboard(generateWebhookUrl(webhook.name), webhook.name)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {copiedId === webhook.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{webhook.url}</p>
                        )}
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
                  ))}
                </div>
              </>
            )}

            {showCreateOptions && !showCreateForm && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => {
                      setCreateType('webhook');
                      setShowCreateForm(true);
                    }}
                    className="aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-8 w-8 mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">Incoming Webhook</span>
                    <span className="text-xs text-gray-500 mt-1">Create videos via API</span>
                  </button>
                  <button
                    onClick={() => {
                      setCreateType('automation');
                      setShowCreateForm(true);
                    }}
                    className="aspect-square flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-8 w-8 mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">Outgoing Automation</span>
                    <span className="text-xs text-gray-500 mt-1">Send video updates to your endpoint</span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateOptions(false);
                      setCreateType(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {showCreateForm && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter webhook name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Influencers</label>
                  <div className="mt-2 space-y-2">
                    {influencers.map((inf) => (
                      <label key={inf.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedInfluencers.includes(inf.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInfluencers([...selectedInfluencers, inf.id]);
                            } else {
                              setSelectedInfluencers(selectedInfluencers.filter((id) => id !== inf.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{inf.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {createType === 'automation' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateType(null);
                      setSelectedInfluencers([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWebhook}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
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