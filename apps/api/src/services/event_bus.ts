import { SSEEvent } from '@simis/shared';

export class MvpEventBus {
  private subscribers: Set<(event: SSEEvent) => void> = new Set();

  public subscribe(callback: (event: SSEEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public emitEvent(event: SSEEvent) {
    this.broadcast(event);
  }

  private broadcast(event: SSEEvent) {
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (e) {
        console.error('Error broadcasting to subscriber:', e);
      }
    }
  }
}

export const eventBus = new MvpEventBus();
