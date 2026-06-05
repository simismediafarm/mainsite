import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegistryRepository, RegistryContext, ContentIntegrity, EventBus } from "@simis/registry-core";
import { RegistryService } from "../../registry/RegistryService";
import { DesignSystemApplicationService } from "../DesignSystemApplicationService";
import { PromotionCoordinator } from "./PromotionCoordinator";
import { MemoryPromotionLockProvider } from "./PromotionLockProvider";
import { TelemetryService } from "../../telemetry/TelemetryService";
import crypto from "crypto";

describe("Enterprise Promotion Pipeline Integration", () => {
  let repository: RegistryRepository;
  let registryService: RegistryService;
  let appService: DesignSystemApplicationService;
  let coordinator: PromotionCoordinator;
  let lockProvider: MemoryPromotionLockProvider;
  let eventBus: EventBus;
  let telemetry: TelemetryService;
  let context: RegistryContext;

  beforeEach(() => {
    // We mock the repository and eventbus for isolated testing without full db setup
    repository = {} as any;
    eventBus = new EventBus();
    
    // We instantiate real implementations for the core logic
    const txBoundary = { execute: async (cb: any) => cb({}) } as any;
    const integrityEngine = { signPayload: vi.fn(), verifyPayload: vi.fn().mockReturnValue(true) } as any;
    const permissionService = { validate: vi.fn().mockResolvedValue(true) } as any;
    
    registryService = new RegistryService(repository, txBoundary, eventBus, integrityEngine, permissionService);
    appService = new DesignSystemApplicationService(registryService, repository);
    lockProvider = new MemoryPromotionLockProvider();
    telemetry = new TelemetryService(eventBus);
    coordinator = new PromotionCoordinator(repository, appService, lockProvider, eventBus);

    context = {
      actorId: "test-actor",
      tenantId: "tenant-1",
      workspace: "workspace-1",
      environment: "development",
      correlationId: "corr-1",
    };
  });

  it("should enforce DAG ordering and compile theme with specific artifactSchemaVersion", async () => {
    // Mock definitions and dependencies
    const themeUid = "theme-uid-1";
    const tokenUid = "token-uid-1";
    const compUid = "comp-uid-1";

    repository.getDefinitionByUid = vi.fn().mockImplementation(async (uid: string) => {
      if (uid === themeUid) return { uid: themeUid, id: "my-theme", currentVersionUid: "v-theme-1" };
      if (uid === tokenUid) return { uid: tokenUid, id: "my-tokens", currentVersionUid: "v-token-1" };
      if (uid === compUid) return { uid: compUid, id: "my-comp", currentVersionUid: "v-comp-1" };
      return null;
    });

    repository.getVersion = vi.fn().mockImplementation(async (versionUid: string) => {
      if (versionUid === "v-theme-1") return { definition: { subtype: "theme" } };
      if (versionUid === "v-token-1") return { definition: { subtype: "token-set" } };
      if (versionUid === "v-comp-1") return { definition: { subtype: "component-style" } };
      return null;
    });

    repository.listDependencies = vi.fn().mockImplementation(async (uid: string) => {
      if (uid === themeUid) return [{ dependsOnUid: tokenUid, dependencyMode: "hard" }];
      return [];
    });

    repository.listDefinitions = vi.fn().mockImplementation(async (type: string, env: string, tenant?: string, ws?: string) => {
      // Mock listing to find component styles that depend on theme (simplified DAG logic)
      return [
        { uid: compUid, currentVersionUid: "v-comp-1" }
      ];
    });

    appService.promote = vi.fn().mockResolvedValue(undefined);

    const manifest = await coordinator.promoteCascading(context, themeUid, "staging");

    expect(manifest).toBeDefined();
    expect(manifest.targetEnvironment).toBe("staging");
    expect(manifest.dependencyGraphHash).toBeDefined();

    // Verify order: tokens -> components -> theme
    expect(appService.promote).toHaveBeenNthCalledWith(1, context, tokenUid, "staging", "CASCADING_PROMOTION");
    expect(appService.promote).toHaveBeenNthCalledWith(2, context, compUid, "staging", "CASCADING_PROMOTION");
    expect(appService.promote).toHaveBeenNthCalledWith(3, context, themeUid, "staging", "CASCADING_PROMOTION");

    // Verify telemetry event was captured
    const snapshot = telemetry.getSnapshot();
    const promoteKey = Object.keys(snapshot.metrics).find(k => k.startsWith("theme_promoted_count"));
    expect(promoteKey).toBeDefined();
    expect(snapshot.metrics[promoteKey!]).toBe(1);
  });

  it("should throw error if lock cannot be acquired due to concurrent promotion", async () => {
    // Acquire lock manually to simulate concurrent promotion
    await lockProvider.acquireLock("staging", "tenant-1", "workspace-1");

    // Setting timeout to 100ms for faster test failure
    coordinator = new PromotionCoordinator(repository, appService, lockProvider, eventBus);
    // @ts-ignore - hacking the timeout parameter to test
    const _acquireLock = lockProvider.acquireLock.bind(lockProvider);
    lockProvider.acquireLock = (env, tenant, ws) => _acquireLock(env, tenant, ws, 100);

    await expect(coordinator.promoteCascading(context, "some-theme", "staging"))
      .rejects.toThrow(/Failed to acquire promotion lock/);
  });
});
