import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Plus, 
  Copy, 
  Edit2, 
  Trash2, 
  EyeOff, 
  Loader2, 
  Check, 
  AlertCircle,
  Calendar,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { env } from '../lib/env';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  key_preview: string;
  key_value?: string; // Only available on creation
}

interface ApiKeyManagementProps {
  className?: string;
}

export default function ApiKeyManagement({ className = '' }: ApiKeyManagementProps) {
  const { currentUser } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendUrl = env.AI_CLONE_BACKEND_PROXY;

  useEffect(() => {
    if (currentUser?.id) {
      fetchApiKeys();
    }
  }, [currentUser?.id]);

  const fetchApiKeys = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/keys?userId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!currentUser?.id || !newKeyName.trim()) return;
    
    setCreating(true);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          name: newKeyName.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewlyCreatedKey(data.data);
        setApiKeys(prev => [...prev, data.data]);
        setNewKeyName('');
        setShowCreateModal(false);
        setSuccess('API key created successfully! Make sure to copy it now - you won\'t be able to see it again.');
      } else {
        throw new Error(data.error || 'Failed to create API key');
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const updateApiKey = async (keyId: string, newName: string) => {
    if (!currentUser?.id || !newName.trim()) return;
    
    setUpdating(keyId);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          name: newName.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? { ...key, name: data.data.name } : key
        ));
        setEditingKey(null);
        setEditingName('');
        setSuccess('API key updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update API key');
      }
    } catch (err) {
      console.error('Error updating API key:', err);
      setError('Failed to update API key');
    } finally {
      setUpdating(null);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!currentUser?.id) return;
    
    setDeleting(keyId);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
        setSuccess('API key deleted successfully');
      } else {
        throw new Error(data.error || 'Failed to delete API key');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key');
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setNewlyCreatedKey(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`bg-[#0D1117]/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] p-6 sm:p-8 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-[#4DE0F9]" />
          <h2 className="text-xl font-bold text-white">API Key Management</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            clearMessages();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create New Key
        </motion.button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-2"
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}

        {newlyCreatedKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-6 bg-[#4DE0F9]/10 border border-[#4DE0F9]/30 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-[#4DE0F9]" />
              <h3 className="text-lg font-semibold text-white">Your New API Key</h3>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              ⚠️ This is the only time you'll see the full key. Copy it now and store it securely!
            </p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#4DE0F9] break-all">{newlyCreatedKey.key_value}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(newlyCreatedKey.key_value!, newlyCreatedKey.id)}
                  className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copiedKey === newlyCreatedKey.id ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#4DE0F9]" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg text-gray-300">No API keys found</p>
          <p className="text-sm text-gray-500 mt-2">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#4DE0F9]/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingKey === apiKey.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 border border-white/10 focus:border-[#4DE0F9] focus:ring-2 focus:ring-[#4DE0F9]/20 transition-all duration-200"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateApiKey(apiKey.id, editingName);
                          }
                        }}
                        autoFocus
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateApiKey(apiKey.id, editingName)}
                        disabled={updating === apiKey.id}
                        className="p-2 rounded-lg bg-[#4DE0F9] text-black hover:bg-[#4DE0F9]/90 transition-colors disabled:opacity-50"
                      >
                        {updating === apiKey.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditingKey(null);
                          setEditingName('');
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      </motion.button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{apiKey.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(apiKey.created_at)}</span>
                        </div>
                        <div className="font-mono bg-black/30 px-2 py-1 rounded">
                          {apiKey.key_preview}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(apiKey.key_preview, apiKey.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Copy key preview"
                  >
                    {copiedKey === apiKey.id ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingKey(apiKey.id);
                      setEditingName(apiKey.name);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Edit key name"
                  >
                    <Edit2 className="h-4 w-4 text-gray-400" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteApiKey(apiKey.id)}
                    disabled={deleting === apiKey.id}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    title="Delete key"
                  >
                    {deleting === apiKey.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-400" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0D1117] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-6">
                <Key className="h-5 w-5 text-[#4DE0F9]" />
                <h3 className="text-xl font-bold text-white">Create New API Key</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production App, Mobile App"
                  className="w-full bg-white/10 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-[#4DE0F9] focus:ring-2 focus:ring-[#4DE0F9]/20 transition-all duration-200 placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newKeyName.trim()) {
                      createApiKey();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createApiKey}
                  disabled={creating || !newKeyName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-black bg-[#4DE0F9] hover:bg-[#4DE0F9]/90 hover:shadow-lg hover:shadow-[#4DE0F9]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Key'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Information */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
        <h4 className="text-sm font-semibold text-white mb-2">How to use your API keys:</h4>
        <div className="space-y-2 text-xs text-gray-400">
          <div>
            <strong>Bearer Token:</strong> <code className="bg-black/30 px-1 rounded">Authorization: Bearer your_api_key</code>
          </div>
          <div>
            <strong>API Key Header:</strong> <code className="bg-black/30 px-1 rounded">x-api-key: your_api_key</code>
          </div>
          <p className="text-yellow-400 mt-2">
            ⚠️ Keep your API keys secure and never expose them in client-side code
          </p>
        </div>
      </div>
    </motion.div>
  );
}
