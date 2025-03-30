import React, { useState } from 'react';
import { Node } from 'reactflow';
import { X } from 'lucide-react';
import { NodeData } from './types';

interface NodePropertiesProps {
  node: Node<NodeData>;
  onClose: () => void;
  onUpdate: (config: any) => void;
}

export function NodeProperties({ node, onClose, onUpdate }: NodePropertiesProps) {
  const [config, setConfig] = useState(node.data.config);

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
                Webhook URL
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                placeholder="Enter webhook URL"
              />
            </div>
          </>
        );

      case 'action':
        return (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Action Type
              </label>
              <select
                value={config.action || ''}
                onChange={(e) => handleChange('action', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
              >
                <option value="">Select action</option>
                <option value="generate_video">Generate Video</option>
                <option value="send_webhook">Send Webhook</option>
                <option value="delay">Delay</option>
              </select>
              {config.action === 'delay' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white">
                    Delay Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.duration || ''}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                  />
                </div>
              )}
              {config.action === 'send_webhook' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => handleChange('webhookUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:border-[#c9fffc] focus:ring-1 focus:ring-[#c9fffc]"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          </>
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
    }
  };

  return (
    <div className="w-80 bg-[#1a1a1a] border-l border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-white">Node Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4">{renderFields()}</div>
    </div>
  );
}