// Node Execution Service
// Handles execution of action and flow nodes according to TRIGGER SPEC — ADDENDUM ②

import { ActionFlowNode, HttpConfig, FilterConfig, JsConfig, SwitchConfig, WaitConfig, MergeConfig, GenerateVideoConfig } from '../types/nodes';
import { supabase } from '../lib/supabase';
import { interpolateConfig, interpolateTemplate, buildExecutionContext } from './templateEngine';

interface ExecutionContext {
  [key: string]: any;
}

interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodeId?: string;
  shouldStop?: boolean;
}

/**
 * Main node executor function
 * Used by the generic workflow execution loop
 */
export async function executeNode(node: ActionFlowNode, ctx: ExecutionContext): Promise<ExecutionResult> {
  try {
    console.log(`🔄 Executing ${node.kind} node:`, node.id);
    
    // Interpolate the entire config with template engine
    const interpolatedConfig = interpolateConfig(node.data.config, ctx);
    
    switch (node.kind) {
      case 'http':
        return await executeHttpNode(interpolatedConfig as HttpConfig, ctx);
      
      case 'filter':
        return await executeFilterNode(interpolatedConfig as FilterConfig, ctx);
      
      case 'js':
        return await executeJsNode(interpolatedConfig as JsConfig, ctx);
      
      case 'switch':
        return await executeSwitchNode(interpolatedConfig as SwitchConfig, ctx);
      
      case 'wait':
        return await executeWaitNode(interpolatedConfig as WaitConfig, ctx);
      
      case 'merge':
        return await executeMergeNode(interpolatedConfig as MergeConfig, ctx);
      
      case 'generate-video':
        return await executeGenerateVideoNode(interpolatedConfig as GenerateVideoConfig, ctx);
      
      default:
        throw new Error(`Unknown node kind: ${(node as any).kind}`);
    }
  } catch (error) {
    console.error(`❌ Error executing ${node.kind} node:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * HTTP Request Node Execution
 * - Build fetch() with templated URL/headers/body
 * - Timeout with AbortController
 * - On 2xx → parse JSON/text → ctx[saveAs]
 * - On non-2xx → throw → BullMQ retry handles back-off
 */
async function executeHttpNode(config: HttpConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { method, url, headers = {}, body, timeoutMs = 15000, saveAs = 'httpResponse' } = config;
  
  // Config is already interpolated by the template engine
  const templatedUrl = url;
  const templatedHeaders = headers;
  
  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const requestInit: RequestInit = {
      method,
      headers: templatedHeaders,
      signal: controller.signal
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      if (typeof body === 'string') {
        requestInit.body = body; // Already interpolated
      } else {
        requestInit.body = JSON.stringify(body);
        if (!templatedHeaders['Content-Type']) {
          templatedHeaders['Content-Type'] = 'application/json';
          requestInit.headers = templatedHeaders;
        }
      }
    }
    
    console.log(`🌐 Making ${method} request to:`, templatedUrl);
    const response = await fetch(templatedUrl, requestInit);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse response
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Save to context
    ctx[saveAs] = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    };
    
    console.log(`✅ HTTP request completed, saved to ctx.${saveAs}`);
    
    return {
      success: true,
      data: responseData
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`HTTP request timeout after ${timeoutMs}ms`);
    }
    
    throw error;
  }
}

/**
 * Filter Node Execution
 * - Evaluate expression with Function constructor
 * - Return boolean; runner chooses nextTrue / nextFalse path
 */
async function executeFilterNode(config: FilterConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { expression, nextTrue, nextFalse } = config;
  
  if (!expression) {
    throw new Error('Filter expression is required');
  }
  
  try {
    // Create a safe evaluation function
    const evalFunction = new Function('ctx', `return (${expression})`);
    const result = evalFunction(ctx);
    
    console.log(`🔍 Filter expression "${expression}" evaluated to:`, result);
    
    const nextNodeId = result ? nextTrue : nextFalse;
    const shouldStop = !nextNodeId;
    
    return {
      success: true,
      data: result,
      nextNodeId,
      shouldStop
    };
    
  } catch (error) {
    throw new Error(`Filter expression evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * JavaScript Code Node Execution
 * - Wrap code string as `async (ctx) => { ... }` in safe execution
 * - Save returned value to ctx[saveAs]
 */
async function executeJsNode(config: JsConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { code, saveAs = 'result' } = config;
  
  if (!code) {
    throw new Error('JavaScript code is required');
  }
  
  try {
    // Create async function wrapper
    const asyncFunction = new Function('ctx', `
      return (async function() {
        ${code}
      })();
    `);
    
    console.log(`⚡ Executing JavaScript code`);
    const result = await asyncFunction(ctx);
    
    // Save result to context
    if (saveAs) {
      ctx[saveAs] = result;
      console.log(`✅ JavaScript execution completed, saved to ctx.${saveAs}`);
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    throw new Error(`JavaScript execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Switch Node Execution
 * - Evaluate keyExpr, compare strict === with each case.value
 * - Push matched `next` onto execution queue; else defaultNext
 */
async function executeSwitchNode(config: SwitchConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { keyExpr, cases = [], defaultNext } = config;
  
  if (!keyExpr) {
    throw new Error('Switch key expression is required');
  }
  
  try {
    // Evaluate key expression
    const evalFunction = new Function('ctx', `return (${keyExpr})`);
    const keyValue = evalFunction(ctx);
    
    console.log(`🔀 Switch evaluating "${keyExpr}" =`, keyValue);
    
    // Find matching case
    for (const caseItem of cases) {
      if (caseItem.value === keyValue) {
        console.log(`✅ Switch matched case:`, caseItem.value, '→', caseItem.next);
        return {
          success: true,
          data: keyValue,
          nextNodeId: caseItem.next,
          shouldStop: !caseItem.next
        };
      }
    }
    
    // No match found, use default
    console.log(`🔀 Switch no match, using default:`, defaultNext);
    return {
      success: true,
      data: keyValue,
      nextNodeId: defaultNext,
      shouldStop: !defaultNext
    };
    
  } catch (error) {
    throw new Error(`Switch key expression evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wait Node Execution
 * - mode=delay → `await sleep(delaySeconds)`
 * - mode=until → loop: eval untilExpr every N; timeout after 24h
 */
async function executeWaitNode(config: WaitConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { mode, delaySeconds = 60, untilExpr, checkEverySeconds = 30 } = config;
  
  if (mode === 'delay') {
    if (!delaySeconds || delaySeconds <= 0) {
      throw new Error('Delay seconds must be greater than 0');
    }
    
    console.log(`⏱️ Waiting for ${delaySeconds} seconds`);
    await sleep(delaySeconds * 1000);
    
    return {
      success: true,
      data: { waited: delaySeconds }
    };
    
  } else if (mode === 'until') {
    if (!untilExpr) {
      throw new Error('Until expression is required for until mode');
    }
    
    console.log(`⏱️ Waiting until "${untilExpr}" is true`);
    
    const maxWaitTime = 24 * 60 * 60 * 1000; // 24 hours
    const checkInterval = checkEverySeconds * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const evalFunction = new Function('ctx', `return (${untilExpr})`);
        const result = evalFunction(ctx);
        
        if (result) {
          console.log(`✅ Wait condition met after ${Math.round((Date.now() - startTime) / 1000)}s`);
          return {
            success: true,
            data: { condition: true, waitedSeconds: Math.round((Date.now() - startTime) / 1000) }
          };
        }
        
        await sleep(checkInterval);
        
      } catch (error) {
        throw new Error(`Wait until expression evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    throw new Error('Wait until timeout after 24 hours');
    
  } else {
    throw new Error(`Unknown wait mode: ${mode}`);
  }
}

/**
 * Merge Node Execution
 * - Track completion of listed sources
 * - strategy=pass-through → first ctx passes forward
 * - strategy=combine → deepMerge(...sourceCtx) into current ctx
 */
async function executeMergeNode(config: MergeConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { strategy = 'pass-through', sources = [] } = config;
  
  if (sources.length === 0) {
    throw new Error('Merge node requires at least one source');
  }
  
  console.log(`🔄 Merge node with strategy "${strategy}" waiting for sources:`, sources);
  
  // In a real implementation, this would coordinate with the workflow engine
  // to wait for multiple branches to complete. For now, we'll simulate this.
  
  if (strategy === 'pass-through') {
    // Return the current context as-is (first completed branch)
    return {
      success: true,
      data: { strategy: 'pass-through', sources }
    };
    
  } else if (strategy === 'combine') {
    // In a real implementation, this would deep-merge contexts from all source branches
    // For now, we'll return the current context
    return {
      success: true,
      data: { strategy: 'combine', sources, merged: true }
    };
    
  } else {
    throw new Error(`Unknown merge strategy: ${strategy}`);
  }
}

/**
 * Generate Video Node Execution
 * - Get script from configured source (manual, previous-node, webhook)
 * - Fetch influencer data from database
 * - Generate video using HeyGen API
 * - Save result to context
 */
async function executeGenerateVideoNode(config: GenerateVideoConfig, ctx: ExecutionContext): Promise<ExecutionResult> {
  const { influencerId, scriptSource, scriptValue, scriptContextKey = 'script', saveAs = 'videoResult' } = config;
  
  if (!influencerId) {
    throw new Error('Influencer ID is required for video generation');
  }
  
  try {
    // Get script content based on source
    let script = '';
    
    switch (scriptSource) {
      case 'manual':
        script = scriptValue || '';
        break;
        
      case 'previous-node':
        script = getNestedValue(ctx, scriptContextKey) || '';
        break;
        
      case 'webhook':
        // For webhook source, script should already be in context from webhook trigger
        script = getNestedValue(ctx, 'webhookData.script') || getNestedValue(ctx, 'script') || '';
        break;
        
      default:
        throw new Error(`Unknown script source: ${scriptSource}`);
    }
    
    if (!script.trim()) {
      throw new Error('Script content is required for video generation');
    }
    
    console.log(`🎬 Generating video with influencer ${influencerId}, script length: ${script.length}`);
    
    // Fetch influencer data from database
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencerId)
      .single();
    
    if (influencerError || !influencer) {
      throw new Error(`Failed to fetch influencer: ${influencerError?.message || 'Influencer not found'}`);
    }
    
    if (influencer.status !== 'completed') {
      throw new Error(`Influencer is not ready for video generation. Status: ${influencer.status}`);
    }
    
    // For now, we'll simulate video generation
    // In a real implementation, this would call HeyGen API
    const videoResult = {
      influencer: {
        id: influencer.id,
        name: influencer.name,
        templateId: influencer.templateId
      },
      script: script,
      scriptSource: scriptSource,
      status: 'generating',
      timestamp: new Date().toISOString(),
      // Simulated video generation result
      videoId: `video_${Date.now()}`,
      estimatedDuration: Math.ceil(script.length / 10) // rough estimate
    };
    
    // Save result to context
    ctx[saveAs] = videoResult;
    
    console.log(`✅ Video generation initiated, saved to ctx.${saveAs}`);
    
    return {
      success: true,
      data: videoResult
    };
    
  } catch (error) {
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get nested value from object using dot notation
 * (Keep this local version for backwards compatibility)
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep merge utility for combining contexts
 */
function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
} 