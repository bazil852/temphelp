import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Settings, Play, Pause, Copy, Trash2, Edit3, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowService, type Workflow } from '../services/workflowService';

const WorkflowListPage: React.FC = () => {
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
    navigate('/workflow/new');
  };

  const handleEditWorkflow = (id: string) => {
    navigate(`/workflow/${id}`);
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="relative">
          {/* Pulsing circles */}
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
            animate={{ scale: [1.4, 1.6, 1.4], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="w-20 h-20 rounded-full bg-[#4DE0F9] bg-opacity-10 absolute"
          />
          
          {/* Central glowing dot */}
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
            <h1 className="text-2xl font-bold text-white mb-2">Workflows</h1>
            <p className="text-gray-300">Manage and organize your automation workflows</p>
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
          {/* Search */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-input px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Tag Filter */}
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

        {/* Selected Tags */}
        <AnimatePresence>
          {selectedTags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center space-x-2 mt-3"
            >
              <span className="text-sm text-gray-300">Selected tags:</span>
              {selectedTags.map(tag => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="inline-flex items-center px-2 py-1 bg-[#4DE0F9] bg-opacity-20 text-[#4DE0F9] text-sm rounded-full border border-[#4DE0F9] border-opacity-30"
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 text-[#4DE0F9] hover:text-white"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Workflow Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="min-h-[400px]"
      >
        {filteredWorkflows.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel text-center py-16"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-24 h-24 mx-auto mb-4 bg-[#4DE0F9] bg-opacity-10 rounded-full flex items-center justify-center"
            >
              <Settings className="w-12 h-12 text-[#4DE0F9]" />
            </motion.div>
            <motion.h3 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg font-medium text-white mb-2"
            >
              {workflows.length === 0 ? 'No workflows yet' : 'No workflows match your filters'}
            </motion.h3>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-300 mb-6"
            >
              {workflows.length === 0 
                ? 'Get started by creating your first automation workflow'
                : 'Try adjusting your search or filter criteria'
              }
            </motion.p>
            {workflows.length === 0 && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateWorkflow}
                className="glow-button inline-flex items-center px-4 py-2"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Workflow
              </motion.button>
            )}
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
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  index,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass-panel p-6 cursor-pointer relative overflow-hidden group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onEdit(workflow.id)}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))'
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{workflow.name}</h3>
          {workflow.description && (
            <p className="text-gray-300 text-sm line-clamp-2">{workflow.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className={`px-2 py-1 text-xs rounded-full ${
              workflow.status === 'active'
                ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30'
                : 'bg-gray-500 bg-opacity-20 text-gray-400 border border-gray-500 border-opacity-30'
            }`}
          >
            {workflow.status}
          </motion.span>
        </div>
      </div>

      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
          {workflow.tags.slice(0, 3).map((tag, tagIndex) => (
            <motion.span
              key={tag}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + tagIndex * 0.05 + 0.3 }}
              className="inline-flex items-center px-2 py-1 bg-[#4DE0F9] bg-opacity-10 text-[#4DE0F9] text-xs rounded-full border border-[#4DE0F9] border-opacity-20"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </motion.span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{workflow.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400 relative z-10">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(workflow.updated_at)}
        </div>
      </div>

      {/* Action Buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-4 right-4 flex items-center space-x-1 glass-panel p-1 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(workflow.id, workflow.status);
              }}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] rounded transition-colors"
              title={workflow.status === 'active' ? 'Deactivate' : 'Activate'}
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
                onEdit(workflow.id);
              }}
              className="p-2 text-gray-300 hover:text-[#4DE0F9] rounded transition-colors"
              title="Edit"
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
              className="p-2 text-gray-300 hover:text-[#4DE0F9] rounded transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workflow.id);
              }}
              className="p-2 text-gray-300 hover:text-red-400 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkflowListPage; 