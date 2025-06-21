import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor, Sidebar, Provider } from '@inngest/workflow-kit';
import { workflowService, workflowDataService, type Workflow } from '../../services/workflowService';

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
      
      // Convert Inngest Workflow Kit data to TypeScript source
      const workflowDefinition = workflowKitData ? 
        JSON.stringify(workflowKitData) : // For now, store as JSON, later compile to TS
        JSON.stringify(workflowData);
      
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
    {
      id: 'generate-video',
      name: 'Generate Video',
      description: 'Generate AI videos using HeyGen',
      inputs: [
        { name: 'script', type: 'string', required: true },
        { name: 'avatar_id', type: 'string', required: true }
      ],
      outputs: [
        { name: 'video_url', type: 'string' },
        { name: 'video_id', type: 'string' }
      ]
    },
    {
      id: 'send-webhook',
      name: 'Send Webhook',
      description: 'Send HTTP webhook to external service',
      inputs: [
        { name: 'url', type: 'string', required: true },
        { name: 'method', type: 'string', required: true },
        { name: 'payload', type: 'object' }
      ],
      outputs: [
        { name: 'response', type: 'object' },
        { name: 'status', type: 'number' }
      ]
    },
    {
      id: 'ai-processing',
      name: 'AI Processing',
      description: 'Process data using AI models',
      inputs: [
        { name: 'prompt', type: 'string', required: true },
        { name: 'model', type: 'string' },
        { name: 'data', type: 'object' }
      ],
      outputs: [
        { name: 'result', type: 'string' },
        { name: 'tokens', type: 'number' }
      ]
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
            animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="w-20 h-20 rounded-full bg-[#A855F7] bg-opacity-20 absolute"
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
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Workflow not found
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 mb-4"
          >
            The workflow you're looking for doesn't exist.
          </motion.p>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/automation-builder')}
            className="glow-button inline-flex items-center px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </motion.button>
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
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel px-6 py-4 m-6 mb-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/automation-builder')}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-xl font-bold text-white">{workflowName}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>
                  Status: <span className={`font-medium ${
                    workflow.status === 'active' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {workflow.status}
                  </span>
                </span>
                {workflow.updated_at && (
                  <span>
                    Last saved: {new Date(workflow.updated_at).toLocaleString()}
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          <div className="flex items-center space-x-3">
            {!isNewWorkflow && (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleStatus}
                className={`inline-flex items-center px-3 py-2 text-sm rounded-lg border transition-all ${
                  workflow.status === 'active'
                    ? 'border-orange-500 border-opacity-30 text-orange-400 bg-orange-500 bg-opacity-10 hover:bg-opacity-20'
                    : 'border-green-500 border-opacity-30 text-green-400 bg-green-500 bg-opacity-10 hover:bg-opacity-20'
                }`}
              >
                {workflow.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </motion.button>
            )}

            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9] hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSave()}
              disabled={isSaving}
              className="glow-button inline-flex items-center px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Workflow Editor */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 mx-6 mb-6 glass-panel overflow-hidden"
      >
        <Provider
          workflow={workflowData}
          actions={availableActions}
          onChange={handleWorkflowChange}
        >
          <div className="flex h-full">
            <div className="flex-1 h-full">
              <Editor 
                direction="horizontal"
                className="h-full bg-transparent"
              />
            </div>
            <div className="w-80 border-l border-gray-700">
              <Sidebar />
            </div>
          </div>
        </Provider>
      </motion.div>

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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSettings(false);
                    handleSave();
                  }}
                  className="glow-button px-4 py-2"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AutomationBuilderEditorPage; 