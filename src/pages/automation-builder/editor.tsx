import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Play, Pause, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowService, type Workflow, saveWorkflow, SaveWorkflowDto, BoardJson } from '../../services/workflowService';
import { buildNodeOutputsFromWorkflow } from '../../services/templateEngine';
import { activateWorkflow, deactivateWorkflow, runWorkflow, hasManualTrigger, getWebhookTriggerNode } from '../../services/triggerService';
import SimpleWorkflowEditor from '../../components/SimpleWorkflowEditor';
import RunNowModal from '../../components/RunNowModal';
import NodeConfigModal from '../../components/NodeConfigModal';
import toast from 'react-hot-toast';

// Move availableActions outside component to prevent re-creation on every render
const AVAILABLE_ACTIONS = [
  // Triggers
  {
    kind: 'webhook-trigger',
    name: 'Webhook',
    description: 'Start workflow when webhook is received',
    icon: '🌐',
    category: 'triggers'
  },
  {
    kind: 'manual-trigger',
    name: 'Manual',
    description: 'Start workflow manually',
    icon: '🖐️',
    category: 'triggers'
  },
  {
    kind: 'schedule-trigger',
    name: 'Schedule',
    description: 'Start workflow on a schedule',
    icon: '⏰',
    category: 'triggers'
  },
  
  // Core Operations (New Spec)
  {
    kind: 'filter',
    name: 'Filter',
    description: 'Route workflow based on conditions',
    icon: '🔍',
    category: 'core'
  },
  {
    kind: 'switch',
    name: 'Switch',
    description: 'Route to different paths based on value',
    icon: '🔀',
    category: 'core'
  },
  {
    kind: 'wait',
    name: 'Wait',
    description: 'Delay execution or wait for conditions',
    icon: '⏱️',
    category: 'core'
  },
  {
    kind: 'merge',
    name: 'Merge',
    description: 'Combine multiple workflow branches',
    icon: '🔄',
    category: 'core'
  },
  {
    kind: 'js',
    name: 'Custom Code',
    description: 'Execute custom JavaScript code',
    icon: '⚡',
    category: 'core'
  },
  
  // Integrations (New Spec)
  {
    kind: 'http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    icon: '🌐',
    category: 'integrations'
  },
  
  // Legacy nodes (to be deprecated)
  {
    kind: 'set-variable',
    name: 'Set Variable',
    description: 'Set or modify variables',
    icon: '📝',
    category: 'legacy'
  },
  {
    kind: 'transform-data',
    name: 'Transform Data',
    description: 'Transform and manipulate data',
    icon: '🔄',
    category: 'legacy'
  },
  {
    kind: 'code-execution',
    name: 'Code (Legacy)',
    description: 'Execute custom JavaScript code',
    icon: '💻',
    category: 'legacy'
  },
  {
    kind: 'loop',
    name: 'Loop',
    description: 'Loop through arrays or objects',
    icon: '🔁',
    category: 'legacy'
  },
  {
    kind: 'condition',
    name: 'IF Condition',
    description: 'Branch workflow based on conditions',
    icon: '🔀',
    category: 'legacy'
  },
  {
    kind: 'delay',
    name: 'Wait (Legacy)',
    description: 'Wait for a specified amount of time',
    icon: '⏸️',
    category: 'legacy'
  },
  {
    kind: 'http-request',
    name: 'HTTP Request (Legacy)',
    description: 'Make HTTP requests to APIs',
    icon: '🌐',
    category: 'legacy'
  },
  
  // Integrations
  {
    kind: 'generate-video',
    name: 'Generate Video',
    description: 'Generate AI videos using HeyGen',
    icon: '🎬',
    category: 'integrations'
  },

  {
    kind: 'ai-processing',
    name: 'AI Processing',
    description: 'Process data using AI models',
    icon: '🤖',
    category: 'integrations'
  }
];

const AutomationBuilderEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('🔄 AutomationBuilderEditorPage component rendered/re-rendered with id:', id);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [showRunNowModal, setShowRunNowModal] = useState(false);
  const [runNowPayload, setRunNowPayload] = useState('{\n  "test": true,\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  
  // Track if workflow has been saved to prevent navigation races
  const hasSavedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);

  // Modal state
  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);

  const isNewWorkflow = id === 'new';

  useEffect(() => {
    console.log('🔄 Main useEffect triggered with:', { id, isNewWorkflow });
    
    if (isNewWorkflow) {
      console.log('📝 Initializing new workflow');
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
      console.log('📂 Loading existing workflow:', id);
      loadWorkflow(id);
    }
  }, [id, isNewWorkflow]);

  // Cleanup timeout on unmount
  useEffect(() => {
    console.log('🔧 Cleanup useEffect mounted');
    
    // Add global listeners to detect page navigation/reload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🚨 BEFOREUNLOAD EVENT DETECTED - Page is about to reload/navigate!');
    };
    
    const handleUnload = (e: Event) => {
      console.log('🚨 UNLOAD EVENT DETECTED - Page is reloading/navigating!');
    };
    
    const handlePopState = (e: PopStateEvent) => {
      console.log('🚨 POPSTATE EVENT DETECTED - Browser navigation!', e.state);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      console.log('🧹 Component unmounting, cleaning up timeout and listeners');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const loadWorkflow = async (workflowId: string) => {
    console.log('📂 loadWorkflow called for ID:', workflowId);
    try {
      setIsLoading(true);
      const workflowResponse = await workflowService.getWorkflow(workflowId);

      if (!workflowResponse) {
        console.log('❌ Workflow not found, navigating back to list');
        navigate('/automation-builder');
        return;
      }

      console.log('✅ Workflow loaded successfully:', workflowResponse.name);
      console.log('📊 Board data available:', !!workflowResponse.board_data);
      
      setWorkflow(workflowResponse);
      setWorkflowName(workflowResponse.name);
      setWorkflowDescription(workflowResponse.description || '');
      setWorkflowTags(workflowResponse.tags);
      setWorkflowData(workflowResponse.board_data || {});
    } catch (error) {
      console.error('❌ Error loading workflow:', error);
      navigate('/automation-builder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (workflowKitData?: any, shouldNavigate = false) => {
    if (!workflow) return;

    console.log('🔄 handleSave called with:', { 
      workflowKitData: !!workflowKitData, 
      isNewWorkflow, 
      shouldNavigate,
      hasSaved: hasSavedRef.current 
    });

    try {
      setIsSaving(true);
      
      // Use board_data for workflow content
      let boardData = workflowKitData || workflowData;
      console.log('💾 Board data for save:', { 
        hasWorkflowKitData: !!workflowKitData, 
        hasWorkflowData: !!workflowData, 
        hasBoardData: !!boardData,
        boardDataKeys: boardData ? Object.keys(boardData) : []
      });

      // Ensure boardData has the required structure
      if (!boardData || !boardData.nodes) {
        console.warn('⚠️ Invalid board data structure, using empty workflow');
        boardData = { nodes: [], connections: [] };
      }
      
      // Use the new optimized saveWorkflow function
      const workflowId = await saveWorkflow(boardData as BoardJson, {
        workflowId: isNewWorkflow ? undefined : workflow.id,
        name: workflowName,
        description: workflowDescription,
        tags: workflowTags
      });
      
      if (isNewWorkflow) {
        // Only navigate on manual save, not auto-save
        if (shouldNavigate) {
          console.log('🧭 Navigating to new workflow:', workflowId);
          navigate(`/automation-builder/${workflowId}`, { replace: true });
        } else {
          console.log('📍 Auto-save completed, staying on current route');
        }
        
        hasSavedRef.current = true;
      } else {
        // Update local state for existing workflow
        setWorkflow({
          ...workflow,
          name: workflowName,
          description: workflowDescription,
          tags: workflowTags,
          updated_at: new Date().toISOString(),
          version: (workflow.version || 0) + 1
        });
        
        console.log('✅ Save completed successfully with new version:', (workflow.version || 0) + 1);
      }
      
      // Show saved indicator for 2 seconds
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
      
    } catch (error) {
      console.error('❌ Error saving workflow:', error);
      alert('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
      console.log('🏁 Save process finished, isSaving set to false');
    }
  };

  const handleToggleStatus = async () => {
    if (!workflow || isNewWorkflow) return;

    try {
      const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
      
      if (newStatus === 'active') {
        // Activating workflow - call the new trigger service
        console.log('🚀 Activating workflow with new trigger service');
        const result = await activateWorkflow(workflow.id);
        console.log('✅ Workflow activation result:', result);
        
        // Update webhook token in workflow data if returned
        if (result.token && workflowData) {
          const webhookNode = getWebhookTriggerNode(workflowData);
          if (webhookNode) {
            const updatedNodes = workflowData.nodes.map((node: any) => {
              if (node.id === webhookNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      token: result.token,
                      url: result.url
                    }
                  }
                };
              }
              return node;
            });
            setWorkflowData({ ...workflowData, nodes: updatedNodes });
          }
        }
        
        toast.success('Workflow activated successfully');
      } else {
        // Deactivating workflow
        console.log('⏸️ Deactivating workflow with new trigger service');
        await deactivateWorkflow(workflow.id);
        console.log('✅ Workflow deactivated successfully');
        toast.success('Workflow deactivated successfully');
      }
      
      // Update workflow status in database
      await workflowService.updateWorkflow(workflow.id, { status: newStatus });
      setWorkflow({ ...workflow, status: newStatus });
      
    } catch (error) {
      console.error('❌ Error updating workflow status:', error);
      toast.error(`Failed to ${workflow.status === 'active' ? 'deactivate' : 'activate'} workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestManualTrigger = async () => {
    if (!workflow || !workflowData) return;
    
    try {
      // Check if workflow has manual trigger
      const hasManual = hasManualTrigger(workflowData);
      
      if (!hasManual) {
        toast.error('No manual triggers found in this workflow');
        return;
      }
      
      // Show the Run Now modal
      setShowRunNowModal(true);
      
    } catch (error) {
      console.error('❌ Error opening manual trigger modal:', error);
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRunNowConfirm = async () => {
    if (!workflow) return;
    
    try {
      await runWorkflow(workflow.id, JSON.parse(runNowPayload));
      console.log('✅ Manual trigger response');
      setShowRunNowModal(false);
    } catch (error) {
      console.error('❌ Error triggering workflow:', error);
      alert('Failed to trigger workflow. Please check your payload format.');
    }
  };

  const handleNodeClick = (node: any) => {
    console.log('🎯 Node clicked in parent:', node.id, node.data.actionKind);
    setSelectedNode(node);
    setIsConfigModalOpen(true);
  };

  const handleNodeConfigSave = (nodeId: string, config: any) => {
    console.log('💾 Saving node config from parent for:', nodeId, 'Config:', config);
    
    // Find the node to check if it's a switch node
    const targetNode = workflowData.nodes?.find((node: any) => node.id === nodeId);
    const isSwitch = targetNode?.data?.actionKind === 'switch';
    
    // Update the workflow data with the new node config
    let updatedWorkflowData = {
      ...workflowData,
      nodes: workflowData.nodes.map((node: any) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    };
    
    // For switch nodes, automatically create/update connections based on config
    if (isSwitch && config.cases) {
      // Remove existing connections from this switch node
      const existingConnections = updatedWorkflowData.connections || [];
      const filteredConnections = existingConnections.filter((conn: any) => conn.source !== nodeId);
      
      // Create new connections for each case and default
      const newConnections = [...filteredConnections];
      
      // Add connections for each case
      config.cases.forEach((caseItem: any, index: number) => {
        if (caseItem.next) {
          const connectionId = `${nodeId}-${caseItem.next}-case-${index}`;
          newConnections.push({
            id: connectionId,
            source: nodeId,
            target: caseItem.next,
            sourceHandle: `case-${index}`,
            targetHandle: 'input'
          });
        }
      });
      
      // Add connection for default path
      if (config.defaultNext) {
        const defaultConnectionId = `${nodeId}-${config.defaultNext}-default`;
        newConnections.push({
          id: defaultConnectionId,
          source: nodeId,
          target: config.defaultNext,
          sourceHandle: 'default',
          targetHandle: 'input'
        });
      }
      
      updatedWorkflowData.connections = newConnections;
      console.log('🔀 Updated switch connections:', newConnections.filter(c => c.source === nodeId));
    }
    
    console.log('💾 Updated node in parent:', updatedWorkflowData.nodes.find((n: any) => n.id === nodeId));
    setWorkflowData(updatedWorkflowData);
    
    // Auto-save the changes
    handleSave(updatedWorkflowData);
  };

  const handleWorkflowChange = useCallback((newData: any) => {
    console.log('🔄 handleWorkflowChange called with:', { 
      hasNewData: !!newData, 
      isNewWorkflow, 
      hasSaved: hasSavedRef.current,
      currentDataLength: JSON.stringify(workflowData || {}).length,
      newDataLength: JSON.stringify(newData || {}).length
    });
    
    // Guard against unnecessary saves - only save if data actually changed
    if (JSON.stringify(newData) === JSON.stringify(workflowData)) {
      console.log('🔄 Workflow data unchanged, skipping auto-save');
      return;
    }
    
    console.log('📝 Workflow data changed, updating state and scheduling auto-save');
    setWorkflowData(newData);
    
    // Auto-save after 2 seconds of inactivity (using ref to avoid closure issues)
    if (saveTimeoutRef.current) {
      console.log('⏰ Clearing existing save timeout');
      clearTimeout(saveTimeoutRef.current);
    }
    
    console.log('⏰ Setting new save timeout (2 seconds)');
    saveTimeoutRef.current = setTimeout(() => {
      // Don't auto-save new workflows - only after first manual save
      if (!isNewWorkflow || hasSavedRef.current) {
        console.log('🔄 Auto-save timeout triggered (no navigation)', { isNewWorkflow, hasSaved: hasSavedRef.current });
        handleSave(newData, false); // false = don't navigate
      } else {
        console.log('🔄 Skipping auto-save for unsaved new workflow', { isNewWorkflow, hasSaved: hasSavedRef.current });
      }
    }, 2000);
  }, [isNewWorkflow]); // Keep minimal dependencies to avoid re-creation

  // Extract trigger data and node outputs for data mapping
  const { triggerData, nodeOutputs } = React.useMemo(() => {
    const nodes = workflowData?.nodes || [];
    
    // Find trigger node and its sample payload (from any source)
    const triggerNode = nodes.find((node: any) => 
      node.data?.actionKind?.includes('trigger')
    );
    
    // Use any available sample payload - from webhook test, manual input, or previous captures
    const triggerSampleData = triggerNode?.data?.samplePayload || 
                             triggerNode?.data?.config?.samplePayload ||
                             triggerNode?.data?.lastCapturedPayload;

    // Build node outputs using the enhanced template engine function
    const outputs = buildNodeOutputsFromWorkflow(nodes);

    console.log('🗺️ Data mapping sources:', {
      triggerNode: triggerNode?.id,
      triggerSampleData: !!triggerSampleData,
      nodeOutputsCount: Object.keys(outputs).length,
      availableNodes: nodes.map((n: any) => ({ id: n.id, kind: n.data?.actionKind, saveAs: n.data?.config?.saveAs }))
    });

    return {
      triggerData: triggerSampleData,
      nodeOutputs: outputs
    };
  }, [workflowData]);

  // Use the constant AVAILABLE_ACTIONS defined outside the component

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
            className="w-20 h-20 rounded-full bg-[#4DE0F9] bg-opacity-20 absolute"
          />
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 10px rgba(77, 224, 249, 0.5)",
                "0 0 30px rgba(77, 224, 249, 0.7)",
                "0 0 10px rgba(77, 224, 249, 0.5)"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-3 h-3 rounded-full bg-[#4DE0F9] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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
            type="button"
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
    <div className="fixed inset-0 bg-gray-900 overflow-hidden flex flex-col">
      {/* Top Bar - Outside Canvas */}
      <motion.div 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 mx-4 mt-4 mb-2 flex items-center justify-between px-6 py-3 rounded-lg border border-white/20 pointer-events-auto"
        style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      >
        <div className="flex items-center space-x-4">
          <motion.button
            type="button"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('⬅️ Back button clicked');
              navigate('/automation-builder');
            }}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer pointer-events-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </motion.button>

          <div className="h-6 w-px bg-gray-600" />

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3"
          >
            <h1 className="text-lg font-semibold text-white truncate max-w-xs">
              {workflowName}
            </h1>
            
            {workflow?.status && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                workflow.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {workflow.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}
          </motion.div>
        </div>

        {/* Canvas Controls - Simplified */}
        <div className="flex items-center space-x-2">
          {/* Activate/Deactivate Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Activate button clicked, current status:', workflow?.status);
              handleToggleStatus();
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer pointer-events-auto ${
              workflow?.status === 'active'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
            title={workflow?.status === 'active' ? 'Deactivate Workflow' : 'Activate Workflow'}
          >
            {workflow?.status === 'active' ? 'Deactivate' : 'Activate'}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('⚙️ Settings button clicked');
              setShowSettings(true);
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer pointer-events-auto"
            title="Workflow Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>

          <div className="flex items-center space-x-1">
            {showSavedIndicator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center text-green-400 text-sm px-2"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Saved
              </motion.div>
            )}
            
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('💾 Manual Save button clicked');
                handleSave(undefined, true);
              }}
              disabled={isSaving}
              className="px-6 py-2 bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer pointer-events-auto min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Workflow Editor */}
      <div className="flex-1 w-full mx-4 mb-4 rounded-lg overflow-hidden">
        <SimpleWorkflowEditor
          workflow={{ ...workflowData, id: workflow?.id }}
          availableActions={AVAILABLE_ACTIONS}
          onChange={handleWorkflowChange}
          triggerData={triggerData}
          nodeOutputs={nodeOutputs}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
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
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('❌ Settings Cancel button clicked');
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('💾 Settings Save Changes button clicked');
                    setShowSettings(false);
                    handleSave(undefined, true);
                  }}
                  className="px-4 py-2 bg-[#4DE0F9] text-black font-medium rounded-lg hover:bg-[#4DE0F9]/90 transition-colors"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Now Modal */}
      <RunNowModal
        isOpen={showRunNowModal}
        onClose={() => setShowRunNowModal(false)}
        workflowId={workflow?.id || ''}
        workflowName={workflow?.name}
      />

      {/* Node Configuration Modal */}
      <NodeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        node={selectedNode}
        onSave={handleNodeConfigSave}
        onDelete={(nodeId: string) => {
          // Remove node from workflow data
          const updatedWorkflowData = {
            ...workflowData,
            nodes: workflowData.nodes.filter((node: any) => node.id !== nodeId),
            connections: workflowData.connections.filter((conn: any) => 
              conn.source !== nodeId && conn.target !== nodeId
            )
          };
          setWorkflowData(updatedWorkflowData);
          handleSave(updatedWorkflowData);
          setIsConfigModalOpen(false);
        }}
        workflowId={workflow?.id}
        triggerData={triggerData}
        nodeOutputs={nodeOutputs}
        availableNodes={workflowData?.nodes?.filter((node: any) => node.id !== 'start') || []}
      />
    </div>
  );
};

export default AutomationBuilderEditorPage; 