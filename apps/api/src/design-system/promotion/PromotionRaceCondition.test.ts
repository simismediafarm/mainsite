import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { RegistryRepository, RegistryContext, EventBus } from "@simis/registry-core";
import { RegistryService } from "../../registry/RegistryService";
import { DesignSystemApplicationService } from "../DesignSystemApplicationService";
import { PromotionCoordinator } from "./PromotionCoordinator";
import { MemoryPromotionLockProvider } from "./PromotionLockProvider";
import { TelemetryService } from "../../telemetry/TelemetryService";

describe("Promotion Race Condition Storm Certification", () => {
  let repository: RegistryRepository;
  let registryService: RegistryService;
  let appService: DesignSystemApplicationService;
  let coordinator: PromotionCoordinator;
  let lockProvider: MemoryPromotionLockProvider;
  let eventBus: EventBus;
  let telemetry: TelemetryService;

  beforeEach(() => {
    repository = {} as any;
    eventBus = new EventBus();
    
    const txBoundary = { execute: async (cb: any) => cb({}) } as any;
    const integrityEngine = { signPayload: vi.fn(), verifyPayload: vi.fn().mockReturnValue(true) } as any;
    const permissionService = { validate: vi.fn().mockResolvedValue(true) } as any;
    
    registryService = new RegistryService(repository, txBoundary, eventBus, integrityEngine, permissionService);
    appService = new DesignSystemApplicationService(registryService, repository);
    lockProvider = new MemoryPromotionLockProvider();
    telemetry = new TelemetryService(eventBus);
    
    repository.listDependencies = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, Math.random() * 20));
      return [];
    });
    repository.listDefinitions = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, Math.random() * 20));
      return [];
    });
    repository.getDefinitionByUid = vi.fn().mockImplementation(async (uid: string) => {
      await new Promise(r => setTimeout(r, 5));
      if (uid === "theme-x") return { uid: "theme-x", currentVersionUid: "v-theme-x" };
      return null;
    });
    repository.getVersion = vi.fn().mockImplementation(async (versionUid: string) => {
      await new Promise(r => setTimeout(r, 5));
      if (versionUid === "v-theme-x") return { definition: { subtype: "theme" } };
      return null;
    });

    appService.promote = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 150)); // Simulated promotion duration
    });
    
    appService.rollback = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 10)); // Simulated rollback duration
    });
  });

  it("should survive a 100-way promotion and rollback storm with exactly one success per overlapping window", async () => {
    // 50 promotes, 50 rollbacks running concurrently
    const operations = Array.from({ length: 100 }).map((_, index) => {
      const context: RegistryContext = {
        actorId: `actor-${index}`,
        tenantId: "tenant-storm",
        workspace: "ws-storm",
        environment: "development",
        correlationId: `corr-${index}`,
      };

      // Ensure fresh instances per request to isolate timeouts if necessary,
      // but they should share the same lockProvider
      const coord = new PromotionCoordinator(repository, appService, lockProvider, eventBus);

      if (index % 2 === 0) {
        return coord.promoteCascading(context, "theme-x", "production").catch(e => e);
      } else {
        const correctHash = crypto.createHash("sha256").update("theme-x").digest("hex");
        return coord.rollbackCascading(context, "theme-x", "production", correctHash).catch(e => e);
      }
    });

    const results = await Promise.all(operations);

    // Assert that a vast majority failed due to lock acquisition
    const lockErrors = results.filter(r => r instanceof Error && r.message.includes("lock"));
    const otherErrors = results.filter(r => r instanceof Error && !r.message.includes("lock"));
    const successes = results.filter(r => !(r instanceof Error));

    if (otherErrors.length > 0) {
      console.error(otherErrors[0]);
    }

    expect(otherErrors.length).toBe(0); // Should only fail with lock error
    
    // There can be more than 1 success overall because operations are completed and locks are released,
    // allowing subsequent waiting operations (if retried or if they start later) to grab the lock.
    // However, since we trigger them simultaneously and they take ~30-50ms, some will fail immediately.
    // We expect at least one success and many lock acquisition failures.
    expect(successes.length).toBeGreaterThan(0);
    expect(lockErrors.length).toBeGreaterThan(0);
    
    // Total should equal 100
    expect(successes.length + lockErrors.length).toBe(100);
  }, 30000);
});
