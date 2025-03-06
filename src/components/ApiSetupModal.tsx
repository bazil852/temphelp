import React, { useState } from 'react';
import { Key, Bot, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ApiSetupModal({ onClose }: { onClose: () => void }) {
  const updateApiKeys = useAuthStore((state) => state.updateApiKeys);
  const [openaiKey, setOpenaiKey] = useState('');
  const [heygenKey, setHeygenKey] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openaiKey || !heygenKey) {
      setError('Both API keys are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      updateApiKeys(openaiKey, heygenKey);
      onClose();
    } catch (err) {
      setError('Failed to save API keys');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Complete Your Setup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your API keys to start creating content
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="openai-key" className="flex items-center text-sm font-medium text-gray-700">
              <Bot className="h-4 w-4 mr-2" />
              OpenAI API Key
            </label>
            <input
              type="password"
              id="openai-key"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="sk-..."
              required
            />
          </div>

          <div>
            <label htmlFor="heygen-key" className="flex items-center text-sm font-medium text-gray-700">
              <Key className="h-4 w-4 mr-2" />
              HeyGen API Key
            </label>
            <input
              type="password"
              id="heygen-key"
              value={heygenKey}
              onChange={(e) => setHeygenKey(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your HeyGen API key"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}