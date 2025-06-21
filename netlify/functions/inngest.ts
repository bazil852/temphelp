import { inngest } from "../../src/lib/inngest/client";

// Simple endpoint to trigger workflows
export const handler = async (event: any, context: any) => {
  try {
    const { httpMethod, body } = event;
    
    if (httpMethod === 'POST') {
      const data = JSON.parse(body || '{}');
      
      // Send event to Inngest
      await inngest.send({
        name: "workflow/execute",
        data: data
      });
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        },
        body: JSON.stringify({ 
          success: true, 
          message: "Workflow triggered successfully" 
        })
      };
    }
    
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
    
  } catch (error) {
    console.error('Error in inngest handler:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}; 