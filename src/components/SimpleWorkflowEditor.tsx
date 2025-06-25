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

// Helper function to get node icon based on action kind
const getNodeIcon = (actionKind: string): string => {
  const iconMap: Record<string, string> = {
    'webhook-trigger': '🌐',
    'manual-trigger': '👆',
    'schedule-trigger': '⏰',
    'filter': '🔍',
    'switch': '🔀',
    'wait': '⏱️',
    'merge': '🔄',
    'js': '⚡',
    'http': '🌐',
    'generate-video': '🎬',
    'ai-processing': '🤖',
  };
  return iconMap[actionKind] || '⚙️';
};

// Draggable component replacement (simple wrapper)
interface DraggableProps {
  children: React.ReactNode;
  position: { x: number; y: number };
  onStart: () => boolean;
  onDrag: (e: React.MouseEvent, data: { x: number; y: number }) => void;
  onStop: (e: React.MouseEvent, data: { x: number; y: number }) => void;
}

const Draggable: React.FC<DraggableProps> = ({ children, position, onStart, onDrag, onStop }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = React.useState(position);
  const [dragStarted, setDragStarted] = React.useState(false);
  const [mouseStartPos, setMouseStartPos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const newPos = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };
        setCurrentPos(newPos);
        onDrag(e as any, newPos);
        
        // If we moved more than 5px, consider it a drag
        const distanceMoved = Math.sqrt(
          Math.pow(e.clientX - mouseStartPos.x, 2) + 
          Math.pow(e.clientY - mouseStartPos.y, 2)
        );
        if (distanceMoved > 5) {
          setDragStarted(true);
        }
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        onStop(e as any, currentPos);
        
        // Reset drag started state after a short delay
        setTimeout(() => setDragStarted(false), 100);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, startPos, currentPos, onDrag, onStop, mouseStartPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onStart()) {
      setIsDragging(true);
      setDragStarted(false);
      setStartPos({ x: e.clientX - currentPos.x, y: e.clientY - currentPos.y });
      setMouseStartPos({ x: e.clientX, y: e.clientY });
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      style={{ position: 'absolute', left: currentPos.x, top: currentPos.y }}
      onMouseDown={handleMouseDown}
      data-drag-started={dragStarted}
    >
      {children}
    </div>
  );
};

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  
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
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Full-screen Canvas */}
      <div 
        ref={canvasRef}
        className="w-full h-full relative bg-gray-900"
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
          touchAction: 'none'
        }}
      >
        {/* Grid Background */}
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
        
        {/* Canvas Status Bar - Minimal */}
        <div 
          className="absolute top-20 left-4 bg-black/50 text-white px-3 py-1 rounded text-xs pointer-events-none z-50" 
        >
          {Math.round(canvasTransform.scale * 100)}% | {nodes.filter(n => n.id !== 'start').length} nodes | {connections.length} connections
            </div>
            
        {/* Transformed container for nodes */}
        <div 
          className="absolute inset-0" 
            style={{ 
              zIndex: 50,
              transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
              transformOrigin: '0 0'
            }}
          >
          {/* Connection lines */}
          <svg 
            className="absolute inset-0 pointer-events-none w-full h-full" 
            style={{ zIndex: 250, overflow: 'visible' }}
          >
            {/* Debug test line - always visible */}
            <path
              d="M 200 100 L 400 100"
              stroke="#4DE0F9"
              strokeWidth="3"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(77, 224, 249, 0.5))' }}
            />
            
            {connections.map((connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source);
              const targetNode = nodes.find(n => n.id === connection.target);
              
              // Don't render connections involving the start node
              if (!sourceNode || !targetNode || sourceNode.id === 'start' || targetNode.id === 'start') return null;
              
              // Calculate connection points based on actual connection dot positions
              const nodeWidth = 160; // Approximate node width
              const nodeHeight = 120; // Approximate node height with padding
              const sourceX = sourceNode.position.x + nodeWidth + 8; // Right connection dot
              const sourceY = sourceNode.position.y + nodeHeight / 2; // Center height
              const targetX = targetNode.position.x - 8; // Left connection dot
              const targetY = targetNode.position.y + nodeHeight / 2; // Center height
              
              // Create smooth cubic bezier curve
              const controlX1 = sourceX + 80; // Control point for smooth curve
              const controlX2 = targetX - 80;
              const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
              
              return (
                <path
                  key={connection.id}
                  d={pathData}
                  stroke="#4DE0F9"
                  strokeWidth="3"
                  fill="none"
                  className="drop-shadow-lg"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(77, 224, 249, 0.5))' }}
                />
              );
            })}
            
            {/* Active connection line */}
            {isConnecting && connectionStart && (
              <path
                d={`M ${connectionStart.position.x} ${connectionStart.position.y} Q ${(connectionStart.position.x + mousePosition.x) / 2} ${connectionStart.position.y} ${mousePosition.x} ${mousePosition.y}`}
                stroke="#4DE0F9"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
                className="animate-pulse"
                style={{ filter: 'drop-shadow(0 0 6px rgba(77, 224, 249, 0.8))' }}
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.filter(node => node.id !== 'start').map((node) => (
            <Draggable
              key={node.id}
              position={node.position}
              onStart={() => {
                console.log('🎯 Node drag started');
                return true;
              }}
              onDrag={(e, data) => {
                setIsDragging(true);
                
                const updatedNodes = nodes.map(n => 
                  n.id === node.id 
                    ? { ...n, position: { x: data.x, y: data.y } }
                    : n
                );
                setNodes(updatedNodes);
                console.log('🔄 Node position updated during drag');
              }}
              onStop={(e, data) => {
                console.log('🎯 Node drag ended, calling onChange');
                onChange({ nodes, connections, canvasTransform });
                
                // Reset isDragging after a short delay to prevent immediate clicks
                setTimeout(() => setIsDragging(false), 50);
              }}
            >
              {/* Clean Modern Node */}
              <div 
                className="workflow-node bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl cursor-move select-none hover:border-[#4DE0F9]/50 transition-all duration-200 min-w-[140px] max-w-[180px] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                style={{ zIndex: 300 }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const dragStarted = (e.currentTarget.parentElement as HTMLElement)?.getAttribute('data-drag-started') === 'true';
                  
                  if (!isDragging && !dragStarted && !target.closest('.connection-point') && !target.closest('button')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNodeClick(node);
                  }
                }}
              >
                {/* Node Content */}
                <div className="flex flex-col items-center p-4 relative">
                  {/* Delete Button - Top Right */}
                  {node.id !== 'start' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeNode(node.id);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  {/* Node Icon */}
                  <div className="w-8 h-8 bg-[#4DE0F9]/20 border border-[#4DE0F9]/30 rounded-xl flex items-center justify-center text-lg mb-2">
                    {node.data.type === 'trigger' ? '⚡' : getNodeIcon((node.data as any).actionKind)}
                  </div>
                  
                  {/* Node Name */}
                  <span className="text-sm font-medium text-white text-center leading-tight">
                    {node.data.label}
                  </span>
                </div>

                {/* Connection Points */}
                {/* Input handle - left side */}
                {node.id !== 'start' && (
                  <div 
                    className="connection-point absolute -left-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setIsDragging(false);
                      handleConnectionEnd(node.id, 'input', e);
                    }}
                    style={{ width: '16px', height: '16px' }}
                  >
                    <div className="w-4 h-4 bg-gray-300 border-2 border-white rounded-full hover:bg-blue-500 transition-colors" />
                          </div>
                        )}

                {/* Output handle - right side */}
                  <div 
                    className="connection-point absolute -right-2 top-1/2 transform -translate-y-1/2 cursor-crosshair z-50"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsDragging(false);
                      handleConnectionStart(node.id, 'output', e);
                    }}
                  style={{ width: '16px', height: '16px' }}
                >
                  <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full hover:bg-blue-600 transition-colors" />
                  </div>
                  </div>
            </Draggable>
          ))}
        </div>

        {/* Help Instructions */}
        {nodes.filter(n => n.id !== 'start').length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] text-white p-6 max-w-sm z-40"
          >
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="text-lg mr-2">✨</span>
              Get Started
            </h3>
            <p className="text-sm mb-4 text-gray-300 leading-relaxed">
              Add nodes from the sidebar to build your workflow.
            </p>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-[#4DE0F9] rounded-full mr-3"></span>
                Drag nodes to move them
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-[#4DE0F9] rounded-full mr-3"></span>
                Click blue dots to create connections
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 bg-[#4DE0F9] rounded-full mr-3"></span>
                Double-click nodes to configure
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Sidebar */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isSidebarCollapsed ? '60px' : '300px'
        }}
        transition={{ duration: 0.3 }}
        className="absolute top-20 right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] z-[110] flex flex-col pointer-events-auto"
        style={{ 
          minWidth: isSidebarCollapsed ? '60px' : '300px', 
          height: 'calc(100vh - 280px)',
          maxHeight: 'calc(100vh - 280px)'
        }}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b border-white/10 flex items-center flex-shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <h3 className="text-white font-medium text-sm flex items-center">
              <Plus className="w-4 h-4 mr-2 text-[#4DE0F9]" />
              Add Nodes
            </h3>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer pointer-events-auto"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {isSidebarCollapsed ? (
            /* Collapsed - Icons only */
            <div className="space-y-2">
              {availableActions.slice(0, 8).map((action) => (
                      <motion.button
                        key={action.kind}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full aspect-square p-2 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-lg text-center border border-white/10 hover:border-[#4DE0F9]/30 group flex items-center justify-center cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addNode(action.kind);
                        }}
                        title={action.name}
                      >
                        <span className="text-sm group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                      </motion.button>
                    ))}
            </div>
          ) : (
            /* Expanded - Full content */
            <div className="space-y-6">
              {['triggers', 'core', 'integrations'].map((category) => {
                const categoryActions = availableActions.filter(action => action.category === category);
                if (categoryActions.length === 0) return null;
                
                const categoryNames: Record<string, string> = {
                  triggers: 'Triggers',
                  core: 'Core', 
                  integrations: 'Integrations'
                };
                
                return (
                  <motion.div 
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="text-gray-300 font-semibold text-xs mb-3 uppercase tracking-wider">
                      {categoryNames[category]}
                    </h4>
                    
                    <div className="space-y-2">
                      {categoryActions.map((action, index) => (
                        <motion.button
                          key={action.kind}
                          type="button"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                                                     className="w-full p-3 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-xl text-left border border-white/10 hover:border-[#4DE0F9]/30 group cursor-pointer pointer-events-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addNode(action.kind);
                          }}
                        >
                            <div className="flex items-center">
                            <span className="text-base mr-3 group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {action.name}
                            </div>
                          {action.description && (
                                <div className="text-xs text-gray-400 truncate mt-0.5">
                              {action.description}
                                </div>
                          )}
                            </div>
                            <Plus className="w-3 h-3 text-gray-400 group-hover:text-[#4DE0F9] transition-colors flex-shrink-0" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
                </div>
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