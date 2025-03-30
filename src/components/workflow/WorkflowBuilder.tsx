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
    const newNode: Node<NodeData> = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 100, y: 100 },
      data: {
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        type: nodeType,
        config: {},
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
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <NodeProperties
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(config) => handleNodeConfigUpdate(selectedNode.id, config)}
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