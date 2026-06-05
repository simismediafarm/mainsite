import { describe, it, expect, vi } from "vitest";
import { EventBus } from "@simis/registry-core/src/core/EventBus";
import { CdnDistributionService } from "./CdnDistributionService";
import { InMemoryCdnProvider } from "./InMemoryCdnProvider";
import { DistributionEventSubscriber } from "./DistributionEventSubscriber";

describe("DistributionEventSubscriber", () => {
  it("should trigger cache purge on theme_promoted event", async () => {
    const eventBus = new EventBus();
    const provider = new InMemoryCdnProvider();
    const service = new CdnDistributionService(provider);
    
    vi.spyOn(service, "invalidateByTag").mockResolvedValue({ status: "COMPLETE" } as any);

    new DistributionEventSubscriber(eventBus, service);

    await eventBus.publish({
      eventUid: "e-1",
      correlationId: "c-1",
      actorId: "actor-1",
      environment: "production",
      type: "theme_promoted",
      payload: { themeDefinitionUid: "theme-1" },
      timestamp: new Date()
    });

    expect(service.invalidateByTag).toHaveBeenCalledWith("theme-1", "tenant-unknown-tenant:theme-theme-1", ["us-east", "eu-west", "ap-southeast"]);
  });

  it("should trigger cache purge on theme_rolled_back event", async () => {
    const eventBus = new EventBus();
    const provider = new InMemoryCdnProvider();
    const service = new CdnDistributionService(provider);
    
    vi.spyOn(service, "invalidateByTag").mockResolvedValue({ status: "COMPLETE" } as any);

    new DistributionEventSubscriber(eventBus, service);

    await eventBus.publish({
      eventUid: "e-2",
      correlationId: "c-2",
      actorId: "actor-1",
      environment: "production",
      type: "theme_rolled_back",
      payload: { themeDefinitionUid: "theme-1" },
      timestamp: new Date()
    });

    expect(service.invalidateByTag).toHaveBeenCalledWith("theme-1", "tenant-unknown-tenant:theme-theme-1", ["us-east", "eu-west", "ap-southeast"]);
  });
});
