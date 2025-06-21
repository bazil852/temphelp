import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Settings, Trash2 } from 'lucide-react';

interface SimpleWorkflowEditorProps {
  workflow?: any;
  availableActions: any[];
  onChange: (data: any) => void;
}

const SimpleWorkflowEditor: React.FC<SimpleWorkflowEditorProps> = ({
  workflow,
  availableActions,
  onChange
}) => {
  const [nodes, setNodes] = React.useState([
    {
      id: 'start',
      type: 'trigger',
      position: { x: 200, y: 150 },
      data: { label: 'Workflow Start', type: 'trigger' }
    }
  ]);

  const [connections, setConnections] = React.useState<Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>>([]);

  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionStart, setConnectionStart] = React.useState<{
    nodeId: string;
    handle: string;
    position: { x: number; y: number };
  } | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  const addNode = (actionKind: string) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'action',
      position: { x: 300 + nodes.length * 50, y: 200 + nodes.length * 30 },
      data: { 
        label: availableActions.find(a => a.kind === actionKind)?.name || actionKind,
        type: 'action',
        actionKind
      }
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onChange({ nodes: newNodes, connections });
  };

  const removeNode = (nodeId: string) => {
    const newNodes = nodes.filter(node => node.id !== nodeId);
    const newConnections = connections.filter(conn => conn.source !== nodeId && conn.target !== nodeId);
    setNodes(newNodes);
    setConnections(newConnections);
    onChange({ nodes: newNodes, connections: newConnections });
  };

  const handleConnectionStart = (nodeId: string, handle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const canvasRect = event.currentTarget.closest('.canvas-container')?.getBoundingClientRect();
    
    if (canvasRect) {
      setConnectionStart({
        nodeId,
        handle,
        position: {
          x: rect.left + rect.width / 2 - canvasRect.left,
          y: rect.top + rect.height / 2 - canvasRect.top
        }
      });
      setIsConnecting(true);
    }
  };

  const handleConnectionEnd = (targetNodeId: string, targetHandle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (connectionStart && connectionStart.nodeId !== targetNodeId) {
      const newConnection = {
        id: `${connectionStart.nodeId}-${targetNodeId}-${Date.now()}`,
        source: connectionStart.nodeId,
        target: targetNodeId,
        sourceHandle: connectionStart.handle,
        targetHandle: targetHandle
      };
      
      const newConnections = [...connections, newConnection];
      setConnections(newConnections);
      onChange({ nodes, connections: newConnections });
    }
    
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isConnecting) {
      const canvasRect = event.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - canvasRect.left,
        y: event.clientY - canvasRect.top
      });
    }
  };

  const handleCanvasClick = () => {
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
    }
  };

  return (
    <div className="flex h-full bg-transparent">
      {/* Canvas */}
      <div 
        className="flex-1 relative bg-transparent min-h-[600px] border-r border-gray-700/50 canvas-container"
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      >
        <motion.div 
          className="absolute inset-0 bg-transparent"
          style={{
            backgroundImage: `radial-gradient(rgba(77, 224, 249, 0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            zIndex: 1
          }}
        />
        
                <div className="absolute inset-0 p-4" style={{ zIndex: 100 }}>
          {/* Debug info */}
          <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs" style={{ zIndex: 500 }}>
            Nodes: {nodes.length} | Connections: {connections.length} | {isConnecting ? 'Connecting...' : 'Ready'}
          </div>
          
          {/* Fallback debug node - should always be visible */}
          <div 
            className="absolute bg-red-500 text-white p-4 rounded-lg shadow-lg" 
            style={{ 
              left: 100, 
              top: 100, 
              zIndex: 600,
              minWidth: '200px'
            }}
          >
            <div className="font-bold">DEBUG NODE</div>
            <div className="text-sm">If you can see this, nodes work!</div>
            <div className="text-xs mt-1">Position: (100, 100)</div>
          </div>
          
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              drag
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={false}
              className="absolute cursor-move"
              style={{ 
                left: node.position.x, 
                top: node.position.y,
                zIndex: 200,
                pointerEvents: 'auto'
              }}
              onDrag={(event, info) => {
                const updatedNodes = nodes.map(n => 
                  n.id === node.id 
                    ? { 
                        ...n, 
                        position: { 
                          x: node.position.x + info.offset.x, 
                          y: node.position.y + info.offset.y
                        } 
                      }
                    : n
                );
                setNodes(updatedNodes);
              }}
              onDragEnd={(event, info) => {
                onChange({ nodes, connections });
              }}
            >
                             <div 
                 className={`
                   relative min-w-[160px] p-4 rounded-lg border cursor-move
                   ${node.data.type === 'trigger' 
                     ? 'bg-gradient-to-r from-[#4DE0F9]/60 to-[#A855F7]/60 border-[#4DE0F9] bg-black/40' 
                     : 'bg-white/30 border-white/60 bg-black/40'
                   }
                   hover:bg-white/30 transition-all duration-200
                   shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                   backdrop-blur-sm
                   ring-2 ring-white/20
                 `}
                 style={{ zIndex: 300 }}
               >
                <div className="flex items-center justify-between mb-2">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${node.data.type === 'trigger' ? 'bg-[#4DE0F9]' : 'bg-[#A855F7]'}
                    shadow-[0_0_8px_currentColor]
                  `} />
                  {node.id !== 'start' && (
                    <button
                      onClick={() => removeNode(node.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <h3 className="text-white font-medium text-sm mb-1">
                  {node.data.label}
                </h3>
                
                                 <p className="text-gray-300 text-xs">
                   {node.data.type === 'trigger' ? 'Workflow Entry Point' : `Action: ${(node.data as any).actionKind || 'Unknown'}`}
                 </p>
                 
                 <p className="text-green-400 text-xs mt-1 font-mono">
                   Debug: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                 </p>

                {/* Connection points */}
                <div 
                  className="absolute -right-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleConnectionStart(node.id, 'output', e);
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="w-4 h-4 bg-[#4DE0F9] rounded-full border-2 border-white/30 shadow-[0_0_8px_#4DE0F9] hover:scale-125 transition-transform" />
                </div>
                {node.id !== 'start' && (
                  <div 
                    className="absolute -left-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleConnectionEnd(node.id, 'input', e);
                    }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="w-4 h-4 bg-[#A855F7] rounded-full border-2 border-white/30 shadow-[0_0_8px_#A855F7] hover:scale-125 transition-transform" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Connections SVG */}
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ zIndex: 50 }}
          >
            {/* Render existing connections */}
            {connections.map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source);
              const targetNode = nodes.find(n => n.id === connection.target);
              
              if (!sourceNode || !targetNode) return null;
              
              const sourceX = sourceNode.position.x + 160; // node width + connection point offset
              const sourceY = sourceNode.position.y + 40; // half node height
              const targetX = targetNode.position.x - 8; // connection point offset
              const targetY = targetNode.position.y + 40;
              
              // Create a curved path
              const midX = (sourceX + targetX) / 2;
              const pathData = `M ${sourceX} ${sourceY} C ${midX} ${sourceY} ${midX} ${targetY} ${targetX} ${targetY}`;
              
              return (
                <g key={connection.id}>
                  <path
                    d={pathData}
                    stroke="#4DE0F9"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-[0_0_8px_rgba(77,224,249,0.5)]"
                  />
                  {/* Connection dots */}
                  <circle cx={sourceX} cy={sourceY} r="3" fill="#4DE0F9" />
                  <circle cx={targetX} cy={targetY} r="3" fill="#A855F7" />
                </g>
              );
            })}
            
            {/* Render temporary connection while dragging */}
            {isConnecting && connectionStart && (
              <g>
                <path
                  d={`M ${connectionStart.position.x} ${connectionStart.position.y} L ${mousePosition.x} ${mousePosition.y}`}
                  stroke="#4DE0F9"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  className="drop-shadow-[0_0_8px_rgba(77,224,249,0.5)]"
                />
                <circle cx={connectionStart.position.x} cy={connectionStart.position.y} r="3" fill="#4DE0F9" />
                <circle cx={mousePosition.x} cy={mousePosition.y} r="3" fill="#A855F7" />
              </g>
            )}
          </svg>
        </div>

        {/* Instructions */}
        {nodes.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-8 glass-panel p-4 max-w-sm"
            style={{ zIndex: 400 }}
          >
            <h3 className="text-white font-medium mb-2">✨ Get Started</h3>
            <p className="text-gray-300 text-sm mb-3">
              Add actions from the sidebar to build your workflow. Drag nodes to rearrange them.
            </p>
            <div className="text-xs text-gray-400">
              • Drag nodes to move them<br/>
              • Connect actions by their outputs and inputs<br/>
              • Configure each action's properties
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 border-l border-gray-700 bg-transparent p-4 overflow-y-auto"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-[#4DE0F9]" />
          Inngest Nodes
        </h3>

        {/* Group actions by category */}
        {['triggers', 'core', 'flow', 'integrations'].map((category) => {
          const categoryActions = availableActions.filter(action => action.category === category);
          if (categoryActions.length === 0) return null;
          
          const categoryNames: Record<string, string> = {
            triggers: 'Triggers',
            core: 'Core Steps', 
            flow: 'Flow Control',
            integrations: 'Integrations'
          };
          
          return (
            <div key={category} className="mb-6">
              <h4 className="text-gray-300 font-medium text-sm mb-3 uppercase tracking-wide">
                {categoryNames[category]}
              </h4>
              
              <div className="space-y-2">
                {categoryActions.map((action, index) => (
                  <motion.div
                    key={action.kind}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-panel p-3 cursor-pointer hover:bg-white/10 transition-colors group"
                    onClick={() => addNode(action.kind)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{action.icon}</span>
                        <h4 className="text-white font-medium text-sm group-hover:text-[#4DE0F9] transition-colors">
                          {action.name}
                        </h4>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#4DE0F9] transition-colors" />
                    </div>
                    
                    {action.description && (
                      <p className="text-gray-400 text-xs ml-7">
                        {action.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
        

        {availableActions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">No actions available</p>
          </div>
        )}

        {/* Workflow Controls */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Play className="w-4 h-4 mr-2 text-[#4DE0F9]" />
            Workflow Controls
          </h4>
          
          <div className="space-y-2">
            <button className="w-full glow-button px-3 py-2 text-sm">
              <Play className="w-4 h-4 mr-2" />
              Test Workflow
            </button>
            
            <button className="w-full glass-panel px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Configure Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleWorkflowEditor; 