// Action and Flow Node Type Definitions
// Based on TRIGGER SPEC — ADDENDUM ②

export interface BaseNode {
  id: string;                  // node-uuid
  type: "action" | "flow";
  kind: "http" | "filter" | "js" | "switch" | "wait" | "merge" | "generate-video";
  data: { config: any };       // see per-kind below
}

/*****************************************************************
1. HTTP-REQUEST  (kind:"http")       type: "action"
*****************************************************************/
export interface HttpNode extends BaseNode {
  kind: "http";
  type: "action";
  data: { config: HttpConfig };
}

export interface HttpConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";    // default: "GET"
  url: string;          // templated: "https://api/foo?x={{ctx.id}}"
  headers?: Record<string, string>;
  body?: any;             // JSON or raw string
  bodyParams?: Record<string, any>;
  bodyType?: string;
  timeoutMs?: number;        // default: 15000
  saveAs?: string;          // ctx key, default: "httpResponse"
}

/*****************************************************************
2. FILTER  (kind:"filter")           type: "flow"
*****************************************************************/
export interface FilterNode extends BaseNode {
  kind: "filter";
  type: "flow";
  data: { config: FilterConfig };
}

export interface FilterConfig {
  expression: string;        // JS-like: "ctx.order.total > 100"
  nextTrue: string;         // node id
  nextFalse?: string;         // node id  (optional; undefined = stop)
}

/*****************************************************************
3. CUSTOM JS CODE  (kind:"js")       type: "action"
*****************************************************************/
export interface JsNode extends BaseNode {
  kind: "js";
  type: "action";
  data: { config: JsConfig };
}

export interface JsConfig {
  code: string;              // async function(ctx) { … return value; }
  saveAs?: string;           // ctx key default: "result"
}

/*****************************************************************
4. SWITCH  (kind:"switch")           type: "flow"
*****************************************************************/
export interface SwitchNode extends BaseNode {
  kind: "switch";
  type: "flow";
  data: { config: SwitchConfig };
}

export interface SwitchConfig {
  keyExpr: string;           // "ctx.user.plan"
  cases: Array<{ value: string | number | boolean; next: string }>;
  defaultNext?: string;
}

/*****************************************************************
5. WAIT  (kind:"wait")               type: "flow"
*****************************************************************/
export interface WaitNode extends BaseNode {
  kind: "wait";
  type: "flow";
  data: { config: WaitConfig };
}

export interface WaitConfig {
  mode: "delay" | "until";
  delaySeconds?: number;     // if mode="delay"
  untilExpr?: string;        // JS boolean poll, eg "ctx.status==='done'"
  checkEverySeconds?: number;// default: 30
}

/*****************************************************************
6. MERGE  (kind:"merge")             type: "flow"
*****************************************************************/
export interface MergeNode extends BaseNode {
  kind: "merge";
  type: "flow";
  data: { config: MergeConfig };
}

export interface MergeConfig {
  strategy: "pass-through" | "combine";
  sources: Array<string>;           // node IDs expected
}

/*****************************************************************
7. GENERATE VIDEO  (kind:"generate-video")  type: "action"
*****************************************************************/
export interface GenerateVideoNode extends BaseNode {
  kind: "generate-video";
  type: "action";
  data: { config: GenerateVideoConfig };
}

export interface GenerateVideoConfig {
  influencerId: string;          // Selected influencer ID
  scriptSource: "previous-node" | "webhook" | "manual";
  scriptValue?: string;          // For manual input
  scriptContextKey?: string;     // For previous-node (ctx key to read from)
  webhookPath?: string;          // For webhook source
  saveAs?: string;              // ctx key, default: "videoResult"
}

// Union type for all node types
export type ActionFlowNode = HttpNode | FilterNode | JsNode | SwitchNode | WaitNode | MergeNode | GenerateVideoNode;

// Default configurations
export const getDefaultNodeConfig = (kind: string): any => {
  switch (kind) {
    case 'http':
      return {
        method: 'GET',
        url: '',
        headers: {},
        body: null,
        bodyParams: {},
        bodyType: 'json',
        timeoutMs: 15000,
        saveAs: 'httpResponse'
      } as HttpConfig;
      
    case 'filter':
      return {
        expression: '',
        nextTrue: '',
        nextFalse: ''
      } as FilterConfig;
      
    case 'js':
      return {
        code: 'async function execute(ctx) {\n  // Your code here\n  return result;\n}',
        saveAs: 'result'
      } as JsConfig;
      
    case 'switch':
      return {
        keyExpr: '',
        cases: [],
        defaultNext: ''
      } as SwitchConfig;
      
    case 'wait':
      return {
        mode: 'delay',
        delaySeconds: 60,
        untilExpr: '',
        checkEverySeconds: 30
      } as WaitConfig;
      
    case 'merge':
      return {
        strategy: 'pass-through',
        sources: []
      } as MergeConfig;
      
    case 'generate-video':
      return {
        influencerId: '',
        scriptSource: 'manual',
        scriptValue: '',
        scriptContextKey: 'script',
        webhookPath: '/video/script',
        saveAs: 'videoResult'
      } as GenerateVideoConfig;
      
    default:
      return {};
  }
};

// Node metadata for UI
export const NODE_METADATA = {
  http: {
    title: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    category: 'Integrations',
    icon: '🌐',
    type: 'action' as const
  },
  filter: {
    title: 'Filter',
    description: 'Route workflow based on conditions',
    category: 'Core',
    icon: '🔍',
    type: 'flow' as const
  },
  js: {
    title: 'Custom Code',
    description: 'Execute custom JavaScript code',
    category: 'Core',
    icon: '⚡',
    type: 'action' as const
  },
  switch: {
    title: 'Switch',
    description: 'Route to different paths based on value',
    category: 'Core',
    icon: '🔀',
    type: 'flow' as const
  },
  wait: {
    title: 'Wait',
    description: 'Delay execution or wait for conditions',
    category: 'Core',
    icon: '⏱️',
    type: 'flow' as const
  },
  merge: {
    title: 'Merge',
    description: 'Combine multiple workflow branches',
    category: 'Core',
    icon: '🔄',
    type: 'flow' as const
  },
  'generate-video': {
    title: 'Generate Video',
    description: 'Generate AI videos using selected influencer',
    category: 'Integrations',
    icon: '🎬',
    type: 'action' as const
  }
}; 