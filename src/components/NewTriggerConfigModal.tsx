import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Copy, RefreshCw, Settings, Clock, Zap, Play, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { activateWorkflow, deactivateWorkflow, getWebhookInfo, regenerateWebhookToken, runWorkflow } from '../services/triggerService';
import { webhookTestService, WebhookTestState } from '../services/webhookTestService';
import toast from 'react-hot-toast';
import cronstrue from 'cronstrue';
import TemplateInput from './TemplateInput';

interface NewTriggerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: any;
  onSave: (nodeId: string, config: any) => void;
  onDelete?: (nodeId: string) => void;
  workflowId?: string;
}

interface TriggerConfig {
  token?: string;
  url?: string;
  lastCapturedAt?: string | null;
  description?: string;
  cron?: string;
  timezone?: string;
  samplePayload?: any;
  // Schedule picker state (UI only, not stored)
  scheduleFrequency?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  scheduleDetails?: {
    minute?: number;
    hour?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  [key: string]: any;
}

// Helper functions for cron generation
const generateCronFromSchedule = (frequency: string, details: any): string => {
  switch (frequency) {
    case 'minute':
      return '* * * * *'; // Every minute
    case 'hour':
      const minute = details?.minute || 0;
      return `${minute} * * * *`; // Every hour at specified minute
    case 'day':
      const dailyMinute = details?.minute || 0;
      const dailyHour = details?.hour || 9;
      return `${dailyMinute} ${dailyHour} * * *`; // Daily at specified time
    case 'week':
      const weeklyMinute = details?.minute || 0;
      const weeklyHour = details?.hour || 9;
      const dayOfWeek = details?.dayOfWeek || 1; // 1 = Monday
      return `${weeklyMinute} ${weeklyHour} * * ${dayOfWeek}`; // Weekly on specified day/time
    case 'month':
      const monthlyMinute = details?.minute || 0;
      const monthlyHour = details?.hour || 9;
      const dayOfMonth = details?.dayOfMonth || 1;
      return `${monthlyMinute} ${monthlyHour} ${dayOfMonth} * *`; // Monthly on specified day/time
    default:
      return '*/10 * * * *'; // Default: every 10 minutes
  }
};

const parseCronToSchedule = (cron: string): { frequency: string; details: any } | null => {
  if (!cron) return null;
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return null;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Every minute: * * * * *
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { frequency: 'minute', details: {} };
  }
  
  // Every hour: X * * * *
  if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && minute !== '*') {
    return { frequency: 'hour', details: { minute: parseInt(minute) || 0 } };
  }
  
  // Daily: X Y * * *
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && minute !== '*' && hour !== '*') {
    return { 
      frequency: 'day', 
      details: { 
        minute: parseInt(minute) || 0, 
        hour: parseInt(hour) || 9 
      } 
    };
  }
  
  // Weekly: X Y * * Z
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && minute !== '*' && hour !== '*') {
    return { 
      frequency: 'week', 
      details: { 
        minute: parseInt(minute) || 0, 
        hour: parseInt(hour) || 9,
        dayOfWeek: parseInt(dayOfWeek) || 1
      } 
    };
  }
  
  // Monthly: X Y Z * *
  if (month === '*' && dayOfWeek === '*' && minute !== '*' && hour !== '*' && dayOfMonth !== '*') {
    return { 
      frequency: 'month', 
      details: { 
        minute: parseInt(minute) || 0, 
        hour: parseInt(hour) || 9,
        dayOfMonth: parseInt(dayOfMonth) || 1
      } 
    };
  }
  
  return null; // Complex cron that doesn't fit our patterns
};

const NewTriggerConfigModal: React.FC<NewTriggerConfigModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  onDelete,
  workflowId
}) => {
  const [config, setConfig] = useState<TriggerConfig>({});
  const [isLoading, setIsLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ token: string; url: string; captured_at?: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cronDescription, setCronDescription] = useState<string>('');
  const [cronError, setCronError] = useState<string>('');
  const [testState, setTestState] = useState<WebhookTestState>({ state: 'idle' });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (node && isOpen) {
      const actionKind = node.data?.actionKind;
      const existingConfig = node.data?.config || {};
      
      // Set default config based on trigger type
      let defaultConfig: TriggerConfig = {};
      
      switch (actionKind) {
        case 'webhook-trigger':
          defaultConfig = {
            token: existingConfig.token || '',
            url: existingConfig.url || '',
            lastCapturedAt: existingConfig.lastCapturedAt || null,
            samplePayload: existingConfig.samplePayload || null,
            ...existingConfig
          };
          break;
        case 'manual-trigger':
          defaultConfig = {
            description: existingConfig.description || 'Manual trigger - run workflow on demand',
            ...existingConfig
          };
          break;
        case 'schedule-trigger':
          const existingCron = existingConfig.cron || '*/10 * * * *';
          const scheduleData = parseCronToSchedule(existingCron) || { frequency: 'hour', details: { minute: 0 } };
          
          defaultConfig = {
            cron: existingCron,
            description: existingConfig.description || '',
            timezone: existingConfig.timezone || 'UTC',
            scheduleFrequency: scheduleData.frequency as any,
            scheduleDetails: scheduleData.details || {},
            ...existingConfig
          };
          break;
      }
      
      setConfig(defaultConfig);
      
      // Load webhook info if it's a webhook trigger
      if (actionKind === 'webhook-trigger' && workflowId) {
        loadWebhookInfo();
      }
      
      // Parse cron if it's a schedule trigger
      if (actionKind === 'schedule-trigger' && defaultConfig.cron) {
        parseCronExpression(defaultConfig.cron);
      }
    }
  }, [node, isOpen, workflowId]);

  // Refresh webhook info when modal opens (to catch activation changes)
  useEffect(() => {
    if (isOpen && node?.data?.actionKind === 'webhook-trigger' && workflowId) {
      // Small delay to allow activation to complete
      const timer = setTimeout(() => {
        loadWebhookInfo();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Watch for node config changes (token/url updates from activation)
  useEffect(() => {
    if (node?.data?.actionKind === 'webhook-trigger' && node?.data?.config) {
      const nodeConfig = node.data.config;
      console.log('👀 Node config changed:', nodeConfig);
      
      // If node has token/url but modal doesn't, update it
      if (nodeConfig.token && nodeConfig.url && !webhookInfo) {
        console.log('🔄 Updating webhook info from node config');
        setWebhookInfo({
          token: nodeConfig.token,
          url: nodeConfig.url,
          captured_at: nodeConfig.captured_at
        });
        setConfig((prev: TriggerConfig) => ({
          ...prev,
          token: nodeConfig.token,
          url: nodeConfig.url
        }));
      }
    }
  }, [node?.data?.config?.token, node?.data?.config?.url]);

  const loadWebhookInfo = async () => {
    if (!workflowId || !node?.id) {
      console.log('❌ Cannot load webhook info - missing workflowId or node.id:', { workflowId, nodeId: node?.id });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔍 Loading webhook info for:', { workflowId, nodeId: node.id });
      
      const info = await getWebhookInfo(workflowId, node.id);
      console.log('📡 Webhook info response:', info);
      
      // Check if info is valid before accessing properties
      if (info && typeof info === 'object') {
        console.log('✅ Setting webhook info:', info);
        setWebhookInfo(info);
        setConfig((prev: TriggerConfig) => ({ 
          ...prev, 
          token: info.token || '', 
          url: info.url || '' 
        }));
      } else {
        console.log('⚠️ No webhook info available yet');
        setWebhookInfo(null);
      }
    } catch (error) {
      console.error('❌ Error loading webhook info:', error);
      setWebhookInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!workflowId || !node?.id) return;
    
    try {
      setIsLoading(true);
      const info = await regenerateWebhookToken(workflowId, node.id);
      
      // Check if info is valid before accessing properties
      if (info && typeof info === 'object') {
        setWebhookInfo(info);
        setConfig((prev: TriggerConfig) => ({ 
          ...prev, 
          token: info.token || '', 
          url: info.url || '' 
        }));
        toast.success('Webhook token regenerated successfully');
      } else {
        toast.error('Failed to regenerate webhook token - invalid response');
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error('Failed to regenerate webhook token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const parseCronExpression = (cronExpression: string) => {
    try {
      const description = cronstrue.toString(cronExpression);
      setCronDescription(description);
      setCronError('');
    } catch (error) {
      setCronDescription('');
      setCronError('Invalid cron expression');
    }
  };

  const handleCronChange = (value: string) => {
    setConfig((prev: TriggerConfig) => ({ ...prev, cron: value }));
    parseCronExpression(value);
  };

  const handleScheduleChange = (frequency: string, details: any) => {
    const newCron = generateCronFromSchedule(frequency, details);
    setConfig((prev: TriggerConfig) => ({ 
      ...prev, 
      cron: newCron,
      scheduleFrequency: frequency as any,
      scheduleDetails: details
    }));
    parseCronExpression(newCron);
  };

  const handleSave = () => {
    // Validate schedule trigger cron
    if (node.data?.actionKind === 'schedule-trigger' && cronError) {
      toast.error('Please fix the cron expression before saving');
      return;
    }
    
    // Filter out UI-only properties before saving
    const { scheduleFrequency, scheduleDetails, ...configToSave } = config;
    
    console.log('💾 Saving trigger configuration:', {
      nodeId: node.id,
      config: configToSave,
      hasSamplePayload: !!configToSave.samplePayload,
      samplePayloadSize: configToSave.samplePayload ? JSON.stringify(configToSave.samplePayload).length : 0,
      filteredOutUIState: { scheduleFrequency, scheduleDetails }
    });
    
    onSave(node.id, configToSave);
    onClose();
    toast.success('Trigger configuration saved');
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(node.id);
      onClose();
      toast.success('Trigger deleted');
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
            
            // If captured, automatically save the sample payload
            if (currentState.state === 'captured' && currentState.samplePayload) {
              const updatedConfig = { ...config, samplePayload: currentState.samplePayload };
              setConfig(updatedConfig);
              toast.success('🎉 Webhook payload captured and saved!');
              console.log('🎯 Webhook payload automatically saved:', currentState.samplePayload);
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
      // Payload is already saved automatically during capture
      setTestState({ state: 'idle' });
      toast.success('✅ Using captured sample payload for data mapping');
    }
  };

  const renderWebhookTrigger = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">Webhook Trigger</h3>
          <p className="text-sm text-gray-400">Receive HTTP requests to trigger this workflow</p>
        </div>
      </div>

      {webhookInfo ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={webhookInfo.url}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
              />
              <button
                onClick={() => handleCopy(webhookInfo.url, 'Webhook URL')}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                {copiedField === 'Webhook URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Token</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={webhookInfo.token}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
              />
              <button
                onClick={() => handleCopy(webhookInfo.token, 'Token')}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                {copiedField === 'Token' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={handleRegenerateToken}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Token</span>
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Status</span>
            </div>
            <p className="text-sm text-gray-400">
              {webhookInfo?.captured_at 
                ? `Last request received: ${new Date(webhookInfo.captured_at).toLocaleString()}`
                : 'No requests captured yet'
              }
            </p>
          </div>

          {/* Sample Payload Section */}
          {config.samplePayload && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-gray-300">Sample Payload Captured</span>
                </div>
                <button
                  onClick={() => setConfig({ ...config, samplePayload: undefined })}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Clear sample payload"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-300 overflow-auto max-h-32">
                {JSON.stringify(config.samplePayload, null, 2)}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                This sample payload will be used for data mapping in other nodes.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleCopy(JSON.stringify(config.samplePayload, null, 2), 'Sample Payload')}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  {copiedField === 'Sample Payload' ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">
            {isLoading ? 'Loading webhook information...' : 'Webhook will be created when workflow is activated'}
          </p>
        </div>
      )}
    </div>
  );

  const renderManualTrigger = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
          <Play className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">Manual Trigger</h3>
          <p className="text-sm text-gray-400">Run this workflow manually on demand</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={config.description || ''}
          onChange={(e) => setConfig((prev: TriggerConfig) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe when this workflow should be run manually..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white h-20 resize-none"
        />
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Play className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">How to run</span>
        </div>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use the "Run Now" button in the workflow editor</li>
          <li>• Click the play button in the workflow list</li>
          <li>• Call the manual execution API</li>
        </ul>
      </div>
    </div>
  );

  const renderScheduleTrigger = () => {
    const frequency = config.scheduleFrequency || 'hour';
    const details = config.scheduleDetails || {};

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const renderDetailPicker = () => {
      switch (frequency) {
        case 'minute':
          return (
            <p className="text-sm text-gray-400 bg-gray-800/50 rounded p-3">
              Workflow will run every minute
            </p>
          );
          
        case 'hour':
          return (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">At minute</label>
              <select
                value={details.minute || 0}
                onChange={(e) => handleScheduleChange(frequency, { ...details, minute: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Example: Hour at minute {(details.minute || 0).toString().padStart(2, '0')} (runs every hour at {(details.minute || 0).toString().padStart(2, '0')}:00)
              </p>
            </div>
          );
          
        case 'day':
          return (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hour</label>
                <select
                  value={details.hour || 9}
                  onChange={(e) => handleScheduleChange(frequency, { ...details, hour: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Minute</label>
                <select
                  value={details.minute || 0}
                  onChange={(e) => handleScheduleChange(frequency, { ...details, minute: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400">
                  Example: Daily at {(details.hour || 9).toString().padStart(2, '0')}:{(details.minute || 0).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          );
          
        case 'week':
          return (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Day of week</label>
                <select
                  value={details.dayOfWeek || 1}
                  onChange={(e) => handleScheduleChange(frequency, { ...details, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hour</label>
                  <select
                    value={details.hour || 9}
                    onChange={(e) => handleScheduleChange(frequency, { ...details, hour: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minute</label>
                  <select
                    value={details.minute || 0}
                    onChange={(e) => handleScheduleChange(frequency, { ...details, minute: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Example: Weekly on {dayNames[details.dayOfWeek || 1]} at {(details.hour || 9).toString().padStart(2, '0')}:{(details.minute || 0).toString().padStart(2, '0')}
              </p>
            </div>
          );
          
        case 'month':
          return (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Day of month</label>
                <select
                  value={details.dayOfMonth || 1}
                  onChange={(e) => handleScheduleChange(frequency, { ...details, dayOfMonth: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hour</label>
                  <select
                    value={details.hour || 9}
                    onChange={(e) => handleScheduleChange(frequency, { ...details, hour: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minute</label>
                  <select
                    value={details.minute || 0}
                    onChange={(e) => handleScheduleChange(frequency, { ...details, minute: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Example: Monthly on day {details.dayOfMonth || 1} at {(details.hour || 9).toString().padStart(2, '0')}:{(details.minute || 0).toString().padStart(2, '0')}
              </p>
            </div>
          );
          
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Schedule Trigger</h3>
            <p className="text-sm text-gray-400">Run this workflow on a schedule</p>
          </div>
        </div>

        {/* Frequency Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Run Every</label>
          <select
            value={frequency}
            onChange={(e) => handleScheduleChange(e.target.value, {})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        {/* Detail Picker */}
        {renderDetailPicker()}

        {/* Generated Cron & Description */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Generated Schedule</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cron Expression:</span>
              <code className="text-purple-400 bg-gray-900 px-2 py-1 rounded font-mono">{config.cron}</code>
            </div>
            {cronDescription && (
              <div className="text-green-400">
                <strong>Schedule:</strong> {cronDescription}
              </div>
            )}
            {cronError && (
              <div className="text-red-400">
                <strong>Error:</strong> {cronError}
              </div>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
          <TemplateInput
            value={config.description || ''}
            onChange={(value) => setConfig((prev: TriggerConfig) => ({ ...prev, description: value }))}
            placeholder="e.g., Daily report generation for {{ctx.trigger.department}}"
            className="w-full"
            dataSources={{}}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
          <select
            value={config.timezone || 'UTC'}
            onChange={(e) => setConfig((prev: TriggerConfig) => ({ ...prev, timezone: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
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
      </div>
    );
  };

  const renderContent = () => {
    if (!node) return null;

    const actionKind = node.data?.actionKind;

    switch (actionKind) {
      case 'webhook-trigger':
        return renderWebhookTrigger();
      case 'manual-trigger':
        return renderManualTrigger();
      case 'schedule-trigger':
        return renderScheduleTrigger();
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Unknown trigger type: {actionKind}</p>
          </div>
        );
    }
  };

  if (!isOpen || !node) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-semibold text-white">Configure Trigger</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content - Split into two columns */}
          <div className="flex h-[calc(90vh-200px)]">
            {/* Left Column - Configuration */}
            <div className="flex-1 p-6 border-r border-gray-700 overflow-y-auto">
              <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
              {renderContent()}
            </div>

            {/* Right Column - Test and Inputs */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Test & Sample Data</h3>
                {node?.data?.actionKind === 'webhook-trigger' && (
                  <button
                    onClick={handleTestWebhook}
                    disabled={isLoading || testState.state === 'waiting'}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {testState.state === 'waiting' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Waiting for Request...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Test Step</span>
                      </>
                    )}
                  </button>
                )}
                {node?.data?.actionKind === 'manual-trigger' && (
                  <button
                    onClick={() => {
                      if (workflowId) {
                        runWorkflow(workflowId, {});
                        toast.success('Workflow started manually');
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Test Step</span>
                  </button>
                )}
                {node?.data?.actionKind === 'schedule-trigger' && (
                  <button
                    onClick={() => {
                      if (workflowId) {
                        runWorkflow(workflowId, {});
                        toast.success('Workflow started manually (simulating schedule)');
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Test Step</span>
                  </button>
                )}
              </div>

              {/* Test Status and Results */}
              {node?.data?.actionKind === 'webhook-trigger' && (
                <div className="space-y-4">
                  {/* Webhook URL Info */}
                  {webhookInfo?.url && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Webhook URL</span>
                        <button
                          onClick={() => handleCopy(webhookInfo.url, 'URL')}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {copiedField === 'URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <code className="text-xs text-green-400 break-all">{webhookInfo.url}</code>
                    </div>
                  )}

                  {/* Test Status */}
                  {testState.state !== 'idle' && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      {testState.state === 'waiting' && (
                        <div className="flex items-center space-x-3">
                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                          <div>
                            <p className="text-white font-medium">Waiting for webhook...</p>
                            <p className="text-gray-400 text-sm">Send a request to the URL above</p>
                          </div>
                        </div>
                      )}
                      {testState.state === 'captured' && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-white font-medium">Webhook captured!</p>
                          </div>
                          <button
                            onClick={handleUseSample}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            Use Sample Data
                          </button>
                        </div>
                      )}
                      {testState.state === 'error' && (
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-white font-medium">Test failed</p>
                            <p className="text-red-400 text-sm">{testState.error}</p>
                          </div>
                        </div>
                      )}
                      {testState.state === 'waiting' && (
                        <button
                          onClick={handleCancelTest}
                          className="mt-3 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
                        >
                          Cancel Test
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sample Data Display */}
                  {(testState.samplePayload || config.samplePayload) && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Sample Payload</h4>
                      <pre className="text-xs text-green-400 bg-gray-900 rounded p-3 overflow-auto max-h-64">
                        {JSON.stringify(testState.samplePayload || config.samplePayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* For manual and schedule triggers, show sample input options */}
              {(node?.data?.actionKind === 'manual-trigger' || node?.data?.actionKind === 'schedule-trigger') && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Sample Test Data</h4>
                    <textarea
                      value={JSON.stringify(config.samplePayload || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setConfig((prev: TriggerConfig) => ({ ...prev, samplePayload: parsed }));
                        } catch (error) {
                          // Keep the raw text for editing
                        }
                      }}
                      placeholder='{\n  "key": "value",\n  "data": "sample"\n}'
                      className="w-full h-32 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-green-400 font-mono text-xs"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      This data will be passed to the workflow when testing
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Delete Trigger
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || Boolean(node.data?.actionKind === 'schedule-trigger' && cronError)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewTriggerConfigModal; 