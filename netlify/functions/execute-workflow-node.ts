import { executeNode } from '../../src/services/nodeExecutionService';
import { ActionFlowNode } from '../../src/types/nodes';

interface ExecuteNodeRequest {
  node: ActionFlowNode;
  context: Record<string, any>;
}

export const handler = async (event: any, context: any) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { node, context: executionContext }: ExecuteNodeRequest = JSON.parse(event.body || '{}');

    if (!node) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Node configuration is required' })
      };
    }

    if (!node.kind || !['http', 'filter', 'js', 'switch', 'wait', 'merge'].includes(node.kind)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Invalid node kind: ${node.kind}` })
      };
    }

    console.log(`🔄 Executing node: ${node.kind} (${node.id})`);
    
    // Execute the node
    const result = await executeNode(node, executionContext || {});
    
    console.log(`✅ Node execution completed:`, result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error executing workflow node:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
}; 