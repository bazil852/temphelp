import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Square, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeData, NodeTypeConfig, WorkflowNode } from './types';
import { TriggerNode } from './nodes/TriggerNode';
import { ActionNode } from './nodes/ActionNode';
import { FilterNode } from './nodes/FilterNode';
import { GenAiNode } from './nodes/GenAiNode';
import { ReturnNode } from './nodes/ReturnNode';
import { LoopNode } from './nodes/LoopNode';
import { SwitchNode } from './nodes/SwitchNode';
import { HttpRequestNode } from './nodes/HttpRequestNode';
import { SequenceNode } from './nodes/SequenceNode';
import { DelayNode } from './nodes/DelayNode';
import { NodeSidebar } from './NodeSidebar';
import { NodeProperties } from './NodeProperties';
import { webhookTestService, WebhookTestSession } from '../../services/webhookTestService';
import { WebhookDataViewer } from './WebhookDataViewer';

const DEFAULT_NODES = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      label: 'Webhook Trigger',
      type: 'trigger',
      config: {},
    },
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 400, y: 100 },
    data: {
      label: 'Generate Video',
      type: 'action',
      config: {},
    },
  },
];

const DEFAULT_EDGES = [
  {
    id: 'edge-1',
    source: 'trigger-1',
    target: 'action-1',
    type: 'default',
  },
];

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  filter: FilterNode,
  'gen-ai': GenAiNode,
  return: ReturnNode,
  loop: LoopNode,
  switch: SwitchNode,
  'http-request': HttpRequestNode,
  sequence: SequenceNode,
  delay: DelayNode,
};

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node<NodeData>[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  
  // Webhook testing state
  const [testSession, setTestSession] = useState<WebhookTestSession | null>(null);
  const [capturedData, setCapturedData] = useState<any>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Helper function to detect webhook trigger nodes
  const getWebhookTriggerNodes = () => {
    return nodes.filter(node => 
      node.type === 'trigger' && 
      node.data.config.triggerType === 'webhook'
    );
  };

  const hasWebhookTrigger = getWebhookTriggerNodes().length > 0;

  // Webhook testing functions
  const startWebhookTest = () => {
    const webhookNodes = getWebhookTriggerNodes();
    if (webhookNodes.length === 0) return;

    // Use the first webhook trigger node for testing
    const firstWebhookNode = webhookNodes[0];
    const session = webhookTestService.startListening(firstWebhookNode.id);
    setTestSession(session);
    setCapturedData(null);
    setShowTestModal(true);

    // Start polling for data
    const interval = setInterval(async () => {
      const data = await webhookTestService.pollForData(session.testId);
      if (data) {
        setCapturedData(data.payload);
        webhookTestService.updateSessionData(firstWebhookNode.id, data.payload);
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };

  const stopWebhookTest = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (testSession) {
      const webhookNodes = getWebhookTriggerNodes();
      if (webhookNodes.length > 0) {
        webhookTestService.stopListening(webhookNodes[0].id);
      }
      setTestSession(null);
    }
    setShowTestModal(false);
  };

  const copyWebhookUrl = async () => {
    if (testSession?.webhookUrl) {
      await navigator.clipboard.writeText(testSession.webhookUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const handlePathSelect = (path: string) => {
    // Update the first webhook trigger node with the selected path
    const webhookNodes = getWebhookTriggerNodes();
    if (webhookNodes.length > 0) {
      const nodeId = webhookNodes[0].id;
      handleNodeConfigUpdate(nodeId, { 
        ...webhookNodes[0].data.config, 
        promptParameter: path 
      });
    }
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleNodeAdd = (nodeType: string) => {
    const getNodeLabel = (type: string) => {
      switch (type) {
        case 'trigger': return 'Webhook Trigger';
        case 'action': return 'Generate Video';
        case 'gen-ai': return 'AI Processing';
        case 'http-request': return 'HTTP Request';
        case 'switch': return 'Conditional Switch';
        case 'loop': return 'For Each Loop';
        case 'sequence': return 'Sequence';
        case 'delay': return 'Wait';
        case 'filter': return 'Filter Data';
        case 'return': return 'Return Response';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    };

    const getNodeConfig = (type: string) => {
      switch (type) {
        case 'action': return { action: 'generate_video' };
        case 'http-request': return { method: 'GET', url: '' };
        case 'switch': return { field: '', conditions: [] };
        case 'loop': return { iterations: 10, collection: '', itemName: 'item' };
        case 'sequence': return { branches: 2, waitForAll: true, continueOnError: false };
        case 'delay': return { duration: 5, unit: 'seconds' };
        default: return {};
      }
    };

    const newNode: Node<NodeData> = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 100, y: 100 },
      data: {
        label: getNodeLabel(nodeType),
        type: nodeType,
        config: getNodeConfig(nodeType),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleNodeConfigUpdate = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  };

  const handleSaveWorkflow = () => {
    const workflow = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: node.data,
      })),
      edges: edges,
    };
    console.log('Workflow JSON:', workflow);
    return workflow;
  };

  return (
    <div className="h-[80vh] flex">
      {/* Node Sidebar */}
      <NodeSidebar onNodeAdd={handleNodeAdd} />

      {/* Flow Canvas */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
          className="bg-transparent"
        >
          <Background color="#c9fffc" gap={16} size={1} />
          <Background color="#c9fffc" gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <NodeProperties
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(config) => handleNodeConfigUpdate(selectedNode.id, config)}
          nodes={nodes}
          edges={edges}
          nodes={nodes}
          edges={edges}
        />
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-3">
        {/* Test Webhook Button */}
        {hasWebhookTrigger && (
          <button
            onClick={testSession ? stopWebhookTest : startWebhookTest}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              testSession 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-[#4DE0F9]/20 text-[#4DE0F9] border border-[#4DE0F9]/30 hover:bg-[#4DE0F9]/30'
            }`}
          >
            {testSession ? (
              <>
                <Square className="w-4 h-4" />
                <span>Stop Test</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Test Webhook</span>
              </>
            )}
            {testSession?.isListening && (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            )}
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveWorkflow}
          className="px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9]"
        >
          Save Workflow
        </button>
      </div>

      {/* Test Webhook Modal */}
      <AnimatePresence>
        {showTestModal && testSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && stopWebhookTest()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium text-lg flex items-center space-x-2">
                  <span>Webhook Testing</span>
                  {testSession.isListening && (
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                </h3>
                <button
                  onClick={stopWebhookTest}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* URL Section */}
                <div className="glass-panel p-4 border border-[#4DE0F9]/30">
                  <h4 className="text-white font-medium mb-2">Test Webhook URL</h4>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-3 bg-black/20 rounded-lg text-[#4DE0F9] text-sm font-mono break-all">
                      {testSession.webhookUrl}
                    </code>
                    <button
                      onClick={copyWebhookUrl}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{urlCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Send a POST request to this URL with your test data
                  </p>
                </div>

                {/* Status Section */}
                {testSession.isListening && !capturedData && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-3 text-yellow-400">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span>Waiting for webhook data...</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Send test data to the URL above to capture the webhook structure
                    </p>
                  </div>
                )}

                {/* Captured Data Viewer */}
                {capturedData && (
                  <div>
                    <WebhookDataViewer 
                      data={capturedData} 
                      onPathSelect={handlePathSelect}
                    />
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm">
                        ✅ Webhook data captured! Click "Use" buttons above to map JSON paths to your trigger node.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}