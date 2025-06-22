// Trigger Node Type Definitions
// Based on the TRIGGER-NODE SPEC

export interface BaseTrigger {
  id: string;              // node-uuid, unique per workflow
  type: "trigger";         // identifies it as a trigger
  subtype: "webhook" | "schedule" | "manual";
  data: { config: WebhookCfg | ScheduleCfg | ManualCfg };
}

// ═══════════════════════════════════════════════════════════════
// 1A · WEBHOOK TRIGGER
// ═══════════════════════════════════════════════════════════════

export interface WebhookTrigger extends BaseTrigger {
  subtype: "webhook";
  data: { config: WebhookCfg };
}

export interface WebhookCfg {
  path: string;            // "/incoming/order"   (required)
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";    // ⇢ default "POST"
  authentication: "none" | "basic" | "bearer" | "headerKey";   // ⇢ "none"
  acceptBinary?: boolean;       // ⇢ false
  responseMode?: "onReceived" | "whenFinished";              // ⇢ "onReceived"
  queryParams?: Array<{ name: string; required: boolean }>;
  headers?: Record<string, string>;
  retryOn?: Array<{
    status: number;             // 500 etc.
    attempts: number;             // ⇢ 3
    backoffMs: number;             // ⇢ 10000
  }>;
  samplePayload?: any;     // Captured sample payload for testing
}

// ═══════════════════════════════════════════════════════════════
// 1B · SCHEDULE TRIGGER
// ═══════════════════════════════════════════════════════════════

export interface ScheduleTrigger extends BaseTrigger {
  subtype: "schedule";
  data: { config: ScheduleCfg };
}

export interface ScheduleCfg {
  mode: "cron" | "interval" | "date";     // ⇢ "cron"
  cron?: string;   // "0 9 * * 1-5"  (if mode="cron")
  interval?: { every: number; unit: "seconds" | "minutes" | "hours" | "days" };
  date?: string;   // ISO timestamp (if mode="date")
  tz?: string;   // ⇢ "UTC"
  activeFrom?: string; // ISO
  activeUntil?: string; // ISO
  skipWeekends?: boolean; // ⇢ false
}

// ═══════════════════════════════════════════════════════════════
// 1C · MANUAL TRIGGER
// ═══════════════════════════════════════════════════════════════

export interface ManualTrigger extends BaseTrigger {
  subtype: "manual";
  data: { config: ManualCfg };
}

export interface ManualCfg {
  name?: string;
  samplePayload?: any;
}

// ═══════════════════════════════════════════════════════════════
// UNION TYPE
// ═══════════════════════════════════════════════════════════════

export type TriggerNode = WebhookTrigger | ScheduleTrigger | ManualTrigger;

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export const getDefaultWebhookConfig = (): WebhookCfg => ({
  path: "/incoming/webhook",
  method: "POST",
  authentication: "none",
  acceptBinary: false,
  responseMode: "onReceived",
  queryParams: [],
  headers: {},
  retryOn: []
});

export const getDefaultScheduleConfig = (): ScheduleCfg => ({
  mode: "cron",
  cron: "0 9 * * 1-5", // 9 AM weekdays
  tz: "UTC",
  skipWeekends: false
});

export const getDefaultManualConfig = (): ManualCfg => ({
  name: "Manual Trigger",
  samplePayload: {}
});

// ═══════════════════════════════════════════════════════════════
// TRIGGER EVENT TYPES (for runtime)
// ═══════════════════════════════════════════════════════════════

export interface WebhookEvent {
  kind: "webhook";
  nodeId: string;
  payload: any;
  headers: Record<string, string>;
  query: Record<string, string>;
}

export interface ScheduleEvent {
  kind: "schedule";
  nodeId: string;
  ts: string;
  cron?: string;
}

export interface ManualEvent {
  kind: "manual";
  nodeId: string;
  payload?: any;
}

export type TriggerEvent = WebhookEvent | ScheduleEvent | ManualEvent; 