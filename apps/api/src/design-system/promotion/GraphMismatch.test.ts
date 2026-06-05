import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegistryRepository, RegistryContext, EventBus } from "@simis/registry-core";
import { RegistryService } from "../../registry/RegistryService";
import { DesignSystemApplicationService } from "../DesignSystemApplicationService";
import { PromotionCoordinator, GraphMismatchError } from "./PromotionCoordinator";
import { MemoryPromotionLockProvider } from "./PromotionLockProvider";
import { TelemetryService } from "../../telemetry/TelemetryService";
import crypto from "crypto";

describe("Dependency Graph Mismatch Validation", () => {
  let repository: RegistryRepository;
  let registryService: RegistryService;
  let appService: DesignSystemApplicationService;
  let coordinator: PromotionCoordinator;
  let lockProvider: MemoryPromotionLockProvider;
  let eventBus: EventBus;
  let context: RegistryContext;

  beforeEach(() => {
    repository = {} as any;
    eventBus = new EventBus();
    const txBoundary = { execute: async (cb: any) => cb({}) } as any;
    const integrityEngine = { signPayload: vi.fn(), verifyPayload: vi.fn().mockReturnValue(true) } as any;
    const permissionService = { validate: vi.fn().mockResolvedValue(true) } as any;

    registryService = new RegistryService(repository, txBoundary, eventBus, integrityEngine, permissionService);
    appService = new DesignSystemApplicationService(registryService, repository);
    (appService as any).rollback = vi.fn().mockResolvedValue(undefined);
    lockProvider = new MemoryPromotionLockProvider();
    coordinator = new PromotionCoordinator(repository, appService, lockProvider, eventBus);

    context = {
      actorId: "test-actor",
      tenantId: "tenant-1",
      workspace: "workspace-1",
      environment: "development",
      correlationId: "corr-1",
    };
  });

  it("should block rollback if the current graph hash does not match the manifest hash", async () => {
    const themeUid = "theme-1";
    const tokenUid = "token-1";
    
    repository.getDefinitionByUid = vi.fn().mockImplementation(async (uid: string) => {
      if (uid === themeUid) return { uid: themeUid, currentVersionUid: "v-theme-1" };
      if (uid === tokenUid) return { uid: tokenUid, currentVersionUid: "v-token-1" };
      return null;
    });

    repository.getVersion = vi.fn().mockImplementation(async (versionUid: string) => {
      if (versionUid === "v-theme-1") return { definition: { subtype: "theme" } };
      if (versionUid === "v-token-1") return { definition: { subtype: "token-set" } };
      return null;
    });

    // Simulate changed dependencies (token added to graph after the original promotion)
    repository.listDependencies = vi.fn().mockResolvedValue([{ dependsOnUid: tokenUid, dependencyMode: "hard" }]);
    repository.listDefinitions = vi.fn().mockResolvedValue([]);

    // We manually calculate what the current graph hash will be to prove mismatch
    const expectedCurrentDag = [tokenUid, themeUid];
    const actualCurrentGraphHash = crypto.createHash("sha256").update(expectedCurrentDag.join(",")).digest("hex");

    // The old manifest only had the theme itself (no token), so its hash is different
    const oldManifestHash = crypto.createHash("sha256").update(themeUid).digest("hex");

    await expect(coordinator.rollbackCascading(context, themeUid, "production", oldManifestHash))
      .rejects.toThrow(GraphMismatchError);

    try {
      await coordinator.rollbackCascading(context, themeUid, "production", oldManifestHash);
    } catch (e) {
      expect(e).toBeInstanceOf(GraphMismatchError);
      expect((e as GraphMismatchError).expectedHash).toBe(oldManifestHash);
      expect((e as GraphMismatchError).actualHash).toBe(actualCurrentGraphHash);
    }
    
    // Ensure rollback was not executed
    expect((appService as any).rollback).not.toHaveBeenCalled();
  });

  it("should execute rollback if hashes match exactly", async () => {
    const themeUid = "theme-1";
    
    repository.getDefinitionByUid = vi.fn().mockImplementation(async (uid: string) => {
      if (uid === themeUid) return { uid: themeUid, currentVersionUid: "v-theme-1" };
      return null;
    });

    repository.getVersion = vi.fn().mockImplementation(async (versionUid: string) => {
      if (versionUid === "v-theme-1") return { definition: { subtype: "theme" } };
      return null;
    });

    repository.listDependencies = vi.fn().mockResolvedValue([]);
    repository.listDefinitions = vi.fn().mockResolvedValue([]);

    const expectedCurrentDag = [themeUid];
    const correctHash = crypto.createHash("sha256").update(expectedCurrentDag.join(",")).digest("hex");

    await expect(coordinator.rollbackCascading(context, themeUid, "production", correctHash))
      .resolves.toBeUndefined();

    expect((appService as any).rollback).toHaveBeenCalledWith(context, themeUid, "production");
  });
});
