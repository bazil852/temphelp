# Action & Flow Nodes System

Complete implementation of 6 core action/flow node types following the TRIGGER SPEC — ADDENDUM ② specification, plus the Generate Video integration node.

## Overview

This system provides a comprehensive set of workflow nodes that are easier to use than n8n, with specialized configuration modals and robust execution capabilities.

This document describes the implementation of the Action & Flow Nodes system, which provides easier-than-n8n versions of core workflow operations. The system includes 6 node types organized into two categories:

### Core Operations
- **Filter** - Route workflow based on conditions
- **Switch** - Route to different paths based on value  
- **Wait** - Delay execution or wait for conditions
- **Merge** - Combine multiple workflow branches
- **Custom Code** - Execute custom JavaScript code

### Integrations
- **HTTP Request** - Make HTTP requests to external APIs

## Node Types & Configuration

### 1. HTTP Request Node (`kind: "http"`)

**Type:** Action  
**Purpose:** Make HTTP requests to external APIs

**Configuration:**
```typescript
interface HttpConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";  // default: "GET"
  url: string;                                          // templated: "https://api/foo?x={{ctx.id}}"
  headers?: Record<string, string>;
  body?: any;                                          // JSON or raw string
  timeoutMs?: number;                                  // default: 15000
  saveAs?: string;                                     // ctx key, default: "httpResponse"
}
```

**Modal Fields:**
- URL (required, supports templating)
- HTTP Method dropdown
- Headers table (key-value pairs)
- Request Body (JSON textarea, shown for POST/PUT/PATCH)
- Timeout in milliseconds
- "Save result to" context key

**Example Usage:**
```json
{
  "method": "POST",
  "url": "https://api.example.com/users/{{ctx.userId}}",
  "headers": {
    "Authorization": "Bearer {{ctx.token}}",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{ctx.userName}}",
    "email": "{{ctx.userEmail}}"
  },
  "timeoutMs": 30000,
  "saveAs": "userResponse"
}
```

### 2. Filter Node (`kind: "filter"`)

**Type:** Flow  
**Purpose:** Route workflow based on conditions

**Configuration:**
```typescript
interface FilterConfig {
  expression: string;        // JS-like: "ctx.order.total > 100"
  nextTrue: string;         // node id
  nextFalse?: string;       // node id (optional; undefined = stop)
}
```

**Modal Fields:**
- Condition expression (textarea)
- Success path dropdown (populated with node IDs)
- Failure path dropdown (optional)

**Example Usage:**
```json
{
  "expression": "ctx.order.total > 100 && ctx.user.isPremium",
  "nextTrue": "send-premium-email",
  "nextFalse": "send-standard-email"
}
```

### 3. Custom Code Node (`kind: "js"`)

**Type:** Action  
**Purpose:** Execute custom JavaScript code

**Configuration:**
```typescript
interface JsConfig {
  code: string;              // async function(ctx) { … return value; }
  saveAs?: string;           // ctx key default: "result"
}
```

**Modal Fields:**
- Monaco editor for JavaScript code
- "Save result to ctx key" input

**Example Usage:**
```json
{
  "code": "const total = ctx.items.reduce((sum, item) => sum + item.price, 0);\nreturn { total, itemCount: ctx.items.length };",
  "saveAs": "orderSummary"
}
```

### 4. Switch Node (`kind: "switch"`)

**Type:** Flow  
**Purpose:** Route to different paths based on value

**Configuration:**
```typescript
interface SwitchConfig {
  keyExpr: string;           // "ctx.user.plan"
  cases: Array<{ value: string | number | boolean; next: string }>;
  defaultNext?: string;
}
```

**Modal Fields:**
- Key expression input
- Repeater list for cases (Case Value → Next Node)
- Optional default path dropdown

**Example Usage:**
```json
{
  "keyExpr": "ctx.user.plan",
  "cases": [
    { "value": "premium", "next": "premium-workflow" },
    { "value": "basic", "next": "basic-workflow" },
    { "value": "trial", "next": "trial-workflow" }
  ],
  "defaultNext": "default-workflow"
}
```

### 5. Wait Node (`kind: "wait"`)

**Type:** Flow  
**Purpose:** Delay execution or wait for conditions

**Configuration:**
```typescript
interface WaitConfig {
  mode: "delay" | "until";
  delaySeconds?: number;     // if mode="delay"
  untilExpr?: string;        // JS boolean poll, eg "ctx.status==='done'"
  checkEverySeconds?: number;// default: 30
}
```

**Modal Fields:**
- Radio buttons for Delay/Until mode
- Delay mode: seconds input
- Until mode: expression textarea + polling interval

**Example Usage:**
```json
{
  "mode": "until",
  "untilExpr": "ctx.videoStatus === 'completed'",
  "checkEverySeconds": 10
}
```

### 6. Merge Node (`kind: "merge"`)

**Type:** Flow  
**Purpose:** Combine multiple workflow branches

**Configuration:**
```typescript
interface MergeConfig {
  strategy: "pass-through" | "combine";
  sources: Array<string>;           // node IDs expected
}
```

**Modal Fields:**
- Strategy dropdown (pass-through/combine)
- Multi-select list of branch node IDs

**Example Usage:**
```json
{
  "strategy": "combine",
  "sources": ["email-branch", "sms-branch", "push-branch"]
}
```

### 7. Generate Video Node (Integration)

**Purpose**: Generate AI videos using selected influencers and script content from various sources.

**Type**: Action node

**Configuration**:
- **Influencer Selection**: Choose from user's available influencers with preview
- **Script Source**: 
  - `manual`: Enter script directly in the modal
  - `previous-node`: Get script from previous workflow step via context key
  - `webhook`: Receive script via webhook trigger
- **Script Configuration**: Based on selected source (manual input, context key, webhook path)
- **Save As**: Context key where video generation result will be stored

**Default Configuration**:
```typescript
{
  influencerId: '',
  scriptSource: 'manual',
  scriptValue: '',
  scriptContextKey: 'script',
  webhookPath: '/video/script',
  saveAs: 'videoResult'
}
```

**Execution Behavior**:
1. Validates influencer ID is provided
2. Retrieves script content based on source:
   - Manual: Uses `scriptValue` directly
   - Previous Node: Reads from `ctx[scriptContextKey]`
   - Webhook: Reads from `ctx.webhookData.script` or `ctx.script`
3. Fetches influencer data from Supabase database
4. Validates influencer status (must be 'completed')
5. Initiates video generation (currently simulated)
6. Saves result to `ctx[saveAs]`

**Result Format**:
```typescript
{
  influencer: {
    id: string,
    name: string,
    templateId: string
  },
  script: string,
  scriptSource: string,
  status: 'generating',
  timestamp: string,
  videoId: string,
  estimatedDuration: number
}
```

**UI Features**:
- Custom dropdown showing influencer name and preview image
- Radio button selection for script source
- Dynamic forms based on selected script source
- Influencer preview card with image and status
- Validation for required fields

## Backend Execution

### Node Executor Signature
```typescript
async function executeNode(node: BaseNode, ctx: any): Promise<ExecutionResult>
```

### Execution Behavior

**HTTP Node:**
- Build fetch() with templated URL/headers/body
- Timeout with AbortController
- On 2xx → parse JSON/text → ctx[saveAs]
- On non-2xx → throw → BullMQ retry handles back-off

**Filter Node:**
- Evaluate expression with Function constructor
- Return boolean; runner chooses nextTrue/nextFalse path

**Custom Code Node:**
- Wrap code string as `async (ctx) => { ... }` in safe execution
- Save returned value to ctx[saveAs]

**Switch Node:**
- Evaluate keyExpr, compare strict === with each case.value
- Push matched `next` onto execution queue; else defaultNext

**Wait Node:**
- mode=delay → `await sleep(delaySeconds)`
- mode=until → loop: eval untilExpr every N; timeout after 24h

**Merge Node:**
- Track completion of listed sources
- strategy=pass-through → first ctx passes forward
- strategy=combine → deepMerge(...sourceCtx) into current ctx

## API Endpoints

### Execute Single Node
```
POST /.netlify/functions/execute-workflow-node
```

**Request Body:**
```json
{
  "node": {
    "id": "node-123",
    "kind": "http",
    "type": "action",
    "data": {
      "config": {
        "method": "GET",
        "url": "https://api.example.com/data",
        "saveAs": "apiData"
      }
    }
  },
  "context": {
    "userId": "user-456",
    "token": "abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "data": { ... },
    "nextNodeId": "next-node-id"
  },
  "timestamp": "2025-01-22T17:00:00.000Z"
}
```

## UI Implementation

### Sidebar Organization
Nodes are organized by category in the workflow editor sidebar:

```
Core
├── Filter
├── Switch  
├── Wait
├── Merge
└── Custom Code

Integrations
└── HTTP Request

Legacy (deprecated)
├── Set Variable
├── Transform Data
├── Code (Legacy)
├── Loop
├── IF Condition
├── Wait (Legacy)
└── HTTP Request (Legacy)
```

### Modal System
- Double-click or gear icon opens configuration modal
- Each node type has a specialized configuration form
- Modal saves configuration to `node.data.config`
- Integration with existing NodeConfigModal system

### Available Nodes Dropdown
For flow control nodes (Filter, Switch, Merge), dropdowns are populated with available nodes in the workflow for routing decisions.

## Templating System

### Context Variable Templating
Use `{{ctx.key}}` syntax to reference context variables:

```
URL: https://api.example.com/users/{{ctx.userId}}
Header: Authorization: Bearer {{ctx.authToken}}
Body: {"name": "{{ctx.userName}}", "email": "{{ctx.userEmail}}"}
```

### Nested Properties
Access nested properties with dot notation:
```
{{ctx.user.profile.email}}
{{ctx.order.items.0.price}}
```

## Error Handling

### Execution Errors
- HTTP errors (non-2xx responses) throw exceptions
- JavaScript evaluation errors are caught and wrapped
- Timeout errors for HTTP requests and wait conditions
- All errors include descriptive messages for debugging

### Validation
- Required fields validated in modal forms
- Expression syntax validation for Filter and Switch nodes
- URL format validation for HTTP nodes
- Timeout and interval bounds checking

## Testing

### Manual Testing
Each node type can be tested individually using the execute-workflow-node endpoint with sample configurations and context data.

### Integration Testing
Nodes integrate with the existing workflow system and can be tested as part of complete workflow executions.

## Migration from Legacy Nodes

The new system replaces several legacy node types:
- `http-request` → `http`
- `filter` (old) → `filter` (new spec)
- `code-execution` → `js`
- `switch` (old) → `switch` (new spec)
- `delay` → `wait`
- `merge` (old) → `merge` (new spec)

Legacy nodes remain available but are marked as deprecated in the UI. 