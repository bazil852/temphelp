import { BoardJson, ExecWorkflow, ExecNode } from "./types";

export function boardToExec(board: BoardJson, name = "Untitled"): ExecWorkflow {
  // Build next node mappings
  const nextMap: Record<string, string[]> = {};
  board.connections.forEach(c => {
    (nextMap[c.source] ||= []).push(c.target);
  });

  // Build previous node mappings
  const prevMap: Record<string, string[]> = {};
  board.connections.forEach(c => {
    (prevMap[c.target] ||= []).push(c.source);
  });

  const nodes: Record<string, ExecNode> = {};
  for (const n of board.nodes) {
    if (n.id === "start") continue;
    const cfg = n.data.config ?? {};

    // Get previous nodes for this node
    const prevNodes = prevMap[n.id] || [];

    switch (n.data.actionKind) {
      case "webhook-trigger":
      case "schedule-trigger":
      case "manual-trigger":
        nodes[n.id] = {
          id: n.id,
          kind: "trigger",
          sub: (cfg.subtype ?? "webhook").replace("-trigger", ""),
          next: nextMap[n.id]?.[0] ?? null,
          prev: prevNodes,
          cfg
        };
        break;

      case "filter":
        nodes[n.id] = {
          id: n.id,
          kind: "filter",
          edges: { true: cfg.nextTrue ?? null, false: cfg.nextFalse ?? null },
          prev: prevNodes,
          cfg
        };
        break;

      case "switch":
        nodes[n.id] = {
          id: n.id,
          kind: "switch",
          edges: Object.fromEntries((cfg.cases ?? []).map((c: any) => [String(c.value), c.next])),
          prev: prevNodes,
          cfg
        };
        break;

      case "wait":
      case "merge":
        nodes[n.id] = {
          id: n.id,
          kind: n.data.actionKind,
          edges: Object.fromEntries((cfg.cases ?? []).map((c: any) => [String(c.value), c.next])),
          prev: prevNodes,
          cfg
        };
        break;

      default:
        // HTTP, Custom JS, and other linear nodes
        nodes[n.id] = {
          id: n.id,
          kind: n.data.actionKind,
          next: nextMap[n.id]?.[0] ?? null,
          prev: prevNodes,
          cfg
        };
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    version: 1,
    root: nextMap["start"]?.[0] ?? "",
    nodes
  };
} 