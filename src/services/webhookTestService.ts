import { supabase } from '../lib/supabase';

export interface TestWebhookData {
  testId: string;
  payload: any;
  capturedAt: string;
  headers?: any;
  method?: string;
  queryParams?: any;
}

export interface WebhookTestSession {
  testId: string;
  isListening: boolean;
  webhookUrl: string;
  capturedData?: any;
}

export interface WebhookTestState {
  state: 'idle' | 'waiting' | 'captured' | 'error';
  webhookUrl?: string;
  token?: string;
  samplePayload?: any;
  error?: string;
  expiresAt?: string;
}

export class WebhookTestService {
  private static instance: WebhookTestService;
  private activeSessions: Map<string, WebhookTestSession> = new Map();
  private testStates = new Map<string, WebhookTestState>();
  private subscriptions = new Map<string, any>();

  static getInstance(): WebhookTestService {
    if (!WebhookTestService.instance) {
      WebhookTestService.instance = new WebhookTestService();
    }
    return WebhookTestService.instance;
  }

  // Generate a unique test ID
  generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start listening for webhook data
  startListening(nodeId: string): WebhookTestSession {
    const testId = this.generateTestId();
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/.netlify/functions/test-webhook?testId=${testId}`;
    
    const session: WebhookTestSession = {
      testId,
      isListening: true,
      webhookUrl,
    };

    this.activeSessions.set(nodeId, session);
    return session;
  }

  // Stop listening for webhook data
  stopListening(nodeId: string): void {
    const session = this.activeSessions.get(nodeId);
    if (session) {
      session.isListening = false;
      this.activeSessions.set(nodeId, session);
    }
  }

  // Get the current test session for a node
  getSession(nodeId: string): WebhookTestSession | undefined {
    return this.activeSessions.get(nodeId);
  }

  // Poll for captured webhook data
  async pollForData(testId: string): Promise<TestWebhookData | null> {
    try {
      const response = await fetch(`/.netlify/functions/test-webhook?testId=${testId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        return {
          testId,
          payload: result.data,
          capturedAt: result.capturedAt,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error polling for webhook data:', error);
      return null;
    }
  }

  // Update session with captured data
  updateSessionData(nodeId: string, data: any): void {
    const session = this.activeSessions.get(nodeId);
    if (session) {
      session.capturedData = data;
      session.isListening = false;
      this.activeSessions.set(nodeId, session);
    }
  }

  // Clear all sessions (cleanup)
  clearAllSessions(): void {
    this.activeSessions.clear();
  }

  // Get JSON paths from captured data for mapping
  getJsonPaths(obj: any, prefix = '', paths: string[] = []): string[] {
    if (obj === null || obj === undefined) {
      return paths;
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach(key => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        paths.push(newPrefix);
        this.getJsonPaths(obj[key], newPrefix, paths);
      });
    } else if (Array.isArray(obj)) {
      const newPrefix = prefix ? `${prefix}[0]` : '[0]';
      if (obj.length > 0) {
        paths.push(newPrefix);
        this.getJsonPaths(obj[0], newPrefix, paths);
      }
    } else {
      // Primitive value, already added the path above
    }

    return paths.filter((path, index, self) => self.indexOf(path) === index);
  }

  /**
   * Arm a webhook test for a specific node
   */
  async armWebhookTest(nodeId: string, workflowId: string): Promise<WebhookTestState> {
    try {
      console.log('🔧 Arming webhook test for node:', nodeId);

      // Call the Supabase Edge Function arm API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/arm-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId, nodeId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to arm webhook test: ${error}`);
      }

      const { webhookUrl, token, expiresAt } = await response.json();

      // Update test state
      const testState: WebhookTestState = {
        state: 'waiting',
        webhookUrl,
        token,
        expiresAt,
      };

      this.testStates.set(nodeId, testState);

      // Set up Supabase realtime subscription
      this.subscribeToCaptures(nodeId);

      return testState;

    } catch (error) {
      console.error('❌ Error arming webhook test:', error);
      const errorState: WebhookTestState = {
        state: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.testStates.set(nodeId, errorState);
      return errorState;
    }
  }

  /**
   * Subscribe to captured events for a specific node
   */
  private subscribeToCaptures(nodeId: string): void {
    // Clean up existing subscription
    const existingSubscription = this.subscriptions.get(nodeId);
    if (existingSubscription) {
      existingSubscription.unsubscribe();
    }

    console.log('🔗 Setting up realtime subscription for node:', nodeId);

    // Create new subscription
    const subscription = supabase
      .channel(`webhook-test-${nodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'captured_events',
          filter: `node_id=eq.${nodeId}`,
        },
        (payload) => {
          console.log('📨 Captured event received:', payload);
          this.handleCapturedEvent(nodeId, payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    this.subscriptions.set(nodeId, subscription);

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      this.cleanupTest(nodeId);
    }, 5 * 60 * 1000);
  }

  /**
   * Handle a captured event
   */
  private handleCapturedEvent(nodeId: string, capturedEvent: any): void {
    console.log('🎯 Processing captured event for node:', nodeId, capturedEvent);

    const testState = this.testStates.get(nodeId);
    if (!testState) {
      console.warn('⚠️ No test state found for node:', nodeId);
      return;
    }

    // Update test state with captured payload
    const updatedState: WebhookTestState = {
      ...testState,
      state: 'captured',
      samplePayload: capturedEvent.payload,
    };

    this.testStates.set(nodeId, updatedState);

    // Notify any listeners
    this.notifyStateChange(nodeId, updatedState);

    // Clean up subscription
    setTimeout(() => {
      this.cleanupTest(nodeId);
    }, 30000); // Keep for 30 seconds to allow UI to process
  }

  /**
   * Get current test state for a node
   */
  getTestState(nodeId: string): WebhookTestState | null {
    return this.testStates.get(nodeId) || null;
  }

  /**
   * Cancel a webhook test
   */
  cancelTest(nodeId: string): void {
    console.log('🛑 Canceling webhook test for node:', nodeId);
    this.cleanupTest(nodeId);
  }

  /**
   * Clean up test resources
   */
  private cleanupTest(nodeId: string): void {
    // Remove test state
    this.testStates.delete(nodeId);

    // Clean up subscription
    const subscription = this.subscriptions.get(nodeId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(nodeId);
    }

    console.log('🧹 Cleaned up webhook test for node:', nodeId);
  }

  /**
   * Notify state change (can be extended for callbacks)
   */
  private notifyStateChange(nodeId: string, state: WebhookTestState): void {
    // This can be extended to support callbacks or event emitters
    console.log('📢 Test state changed for node:', nodeId, state);
  }

  /**
   * Copy webhook URL to clipboard
   */
  async copyWebhookUrl(webhookUrl: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Export singleton instance
export const webhookTestService = WebhookTestService.getInstance(); 