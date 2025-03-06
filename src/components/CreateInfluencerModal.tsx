import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useInfluencerStore } from '../store/influencerStore';
import { Influencer } from '../types';

interface CreateInfluencerModalProps {
  influencer?: Influencer | null;
  onClose: () => void;
}

export default function CreateInfluencerModal({ influencer, onClose }: CreateInfluencerModalProps) {
  const [name, setName] = useState(influencer?.name || '');
  const [templateId, setTemplateId] = useState(influencer?.templateId || '');
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addInfluencer = useInfluencerStore((state) => state.addInfluencer);
  const updateInfluencer = useInfluencerStore((state) => state.updateInfluencer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (influencer) {
        await updateInfluencer(influencer.id, { name, templateId });
      } else {
        await addInfluencer(name, templateId);
      }
      onClose();
    } catch (err) {
      console.error('Error saving influencer:', err);
      setError('Failed to save influencer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {influencer ? 'Edit Influencer' : 'Create New Influencer'}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Influencer Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                HeyGen Template ID
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              id="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          {showHelp && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-2">How to get your Template ID:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your HeyGen account</li>
                <li>Go to the Templates section</li>
                <li>Create or select an existing template</li>
                <li>The Template ID is in the URL after /templates/</li>
                <li>Example: If URL is app.heygen.com/templates/abc123, the ID is abc123</li>
              </ol>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (influencer ? 'Save Changes' : 'Create Influencer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}