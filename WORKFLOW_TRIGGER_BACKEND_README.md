# Workflow Trigger Backend Implementation

This document describes the complete backend implementation for workflow triggers that supports the frontend trigger system.

## Overview

The backend implements three trigger types:
1. **Webhook Trigger** → Edge Function `/wf-webhook/:token`
2. **Manual Trigger** → RPC `run_workflow_manual`
3. **Scheduled Trigger** → pg_cron integration via `activate_workflow`

## Database Schema

### Tables Created

#### `workflow_webhooks`
Maps webhook tokens to workflows and tracks capture timestamps.
```sql
create table public.workflow_webhooks (
  token        text primary key,
  workflow_id  uuid not null references public.workflows(id) on delete cascade,
  node_id      text not null,
  captured_at  timestamptz,
  created_at   timestamptz default now()
);
```

#### `wf_jobs`
Job queue table for the workflow runner service.
```sql
create table public.wf_jobs (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     uuid not null references public.workflows(id) on delete cascade,
  trigger_payload jsonb,
  status          text default 'queued',
  run_at          timestamptz default now(),
  inserted_at     timestamptz default now()
);
```

## RPC Functions

### `activate_workflow(workflow_id UUID)`
**Returns:** `{token: text, url: text, status: text}`

- Sets workflow status to 'active'
- Generates webhook token for webhook triggers
- Schedules pg_cron job for schedule triggers
- Returns webhook URL and activation status

### `deactivate_workflow(workflow_id UUID)`
**Returns:** `void`

- Sets workflow status to 'inactive'
- Unschedules any pg_cron jobs
- Keeps webhook tokens for reactivation

### `regenerate_webhook_token(workflow_id UUID, node_id text)`
**Returns:** `{token: text, url: text}`

- Generates new webhook token
- Updates workflow_webhooks table
- Returns new token and URL

### `get_webhook_info(workflow_id UUID, node_id text)`
**Returns:** `{token: text, url: text, captured_at: timestamptz}`

- Retrieves current webhook information
- Includes last capture timestamp
- Used by frontend to display webhook status

### `run_workflow_manual(workflow_id UUID, payload JSONB)`
**Returns:** `void`

- Immediately inserts job into wf_jobs queue
- Triggers pg_notify for workflow runner
- Used by "Run Now" functionality

## Edge Function

### `/functions/v1/wf-webhook/:token`

**Method:** POST  
**Body:** JSON payload (optional)  
**Returns:** 202 Accepted

The webhook edge function:
1. Extracts token from URL path
2. Looks up workflow_id from workflow_webhooks table
3. Parses JSON payload from request body
4. Inserts job into wf_jobs queue
5. Updates captured_at timestamp
6. Returns 202 Accepted

## Testing

### Manual Trigger Test
```bash
# Test manual trigger via RPC (requires authentication)
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/run_workflow_manual' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_workflow": "your-workflow-uuid",
    "p_payload": {"test": "data"}
  }'
```

### Webhook Trigger Test
```bash
# Test webhook trigger (public endpoint)
curl -X POST 'https://your-project.supabase.co/functions/v1/wf-webhook/your-token' \
  -H "Content-Type: application/json" \
  -d '{"hello": "world", "timestamp": "2025-01-25T10:00:00Z"}'
```

### Schedule Trigger Test
Schedule triggers are automatically managed by pg_cron when workflows are activated.

## Environment Setup

### Required Environment Variables
```bash
# Set in Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
```

### Database Configuration
```sql
-- Enable pg_cron extension (run once as superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Set app.supabase.url for URL generation in RPC functions
ALTER DATABASE postgres SET app.supabase.url = 'https://your-project.supabase.co';
```

## Deployment

### 1. Run Migrations
```bash
supabase db push
```

### 2. Deploy Edge Function
```bash
supabase functions deploy wf-webhook
```

### 3. Verify Deployment
```bash
# Check if function is deployed
supabase functions list

# Test function health
curl -X OPTIONS 'https://your-project.supabase.co/functions/v1/wf-webhook/test'
```

## Integration with Workflow Runner

The backend integrates with the workflow-runner service through:

1. **Job Queue**: All triggers insert jobs into `wf_jobs` table
2. **Notifications**: `pg_notify('wf_jobs_new', ...)` alerts the runner
3. **Payload Structure**: Consistent trigger_payload format across all trigger types

## Security

- All RPC functions use `SECURITY DEFINER` with appropriate permissions
- Webhook endpoints are public but require valid tokens
- Manual triggers require authentication
- Schedule triggers run with service-role privileges

## Monitoring

### Key Metrics to Monitor
- `wf_jobs` table growth and processing rate
- `workflow_webhooks` capture timestamps
- Edge function response times and error rates
- pg_cron job execution logs

### Useful Queries
```sql
-- Check recent webhook activity
SELECT * FROM workflow_webhooks 
WHERE captured_at > NOW() - INTERVAL '1 hour'
ORDER BY captured_at DESC;

-- Monitor job queue
SELECT status, count(*) FROM wf_jobs 
GROUP BY status;

-- Check scheduled jobs
SELECT * FROM cron.job WHERE jobname LIKE 'wf-%';
```

## Troubleshooting

### Common Issues

1. **Webhook 404 errors**: Check if token exists in workflow_webhooks table
2. **Manual trigger auth errors**: Verify JWT token and user permissions
3. **Schedule not running**: Check pg_cron extension and job configuration
4. **Jobs not processing**: Verify workflow runner is listening to pg_notify

### Debug Queries
```sql
-- Find webhook by token
SELECT * FROM workflow_webhooks WHERE token = 'your-token';

-- Check recent jobs
SELECT * FROM wf_jobs ORDER BY inserted_at DESC LIMIT 10;

-- List active cron jobs
SELECT * FROM cron.job WHERE active = true;
``` 