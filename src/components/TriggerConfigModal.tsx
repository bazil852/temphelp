import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Trash2, Clock, Globe, Play, Plus, Minus,
  Calendar, Settings, Shield, Zap, Code, Copy, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import { 
  TriggerNode, WebhookCfg, ScheduleCfg, ManualCfg,
  getDefaultWebhookConfig, getDefaultScheduleConfig, getDefaultManualConfig
} from '../types/triggers';
import { webhookTestService, WebhookTestState } from '../services/webhookTestService';

interface TriggerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: any; // The trigger node
  onSave: (nodeId: string, config: any) => void;
  onDelete?: (nodeId: string) => void;
  workflowId?: string;
}

const TriggerConfigModal: React.FC<TriggerConfigModalProps> = ({ 
  isOpen, onClose, node, onSave, onDelete, workflowId 
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'advanced' | 'test'>('config');
  const [config, setConfig] = useState<any>({});
  const [triggerSubtype, setTriggerSubtype] = useState<'webhook' | 'schedule' | 'manual'>('webhook');
  const [testState, setTestState] = useState<WebhookTestState>({ state: 'idle' });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (node) {
      const nodeConfig = node.data?.config || {};
      const subtype = node.data?.actionKind || 'webhook';
      
      setTriggerSubtype(subtype);
      
      // Set default config based on subtype if no config exists
      if (Object.keys(nodeConfig).length === 0) {
        switch (subtype) {
          case 'webhook-trigger':
            setConfig(getDefaultWebhookConfig());
            break;
          case 'schedule-trigger':
            setConfig(getDefaultScheduleConfig());
            break;
          case 'manual-trigger':
            setConfig(getDefaultManualConfig());
            break;
          default:
            setConfig(getDefaultWebhookConfig());
        }
      } else {
        setConfig(nodeConfig);
      }
    }
  }, [node]);

  const handleSave = () => {
    onSave(node.id, { ...config, subtype: triggerSubtype });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && node.id !== 'start') {
      onDelete(node.id);
      onClose();
    }
  };

  // Webhook testing functions
  const handleTestWebhook = async () => {
    if (!workflowId) {
      console.error('No workflow ID found');
      return;
    }

    try {
      const testResult = await webhookTestService.armWebhookTest(node.id, workflowId);
      setTestState(testResult);
      
      // Poll for updates
      const pollInterval = setInterval(() => {
        const currentState = webhookTestService.getTestState(node.id);
        if (currentState) {
          setTestState(currentState);
          
          // Stop polling if captured or error
          if (currentState.state === 'captured' || currentState.state === 'error') {
            clearInterval(pollInterval);
            
            // If captured, save the sample payload
            if (currentState.state === 'captured' && currentState.samplePayload) {
              setConfig({ ...config, samplePayload: currentState.samplePayload });
            }
          }
        }
      }, 1000);

      // Clean up polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error testing webhook:', error);
      setTestState({ 
        state: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleCopyWebhookUrl = async () => {
    if (testState.webhookUrl) {
      const success = await webhookTestService.copyWebhookUrl(testState.webhookUrl);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleCancelTest = () => {
    webhookTestService.cancelTest(node.id);
    setTestState({ state: 'idle' });
  };

  const handleUseSample = () => {
    if (testState.samplePayload) {
      setConfig({ ...config, samplePayload: testState.samplePayload });
      setTestState({ state: 'idle' });
      setActiveTab('config');
    }
  };

  const getSubtypeFromActionKind = (actionKind: string): 'webhook' | 'schedule' | 'manual' => {
    if (actionKind.includes('webhook')) return 'webhook';
    if (actionKind.includes('schedule')) return 'schedule';
    if (actionKind.includes('manual')) return 'manual';
    return 'webhook';
  };

  const renderWebhookConfig = () => (
    <div className="space-y-6">
      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-3">
          {/* Path */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Webhook Path <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.path || ''}
              onChange={(e) => setConfig({ ...config, path: e.target.value })}
              placeholder="/incoming/webhook"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              The URL path where this webhook will be accessible
            </p>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">HTTP Method</label>
            <select
              value={config.method || 'POST'}
              onChange={(e) => setConfig({ ...config, method: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* Authentication */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Authentication</label>
            <div className="space-y-1">
              {['none', 'basic', 'bearer', 'headerKey'].map((auth) => (
                <label key={auth} className="flex items-center">
                  <input
                    type="radio"
                    name="authentication"
                    value={auth}
                    checked={config.authentication === auth}
                    onChange={(e) => setConfig({ ...config, authentication: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-white text-sm capitalize">{auth === 'headerKey' ? 'Header Key' : auth}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Query Parameters</label>
            <div className="space-y-2">
              {(config.queryParams || []).map((param: any, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => {
                      const newParams = [...(config.queryParams || [])];
                      newParams[index].name = e.target.value;
                      setConfig({ ...config, queryParams: newParams });
                    }}
                    placeholder="Parameter name"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(e) => {
                        const newParams = [...(config.queryParams || [])];
                        newParams[index].required = e.target.checked;
                        setConfig({ ...config, queryParams: newParams });
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-300">Required</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newParams = (config.queryParams || []).filter((_: any, i: number) => i !== index);
                      setConfig({ ...config, queryParams: newParams });
                    }}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newParams = [...(config.queryParams || []), { name: '', required: false }];
                  setConfig({ ...config, queryParams: newParams });
                }}
                className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Parameter
              </button>
            </div>
          </div>

          {/* Response Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Response Mode</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="responseMode"
                  value="onReceived"
                  checked={config.responseMode === 'onReceived'}
                  onChange={(e) => setConfig({ ...config, responseMode: e.target.value })}
                  className="mr-2"
                />
                <span className="text-white">Acknowledge immediately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="responseMode"
                  value="whenFinished"
                  checked={config.responseMode === 'whenFinished'}
                  onChange={(e) => setConfig({ ...config, responseMode: e.target.value })}
                  className="mr-2"
                />
                <span className="text-white">Wait for workflow completion</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-3">
          {/* Sample Payload Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sample Payload (JSON)</label>
            <textarea
              value={typeof config.samplePayload === 'string' 
                ? config.samplePayload 
                : JSON.stringify(config.samplePayload || {}, null, 2)
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, samplePayload: parsed });
                } catch {
                  setConfig({ ...config, samplePayload: e.target.value });
                }
              }}
              placeholder='{\n  "orderId": "12345",\n  "customer": {\n    "name": "John Doe",\n    "email": "john@example.com"\n  },\n  "total": 99.99\n}'
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-32 font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sample data structure for testing the workflow. Use this if webhook testing is not available.
            </p>
          </div>

          {/* Accept Binary */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.acceptBinary || false}
                onChange={(e) => setConfig({ ...config, acceptBinary: e.target.checked })}
                className="mr-2"
              />
              <span className="text-white text-sm">Accept Binary Data</span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Keep raw Buffer for binary payloads instead of parsing as JSON
            </p>
          </div>

          {/* Static Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Static Headers</label>
            <div className="space-y-2">
              {Object.entries(config.headers || {}).map(([key, value], index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newHeaders = { ...config.headers };
                      delete newHeaders[key];
                      newHeaders[e.target.value] = value;
                      setConfig({ ...config, headers: newHeaders });
                    }}
                    placeholder="Header name"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => {
                      const newHeaders = { ...config.headers };
                      newHeaders[key] = e.target.value;
                      setConfig({ ...config, headers: newHeaders });
                    }}
                    placeholder="Header value"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newHeaders = { ...config.headers };
                      delete newHeaders[key];
                      setConfig({ ...config, headers: newHeaders });
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newHeaders = { ...config.headers, '': '' };
                  setConfig({ ...config, headers: newHeaders });
                }}
                className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Header
              </button>
            </div>
          </div>

          {/* Retry Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Retry Rules</label>
            <div className="space-y-2">
              {(config.retryOn || []).map((retry: any, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="number"
                    value={retry.status}
                    onChange={(e) => {
                      const newRetries = [...(config.retryOn || [])];
                      newRetries[index].status = parseInt(e.target.value);
                      setConfig({ ...config, retryOn: newRetries });
                    }}
                    placeholder="Status code"
                    className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                  />
                  <input
                    type="number"
                    value={retry.attempts}
                    onChange={(e) => {
                      const newRetries = [...(config.retryOn || [])];
                      newRetries[index].attempts = parseInt(e.target.value);
                      setConfig({ ...config, retryOn: newRetries });
                    }}
                    placeholder="Attempts"
                    className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                  />
                  <input
                    type="number"
                    value={retry.backoffMs}
                    onChange={(e) => {
                      const newRetries = [...(config.retryOn || [])];
                      newRetries[index].backoffMs = parseInt(e.target.value);
                      setConfig({ ...config, retryOn: newRetries });
                    }}
                    placeholder="Backoff (ms)"
                    className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRetries = (config.retryOn || []).filter((_: any, i: number) => i !== index);
                      setConfig({ ...config, retryOn: newRetries });
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newRetries = [...(config.retryOn || []), { status: 500, attempts: 3, backoffMs: 10000 }];
                  setConfig({ ...config, retryOn: newRetries });
                }}
                className="flex items-center text-[#4DE0F9] hover:text-[#4DE0F9]/80"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Retry Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-2">Test Webhook</h3>
            <p className="text-gray-400 text-sm mb-4">
              Generate a temporary URL to test your webhook and capture sample payloads
            </p>
          </div>

          {testState.state === 'idle' && (
            <div className="text-center">
              <button
                onClick={handleTestWebhook}
                className="bg-[#4DE0F9] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#4DE0F9]/90 transition-colors"
              >
                <Play className="w-4 h-4 mr-2 inline" />
                Start Webhook Test
              </button>
            </div>
          )}

          {testState.state === 'waiting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-[#4DE0F9]">
                <Loader className="w-5 h-5 animate-spin mr-2" />
                <span>Waiting for webhook request...</span>
              </div>
              
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testState.webhookUrl || ''}
                    readOnly
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 transition-colors"
                  >
                    {copySuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Send a request to this URL to capture a sample payload. URL expires in 5 minutes.
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={handleCancelTest}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel Test
                </button>
              </div>
            </div>
          )}

          {testState.state === 'captured' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Payload Captured Successfully!</span>
              </div>

              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Captured Payload
                </label>
                <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-300 overflow-auto max-h-64">
                  {JSON.stringify(testState.samplePayload, null, 2)}
                </pre>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleUseSample}
                  className="bg-[#4DE0F9] text-black px-4 py-2 rounded font-medium hover:bg-[#4DE0F9]/90 transition-colors"
                >
                  Use This Sample
                </button>
                <button
                  onClick={() => setTestState({ state: 'idle' })}
                  className="text-gray-400 hover:text-white px-4 py-2"
                >
                  Test Again
                </button>
              </div>
            </div>
          )}

          {testState.state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-red-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Test Failed</span>
              </div>

              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  {testState.error || 'An unknown error occurred'}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setTestState({ state: 'idle' })}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {config.samplePayload && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Sample Payload
              </label>
              <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-300 overflow-auto max-h-32">
                {JSON.stringify(config.samplePayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderScheduleConfig = () => (
    <div className="space-y-3">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Schedule Mode</label>
        <div className="flex gap-2">
          {['cron', 'interval', 'date'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setConfig({ ...config, mode })}
              className={`px-3 py-1.5 text-sm rounded capitalize ${
                config.mode === mode 
                  ? 'bg-[#4DE0F9] text-black' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific configuration */}
      {config.mode === 'cron' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cron Expression</label>
          <input
            type="text"
            value={config.cron || ''}
            onChange={(e) => setConfig({ ...config, cron: e.target.value })}
            placeholder="0 9 * * 1-5"
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Example: "0 9 * * 1-5" = 9 AM weekdays
          </p>
        </div>
      )}

      {config.mode === 'interval' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Interval</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={config.interval?.every || 1}
              onChange={(e) => setConfig({ 
                ...config, 
                interval: { ...config.interval, every: parseInt(e.target.value) }
              })}
              placeholder="1"
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
            />
            <select
              value={config.interval?.unit || 'minutes'}
              onChange={(e) => setConfig({ 
                ...config, 
                interval: { ...config.interval, unit: e.target.value as any }
              })}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </div>
      )}

      {config.mode === 'date' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Specific Date & Time</label>
          <input
            type="datetime-local"
            value={config.date || ''}
            onChange={(e) => setConfig({ ...config, date: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
        </div>
      )}

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
        <select
          value={config.tz || 'UTC'}
          onChange={(e) => setConfig({ ...config, tz: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      {/* Active Period */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Active From</label>
          <input
            type="datetime-local"
            value={config.activeFrom || ''}
            onChange={(e) => setConfig({ ...config, activeFrom: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Active Until</label>
          <input
            type="datetime-local"
            value={config.activeUntil || ''}
            onChange={(e) => setConfig({ ...config, activeUntil: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Skip Weekends */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.skipWeekends || false}
            onChange={(e) => setConfig({ ...config, skipWeekends: e.target.checked })}
            className="mr-2"
          />
          <span className="text-white text-sm">Skip Weekends</span>
        </label>
      </div>

      {/* Sample Payload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Sample Payload (JSON)</label>
        <textarea
          value={typeof config.samplePayload === 'string' 
            ? config.samplePayload 
            : JSON.stringify(config.samplePayload || {}, null, 2)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setConfig({ ...config, samplePayload: parsed });
            } catch {
              setConfig({ ...config, samplePayload: e.target.value });
            }
          }}
          placeholder='{\n  "timestamp": "2024-01-15T09:00:00Z",\n  "triggerType": "scheduled"\n}'
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-24 font-mono text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Sample data structure for testing the workflow
        </p>
      </div>
    </div>
  );

  const renderManualConfig = () => (
    <div className="space-y-3">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Trigger Name</label>
        <input
          type="text"
          value={config.name || ''}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          placeholder="Manual Trigger"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        />
      </div>

      {/* Sample Payload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Sample Payload (JSON)</label>
        <textarea
          value={typeof config.samplePayload === 'string' 
            ? config.samplePayload 
            : JSON.stringify(config.samplePayload || {}, null, 2)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setConfig({ ...config, samplePayload: parsed });
            } catch {
              setConfig({ ...config, samplePayload: e.target.value });
            }
          }}
          placeholder='{\n  "example": "data"\n}'
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-24 font-mono text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Sample data structure for testing the workflow
        </p>
      </div>
    </div>
  );

  const getTriggerIcon = (subtype: string) => {
    switch (subtype) {
      case 'webhook': return <Globe className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      case 'manual': return <Play className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getTriggerTitle = (subtype: string) => {
    switch (subtype) {
      case 'webhook': return 'Webhook Trigger';
      case 'schedule': return 'Schedule Trigger';
      case 'manual': return 'Manual Trigger';
      default: return 'Trigger Configuration';
    }
  };

  const currentSubtype = getSubtypeFromActionKind(node?.data?.actionKind || 'webhook');
  const showAdvancedTab = currentSubtype === 'webhook';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center">
                <div className="text-[#4DE0F9] mr-3">
                  {getTriggerIcon(currentSubtype)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {getTriggerTitle(currentSubtype)}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Configure how this workflow will be triggered
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            {showAdvancedTab && (
              <div className="flex border-b border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'config'
                      ? 'text-[#4DE0F9] border-b-2 border-[#4DE0F9]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'advanced'
                      ? 'text-[#4DE0F9] border-b-2 border-[#4DE0F9]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Advanced
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'test'
                      ? 'text-[#4DE0F9] border-b-2 border-[#4DE0F9]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Play className="w-4 h-4 mr-1 inline" />
                  Test
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {currentSubtype === 'webhook' && renderWebhookConfig()}
              {currentSubtype === 'schedule' && renderScheduleConfig()}
              {currentSubtype === 'manual' && renderManualConfig()}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-700 flex-shrink-0">
              <div>
                {node?.id !== 'start' && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-sm bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TriggerConfigModal; 