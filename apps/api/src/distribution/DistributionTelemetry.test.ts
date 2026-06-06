import { describe, it, expect } from "vitest";
import { TelemetryService } from "../telemetry/TelemetryService";
import { EventBus } from "@simis/registry-core";

describe("Distribution Telemetry", () => {
  it("should record CDNCacheStateChanged events", async () => {
    const eventBus = new EventBus();
    const telemetry = new TelemetryService(eventBus);

    await eventBus.publish({
      eventUid: "e-1",
      correlationId: "c-1",
      actorId: "actor-1",
      environment: "production",
      tenantId: "tenant-x",
      type: "cdn_cache_state_changed",
      payload: { state: "HIT" },
      timestamp: new Date()
    });

    await eventBus.publish({
      eventUid: "e-2",
      correlationId: "c-2",
      actorId: "actor-1",
      environment: "production",
      tenantId: "tenant-x",
      type: "cdn_cache_state_changed",
      payload: { state: "MISS" },
      timestamp: new Date()
    });

    const snapshot = telemetry.getSnapshot();

    const hitKey = "cdn_cache_state_count{environment:production,state:HIT,tenantId:tenant-x}";
    const missKey = "cdn_cache_state_count{environment:production,state:MISS,tenantId:tenant-x}";

    expect(snapshot.metrics[hitKey]).toBe(1);
    expect(snapshot.metrics[missKey]).toBe(1);
  });
});
