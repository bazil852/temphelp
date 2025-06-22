/**
 * Template Engine for Data Mapping
 * Handles {{ctx.key}} interpolation with helper functions
 */

// Template helpers
const helpers = {
  uuid: () => crypto.randomUUID(),
  
  now: (format?: string) => {
    const now = new Date();
    switch (format) {
      case 'epoch':
        return Math.floor(now.getTime() / 1000);
      case 'iso':
      default:
        return now.toISOString();
    }
  },
  
  formatDate: (date: any, format: string) => {
    // Simple date formatting - in production you'd use dayjs
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const replacements: Record<string, string> = {
      'YYYY': d.getFullYear().toString(),
      'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
      'DD': d.getDate().toString().padStart(2, '0'),
      'HH': d.getHours().toString().padStart(2, '0'),
      'mm': d.getMinutes().toString().padStart(2, '0'),
      'ss': d.getSeconds().toString().padStart(2, '0'),
    };
    
    let result = format;
    Object.entries(replacements).forEach(([pattern, value]) => {
      result = result.replace(new RegExp(pattern, 'g'), value);
    });
    
    return result;
  }
};

/**
 * Parse and interpolate template strings
 * Supports: {{ctx.trigger.order.total}}, {{uuid()}}, {{now("iso")}}
 */
export function interpolateTemplate(template: string, ctx: any): string {
  if (!template || typeof template !== 'string') {
    return template;
  }

  // Check if template contains any placeholders
  if (!template.includes('{{')) {
    return template;
  }

  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    try {
      const trimmed = expression.trim();
      
      // Handle helper functions
      if (trimmed.includes('(')) {
        return evaluateHelper(trimmed, ctx);
      }
      
      // Handle context paths (ctx.trigger.order.total)
      if (trimmed.startsWith('ctx.')) {
        const path = trimmed.substring(4); // Remove 'ctx.'
        return getNestedValue(ctx, path) || '';
      }
      
      // Fallback: try to evaluate as-is
      return getNestedValue(ctx, trimmed) || '';
      
    } catch (error) {
      console.warn('Template interpolation error:', error, 'Expression:', expression);
      return ''; // Return empty string for failed interpolations
    }
  });
}

/**
 * Evaluate helper functions like uuid(), now("iso"), formatDate(ctx.trigger.date, "YYYY-MM-DD")
 */
function evaluateHelper(expression: string, ctx: any): string {
  try {
    // Parse function name and arguments
    const funcMatch = expression.match(/^(\w+)\((.*)\)$/);
    if (!funcMatch) return '';
    
    const [, funcName, argsStr] = funcMatch;
    
    // Parse arguments (simple implementation - handles strings and ctx paths)
    const args = argsStr ? parseArguments(argsStr, ctx) : [];
    
    // Call the helper function
    const helperFunc = (helpers as any)[funcName];
    if (typeof helperFunc === 'function') {
      return String(helperFunc(...args));
    }
    
    return '';
  } catch (error) {
    console.warn('Helper evaluation error:', error);
    return '';
  }
}

/**
 * Parse function arguments, handling strings and context paths
 */
function parseArguments(argsStr: string, ctx: any): any[] {
  const args: any[] = [];
  const parts = argsStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (!part) continue;
    
    // String literal
    if ((part.startsWith('"') && part.endsWith('"')) || 
        (part.startsWith("'") && part.endsWith("'"))) {
      args.push(part.slice(1, -1));
    }
    // Context path
    else if (part.startsWith('ctx.')) {
      const path = part.substring(4);
      args.push(getNestedValue(ctx, path));
    }
    // Number
    else if (!isNaN(Number(part))) {
      args.push(Number(part));
    }
    // Boolean
    else if (part === 'true' || part === 'false') {
      args.push(part === 'true');
    }
    // Default to string
    else {
      args.push(part);
    }
  }
  
  return args;
}

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue(obj, 'order.customer.email')
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Deep interpolate an entire configuration object
 * Walks through all string values and interpolates templates
 */
export function interpolateConfig(config: any, ctx: any): any {
  if (config === null || config === undefined) {
    return config;
  }
  
  // String: interpolate if it contains templates
  if (typeof config === 'string') {
    return interpolateTemplate(config, ctx);
  }
  
  // Array: recursively interpolate each item
  if (Array.isArray(config)) {
    return config.map(item => interpolateConfig(item, ctx));
  }
  
  // Object: recursively interpolate each value
  if (typeof config === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = interpolateConfig(value, ctx);
    }
    return result;
  }
  
  // Primitive values (number, boolean): return as-is
  return config;
}

/**
 * Extract all template paths from a configuration object
 * Used for validation and UI purposes
 */
export function extractTemplatePaths(config: any): string[] {
  const paths = new Set<string>();
  
  function extract(value: any) {
    if (typeof value === 'string' && value.includes('{{')) {
      const matches = value.match(/\{\{ctx\.([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const path = match.replace(/\{\{ctx\.([^}]+)\}\}/, '$1');
          paths.add(path);
        });
      }
    } else if (Array.isArray(value)) {
      value.forEach(extract);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(extract);
    }
  }
  
  extract(config);
  return Array.from(paths);
}

/**
 * Build execution context from workflow state
 */
export function buildExecutionContext(
  triggerPayload: any,
  nodeOutputs: Record<string, any> = {}
): any {
  return {
    trigger: triggerPayload || {},
    ...nodeOutputs
  };
}

/**
 * Generate flat list of paths from an object for UI dropdown
 * Limited to specified depth to avoid infinite recursion
 */
export function generateDataPaths(
  obj: any, 
  prefix = '', 
  maxDepth = 5, 
  currentDepth = 0
): Array<{ path: string; type: string; value?: any }> {
  const paths: Array<{ path: string; type: string; value?: any }> = [];
  
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return paths;
  }
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      
      // Add the current path
      paths.push({
        path: currentPath,
        type: valueType,
        value: valueType !== 'object' ? value : undefined
      });
      
      // Recursively process objects and arrays
      if (value && typeof value === 'object') {
        paths.push(...generateDataPaths(value, currentPath, maxDepth, currentDepth + 1));
      }
    });
  } else if (Array.isArray(obj)) {
    // For arrays, show first few items as examples
    obj.slice(0, 3).forEach((item, index) => {
      const currentPath = `${prefix}.${index}`;
      const valueType = Array.isArray(item) ? 'array' : typeof item;
      
      paths.push({
        path: currentPath,
        type: valueType,
        value: valueType !== 'object' ? item : undefined
      });
      
      if (item && typeof item === 'object') {
        paths.push(...generateDataPaths(item, currentPath, maxDepth, currentDepth + 1));
      }
    });
  }
  
  return paths;
}

/**
 * Generate sample output data for different node types
 * This helps users understand what data will be available for mapping
 */
export function generateSampleNodeOutput(nodeKind: string, config: any): any {
  switch (nodeKind) {
    case 'http':
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-response-time': '45ms'
        },
        data: {
          id: 12345,
          name: 'Sample Response',
          email: 'user@example.com',
          created_at: '2024-01-15T10:30:00Z',
          metadata: {
            source: 'api',
            version: '1.2'
          }
        }
      };
      
    case 'generate-video':
      return {
        videoId: 'vid_abc123def456',
        status: 'completed',
        url: 'https://cdn.example.com/videos/sample-video.mp4',
        thumbnail: 'https://cdn.example.com/thumbnails/sample-thumb.jpg',
        duration: 45.2,
        resolution: {
          width: 1920,
          height: 1080
        },
        metadata: {
          influencer: config?.influencerId || 'inf_sample',
          script_length: 156,
          processing_time: 23.4,
          created_at: '2024-01-15T10:35:00Z'
        }
      };
      
    case 'js':
      // For custom JS, provide a generic result structure
      return {
        result: 'Custom processing completed',
        processed_items: 5,
        timestamp: '2024-01-15T10:30:00Z',
        metadata: {
          execution_time: 1.2,
          memory_used: '45MB'
        }
      };
      
    case 'filter':
      // Filter nodes don't typically have outputs, they route flow
      return {
        matched: true,
        expression: config?.expression || 'condition',
        evaluated_at: '2024-01-15T10:30:00Z'
      };
      
    case 'switch':
      // Switch nodes route based on cases
      return {
        matched_case: 'case_1',
        key_value: 'example_value',
        evaluated_at: '2024-01-15T10:30:00Z'
      };
      
    case 'wait':
      // Wait nodes might track timing
      return {
        waited_seconds: config?.delaySeconds || 60,
        completed_at: '2024-01-15T10:31:00Z',
        condition_met: true
      };
      
    case 'merge':
      // Merge nodes combine data from multiple sources
      return {
        merged_sources: ['node_1', 'node_2'],
        strategy: config?.strategy || 'pass-through',
        merged_at: '2024-01-15T10:30:00Z',
        combined_data: {
          source_1: { value: 'data from first source' },
          source_2: { value: 'data from second source' }
        }
      };
      
    default:
      return {
        result: 'Node execution completed',
        timestamp: '2024-01-15T10:30:00Z'
      };
  }
}

/**
 * Build node outputs for data mapping based on workflow configuration
 * This generates sample outputs for all nodes that have saveAs configuration
 */
export function buildNodeOutputsFromWorkflow(workflowNodes: any[]): Record<string, any> {
  const outputs: Record<string, any> = {};
  
  workflowNodes.forEach((node: any) => {
    const nodeKind = node.data?.actionKind || node.data?.kind;
    const config = node.data?.config || {};
    const saveAs = config.saveAs;
    
    // Skip trigger nodes and nodes without saveAs
    if (!nodeKind || nodeKind.includes('trigger') || !saveAs) {
      return;
    }
    
    // Check if node already has actual sample data
    const existingSampleData = node.data?.sampleOutput || 
                              node.data?.config?.sampleOutput ||
                              node.data?.lastExecutionResult;
    
    if (existingSampleData) {
      // Use existing sample data if available
      outputs[node.id] = existingSampleData;
    } else {
      // Generate sample output based on node type
      const sampleOutput = generateSampleNodeOutput(nodeKind, config);
      outputs[node.id] = sampleOutput;
    }
  });
  
  console.log('🔧 Built node outputs for data mapping:', {
    totalNodes: workflowNodes.length,
    outputNodes: Object.keys(outputs).length,
    outputs: Object.keys(outputs).map(nodeId => {
      const node = workflowNodes.find(n => n.id === nodeId);
      return {
        nodeId,
        kind: node?.data?.actionKind || node?.data?.kind,
        saveAs: node?.data?.config?.saveAs
      };
    })
  });
  
  return outputs;
}

/**
 * Parse cURL command and extract HTTP configuration
 * Supports common cURL options like -X, -H, -d, --data, --header, etc.
 */
export function parseCurlCommand(curlCommand: string): {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  success: boolean;
  error?: string;
} {
  try {
    // Clean up the command - remove line breaks and extra spaces
    const cleanCommand = curlCommand
      .replace(/\\\s*\n\s*/g, ' ') // Handle line continuations
      .replace(/\s+/g, ' ')
      .trim();

    // Basic validation
    if (!cleanCommand.toLowerCase().startsWith('curl')) {
      return {
        url: '',
        method: 'GET',
        headers: {},
        success: false,
        error: 'Command must start with "curl"'
      };
    }

    let url = '';
    let method = 'GET';
    const headers: Record<string, string> = {};
    let body: any = null;

    // Split command into tokens, respecting quotes
    const tokens = [];
    let currentToken = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < cleanCommand.length; i++) {
      const char = cleanCommand[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        continue;
      } else {
        currentToken += char;
      }
    }
    if (currentToken) {
      tokens.push(currentToken);
    }

    // Parse tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Skip 'curl' command
      if (i === 0 && token.toLowerCase() === 'curl') {
        continue;
      }
      
      // Method
      if (token === '-X' || token === '--request') {
        method = tokens[++i]?.toUpperCase() || 'GET';
      }
      
      // Headers
      else if (token === '-H' || token === '--header') {
        const headerValue = tokens[++i];
        if (headerValue) {
          const [key, ...valueParts] = headerValue.split(':');
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(':').trim();
          }
        }
      }
      
      // Data/Body
      else if (token === '-d' || token === '--data' || token === '--data-raw') {
        const dataValue = tokens[++i];
        if (dataValue) {
          // Try to parse as JSON, otherwise keep as string
          try {
            body = JSON.parse(dataValue);
          } catch {
            body = dataValue;
          }
        }
      }
      
      // Data from file
      else if (token === '--data-binary' || token === '--data-ascii') {
        body = tokens[++i] || '';
      }
      
      // URL (usually the last argument or first non-option argument)
      else if (!token.startsWith('-') && !url) {
        url = token;
      }
    }

    // If no explicit method but has body, assume POST
    if (method === 'GET' && body !== null) {
      method = 'POST';
    }

    // Validate URL
    if (!url) {
      return {
        url: '',
        method: 'GET',
        headers: {},
        success: false,
        error: 'No URL found in cURL command'
      };
    }

    // Clean up URL (remove quotes if present)
    url = url.replace(/^['"]|['"]$/g, '');

    return {
      url,
      method,
      headers,
      body,
      success: true
    };

  } catch (error) {
    return {
      url: '',
      method: 'GET',
      headers: {},
      success: false,
      error: `Failed to parse cURL command: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Test function for cURL parser (can be removed in production)
export function testCurlParser() {
  const testCases = [
    // Simple GET request
    'curl https://api.example.com/users',
    
    // POST with JSON data
    `curl -X POST "https://api.example.com/users" -H "Content-Type: application/json" -d '{"name": "John", "email": "john@example.com"}'`,
    
    // GET with headers
    'curl -H "Authorization: Bearer token123" -H "Accept: application/json" https://api.example.com/profile',
    
    // Multi-line cURL with backslashes
    `curl -X POST "https://api.example.com/orders" \\
      -H "Content-Type: application/json" \\
      -H "Authorization: Bearer abc123" \\
      -d '{"product": "laptop", "quantity": 1}'`
  ];

  console.log('🧪 Testing cURL parser:');
  testCases.forEach((curlCmd, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    console.log('Input:', curlCmd);
    const result = parseCurlCommand(curlCmd);
    console.log('Result:', result);
  });
} 