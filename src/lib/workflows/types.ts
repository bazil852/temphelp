// Board JSON structure (React-Flow format)
export interface BoardJson {
  nodes: BoardNode[];
  connections: BoardConnection[];
}

export interface BoardNode {
  id: string;
  data: {
    actionKind: string;
    config?: any;
  };
  position?: { x: number; y: number };
}

export interface BoardConnection {
  source: string;
  target: string;
}

// Execution definition structure (optimized for runtime)
export interface ExecWorkflow {
  id: string;
  name: string;
  version: number;
  root: string; // Starting node ID
  nodes: Record<string, ExecNode>;
}

export interface ExecNode {
  id: string;
  kind: string;
  next?: string | null; // Single next node
  prev?: string[]; // Array of previous nodes (multiple nodes can point to this one)
  edges?: Record<string, string | null>; // Multiple edges (switch, filter)
  sub?: string; // Subtype for trigger nodes
  cfg: any; // Node configuration
}

// Additional types for specific node kinds
export interface TriggerExecNode extends ExecNode {
  kind: "trigger";
  sub: "webhook" | "schedule" | "manual";
  next: string | null;
  prev: string[];
}

export interface FilterExecNode extends ExecNode {
  kind: "filter";
  edges: {
    true: string | null;
    false: string | null;
  };
  prev: string[];
}

export interface SwitchExecNode extends ExecNode {
  kind: "switch";
  edges: Record<string, string | null>; // case value -> next node
  prev: string[];
} 