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

class WebhookTestService {
  private activeSessions: Map<string, WebhookTestSession> = new Map();

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
}

export const webhookTestService = new WebhookTestService(); 