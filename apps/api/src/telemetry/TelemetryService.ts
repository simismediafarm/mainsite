import { EventBus } from "@simis/registry-core/src/core/EventBus";
import { RegistryEvent } from "@simis/registry-core/src/contracts/RegistryEvent";

export type MetricType = "cumulative" | "histogram" | "distribution";

export interface MetricRecorder {
  recordMetric(name: string, value: number, type: MetricType, tags?: Record<string, string>): void;
}

export interface EventRecorder {
  recordEvent(eventName: string, payload: any, tags?: Record<string, string>): void;
}

export class TelemetryService implements MetricRecorder, EventRecorder {
  private metrics: Record<string, number> = {};
  private histograms: Record<string, number[]> = {};

  constructor(private readonly eventBus: EventBus) {
    this.subscribeToEvents();
  }

  public recordMetric(name: string, value: number, type: MetricType, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    if (type === "cumulative") {
      this.metrics[key] = (this.metrics[key] || 0) + value;
    } else {
      if (!this.histograms[key]) this.histograms[key] = [];
      this.histograms[key].push(value);
    }
  }

  public recordEvent(eventName: string, payload: any, tags?: Record<string, string>): void {
    // In future phases, this would forward to Datadog/OpenTelemetry event endpoints
    console.log(`[Event: ${eventName}]`, JSON.stringify({ payload, tags }));
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags).map(([k, v]) => `${k}:${v}`).sort().join(",");
    return `${name}{${tagStr}}`;
  }

  private subscribeToEvents() {
    this.eventBus.subscribe("theme_promoted", this.handleDomainEvent.bind(this));
    this.eventBus.subscribe("theme_rolled_back", this.handleDomainEvent.bind(this));
    this.eventBus.subscribe("artifact_rejected", this.handleDomainEvent.bind(this));
    this.eventBus.subscribe("signature_mismatch_detected", this.handleDomainEvent.bind(this));
    this.eventBus.subscribe("cdn_cache_state_changed", this.handleCacheStateChanged.bind(this));
  }

  private async handleCacheStateChanged(event: RegistryEvent) {
    const payload = event.payload || {};
    const state = payload.state; // "HIT", "MISS", "PURGED", "STALE", "REVALIDATED"
    const tags = {
      environment: event.environment,
      tenantId: event.tenantId || "unknown",
      state,
    };
    this.recordMetric("cdn_cache_state_count", 1, "cumulative", tags);
    this.recordEvent(event.type, event.payload, tags);
  }

  private async handleDomainEvent(event: RegistryEvent) {
    const tags = {
      environment: event.environment,
      tenantId: event.tenantId || "unknown",
    };
    this.recordMetric(`${event.type}_count`, 1, "cumulative", tags);
    this.recordEvent(event.type, event.payload, tags);
  }

  public getSnapshot() {
    return {
      metrics: { ...this.metrics },
      histograms: { ...this.histograms }
    };
  }
}
