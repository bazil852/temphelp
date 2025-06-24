import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Settings, Trash2, ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDefaultNodeConfig } from '../types/nodes';

interface SimpleWorkflowEditorProps {
  workflow?: any;
  availableActions: any[];
  onChange: (data: any) => void;
  // Data mapping props
  triggerData?: any;
  nodeOutputs?: Record<string, any>;
  // Modal props
  onNodeClick?: (node: any) => void;
}

const SimpleWorkflowEditor: React.FC<SimpleWorkflowEditorProps> = React.memo(({ 
  workflow, 
  availableActions, 
  onChange,
  triggerData,
  nodeOutputs = {},
  onNodeClick
}) => {
  console.log('🔄 SimpleWorkflowEditor component rendered/re-rendered with:', { 
    hasWorkflow: !!workflow, 
    actionsCount: availableActions.length 
  });
  
  // Test onChange function
  console.log('🧪 Testing onChange function:', typeof onChange);
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
  const [isConnectionDragging, setIsConnectionDragging] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Canvas state
  const [canvasTransform, setCanvasTransform] = React.useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const canvasRef = React.useRef<HTMLDivElement>(null);
  
  // Touch support
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number; distance?: number } | null>(null);
  const [isTouchPanning, setIsTouchPanning] = React.useState(false);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  
  // Canvas transform save timeout
  const canvasTransformTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load workflow data when workflow prop changes
  React.useEffect(() => {
    console.log('🔄 Loading workflow data:', workflow);
    if (workflow && workflow.nodes && workflow.connections) {
      // Load existing workflow data
      console.log('📊 Loading nodes:', workflow.nodes.map((n: any) => ({ 
        id: n.id, 
        actionKind: n.data?.actionKind, 
        hasConfig: !!n.data?.config,
        config: n.data?.config 
      })));
      
      setNodes(workflow.nodes);
      setConnections(workflow.connections);
      
      // Load canvas transform if available
      if (workflow.canvasTransform) {
        setCanvasTransform(workflow.canvasTransform);
        console.log('🎯 Loaded canvas transform:', workflow.canvasTransform);
      }
      
      console.log('✅ Loaded workflow with', workflow.nodes.length, 'nodes and', workflow.connections.length, 'connections');
    } else if (workflow === null || (workflow && Object.keys(workflow).length === 0)) {
      // Reset to default state for new workflows
      setNodes([
        {
          id: 'start',
          type: 'trigger',
          position: { x: 200, y: 150 },
          data: { label: 'Workflow Start', type: 'trigger' }
        }
      ]);
      setConnections([]);
      setCanvasTransform({ x: 0, y: 0, scale: 1 });
      console.log('🆕 Reset to default workflow state');
    }
  }, [workflow]);

  // Canvas controls and keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5 refresh and Ctrl+R refresh
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          // Zoom towards center of canvas
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            handleZoom(0.1, { x: centerX, y: centerY });
          } else {
            handleZoom(0.1);
          }
        } else if (e.key === '-') {
          e.preventDefault();
          // Zoom towards center of canvas
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            handleZoom(-0.1, { x: centerX, y: centerY });
          } else {
            handleZoom(-0.1);
          }
        } else if (e.key === '0') {
          e.preventDefault();
          resetCanvasView();
        }
      }
      
      // Fit to screen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fitToScreen();
      }
    };

    // Only add keyboard listeners globally, not wheel events
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasTransform]);

  // Save canvas transform changes with debouncing
  React.useEffect(() => {
    if (canvasTransformTimeoutRef.current) {
      clearTimeout(canvasTransformTimeoutRef.current);
    }
    
    canvasTransformTimeoutRef.current = setTimeout(() => {
      console.log('💾 Saving canvas transform:', canvasTransform);
      onChange({ nodes, connections, canvasTransform });
    }, 1000); // Debounce for 1 second
    
    return () => {
      if (canvasTransformTimeoutRef.current) {
        clearTimeout(canvasTransformTimeoutRef.current);
      }
    };
  }, [canvasTransform, nodes, connections, onChange]);

  const handleZoom = (delta: number, centerPoint?: { x: number; y: number }) => {
    setCanvasTransform(prev => {
      const newScale = Math.max(0.1, Math.min(3, prev.scale + delta));
      
      // If we have a center point (like mouse position), zoom towards that point
      if (centerPoint && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = centerPoint.x - rect.left;
        const mouseY = centerPoint.y - rect.top;
        
        // Calculate the point in the transformed coordinate system
        const pointX = (mouseX - prev.x) / prev.scale;
        const pointY = (mouseY - prev.y) / prev.scale;
        
        // Calculate new position to keep the point under the mouse
        const newX = mouseX - pointX * newScale;
        const newY = mouseY - pointY * newScale;
        
        return {
          x: newX,
          y: newY,
          scale: newScale
        };
      }
      
      // Default zoom to center
      return {
        ...prev,
        scale: newScale
      };
    });
  };

  // Canvas-specific wheel handler
  const handleCanvasWheel = (e: React.WheelEvent) => {
    // Check if this is a zoom gesture (Ctrl/Cmd + wheel or pinch)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta, { x: e.clientX, y: e.clientY });
    } else if (!e.shiftKey) {
      // Regular scroll for panning (when not shift-scrolling horizontally)
      e.preventDefault();
      setCanvasTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX * 0.5,
        y: prev.y - e.deltaY * 0.5
      }));
    }
  };

  const resetCanvasView = () => {
    setCanvasTransform({ x: 0, y: 0, scale: 1 });
  };

  const fitToScreen = () => {
    const visibleNodes = nodes.filter(n => n.id !== 'start');
    if (visibleNodes.length === 0) return;
    
    const padding = 100;
    const minX = Math.min(...visibleNodes.map(n => n.position.x)) - padding;
    const maxX = Math.max(...visibleNodes.map(n => n.position.x + 160)) + padding;
    const minY = Math.min(...visibleNodes.map(n => n.position.y)) - padding;
    const maxY = Math.max(...visibleNodes.map(n => n.position.y + 80)) + padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRect.width / contentWidth;
      const scaleY = canvasRect.height / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      setCanvasTransform({
        x: (canvasRect.width / 2 - centerX * scale),
        y: (canvasRect.height / 2 - centerY * scale),
        scale
      });
    }
  };

  const addNode = (actionKind: string) => {
    console.log('➕ addNode called with actionKind:', actionKind);
    
    // Get default configuration for the node
    const getDefaultConfig = (kind: string) => {
      // For new action/flow nodes, use the types system
      if (['http', 'filter', 'js', 'switch', 'wait', 'merge', 'generate-video'].includes(kind)) {
        return getDefaultNodeConfig(kind);
      }
      
      // Legacy node default configs
      switch (kind) {
        case 'http-request':
          return { method: 'GET', url: '', headers: {}, body: '', timeout: 30000 };
        case 'filter':
          return { conditions: [{ field: '', operator: 'equals', value: '' }], mode: 'keep' };
        case 'loop':
          return { inputData: '', batchSize: 1, maxIterations: 1000 };
        case 'condition':
          return { conditions: [{ field: '', operator: 'equals', value: '' }], logic: 'AND' };
        case 'delay':
          return { duration: 1000, unit: 'milliseconds' };
        default:
          return {};
      }
    };
    
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'action',
      position: { x: 300 + nodes.length * 50, y: 200 + nodes.length * 30 },
      data: { 
        label: availableActions.find(a => a.kind === actionKind)?.name || actionKind,
        type: 'action',
        actionKind,
        config: getDefaultConfig(actionKind)
      }
    };
    
    const newNodes = [...nodes, newNode];
    console.log('➕ Adding node, new node count:', newNodes.length);
    setNodes(newNodes);
    console.log('📤 Calling onChange from addNode with data:', { 
      nodesCount: newNodes.length, 
      connectionsCount: connections.length,
      canvasTransform 
    });
    onChange({ nodes: newNodes, connections, canvasTransform });
  };

  const removeNode = (nodeId: string) => {
    console.log('🗑️ removeNode called for:', nodeId);
    const newNodes = nodes.filter(node => node.id !== nodeId);
    const newConnections = connections.filter(conn => conn.source !== nodeId && conn.target !== nodeId);
    setNodes(newNodes);
    setConnections(newConnections);
    console.log('🗑️ Node removed, calling onChange');
    onChange({ nodes: newNodes, connections: newConnections, canvasTransform });
  };

  const handleNodeClick = (node: any) => {
    console.log('🎯 Node clicked:', node.id, node.data.actionKind);
    onNodeClick?.(node);
  };

  // Build available nodes list for dropdowns
  const availableNodes = React.useMemo(() => {
    return nodes
      .filter((node: any) => node.id !== 'start') // Exclude start node
      .map((node: any) => ({
        id: node.id,
        label: node.data?.label || node.data?.actionKind || node.id,
        kind: node.data?.actionKind,
        saveAs: node.data?.config?.saveAs
      }));
  }, [nodes]);

  const handleConnectionStart = (nodeId: string, handle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Find the source node to get its position
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;
    
    // Calculate connection point position based on node position and handle type
    let connectionX = sourceNode.position.x + (handle === 'output' ? 160 : -8);
    let connectionY = sourceNode.position.y + 40; // Default: middle of node height
    
    // For switch nodes, calculate specific handle position
    if ((sourceNode.data as any).actionKind === 'switch' && handle !== 'output') {
      const config = (sourceNode.data as any).config || {};
      const cases = config.cases || [];
      const hasDefault = !!config.defaultNext;
      const totalHandles = cases.length + (hasDefault ? 1 : 0);
      const nodeHeight = 80;
      const handleSpacing = totalHandles > 1 ? nodeHeight / (totalHandles + 1) : nodeHeight / 2;
      
      connectionX = sourceNode.position.x + 160; // Right side for output handles
      
      if (handle.startsWith('case-')) {
        const caseIndex = parseInt(handle.replace('case-', ''));
        const yOffset = handleSpacing * (caseIndex + 1) - nodeHeight / 2;
        connectionY = sourceNode.position.y + 40 + yOffset;
      } else if (handle === 'default') {
        const yOffset = handleSpacing * (cases.length + 1) - nodeHeight / 2;
        connectionY = sourceNode.position.y + 40 + yOffset;
      }
    }
    
    setConnectionStart({
      nodeId,
      handle,
      position: {
        x: connectionX,
        y: connectionY
      }
    });
    setIsConnecting(true);
    setIsConnectionDragging(true);
    setIsDragging(false); // Ensure node dragging is disabled
  };

  const handleConnectionEnd = (targetNodeId: string, targetHandle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (connectionStart && connectionStart.nodeId !== targetNodeId) {
      // Prevent duplicate connections
      const existingConnection = connections.find(c => 
        c.source === connectionStart.nodeId && c.target === targetNodeId
      );
      
      if (!existingConnection) {
        const newConnection = {
          id: `${connectionStart.nodeId}-${targetNodeId}-${Date.now()}`,
          source: connectionStart.nodeId,
          target: targetNodeId,
          sourceHandle: connectionStart.handle,
          targetHandle: targetHandle
        };
        
        const newConnections = [...connections, newConnection];
        setConnections(newConnections);
        console.log('🔗 Connection created, calling onChange');
        onChange({ nodes, connections: newConnections, canvasTransform });
      }
    }
    
    // Always reset connection state
    setIsConnecting(false);
    setConnectionStart(null);
    setIsConnectionDragging(false);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Don't start panning if clicking on a node or connection point
    if (target.closest('.workflow-node') || target.closest('.connection-point')) {
      return;
    }
    
    // Always allow panning with left mouse button when not connecting
    if (event.button === 0 && !isConnecting) {
      setIsPanning(true);
      setPanStart({
        x: event.clientX - canvasTransform.x,
        y: event.clientY - canvasTransform.y
      });
      event.preventDefault();
    } else if (event.button === 1) {
      // Middle mouse button pan
      setIsPanning(true);
      setPanStart({
        x: event.clientX - canvasTransform.x,
        y: event.clientY - canvasTransform.y
      });
      event.preventDefault();
    } else if (event.button === 0 && isConnecting) {
      // Cancel connection on empty canvas click
      setIsConnecting(false);
      setConnectionStart(null);
      setIsConnectionDragging(false);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isPanning) {
      setCanvasTransform(prev => ({
        ...prev,
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y
      }));
    }
    
    if (isConnecting) {
      const canvasRect = event.currentTarget.getBoundingClientRect();
      const scaledX = (event.clientX - canvasRect.left - canvasTransform.x) / canvasTransform.scale;
      const scaledY = (event.clientY - canvasRect.top - canvasTransform.y) / canvasTransform.scale;
      setMousePosition({ x: scaledX, y: scaledY });
    }
  };

  const handleCanvasMouseUp = (event: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent) => {
    const target = event.target as HTMLElement;
    
    // Don't handle touch on nodes or connection points
    if (target.closest('.workflow-node') || target.closest('.connection-point')) {
      return;
    }

    if (event.touches.length === 1) {
      // Single touch - panning
      const touch = event.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY
      });
      setIsTouchPanning(true);
    } else if (event.touches.length === 2) {
      // Two finger touch - zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setTouchStart({
        x: centerX,
        y: centerY,
        distance
      });
    }
    event.preventDefault();
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!touchStart) return;

    if (event.touches.length === 1 && isTouchPanning) {
      // Single touch panning
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      
      setCanvasTransform(prev => ({
        ...prev,
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY
      });
    } else if (event.touches.length === 2 && touchStart.distance) {
      // Two finger zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleDelta = (distance - touchStart.distance) * 0.001;
      handleZoom(scaleDelta);
      
      setTouchStart(prev => prev ? {
        ...prev,
        distance
      } : null);
    }
    event.preventDefault();
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    setTouchStart(null);
    setIsTouchPanning(false);
    event.preventDefault();
  };

  return (
    <div 
      className="flex h-full bg-transparent"
      onSubmit={(e) => {
        console.log('🚨 FORM SUBMISSION DETECTED in SimpleWorkflowEditor!');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onReset={(e) => {
        console.log('🚨 FORM RESET DETECTED in SimpleWorkflowEditor!');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          console.log('🚨 ENTER KEY PREVENTED in SimpleWorkflowEditor on element:', (e.target as HTMLElement).tagName);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }}
    >
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative bg-transparent min-h-[600px] border-r border-gray-700/50 canvas-container select-none"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          userSelect: 'none',
          cursor: (isPanning || isTouchPanning) ? 'grabbing' : isConnecting ? 'crosshair' : 'grab',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      >
        <motion.div 
          className="absolute inset-0 bg-transparent"
          style={{
            backgroundImage: `
              radial-gradient(rgba(77, 224, 249, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(77, 224, 249, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(77, 224, 249, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: `
              ${20 * canvasTransform.scale}px ${20 * canvasTransform.scale}px,
              ${100 * canvasTransform.scale}px ${100 * canvasTransform.scale}px,
              ${100 * canvasTransform.scale}px ${100 * canvasTransform.scale}px
            `,
            backgroundPosition: `
              ${canvasTransform.x}px ${canvasTransform.y}px,
              ${canvasTransform.x}px ${canvasTransform.y}px,
              ${canvasTransform.x}px ${canvasTransform.y}px
            `,
            zIndex: 1
          }}
        />
        
          {/* Canvas Controls - Fixed position, not transformed */}
          <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 500 }}>
            {/* Minimap */}
            {nodes.length > 1 && (
              <div className="glass-panel p-2 w-32 h-20 relative overflow-hidden">
                <div className="text-xs text-gray-400 mb-1">Minimap</div>
                <div className="relative w-full h-full bg-gray-900/50 rounded">
                  {/* Viewport indicator */}
                  <div 
                    className="absolute border border-[#4DE0F9] bg-[#4DE0F9]/10"
                    style={{
                      left: `${Math.max(0, Math.min(80, -canvasTransform.x / 10))}px`,
                      top: `${Math.max(0, Math.min(40, -canvasTransform.y / 10))}px`,
                      width: `${Math.min(80, 80 / canvasTransform.scale)}px`,
                      height: `${Math.min(40, 40 / canvasTransform.scale)}px`
                    }}
                  />
                  {/* Node indicators */}
                  {nodes.filter(node => node.id !== 'start').map(node => (
                    <div
                      key={node.id}
                      className="absolute w-1 h-1 bg-[#4DE0F9] rounded-full"
                      style={{
                        left: `${Math.max(0, Math.min(80, node.position.x / 20))}px`,
                        top: `${Math.max(0, Math.min(40, node.position.y / 20))}px`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="glass-panel p-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  // Zoom towards center of canvas
                  if (canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    handleZoom(0.1, { x: centerX, y: centerY });
                  } else {
                    handleZoom(0.1);
                  }
                }}
                className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9]/10 rounded transition-colors"
                title="Zoom In (Ctrl/Cmd + +)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  // Zoom towards center of canvas
                  if (canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    handleZoom(-0.1, { x: centerX, y: centerY });
                  } else {
                    handleZoom(-0.1);
                  }
                }}
                className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9]/10 rounded transition-colors"
                title="Zoom Out (Ctrl/Cmd + -)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9]/10 rounded transition-colors"
                title="Fit to Screen (F)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetCanvasView}
                className="p-2 text-gray-300 hover:text-[#4DE0F9] hover:bg-[#4DE0F9]/10 rounded transition-colors"
                title="Reset View (Ctrl/Cmd + 0)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            {/* Zoom indicator */}
            <div className="glass-panel px-3 py-1 text-xs text-gray-300 text-center">
              {Math.round(canvasTransform.scale * 100)}%
            </div>
          </div>

          {/* Transformed container for nodes and canvas UI */}
          <div 
            className="absolute inset-0 p-4" 
            style={{ 
              zIndex: 100,
              transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
              transformOrigin: '0 0'
            }}
          >
          {/* Debug info - positioned to stay visible when zooming/panning */}
          <div 
            className="absolute bg-black/50 text-white p-2 rounded text-xs pointer-events-none" 
            style={{ 
              left: `${-canvasTransform.x / canvasTransform.scale + 20}px`,
              top: `${-canvasTransform.y / canvasTransform.scale + 20}px`,
              fontSize: `${Math.max(10, 12 / canvasTransform.scale)}px`,
              zIndex: 500 
            }}
          >
            Nodes: {nodes.filter(n => n.id !== 'start').length} | Connections: {connections.length} | {
              isConnecting ? '🔗 Connecting...' : 
              isDragging ? '🔄 Dragging...' : 
              (isPanning || isTouchPanning) ? '🤏 Panning...' : 
              '✅ Ready'
            }
          </div>
          
          {/* Connection mode instructions - positioned to stay visible */}
          {isConnecting && (
            <div 
              className="absolute bg-[#4DE0F9]/20 border border-[#4DE0F9]/50 text-white p-3 rounded backdrop-blur-sm pointer-events-none" 
              style={{ 
                left: `${-canvasTransform.x / canvasTransform.scale + 20}px`,
                top: `${-canvasTransform.y / canvasTransform.scale + 60}px`,
                fontSize: `${Math.max(12, 14 / canvasTransform.scale)}px`,
                zIndex: 500 
              }}
            >
              <div className="flex items-center mb-2">
                <div 
                  className="bg-[#4DE0F9] rounded-full mr-2 animate-pulse"
                  style={{ 
                    width: `${Math.max(6, 8 / canvasTransform.scale)}px`,
                    height: `${Math.max(6, 8 / canvasTransform.scale)}px`
                  }}
                ></div>
                Connection Mode Active
              </div>
              <p style={{ fontSize: `${Math.max(10, 12 / canvasTransform.scale)}px` }} className="text-gray-300">
                Click on a cyan input dot to complete the connection
              </p>
            </div>
          )}
          
          {/* Canvas instructions for empty state - positioned to stay visible */}
          {nodes.length === 1 && (
            <div 
              className="absolute bg-black/60 text-white p-4 rounded-lg backdrop-blur-sm border border-gray-700 pointer-events-none" 
              style={{ 
                left: `${-canvasTransform.x / canvasTransform.scale + 300}px`,
                top: `${-canvasTransform.y / canvasTransform.scale + 200}px`,
                fontSize: `${Math.max(12, 14 / canvasTransform.scale)}px`,
                zIndex: 500,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-center">
                <h3 className="font-semibold mb-2">🎯 Canvas Controls</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <kbd 
                      className="px-2 py-1 bg-gray-800 rounded"
                      style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}
                    >
                      Pinch / Wheel
                    </kbd>
                    <p className="text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}>
                      Zoom in/out
                    </p>
                  </div>
                  <div>
                    <kbd 
                      className="px-2 py-1 bg-gray-800 rounded"
                      style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}
                    >
                      Click & Drag
                    </kbd>
                    <p className="text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}>
                      Pan canvas
                    </p>
                  </div>
                  <div>
                    <kbd 
                      className="px-2 py-1 bg-gray-800 rounded"
                      style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}
                    >
                      F
                    </kbd>
                    <p className="text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}>
                      Fit to screen
                    </p>
                  </div>
                  <div>
                    <kbd 
                      className="px-2 py-1 bg-gray-800 rounded"
                      style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}
                    >
                      Ctrl/Cmd + 0
                    </kbd>
                    <p className="text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, 10 / canvasTransform.scale)}px` }}>
                      Reset view
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {nodes.filter(node => node.id !== 'start').map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              drag={!isConnecting && !isDragging && !isConnectionDragging}
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={false}
              whileDrag={{ scale: 1.05, zIndex: 1000 }}
              className="workflow-node absolute"
              style={{ 
                left: node.position.x, 
                top: node.position.y,
                zIndex: 200,
                pointerEvents: 'auto',
                                 cursor: (isConnecting || isConnectionDragging) ? 'default' : 'move'
              }}

                              onDragStart={(event, info) => {
                  // Check if the drag started from a connection point or we're in connection mode
                  const target = event.target as HTMLElement;
                  if (target.closest('.connection-point') || isConnecting || isConnectionDragging) {
                    // Completely prevent dragging if it's from a connection point or in connecting mode
                    return false;
                  }
                  
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(true);
                  return true;
                }}
              onDrag={(event, info) => {
                event.preventDefault();
                event.stopPropagation();
                
                // Use the delta from the drag to update position directly
                const deltaX = info.delta.x / canvasTransform.scale;
                const deltaY = info.delta.y / canvasTransform.scale;
                
                const updatedNodes = nodes.map(n => 
                  n.id === node.id 
                    ? { 
                        ...n, 
                        position: { 
                          x: Math.max(0, n.position.x + deltaX),
                          y: Math.max(0, n.position.y + deltaY)
                        } 
                      }
                    : n
                );
                setNodes(updatedNodes);
                // Don't call onChange during drag to prevent auto-save interruptions
              }}
              onDragEnd={(event, info) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragging(false);
                
                console.log('🎯 Node drag ended, calling onChange');
                // The position is already updated in onDrag, just trigger save
                onChange({ nodes, connections, canvasTransform });
              }}
            >
                             <div 
                 className="glass-panel relative min-w-[160px] p-4 rounded-lg border cursor-move select-none hover:border-[#4DE0F9] hover:shadow-[0_0_20px_rgba(77,224,249,0.3)] transition-all duration-200"
                 style={{ zIndex: 300 }}
                 onClick={(e) => {
                   // Only trigger if not dragging and not clicking connection points
                   const target = e.target as HTMLElement;
                   if (!isDragging && !target.closest('.connection-point') && !target.closest('button')) {
                     e.preventDefault();
                     e.stopPropagation();
                     handleNodeClick(node);
                   }
                 }}
               >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-3 h-3 rounded-full bg-[#4DE0F9] shadow-[0_0_8px_currentColor]" />
                  {node.id !== 'start' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeNode(node.id);
                      }}
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

                {/* Canvas chips for trigger types - using cyan theme only */}
                {(node.data as any).actionKind === 'webhook-trigger' && (node.data as any).config?.url && (
                  <div className="absolute -right-1 -top-1 text-xs bg-[#4DE0F9]/20 border border-[#4DE0F9]/50 rounded px-1 py-0.5 backdrop-blur-sm">
                    🌐
                  </div>
                )}
                {(node.data as any).actionKind === 'schedule-trigger' && (node.data as any).config?.cron && (
                  <div className="absolute -right-1 -top-1 text-xs bg-[#4DE0F9]/20 border border-[#4DE0F9]/50 rounded px-1 py-0.5 backdrop-blur-sm">
                    ⏰{(node.data as any).config.cron}
                  </div>
                )}

                {/* Connection points */}
                {/* For switch nodes, render multiple output handles */}
                {(node.data as any).actionKind === 'switch' ? (
                  (() => {
                    const config = (node.data as any).config || {};
                    const cases = config.cases || [];
                    const hasDefault = !!config.defaultNext;
                    const totalHandles = cases.length + (hasDefault ? 1 : 0);
                    
                    // Calculate vertical spacing for handles
                    const nodeHeight = 80;
                    const handleSpacing = totalHandles > 1 ? nodeHeight / (totalHandles + 1) : nodeHeight / 2;
                    
                    return (
                      <>
                        {/* Case output handles */}
                        {cases.map((caseItem: any, index: number) => {
                          const yOffset = handleSpacing * (index + 1) - nodeHeight / 2;
                          return (
                            <div key={`case-${index}`}>
                              <div 
                                className="connection-point absolute -right-2 cursor-crosshair z-50"
                                style={{
                                  top: '50%',
                                  transform: `translateY(calc(-50% + ${yOffset}px))`,
                                  pointerEvents: 'auto',
                                  zIndex: 1000,
                                  width: '20px',
                                  height: '20px'
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  (e.nativeEvent as any).stopImmediatePropagation?.();
                                  setIsDragging(false);
                                  handleConnectionStart(node.id, `case-${index}`, e);
                                }}
                                onDragStart={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return false;
                                }}
                                onMouseEnter={() => {
                                  document.body.style.cursor = 'crosshair';
                                }}
                                onMouseLeave={() => {
                                  if (!isConnecting) {
                                    document.body.style.cursor = 'default';
                                  }
                                }}
                                draggable={false}
                              >
                                <div className="w-5 h-5 bg-[#4DE0F9] rounded-full border-2 border-white/30 shadow-[0_0_8px_#4DE0F9] hover:scale-125 transition-transform" draggable={false} />
                              </div>
                              {/* Case label */}
                              <div 
                                className="absolute text-xs text-[#4DE0F9] font-medium whitespace-nowrap pointer-events-none"
                                style={{
                                  right: '-8px',
                                  top: '50%',
                                  transform: `translateY(calc(-50% + ${yOffset}px + 12px))`,
                                  zIndex: 999
                                }}
                              >
                                {caseItem.value || `Case ${index + 1}`}
                              </div>
                            </div>
                          );
                        })}
                        {/* Default output handle */}
                        {hasDefault && (
                          <div key="default">
                            <div 
                              className="connection-point absolute -right-2 cursor-crosshair z-50"
                              style={{
                                top: '50%',
                                transform: `translateY(calc(-50% + ${handleSpacing * (cases.length + 1) - nodeHeight / 2}px))`,
                                pointerEvents: 'auto',
                                zIndex: 1000,
                                width: '20px',
                                height: '20px'
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                (e.nativeEvent as any).stopImmediatePropagation?.();
                                setIsDragging(false);
                                handleConnectionStart(node.id, 'default', e);
                              }}
                              onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                              }}
                              onMouseEnter={() => {
                                document.body.style.cursor = 'crosshair';
                              }}
                              onMouseLeave={() => {
                                if (!isConnecting) {
                                  document.body.style.cursor = 'default';
                                }
                              }}
                              draggable={false}
                            >
                              <div className="w-5 h-5 bg-orange-400 rounded-full border-2 border-white/30 shadow-[0_0_8px_orange] hover:scale-125 transition-transform" draggable={false} />
                            </div>
                            {/* Default label */}
                            <div 
                              className="absolute text-xs text-orange-400 font-medium whitespace-nowrap pointer-events-none"
                              style={{
                                right: '-8px',
                                top: '50%',
                                transform: `translateY(calc(-50% + ${handleSpacing * (cases.length + 1) - nodeHeight / 2}px + 12px))`,
                                zIndex: 999
                              }}
                            >
                              default
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  /* Regular single output handle for non-switch nodes */
                  <div 
                    className="connection-point absolute -right-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      (e.nativeEvent as any).stopImmediatePropagation?.();
                      
                      // Prevent any node dragging
                      setIsDragging(false);
                      
                      handleConnectionStart(node.id, 'output', e);
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onMouseEnter={() => {
                      document.body.style.cursor = 'crosshair';
                    }}
                    onMouseLeave={() => {
                      if (!isConnecting) {
                        document.body.style.cursor = 'default';
                      }
                    }}
                    style={{ 
                      pointerEvents: 'auto', 
                      zIndex: 1000,
                      position: 'absolute',
                      right: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px'
                    }}
                    draggable={false}
                  >
                    <div className={`w-5 h-5 bg-[#4DE0F9] rounded-full border-2 border-white/30 shadow-[0_0_8px_#4DE0F9] hover:scale-125 transition-transform ${isConnecting ? 'ring-2 ring-white/50 animate-pulse' : ''}`} draggable={false} />
                  </div>
                )}
                {node.id !== 'start' && (
                  <div 
                    className="connection-point absolute -left-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      (e.nativeEvent as any).stopImmediatePropagation?.();
                      
                      // Prevent any node dragging
                      setIsDragging(false);
                      
                      if (isConnecting) {
                        handleConnectionEnd(node.id, 'input', e);
                      }
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    onMouseEnter={() => {
                      document.body.style.cursor = 'crosshair';
                    }}
                    onMouseLeave={() => {
                      if (!isConnecting) {
                        document.body.style.cursor = 'default';
                      }
                    }}
                    style={{ 
                      pointerEvents: 'auto', 
                      zIndex: 1000,
                      position: 'absolute',
                      left: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px'
                    }}
                    draggable={false}
                  >
                    <div className={`w-5 h-5 bg-[#4DE0F9] rounded-full border-2 border-white/30 shadow-[0_0_8px_#4DE0F9] hover:scale-125 transition-transform ${isConnecting ? 'ring-2 ring-white/50 animate-pulse' : ''}`} draggable={false} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Connections SVG - inside the transformed container */}
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              zIndex: 50,
              width: '100%',
              height: '100%',
              overflow: 'visible'
            }}
          >
            {/* Render existing connections */}
            {connections
              .filter(connection => connection.source !== 'start' && connection.target !== 'start')
              .map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source);
              const targetNode = nodes.find(n => n.id === connection.target);
              
              if (!sourceNode || !targetNode) return null;
              
              // Calculate source position based on handle type for switch nodes
              let sourceX = sourceNode.position.x + 160; // node width + connection point offset
              let sourceY = sourceNode.position.y + 40; // default: center of node
              
              // For switch nodes, calculate specific handle position
              if ((sourceNode.data as any).actionKind === 'switch' && connection.sourceHandle !== 'output') {
                const config = (sourceNode.data as any).config || {};
                const cases = config.cases || [];
                const hasDefault = !!config.defaultNext;
                const totalHandles = cases.length + (hasDefault ? 1 : 0);
                const nodeHeight = 80;
                const handleSpacing = totalHandles > 1 ? nodeHeight / (totalHandles + 1) : nodeHeight / 2;
                
                if (connection.sourceHandle?.startsWith('case-')) {
                  const caseIndex = parseInt(connection.sourceHandle.replace('case-', ''));
                  const yOffset = handleSpacing * (caseIndex + 1) - nodeHeight / 2;
                  sourceY = sourceNode.position.y + 40 + yOffset;
                } else if (connection.sourceHandle === 'default') {
                  const yOffset = handleSpacing * (cases.length + 1) - nodeHeight / 2;
                  sourceY = sourceNode.position.y + 40 + yOffset;
                }
              }
              
              const targetX = targetNode.position.x; // align with left edge of target node
              const targetY = targetNode.position.y + 40; // center of target node
              
              // Create a curved path (React Flow style)
              const midX = sourceX + (targetX - sourceX) * 0.5;
              const controlOffset = Math.abs(targetX - sourceX) * 0.3;
              const pathData = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY} ${targetX - controlOffset} ${targetY} ${targetX} ${targetY}`;
              
              // Determine connection color based on handle type
              let strokeColor = "#4DE0F9";
              if (connection.sourceHandle === 'default') {
                strokeColor = "orange";
              }
              
              return (
                <g key={connection.id}>
                  <path
                    d={pathData}
                    stroke={strokeColor}
                    strokeWidth="2"
                    fill="none"
                    className="react-flow__edge-path"
                    style={{ 
                      filter: `drop-shadow(0 0 4px ${strokeColor === 'orange' ? 'rgba(255,165,0,0.3)' : 'rgba(77, 224, 249, 0.3)'})`,
                      strokeLinecap: 'round'
                    }}
                  />
                  {/* Connection dots */}
                  <circle cx={sourceX} cy={sourceY} r="3" fill={strokeColor} className={`drop-shadow-[0_0_4px_${strokeColor === 'orange' ? 'rgba(255,165,0,0.8)' : 'rgba(77,224,249,0.8)'}]`} />
                  <circle cx={targetX} cy={targetY} r="3" fill="#4DE0F9" className="drop-shadow-[0_0_4px_rgba(77,224,249,0.8)]" />
                </g>
              );
            })}
            
            {/* Render temporary connection while dragging */}
            {isConnecting && connectionStart && (
              <g>
                <path
                  d={(() => {
                    const sourceX = connectionStart.position.x;
                    const sourceY = connectionStart.position.y;
                    const targetX = mousePosition.x;
                    const targetY = mousePosition.y;
                    const controlOffset = Math.abs(targetX - sourceX) * 0.3;
                    return `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY} ${targetX - controlOffset} ${targetY} ${targetX} ${targetY}`;
                  })()}
                  stroke="#4DE0F9"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  className="react-flow__connectionline"
                  style={{ 
                    filter: 'drop-shadow(0 0 4px rgba(77, 224, 249, 0.5))',
                    opacity: 0.8,
                    strokeLinecap: 'round'
                  }}
                />
                <circle cx={connectionStart.position.x} cy={connectionStart.position.y} r="3" fill="#4DE0F9" className="drop-shadow-[0_0_4px_rgba(77,224,249,0.8)]" />
                <circle cx={mousePosition.x} cy={mousePosition.y} r="3" fill="#4DE0F9" className="drop-shadow-[0_0_4px_rgba(77,224,249,0.8)]" />
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
              • <strong>Drag nodes</strong> by their body to move them<br/>
              • <strong>Create connections</strong> by clicking cyan output dots, then cyan input dots<br/>
              • <strong>Delete nodes</strong> using the red trash icon<br/>
              • <strong>Add nodes</strong> from the sidebar on the right
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isSidebarCollapsed ? '60px' : '320px'
        }}
        transition={{ duration: 0.3 }}
        className="border-l border-gray-700 bg-transparent relative flex flex-col h-full"
        style={{ minWidth: isSidebarCollapsed ? '60px' : '320px' }}
      >
        {/* Sidebar Header with Collapse Button */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          {!isSidebarCollapsed && (
            <h3 className="text-white font-semibold flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[#4DE0F9]" />
              Available Nodes
            </h3>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {isSidebarCollapsed ? (
            /* Collapsed Sidebar - Show only icons */
            <div className="space-y-3">
              {['triggers', 'core', 'flow', 'integrations'].map((category) => {
                const categoryActions = availableActions.filter(action => action.category === category);
                if (categoryActions.length === 0) return null;
                
                const categoryIcons: Record<string, string> = {
                  triggers: '⚡',
                  core: '⚙️',
                  flow: '🔀',
                  integrations: '🔗'
                };
                
                return (
                  <div key={category} className="space-y-2">
                    <div 
                      className="text-center p-2 text-gray-400 text-xs font-medium"
                      title={category.charAt(0).toUpperCase() + category.slice(1)}
                    >
                      {categoryIcons[category]}
                    </div>
                    {categoryActions.slice(0, 3).map((action) => (
                      <button
                        key={action.kind}
                        type="button"
                        className="w-full p-2 glass-panel hover:bg-white/10 transition-colors rounded text-center"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addNode(action.kind);
                        }}
                        title={action.name}
                      >
                        <span className="text-lg">{action.icon}</span>
                      </button>
                    ))}
                    {categoryActions.length > 3 && (
                      <div className="text-center text-xs text-gray-500">
                        +{categoryActions.length - 3}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Expanded Sidebar - Show full content */
            <>
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
                        <motion.button
                          type="button"
                          key={action.kind}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass-panel p-3 cursor-pointer hover:bg-white/10 transition-colors group w-full text-left"
                          onClick={(e) => {
                            console.log('🎯 Node button clicked for:', action.kind);
                            e.preventDefault();
                            e.stopPropagation();
                            addNode(action.kind);
                            return false;
                          }}
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
                        </motion.button>
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
            </>
          )}
        </div>


       </motion.div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  console.log('🔍 React.memo comparison:', {
    workflowChanged: JSON.stringify(prevProps.workflow) !== JSON.stringify(nextProps.workflow),
    actionsChanged: prevProps.availableActions !== nextProps.availableActions,
    onChangeChanged: prevProps.onChange !== nextProps.onChange
  });
  
  // Only re-render if props actually changed
  return (
    JSON.stringify(prevProps.workflow) === JSON.stringify(nextProps.workflow) &&
    prevProps.availableActions === nextProps.availableActions &&
    prevProps.onChange === nextProps.onChange
  );
});

export default SimpleWorkflowEditor; 