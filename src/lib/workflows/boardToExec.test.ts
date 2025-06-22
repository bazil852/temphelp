import { boardToExec } from './boardToExec';
import { BoardJson } from './types';

// Test function to verify next/prev relationships
export function testBoardToExec() {
  const testBoard: BoardJson = {
    nodes: [
      {
        id: "start",
        data: { actionKind: "start" }
      },
      {
        id: "trigger-1",
        data: { 
          actionKind: "webhook-trigger",
          config: { path: "/webhook" }
        }
      },
      {
        id: "http-2", 
        data: {
          actionKind: "http-request",
          config: { url: "https://api.example.com" }
        }
      },
      {
        id: "filter-3",
        data: {
          actionKind: "filter", 
          config: { expression: "ctx.result.success" }
        }
      },
      {
        id: "end-4",
        data: {
          actionKind: "http-request",
          config: { url: "https://success.example.com" }
        }
      }
    ],
    connections: [
      { source: "start", target: "trigger-1" },
      { source: "trigger-1", target: "http-2" },
      { source: "http-2", target: "filter-3" },
      { source: "filter-3", target: "end-4" }
    ]
  };

  const result = boardToExec(testBoard, "Test Workflow");
  
  console.log("🧪 Testing boardToExec with next/prev relationships:");
  console.log("Root node:", result.root);
  
  Object.values(result.nodes).forEach(node => {
    console.log(`Node ${node.id}:`, {
      kind: node.kind,
      next: node.next,
      prev: node.prev,
      edges: node.edges
    });
  });

  // Verify relationships
  const trigger = result.nodes["trigger-1"];
  const http = result.nodes["http-2"];
  const filter = result.nodes["filter-3"];
  const end = result.nodes["end-4"];

  console.log("\n✅ Verification:");
  console.log("trigger-1 next:", trigger?.next === "http-2");
  console.log("trigger-1 prev:", trigger?.prev?.includes("start"));
  console.log("http-2 next:", http?.next === "filter-3");
  console.log("http-2 prev:", http?.prev?.includes("trigger-1"));
  console.log("filter-3 prev:", filter?.prev?.includes("http-2"));
  console.log("end-4 prev:", end?.prev?.includes("filter-3"));

  return result;
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testBoardToExec = testBoardToExec;
} 