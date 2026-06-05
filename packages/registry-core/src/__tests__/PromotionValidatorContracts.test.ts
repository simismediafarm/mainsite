import { describe, it, expect, vi } from "vitest";
import { DependencyValidator } from "../core/integrity/DependencyValidator";
import { RegistryRepository } from "../core/RegistryRepository";
import { PromotionRejectedError } from "../core/RegistryErrors";
import { RegistryVersion, RegistryDefinition, RegistryDependency, RegistryStatus } from "../contracts";

describe("PromotionValidatorContracts - validatePromotion tests", () => {
  const createMockRepo = (params: {
    sourceVersion: RegistryVersion | null;
    dependencies: RegistryDependency[];
    targetVersions: Record<string, RegistryVersion>;
    targetDefs: Record<string, RegistryDefinition>;
  }): RegistryRepository => {
    return {
      getVersion: vi.fn().mockImplementation(async (uid: string) => {
        if (uid === params.sourceVersion?.uid) return params.sourceVersion;
        return params.targetVersions[uid] || null;
      }),
      listDependencies: vi.fn().mockImplementation(async (defUid: string) => {
        return params.dependencies;
      }),
      getDefinitionByUid: vi.fn().mockImplementation(async (uid: string) => {
        return params.targetDefs[uid] || null;
      }),
      // Stub other interface methods
      findById: vi.fn(),
      findByBusinessId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      addDependency: vi.fn(),
      renewLock: vi.fn(),
      getDefinitionByTypeAndId: vi.fn(),
      createDefinition: vi.fn(),
      createVersion: vi.fn(),
      updateCurrentVersion: vi.fn(),
      updateDefinitionStatus: vi.fn(),
      updateVersionStatus: vi.fn(),
      acquireLock: vi.fn(),
      releaseLock: vi.fn(),
      listVersions: vi.fn(),
      createAuditLog: vi.fn(),
    } as unknown as RegistryRepository;
  };

  const sourceVersion: RegistryVersion = {
    uid: "source_ver_1",
    definitionUid: "source_def_1",
    versionNumber: 1,
    status: "published",
    payloadHash: "hash_123",
    definition: {},
    createdAt: new Date(),
  };

  it("existing pinned dependency in target environment -> pass", async () => {
    const dependencies: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "source_def_1",
        dependsOnUid: "target_def_1",
        dependsOnVersionUid: "target_ver_1",
        dependencyMode: "pinned",
        dependencyType: "hard",
      }
    ];
    const targetVersions = {
      "target_ver_1": {
        uid: "target_ver_1",
        definitionUid: "target_def_1",
        versionNumber: 1,
        status: "published" as const,
        payloadHash: "hash_456",
        definition: {},
        createdAt: new Date(),
      }
    };
    const targetDefs = {
      "target_def_1": {
        uid: "target_def_1",
        id: "theme-a",
        type: "design-system" as const,
        currentVersionUid: "target_ver_1",
        status: RegistryStatus.Published,
        environment: "staging" as const,
      }
    };

    const repo = createMockRepo({ sourceVersion, dependencies, targetVersions, targetDefs });
    const validator = new DependencyValidator(repo);

    await expect(validator.validatePromotion("source_ver_1", "staging")).resolves.not.toThrow();
  });

  it("missing pinned dependency -> PromotionRejectedError", async () => {
    const dependencies: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "source_def_1",
        dependsOnUid: "target_def_1",
        dependsOnVersionUid: "target_ver_1",
        dependencyMode: "pinned",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      sourceVersion,
      dependencies,
      targetVersions: {}, // Pinned dependency version is missing
      targetDefs: {},
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validatePromotion("source_ver_1", "staging")).rejects.toThrow(PromotionRejectedError);
  });

  it("floating dependency missing -> allowed without throwing", async () => {
    const dependencies: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "source_def_1",
        dependsOnUid: "target_def_1",
        dependencyMode: "floating", // Floating dependency
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      sourceVersion,
      dependencies,
      targetVersions: {},
      targetDefs: {},
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validatePromotion("source_ver_1", "staging")).resolves.not.toThrow();
  });

  it("cross-environment pinned mismatch -> PromotionRejectedError", async () => {
    const dependencies: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "source_def_1",
        dependsOnUid: "target_def_1",
        dependsOnVersionUid: "target_ver_1",
        dependencyMode: "pinned",
        dependencyType: "hard",
      }
    ];
    const targetVersions = {
      "target_ver_1": {
        uid: "target_ver_1",
        definitionUid: "target_def_1",
        versionNumber: 1,
        status: "published" as const,
        payloadHash: "hash_456",
        definition: {},
        createdAt: new Date(),
      }
    };
    const targetDefs = {
      "target_def_1": {
        uid: "target_def_1",
        id: "theme-a",
        type: "design-system" as const,
        currentVersionUid: "target_ver_1",
        status: RegistryStatus.Published,
        environment: "development" as const, // Belongs to development instead of target environment 'staging'
      }
    };

    const repo = createMockRepo({ sourceVersion, dependencies, targetVersions, targetDefs });
    const validator = new DependencyValidator(repo);

    await expect(validator.validatePromotion("source_ver_1", "staging")).rejects.toThrow(PromotionRejectedError);
  });
});
