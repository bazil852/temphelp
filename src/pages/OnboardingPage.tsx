import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Bot } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function OnboardingPage() {
  const navigate = useNavigate();
  const setSettings = useAuthStore((state) => state.setSettings);
  const [heygenApiKey, setHeygenApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, store these securely in your backend
    setSettings({ heygenApiKey, openaiApiKey });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Complete Your Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your API keys to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="heygen" className="flex items-center text-sm font-medium text-gray-700">
                <Key className="h-4 w-4 mr-2" />
                HeyGen API Key
              </label>
              <input
                id="heygen"
                type="password"
                required
                value={heygenApiKey}
                onChange={(e) => setHeygenApiKey(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="openai" className="flex items-center text-sm font-medium text-gray-700">
                <Bot className="h-4 w-4 mr-2" />
                OpenAI API Key
              </label>
              <input
                id="openai"
                type="password"
                required
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}