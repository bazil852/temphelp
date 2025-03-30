import React, { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { Influencer } from '../types';

interface AutomationBuilderProps {
  name: string;
  onNameChange: (name: string) => void;
  influencers: Influencer[];
  selectedInfluencer: string;
  onInfluencerChange: (id: string) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isIncoming: boolean;
  error?: string;
}

export default function AutomationBuilder({
  name,
  onNameChange,
  influencers,
  selectedInfluencer,
  onInfluencerChange,
  webhookUrl,
  onWebhookUrlChange,
  onSubmit,
  onCancel,
  isIncoming,
  error
}: AutomationBuilderProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateWebhookUrl = (name: string) => {
    const serverBaseUrl = import.meta.env.VITE_AI_CLONE_BACKEND_PROXY;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const url = `${serverBaseUrl}/api/webhooks/${id}`;
    onWebhookUrlChange(url);
    return url;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId('webhook-url');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Automation Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            const newName = e.target.value;
            onNameChange(newName);
            if (isIncoming && newName) {
              generateWebhookUrl(newName);
            }
          }}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter a name for this automation"
        />
      </div>

      {/* Trigger Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">When this happens:</h3>
        {isIncoming ? (
          <div className="space-y-3 bg-gray-100 p-3 rounded">
            <div className="flex items-center gap-2 text-gray-700 flex-wrap">
              <span>Receive request at:</span>
              <code className="px-2 py-1 bg-gray-200 rounded text-sm font-mono flex-1">
                {name ? generateWebhookUrl(name) : 'Enter a name to generate URL'}
              </code>
              {name && (
                <button
                  onClick={() => copyToClipboard(generateWebhookUrl(name))}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  {copiedId === 'webhook-url' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-700">
            When video generation completes
          </div>
        )}
      </div>

      {/* Action Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Do this:</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Influencer
            </label>
            <select
              value={selectedInfluencer}
              onChange={(e) => onInfluencerChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an influencer</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.name}
                </option>
              ))}
            </select>
          </div>

          {!isIncoming && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send Updates To
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => onWebhookUrlChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter webhook URL"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Summary:</h3>
        <div className="flex items-center gap-2 text-gray-700">
          <span>
            {isIncoming ? 'When request received' : 'When video completes'}
          </span>
          <ArrowRight className="h-4 w-4" />
          <span>
            {selectedInfluencer ? 
              `Generate video with ${influencers.find(i => i.id === selectedInfluencer)?.name}` :
              'Select an influencer'
            }
          </span>
          {!isIncoming && webhookUrl && (
            <>
              <ArrowRight className="h-4 w-4" />
              <span>Send to webhook</span>
            </>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9] font-medium"
        >
          Create Automation
        </button>
      </div>
    </div>
  );
}