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

      {/* Save Button */}
      <button
        onClick={handleSaveWorkflow}
        className="absolute bottom-4 right-4 px-4 py-2 bg-[#c9fffc] text-black rounded-lg hover:bg-[#a0fcf9]"
      >
        Save Workflow
      </button>
    </div>
  );
}