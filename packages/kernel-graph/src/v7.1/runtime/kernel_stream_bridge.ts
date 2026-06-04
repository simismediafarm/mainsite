import { EventEmitter } from 'events';

export type KernelEvent = {
  intent_id: string;
  step: string;
  timestamp: string;
  data?: any;
};

class KernelStreamBridge extends EventEmitter {
  private static instance: KernelStreamBridge;

  private constructor() {
    super();
    // increase max listeners to avoid warnings on concurrent intents
    this.setMaxListeners(1000); 
  }

  static getInstance(): KernelStreamBridge {
    if (!this.instance) {
      this.instance = new KernelStreamBridge();
    }
    return this.instance;
  }

  /**
   * Broadcast a live execution event to all in-memory subscribers (e.g., SSE connections)
   */
  emitExecutionStep(intentId: string, step: string, data?: any) {
    const event: KernelEvent = {
      intent_id: intentId,
      step,
      timestamp: new Date().toISOString(),
      data
    };
    this.emit(`execution:${intentId}`, event);
  }

  /**
   * Subscribe to live events for a specific intent
   * Returns an unsubscribe function
   */
  subscribeToIntent(intentId: string, callback: (event: KernelEvent) => void): () => void {
    const eventName = `execution:${intentId}`;
    this.on(eventName, callback);
    return () => {
      this.off(eventName, callback);
    };
  }
}

export const streamBridge = KernelStreamBridge.getInstance();
