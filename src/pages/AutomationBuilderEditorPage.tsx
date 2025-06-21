import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowService, workflowDataService, type Workflow } from '../services/workflowService';
import SimpleWorkflowEditor from '../components/SimpleWorkflowEditor';

const AutomationBuilderEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);

  const isNewWorkflow = id === 'new';

  useEffect(() => {
    if (isNewWorkflow) {
      // Initialize new workflow
      setWorkflow({
        id: 'new',
        user_id: '',
        name: 'Untitled Workflow',
        description: '',
        tags: [],
        status: 'inactive',
        created_at: '',
        updated_at: ''
      });
      setWorkflowName('Untitled Workflow');
      setWorkflowDescription('');
      setWorkflowTags([]);
      setWorkflowData({});
      setIsLoading(false);
    } else if (id) {
      loadWorkflow(id);
    }
  }, [id, isNewWorkflow]);

  const loadWorkflow = async (workflowId: string) => {
    try {
      setIsLoading(true);
      const [workflowResponse, dataResponse] = await Promise.all([
        workflowService.getWorkflow(workflowId),
        workflowDataService.getWorkflowData(workflowId)
      ]);

      if (!workflowResponse) {
        navigate('/automation-builder');
        return;
      }

      setWorkflow(workflowResponse);
      setWorkflowName(workflowResponse.name);
      setWorkflowDescription(workflowResponse.description || '');
      setWorkflowTags(workflowResponse.tags);
      setWorkflowData(dataResponse?.board_data || {});
    } catch (error) {
      console.error('Error loading workflow:', error);
      navigate('/automation-builder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (workflowKitData?: any) => {
    if (!workflow) return;

    try {
      setIsSaving(true);
      
      if (isNewWorkflow) {
        // Create new workflow
        const newWorkflow = await workflowService.createWorkflow({
          name: workflowName,
          description: workflowDescription,
          tags: workflowTags,
          board_data: workflowKitData || workflowData
        });
        
        // Navigate to the new workflow
        navigate(`/automation-builder/${newWorkflow.id}`, { replace: true });
      } else {
        // Update existing workflow
        await Promise.all([
          workflowService.updateWorkflow(workflow.id, {
            name: workflowName,
            description: workflowDescription,
            tags: workflowTags
          }),
          workflowKitData ? workflowDataService.saveWorkflowData(workflow.id, workflowKitData) : Promise.resolve()
        ]);
        
        // Reload workflow to get updated data
        await loadWorkflow(workflow.id);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!workflow || isNewWorkflow) return;

    try {
      const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
      await workflowService.updateWorkflow(workflow.id, { status: newStatus });
      setWorkflow({ ...workflow, status: newStatus });
    } catch (error) {
      console.error('Error updating workflow status:', error);
    }
  };

  const handleWorkflowChange = (newData: any) => {
    setWorkflowData(newData);
    // Auto-save after 2 seconds of inactivity
    clearTimeout((window as any).workflowSaveTimeout);
    (window as any).workflowSaveTimeout = setTimeout(() => {
      if (!isNewWorkflow) {
        handleSave(newData);
      }
    }, 2000);
  };

  // Define available actions for the workflow
  const availableActions = [
    // Triggers
    {
      kind: 'event-trigger',
      name: 'Event Trigger',
      description: 'Triggered by custom events from your application',
      category: 'triggers',
      icon: '⚡'
    },
    {
      kind: 'cron-trigger',
      name: 'Cron Schedule',
      description: 'Run on a schedule using cron syntax',
      category: 'triggers',
      icon: '⏰'
    },
    {
      kind: 'webhook-trigger',
      name: 'Webhook Trigger',
      description: 'Triggered by incoming webhook events',
      category: 'triggers',
      icon: '🌐'
    },
    
    // Core Steps
    {
      kind: 'step-run',
      name: 'Run Code',
      description: 'Execute custom TypeScript/JavaScript code',
      category: 'core',
      icon: '🧠'
    },
    {
      kind: 'step-sleep',
      name: 'Sleep',
      description: 'Pause execution for a specified duration',
      category: 'core',
      icon: '💤'
    },
    {
      kind: 'step-sleep-until',
      name: 'Sleep Until',
      description: 'Pause execution until a specific date/time',
      category: 'core',
      icon: '⏰'
    },
    {
      kind: 'step-wait-for-event',
      name: 'Wait for Event',
      description: 'Pause until a specific event is received',
      category: 'core',
      icon: '⏳'
    },
    {
      kind: 'step-invoke',
      name: 'Invoke Function',
      description: 'Call another Inngest function and wait for result',
      category: 'core',
      icon: '🔗'
    },
    {
      kind: 'step-send-event',
      name: 'Send Event',
      description: 'Send events to trigger other functions',
      category: 'core',
      icon: '📤'
    },
    
    // Flow Control
    {
      kind: 'parallel-steps',
      name: 'Parallel Steps',
      description: 'Run multiple steps in parallel',
      category: 'flow',
      icon: '⚡'
    },
    {
      kind: 'conditional-step',
      name: 'Conditional Logic',
      description: 'Execute steps based on conditions',
      category: 'flow',
      icon: '🔀'
    },
    {
      kind: 'loop-step',
      name: 'Loop',
      description: 'Iterate over data or repeat steps',
      category: 'flow',
      icon: '🔄'
    },
    
    // Integrations
    {
      kind: 'generate-video',
      name: 'Generate Video',
      description: 'Generate AI videos using HeyGen',
      category: 'integrations',
      icon: '🎬'
    },
    {
      kind: 'send-webhook',
      name: 'Send Webhook',
      description: 'Send HTTP webhook to external service',
      category: 'integrations',
      icon: '🌐'
    },
    {
      kind: 'send-email',
      name: 'Send Email',
      description: 'Send emails via email service providers',
      category: 'integrations',
      icon: '📧'
    },
    {
      kind: 'database-query',
      name: 'Database Query',
      description: 'Query or update database records',
      category: 'integrations',
      icon: '🗄️'
    },
    {
      kind: 'ai-inference',
      name: 'AI Inference',
      description: 'Call AI/ML models for processing',
      category: 'integrations',
      icon: '🤖'
    },
    {
      kind: 'file-processing',
      name: 'File Processing',
      description: 'Process files, images, or documents',
      category: 'integrations',
      icon: '📁'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full bg-[#4DE0F9] bg-opacity-20 absolute"
          />
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 10px rgba(77, 224, 249, 0.5)",
                "0 0 30px rgba(168, 85, 247, 0.7)",
                "0 0 10px rgba(77, 224, 249, 0.5)"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-3 h-3 rounded-full bg-gradient-to-r from-[#4DE0F9] to-[#A855F7] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex items-center justify-center min-h-screen"
      >
        <div className="glass-panel text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Workflow not found</h2>
          <p className="text-gray-300 mb-4">The workflow you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/automation-builder')}
            className="glow-button inline-flex items-center px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-transparent h-screen"
    >
      {/* Header */}
      <div className="glass-panel px-6 py-4 m-6 mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/automation-builder')}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{workflowName}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>
                  Status: <span className={`font-medium ${
                    workflow.status === 'active' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {workflow.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="glow-button inline-flex items-center px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Editor */}
      <div className="flex-1 mx-6 mb-6 bg-transparent border border-white/20 rounded-xl overflow-hidden backdrop-blur-xl">
        <SimpleWorkflowEditor
          workflow={workflowData}
          availableActions={availableActions}
          onChange={handleWorkflowChange}
        />
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Workflow Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="form-input w-full px-3 py-2"
                    placeholder="Enter workflow name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={3}
                    className="form-input w-full px-3 py-2"
                    placeholder="Describe what this workflow does"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={workflowTags.join(', ')}
                    onChange={(e) => setWorkflowTags(
                      e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    )}
                    className="form-input w-full px-3 py-2"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    handleSave();
                  }}
                  className="glow-button px-4 py-2"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AutomationBuilderEditorPage; 