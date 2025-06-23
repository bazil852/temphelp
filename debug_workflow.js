import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiucmdovylwgfileuhpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdWNtZG92eWx3Z2ZpbGV1aHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NDYxMTEsImV4cCI6MjA0NzIyMjExMX0.Hx57N55YK5Pp5tKkvDStcGFWKzAtzmJNlIqlqaGN9FA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple boardToExec conversion for debugging
function boardToExec(board, name = "Untitled") {
  const nextMap = {};
  board.connections?.forEach(c => {
    (nextMap[c.source] ||= []).push(c.target);
  });

  const prevMap = {};
  board.connections?.forEach(c => {
    (prevMap[c.target] ||= []).push(c.source);
  });

  const nodes = {};
  for (const n of board.nodes || []) {
    if (n.id === "start") continue;
    const cfg = n.data?.config ?? {};
    const prevNodes = prevMap[n.id] || [];

    switch (n.data?.actionKind) {
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

      default:
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

async function debugWorkflow() {
  const workflowId = 'ec6c0032-32d5-4c49-a996-c954490c7efe';
  
  console.log('🔍 Checking workflow data...');
  
  // Get workflow data
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('id, name, status, board_data, exec_definition')
    .eq('id', workflowId)
    .single();
    
  if (error) {
    console.error('❌ Error fetching workflow:', error);
    return;
  }
  
  console.log('📊 Workflow info:');
  console.log('- ID:', workflow.id);
  console.log('- Name:', workflow.name);
  console.log('- Status:', workflow.status);
  console.log('- Has board_data:', !!workflow.board_data);
  console.log('- Has exec_definition:', !!workflow.exec_definition);
  
  if (workflow.board_data) {
    console.log('\n📋 Board data structure:');
    console.log('- Nodes count:', workflow.board_data.nodes?.length || 0);
    console.log('- Connections count:', workflow.board_data.connections?.length || 0);
    
    if (workflow.board_data.nodes) {
      workflow.board_data.nodes.forEach((node, index) => {
        console.log(`  Node ${index + 1}:`, {
          id: node.id,
          type: node.type,
          actionKind: node.data?.actionKind,
          hasConfig: !!node.data?.config
        });
      });
    }
    
    // Test manual conversion
    console.log('\n🔧 Testing manual boardToExec conversion:');
    const converted = boardToExec(workflow.board_data, workflow.name);
    console.log('- Root node:', converted.root);
    console.log('- Converted nodes:');
    Object.keys(converted.nodes).forEach(key => {
      const node = converted.nodes[key];
      console.log(`  ${key}:`, {
        kind: node.kind,
        sub: node.sub,
        next: node.next,
        hasConfig: !!node.cfg
      });
    });
  }
  
  if (workflow.exec_definition) {
    console.log('\n⚙️ Current exec_definition structure:');
    console.log('Type:', typeof workflow.exec_definition);
    console.log('Keys:', Object.keys(workflow.exec_definition));
    console.log('Full object:', JSON.stringify(workflow.exec_definition, null, 2));
  }
  
  // Test the activate_workflow RPC
  console.log('\n🚀 Testing activate_workflow RPC...');
  const { data: activateResult, error: activateError } = await supabase
    .rpc('activate_workflow', { p_workflow: workflowId });
    
  if (activateError) {
    console.error('❌ Activate workflow error:', activateError);
  } else {
    console.log('✅ Activate result:', activateResult);
  }
}

debugWorkflow().catch(console.error); 