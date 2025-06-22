import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { runWorkflow } from '../services/triggerService';
import toast from 'react-hot-toast';

interface RunNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName?: string;
}

const RunNowModal: React.FC<RunNowModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  workflowName
}) => {
  const [payload, setPayload] = useState('{}');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    try {
      // Validate JSON
      let parsedPayload = {};
      if (payload.trim()) {
        try {
          parsedPayload = JSON.parse(payload);
        } catch (error) {
          toast.error('Invalid JSON payload. Please check your input.');
          return;
        }
      }

      setIsRunning(true);
      await runWorkflow(workflowId, parsedPayload);
      toast.success('Queued ✓');
      onClose();
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error(`Failed to run workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Run Workflow Now</h2>
                {workflowName && (
                  <p className="text-sm text-gray-400">{workflowName}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                JSON Payload
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={8}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm resize-none"
                placeholder="Enter JSON payload..."
              />
              <p className="text-xs text-gray-400 mt-1">
                This payload will be available to your workflow as trigger data
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run Now'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RunNowModal; 