# Workflow Execution System Documentation

## Overview

The Workflow Execution System converts React-Flow visual workflows into optimized execution definitions with complete next/previous node relationship tracking. This enables efficient runtime execution, debugging, and flow analysis.

## Architecture

### Dual Storage Model

1. **`board_data`** - Complete React-Flow format for visual editor
2. **`exec_definition`** - Optimized runtime format with relationship tracking
3. **`version`** - Auto-incrementing version for audit trail

### Execution Definition Structure

```typescript
interface ExecWorkflow {
  id: string;           // Unique execution ID
  name: string;         // Workflow name
  version: number;      // Version number
  root: string;         // Starting node ID
  nodes: Record<string, ExecNode>;
}

interface ExecNode {
  id: string;
  kind: string;
  next?: string | null;           // Single next node
  prev?: string[];               // Array of previous nodes
  edges?: Record<string, string | null>; // Multiple edges (switch, filter)
  sub?: string;                  // Subtype for trigger nodes
  cfg: any;                      // Node configuration
}
```

## Node Relationship Tracking

### Next Node Relationships
- **Linear Nodes**: Single `next` property pointing to the next node
- **Branching Nodes**: `edges` object with condition → next node mappings

### Previous Node Relationships
- **All Nodes**: `prev` array containing all nodes that can reach this node
- **Multiple Sources**: Handles merge scenarios where multiple paths converge

### Example Execution Definition

```json
{
  "id": "exec-uuid-123",
  "name": "Order Processing Workflow",
  "version": 3,
  "root": "trigger-webhook-1",
  "nodes": {
    "trigger-webhook-1": {
      "id": "trigger-webhook-1",
      "kind": "trigger",
      "sub": "webhook",
      "next": "http-validate-2",
      "prev": [],
      "cfg": {
        "path": "/orders",
        "method": "POST"
      }
    },
    "http-validate-2": {
      "id": "http-validate-2", 
      "kind": "http-request",
      "next": "filter-check-3",
      "prev": ["trigger-webhook-1"],
      "cfg": {
        "url": "{{ ctx.trigger.validation_url }}",
        "method": "POST"
      }
    },
    "filter-check-3": {
      "id": "filter-check-3",
      "kind": "filter",
      "edges": {
        "true": "http-success-4",
        "false": "http-error-5"
      },
      "prev": ["http-validate-2"],
      "cfg": {
        "expression": "ctx.http-validate-2.status === 200"
      }
    },
    "http-success-4": {
      "id": "http-success-4",
      "kind": "http-request", 
      "next": null,
      "prev": ["filter-check-3"],
      "cfg": {
        "url": "{{ ctx.trigger.success_webhook }}"
      }
    },
    "http-error-5": {
      "id": "http-error-5",
      "kind": "http-request",
      "next": null, 
      "prev": ["filter-check-3"],
      "cfg": {
        "url": "{{ ctx.trigger.error_webhook }}"
      }
    }
  }
}
```

## Node Types and Relationships

### Trigger Nodes
```typescript
{
  kind: "trigger",
  sub: "webhook" | "schedule" | "manual",
  next: string | null,
  prev: string[], // Usually empty for triggers
  cfg: { /* trigger config */ }
}
```

### Linear Nodes (HTTP, Custom JS, etc.)
```typescript
{
  kind: "http-request" | "custom-js" | "wait",
  next: string | null,
  prev: string[],
  cfg: { /* node config */ }
}
```

### Branching Nodes (Filter, Switch)
```typescript
// Filter Node
{
  kind: "filter",
  edges: {
    "true": string | null,
    "false": string | null
  },
  prev: string[],
  cfg: { expression: "..." }
}

// Switch Node  
{
  kind: "switch",
  edges: {
    "case1": "next-node-1",
    "case2": "next-node-2", 
    "default": "default-node"
  },
  prev: string[],
  cfg: { keyExpr: "...", cases: [...] }
}
```

### Merge Nodes
```typescript
{
  kind: "merge",
  next: string | null,
  prev: string[], // Multiple previous nodes converge here
  cfg: { strategy: "pass-through" | "combine" }
}
```

## Conversion Process

### Board to Exec Transformation

The `boardToExec()` function:

1. **Builds Connection Maps**
   ```typescript
   const nextMap: Record<string, string[]> = {};
   const prevMap: Record<string, string[]> = {};
   ```

2. **Processes Each Node**
   - Determines node kind and configuration
   - Assigns next/prev relationships
   - Handles special cases (triggers, filters, switches)

3. **Generates Optimized Structure**
   - Strips visual data (positions, colors)
   - Normalizes node configurations
   - Creates efficient lookup structure

## Runtime Benefits

### Performance Improvements
- **Direct Execution**: No transformation needed at runtime
- **Efficient Traversal**: Next/prev relationships enable fast navigation
- **Reduced Payload**: Stripped visual data reduces memory usage

### Debugging Capabilities
- **Flow Tracing**: Track execution path using next/prev chains
- **Backwards Analysis**: Trace how data reached a node via prev array
- **Branch Analysis**: Understand decision points in filters/switches

### Audit Trail
- **Version Tracking**: Each save increments version number
- **Change History**: Compare exec_definitions across versions
- **Rollback Support**: Restore previous workflow versions

## Usage Examples

### Runtime Execution
```typescript
// Load workflow
const workflow = await db.workflows.findById(id);
const exec: ExecWorkflow = workflow.exec_definition;

// Start execution
let currentNodeId = exec.root;
const context = { trigger: webhookPayload };

while (currentNodeId) {
  const node = exec.nodes[currentNodeId];
  const result = await executeNode(node, context);
  
  // Store result for next nodes
  context[node.id] = result;
  
  // Determine next node
  currentNodeId = getNextNode(node, result);
}
```

### Flow Analysis
```typescript
// Find all paths to a node
function getPathsToNode(exec: ExecWorkflow, targetId: string): string[][] {
  const paths: string[][] = [];
  const target = exec.nodes[targetId];
  
  target.prev.forEach(prevId => {
    const prevPaths = getPathsToNode(exec, prevId);
    prevPaths.forEach(path => paths.push([...path, targetId]));
  });
  
  return paths.length ? paths : [[targetId]];
}

// Trace execution backwards
function traceBackwards(exec: ExecWorkflow, fromId: string): string[] {
  const path: string[] = [];
  let currentId = fromId;
  
  while (currentId) {
    path.unshift(currentId);
    const node = exec.nodes[currentId];
    currentId = node.prev[0]; // Take first previous node
  }
  
  return path;
}
```

## Testing

### Relationship Verification
```typescript
import { testBoardToExec } from './lib/workflows/boardToExec.test';

// Run in browser console
testBoardToExec();
```

### Manual Testing
```typescript
// Test next/prev relationships
const board = { nodes: [...], connections: [...] };
const exec = boardToExec(board, "Test");

// Verify each node has correct relationships
Object.values(exec.nodes).forEach(node => {
  console.log(`${node.id}:`, {
    next: node.next,
    prev: node.prev,
    edges: node.edges
  });
});
```

## Migration Strategy

### Existing Workflows
- Old workflows continue working with `workflow_data` table
- New saves automatically generate `exec_definition`
- Gradual migration as workflows are edited

### Database Schema
```sql
-- New columns in workflows table
ALTER TABLE workflows ADD COLUMN board_data JSONB DEFAULT '{}';
ALTER TABLE workflows ADD COLUMN exec_definition JSONB;
ALTER TABLE workflows ADD COLUMN version INTEGER DEFAULT 1;
```

### Backwards Compatibility
- Editor loads from `board_data` column
- Runner prefers `exec_definition`, falls back to transformation
- Version tracking starts from 1 for existing workflows

## Future Enhancements

### Advanced Flow Analysis
- **Cycle Detection**: Identify infinite loops in workflow design
- **Dead Code Detection**: Find unreachable nodes
- **Performance Analysis**: Identify bottlenecks in execution paths

### Enhanced Debugging
- **Step-by-step Execution**: Pause and inspect at each node
- **Variable Inspection**: View context changes at each step
- **Execution Replay**: Re-run workflows with recorded data

### Optimization Opportunities
- **Parallel Execution**: Execute independent branches simultaneously
- **Caching**: Cache node results for repeated executions
- **Compilation**: Pre-compile templates for faster runtime 