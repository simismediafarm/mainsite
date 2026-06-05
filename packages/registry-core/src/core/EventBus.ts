import { RegistryEvent } from "../contracts/RegistryEvent";

type EventHandler = (event: RegistryEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  subscribe(eventType: RegistryEvent["type"], handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  unsubscribe(eventType: RegistryEvent["type"], handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async publish(event: RegistryEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      const promises = Array.from(handlers).map((handler) => handler(event));
      await Promise.allSettled(promises);
    }
  }
}
