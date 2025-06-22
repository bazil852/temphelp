# Data Mapping System Documentation

## Overview

The Data Mapping System enables users to dynamically map data from triggers and previous nodes into configuration fields of downstream nodes. This system provides a complete UX for field mapping with template interpolation at runtime.

## System Architecture

### 1. Template Engine (`src/services/templateEngine.ts`)

**Core Functions:**
- `interpolateTemplate(template, ctx)` - Interpolates single template strings
- `interpolateConfig(config, ctx)` - Deep interpolates entire configuration objects
- `buildExecutionContext(triggerPayload, nodeOutputs)` - Builds runtime context
- `generateDataPaths(obj)` - Generates flat field paths for UI dropdowns

**Template Syntax:**
```javascript
// Context variables
{{ ctx.trigger.order.total }}
{{ ctx.node123.response.data }}

// Helper functions
{{ uuid() }}                                    // Generate UUID
{{ now("iso") }}                               // Current timestamp
{{ formatDate(ctx.trigger.date, "YYYY-MM-DD") }} // Date formatting
```

**Runtime Context Structure:**
```javascript
{
  trigger: { /* webhook/trigger payload */ },
  "node-123": { /* output from node-123 */ },
  "node-456": { /* output from node-456 */ }
}
```

### 2. UI Components

#### MappableInput (`src/components/MappableInput.tsx`)
Reusable text input component with integrated "Insert Value" dropdown:

```typescript
<MappableInput
  label="URL"
  value={config.url}
  onChange={(value) => setConfig({ ...config, url: value })}
  placeholder="https://api.example.com/endpoint"
  dataSources={dataSources}
  multiline={false}
  description="Supports templating"
/>
```

#### InsertValueDropdown (`src/components/InsertValueDropdown.tsx`)
Tree-structured dropdown for selecting data paths:

**Features:**
- Tree view of available data sources
- Search functionality
- Type indicators (string, number, boolean, array, object)
- Sample value previews
- Template helper documentation

#### SampleDataTab (`src/components/SampleDataTab.tsx`)
Tab component for viewing and using sample data:

**Features:**
- Raw JSON view
- Field browser with type information
- Copy to clipboard functionality
- "Use Field" buttons for quick insertion

### 3. Node Integration

#### Supported Field Types by Node

| Node Type | Mappable Fields |
|-----------|----------------|
| HTTP | `url`, `headers` values, `body` (string), `saveAs` |
| Filter | `expression` |
| Switch | `keyExpr`, case `value` fields |
| Wait | `untilExpr` |
| Custom JS | entire `code` string |
| Merge | none (config only) |

#### ActionFlowConfigModal Updates
- All text inputs replaced with `MappableInput` components
- "Sample Data" tab when sample data is available
- Data sources automatically built from trigger and previous nodes

### 4. Runtime Execution

#### Node Execution Flow
```typescript
// 1. Interpolate entire config before execution
const interpolatedConfig = interpolateConfig(node.data.config, ctx);

// 2. Execute node with interpolated config
return await executeByKind(node.kind, interpolatedConfig);
```

#### Template Interpolation
- Walks object/array structures recursively
- Only interpolates string values containing `{{`
- Leaves non-string values untouched
- Missing keys resolve to empty string with warning

## Usage Examples

### 1. HTTP Request with Dynamic URL
```javascript
// Configuration:
{
  "url": "https://api.example.com/users/{{ ctx.trigger.userId }}",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{ ctx.trigger.token }}"
  }
}

// Runtime context:
{
  "trigger": {
    "userId": "12345",
    "token": "abc123"
  }
}

// Interpolated result:
{
  "url": "https://api.example.com/users/12345",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer abc123"
  }
}
```

### 2. Filter with Dynamic Condition
```javascript
// Configuration:
{
  "expression": "ctx.trigger.order.total > {{ ctx.trigger.minAmount }}"
}

// Runtime context:
{
  "trigger": {
    "order": { "total": 150 },
    "minAmount": 100
  }
}

// Interpolated result:
{
  "expression": "ctx.trigger.order.total > 100"
}
```

### 3. Custom JS with Context Access
```javascript
// Configuration:
{
  "code": "return { fullName: `${ctx.trigger.firstName} ${ctx.trigger.lastName}` };"
}

// Runtime context:
{
  "trigger": {
    "firstName": "John",
    "lastName": "Doe"
  }
}

// Execution result saved to context
```

## Data Sources

### Automatic Data Source Building
The system automatically builds data sources from:

1. **Trigger Data** - Sample payload from multiple sources:
   - Webhook test captures (when testing webhooks)
   - Manual input in trigger configuration (Advanced tab for webhooks, main config for manual/schedule triggers)
   - Previous webhook captures stored in workflow
   - Any existing sample payload in trigger configuration
2. **Previous Node Outputs** - Sample outputs from upstream nodes
3. **Available Nodes** - List of nodes for dropdown selections

### Data Source Structure
```typescript
interface DataSource {
  id: string;        // 'trigger' or node ID
  label: string;     // Display name
  icon: string;      // Emoji icon
  data: any;         // Sample data object
}
```

## Template Helpers

### Built-in Helpers

#### `uuid()`
Generates RFC-4122 v4 UUID string
```javascript
{{ uuid() }}
// Result: "550e8400-e29b-41d4-a716-446655440000"
```

#### `now(format?)`
Returns current timestamp
```javascript
{{ now() }}           // ISO string (default)
{{ now("iso") }}      // ISO string
{{ now("epoch") }}    // Unix timestamp
```

#### `formatDate(date, format)`
Formats date using simple pattern replacement
```javascript
{{ formatDate(ctx.trigger.createdAt, "YYYY-MM-DD") }}
{{ formatDate(ctx.trigger.timestamp, "HH:mm:ss") }}
```

**Supported Format Tokens:**
- `YYYY` - 4-digit year
- `MM` - 2-digit month
- `DD` - 2-digit day
- `HH` - 2-digit hour (24h)
- `mm` - 2-digit minute
- `ss` - 2-digit second

## Error Handling

### Template Interpolation Errors
- Invalid expressions return empty string
- Warnings logged to console
- Workflow execution continues
- Missing paths resolve to empty string

### Runtime Error Logging
```javascript
// Template interpolation errors are logged but don't stop execution
console.warn('Template interpolation error:', error, 'Expression:', expression);

// Missing context keys are handled gracefully
if (!value) {
  console.warn('Missing context key:', path);
  return '';
}
```

## Performance Considerations

### Optimization Features
- **Skip Check**: Configurations without `{{` are skipped entirely
- **Shallow Copy**: Only interpolated objects are deep-cloned
- **Memoization**: Data paths are generated once and cached
- **Lazy Evaluation**: Template helpers only execute when called

### Best Practices
1. Use specific field paths instead of complex expressions
2. Cache frequently accessed data in context
3. Avoid deeply nested template expressions
4. Use helper functions for complex transformations

## Backward Compatibility

### Legacy Node Support
- Nodes without templates work unchanged
- Old configurations are automatically supported
- No breaking changes to existing workflows
- Gradual migration path available

### Default Behaviors
- Empty templates resolve to empty string
- Non-string values pass through unchanged
- Missing helper functions return empty string
- Invalid JSON in templates is preserved as string

## Testing

### Unit Tests
Template engine functions are fully tested:
- `interpolateTemplate()` with various expressions
- `interpolateConfig()` with nested objects
- `generateDataPaths()` with complex data structures
- Helper functions with edge cases

### Integration Tests
- End-to-end workflow execution with templates
- UI component interaction testing
- Data source building and filtering
- Error handling and recovery

## Future Enhancements

### Planned Features
1. **Advanced Helpers** - More date/string manipulation functions
2. **Conditional Templates** - `{{ if condition }}` syntax
3. **Array Operations** - `{{ ctx.items.length }}`, `{{ ctx.items[0] }}`
4. **Custom Helpers** - User-defined template functions
5. **Template Validation** - Real-time syntax checking
6. **Auto-completion** - Smart suggestions in input fields

### Performance Improvements
1. **Template Compilation** - Pre-compile templates for faster execution
2. **Context Caching** - Cache interpolated configurations
3. **Partial Updates** - Only re-interpolate changed fields
4. **Worker Threads** - Offload heavy template processing

## Troubleshooting

### Common Issues

#### Templates Not Interpolating
- Check for correct `{{` `}}` syntax
- Verify context path exists
- Check for typos in field names

#### Missing Data in Dropdown
- Ensure trigger has sample payload
- Verify node outputs are captured
- Check data source building logic

#### Runtime Errors
- Validate template syntax
- Check context structure
- Review helper function usage

### Debug Tools
```javascript
// Enable template debugging
localStorage.setItem('DEBUG_TEMPLATES', 'true');

// View interpolation results
console.log('Template result:', interpolateTemplate(template, ctx));

// Check available context
console.log('Available context:', Object.keys(ctx));
```

## API Reference

### Core Functions

#### `interpolateTemplate(template: string, ctx: any): string`
Interpolates a single template string with context variables and helpers.

#### `interpolateConfig(config: any, ctx: any): any`
Deep interpolates an entire configuration object, walking all string values.

#### `buildExecutionContext(triggerPayload: any, nodeOutputs: Record<string, any>): any`
Builds the runtime execution context from trigger data and node outputs.

#### `generateDataPaths(obj: any, prefix?: string, maxDepth?: number): DataPath[]`
Generates a flat list of field paths from an object for UI display.

#### `getNestedValue(obj: any, path: string): any`
Safely retrieves nested values using dot notation paths.

### Component Props

#### MappableInput Props
```typescript
interface MappableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  dataSources?: DataSource[];
  label?: string;
  description?: string;
}
```

#### InsertValueDropdown Props
```typescript
interface InsertValueDropdownProps {
  onInsert: (template: string) => void;
  dataSources: DataSource[];
  className?: string;
  disabled?: boolean;
}
```

This comprehensive data mapping system provides a powerful yet user-friendly way to connect data between workflow nodes, enabling complex automation scenarios with an intuitive visual interface. 