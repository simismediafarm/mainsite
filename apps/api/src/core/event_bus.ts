import { EventEmitter } from 'events';

export type EventType = 
  | 'CONTENT_CREATED' 
  | 'CONTENT_UPDATED' 
  | 'MONETIZATION_APPLIED' 
  | 'SCRAPE_COMPLETED' 
  | 'RISK_FLAGGED'
  | 'SYSTEM_ERROR';

class EventBus extends EventEmitter {
  constructor() {
    super();
  }

  emitEvent(event: EventType, payload: any) {
    console.log(`[EventBus] Emitting ${event}:`, JSON.stringify(payload).substring(0, 100));
    this.emit(event, payload);
    
    // Here we can also push to a Redis stream or message queue like RabbitMQ/Kafka
    // if crossing microservice boundaries, but for local node orchestration, 
    // internal EventEmitter is sufficient.
  }
}

export const eventBus = new EventBus();
