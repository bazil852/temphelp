import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Settings, Play, Pause, Copy, Trash2, Edit3, Calendar, Tag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowService, type Workflow } from '../../services/workflowService';
import { runWorkflow, hasManualTrigger } from '../../services/triggerService';
import toast from 'react-hot-toast';

const AutomationBuilderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => workflow.tags.includes(tag));
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    
    return matchesSearch && matchesTags && matchesStatus;
  });

  const allTags = Array.from(new Set(workflows.flatMap(w => w.tags)));

  const handleCreateWorkflow = () => {
    navigate('/automation-builder/new');
  };

  const handleEditWorkflow = (id: string) => {
    navigate(`/automation-builder/${id}`);
  };

  const handleDuplicateWorkflow = async (id: string) => {
    try {
      await workflowService.duplicateWorkflow(id);
      loadWorkflows();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowService.deleteWorkflow(id);
        loadWorkflows();
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await workflowService.updateWorkflow(id, { status: newStatus });
      loadWorkflows();
    } catch (error) {
      console.error('Error updating workflow status:', error);
    }
  };

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      // Get workflow to check if it has manual trigger
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) {
        toast.error('Workflow not found');
        return;
      }

      // Load workflow data to check for manual triggers
      const workflowData = await workflowService.getWorkflow(workflowId);
      if (!workflowData || !workflowData.board_data) {
        toast.error('Could not load workflow data');
        return;
      }
      
      const hasManual = hasManualTrigger(workflowData.board_data);
      
      if (!hasManual) {
        toast.error('This workflow does not have a manual trigger');
        return;
      }

      // Run with default payload
      const payload = { 
        test: true, 
        timestamp: new Date().toISOString(),
        source: 'workflow-list'
      };
      
      await runWorkflow(workflowId, payload);
      toast.success('✅ Workflow execution started successfully!');
      
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error(`❌ Error running workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 min-h-screen bg-transparent p-6 space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-white mb-2">Automation Builder</h1>
            <p className="text-gray-300">Create and manage your Inngest-powered workflows</p>
          </motion.div>
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateWorkflow}
            className="glow-button inline-flex items-center px-4 py-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workflow
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-panel px-6 py-4"
      >
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full pl-10 pr-4 py-2"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-input px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {allTags.length > 0 && (
            <select
              onChange={(e) => {
                const tag = e.target.value;
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              className="form-input px-3 py-2"
            >
              <option value="">Filter by tag</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#4DE0F9] bg-opacity-20 text-[#4DE0F9] border border-[#4DE0F9] border-opacity-30"
              >
                {tag}
                <button
                  onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                  className="ml-1 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Workflows Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredWorkflows.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel text-center py-12"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#4DE0F9] to-[#A855F7] flex items-center justify-center"
            >
              <Settings className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">No workflows yet</h3>
            <p className="text-gray-300 mb-6">Create your first automation workflow to get started</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateWorkflow}
              className="glow-button inline-flex items-center px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Workflow
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredWorkflows.map((workflow, index) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  index={index}
                  onEdit={handleEditWorkflow}
                  onDuplicate={handleDuplicateWorkflow}
                  onDelete={handleDeleteWorkflow}
                  onToggleStatus={handleToggleStatus}
                  onRun={handleRunWorkflow}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

interface WorkflowCardProps {
  workflow: Workflow;
  index: number;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onRun: (id: string) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  index,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onRun
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-panel p-6 cursor-pointer group"
      onClick={() => onEdit(workflow.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <motion.h3 
            className="text-lg font-semibold text-white mb-1 group-hover:text-[#4DE0F9] transition-colors"
            whileHover={{ x: 5 }}
          >
            {workflow.name}
          </motion.h3>
          {workflow.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {workflow.description}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          workflow.status === 'active' 
            ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30' 
            : 'bg-gray-500 bg-opacity-20 text-gray-400 border border-gray-500 border-opacity-30'
        }`}>
          {workflow.status}
        </div>
      </div>

      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {workflow.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#A855F7] bg-opacity-20 text-[#A855F7] border border-[#A855F7] border-opacity-30"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{workflow.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(workflow.created_at)}
        </div>
        {workflow.updated_at !== workflow.created_at && (
          <div>
            Updated {formatDate(workflow.updated_at)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(workflow.id);
            }}
            className="p-2 text-gray-400 hover:text-[#4DE0F9] hover:bg-[#4DE0F9] hover:bg-opacity-10 rounded-lg transition-colors"
            title="Edit workflow"
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(workflow.id);
            }}
            className="p-2 text-gray-400 hover:text-[#A855F7] hover:bg-[#A855F7] hover:bg-opacity-10 rounded-lg transition-colors"
            title="Duplicate workflow"
          >
            <Copy className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onRun(workflow.id);
            }}
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500 hover:bg-opacity-10 rounded-lg transition-colors"
            title="Run workflow now"
          >
            <Zap className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(workflow.id, workflow.status);
            }}
            className={`p-2 rounded-lg transition-colors ${
              workflow.status === 'active'
                ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500 hover:bg-opacity-10'
                : 'text-green-400 hover:text-green-300 hover:bg-green-500 hover:bg-opacity-10'
            }`}
            title={workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
          >
            {workflow.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(workflow.id);
            }}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition-colors"
            title="Delete workflow"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
        
        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ x: 5 }}
        >
          <span className="text-xs text-[#4DE0F9]">Open →</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AutomationBuilderListPage; 