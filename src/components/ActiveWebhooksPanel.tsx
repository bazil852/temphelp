import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Webhook, Power, PowerOff, Trash2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWebhookStore } from '../store/webhookStore';
import { useAuthStore } from '../store/authStore';

interface Webhook {
  id: string;
  name: string;
  url: string;
  type: 'webhook' | 'automation';
  event: 'video.create' | 'video.completed';
  active: boolean;
  influencer_ids: string[];
  user_id: string;
}

export default function ActiveWebhooksPanel() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { updateWebhook, deleteWebhook } = useWebhookStore();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (currentUser?.id) {
      fetchWebhooks();
    }
  }, [currentUser?.id]);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError('Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      await updateWebhook(webhook.id, { active: !webhook.active });
      setWebhooks(webhooks.map(w => 
        w.id === webhook.id ? { ...w, active: !w.active } : w
      ));
    } catch (err) {
      console.error('Error toggling webhook:', err);
      setError('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook(id);
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Failed to delete webhook');
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
      >
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#c9fffc]" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col h-[400px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Webhook className="w-4 h-4" />
          Active Webhooks
        </h3>
        <span className="text-cyan-500 text-sm font-medium">{webhooks.length} Active</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-md text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        <AnimatePresence>
          {webhooks.length > 0 ? (
            webhooks.map((webhook) => (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-sm font-medium">{webhook.name}</h4>
                    <span className="text-xs text-gray-400">
                      {webhook.type === 'webhook' ? 'Incoming Webhook' : 'Outgoing Automation'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {webhook.event === 'video.create' ? 'Generates videos via API' : 'Sends updates to webhook'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWebhook(webhook)}
                      className="p-1.5 text-gray-400 hover:text-gray-300"
                      title={webhook.active ? 'Disable webhook' : 'Enable webhook'}
                    >
                      {webhook.active ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="p-1.5 text-red-400 hover:text-red-300"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <span className="text-xs text-gray-400">Webhook URL:</span>
                  <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded flex-1">
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
                    className="p-1 text-gray-500 hover:text-gray-300"
                    title="Copy webhook URL"
                  >
                    {copiedId === webhook.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4 text-sm">
              No active webhooks
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 