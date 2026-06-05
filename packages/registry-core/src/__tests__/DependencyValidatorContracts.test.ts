import { describe, it, expect, vi } from "vitest";
import { DependencyValidator } from "../core/integrity/DependencyValidator";
import { RegistryRepository } from "../core/RegistryRepository";
import { RegistryDefinition, RegistryDependency, RegistryStatus, RegistryVersion } from "../contracts";

describe("DependencyValidatorContracts - DAG and basic validation", () => {
  const createMockRepo = (params: {
    definitions: Record<string, RegistryDefinition>;
    versions: Record<string, RegistryVersion>;
  }): RegistryRepository => {
    return {
      getDefinitionByUid: vi.fn().mockImplementation(async (uid: string) => {
        return params.definitions[uid] || null;
      }),
      getVersion: vi.fn().mockImplementation(async (uid: string) => {
        return params.versions[uid] || null;
      }),
      // Other mocks
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
      listDependencies: vi.fn(),
      listVersions: vi.fn(),
      createAuditLog: vi.fn(),
    } as unknown as RegistryRepository;
  };

  it("skips runtime dependencies", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "comp-a",
      type: "component",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "runtime",
      }
    ];

    const repo = createMockRepo({ definitions: {}, versions: {} });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).resolves.not.toThrow();
  });

  it("throws if hard dependency is missing", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "comp-a",
      type: "component",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_missing",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({ definitions: {}, versions: {} });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/Hard dependency target_missing not found/);
  });

  it("throws if publishing a parent while a hard dependency is not published", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "comp-a",
      type: "component",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Published,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "tokens",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft, // Target is Draft, not Published!
      environment: "development",
    };
    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef },
      versions: {}
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/Cannot publish parent_1: Hard dependency target_1 is not published/);
  });

  it("Rule 1: Throws if bundle is referenced as a runtime dependency", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "theme-a",
      type: "design-system",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "bundle-a",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };

    const parentVersion: RegistryVersion = {
      uid: "parent_ver_1",
      definitionUid: "parent_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h1",
      definition: { subtype: "theme", tokenLevel: "semantic" },
      createdAt: new Date(),
    };
    const targetVersion: RegistryVersion = {
      uid: "target_ver_1",
      definitionUid: "target_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h2",
      definition: { subtype: "bundle" },
      createdAt: new Date(),
    };

    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "runtime",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef, "parent_1": parentDef },
      versions: { "parent_ver_1": parentVersion, "target_ver_1": targetVersion }
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/Bundle target_1 cannot be referenced as a runtime dependency/);
  });

  it("Rule D: Throws if compiled-artifact is referenced as a dependency", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "theme-a",
      type: "design-system",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "artifact-a",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };

    const parentVersion: RegistryVersion = {
      uid: "parent_ver_1",
      definitionUid: "parent_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h1",
      definition: { subtype: "theme", tokenLevel: "semantic" },
      createdAt: new Date(),
    };
    const targetVersion: RegistryVersion = {
      uid: "target_ver_1",
      definitionUid: "target_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h2",
      definition: { subtype: "compiled-artifact" },
      createdAt: new Date(),
    };

    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef, "parent_1": parentDef },
      versions: { "parent_ver_1": parentVersion, "target_ver_1": targetVersion }
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/Compiled Artifact target_1 cannot be referenced as a dependency/);
  });

  it("Rule 2 (DAG Downward): Throws if semantic depends on semantic", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "theme-a",
      type: "design-system",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "theme-b",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };

    const parentVersion: RegistryVersion = {
      uid: "parent_ver_1",
      definitionUid: "parent_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h1",
      definition: { subtype: "theme", tokenLevel: "semantic" },
      createdAt: new Date(),
    };
    const targetVersion: RegistryVersion = {
      uid: "target_ver_1",
      definitionUid: "target_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h2",
      definition: { subtype: "theme", tokenLevel: "semantic" }, // Rank 3 depends on Rank 3 -> Violates downward DAG!
      createdAt: new Date(),
    };

    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef, "parent_1": parentDef },
      versions: { "parent_ver_1": parentVersion, "target_ver_1": targetVersion }
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/DAG Violation: theme \(semantic\) cannot depend on theme \(semantic\)/);
  });

  it("Rule 2 (DAG Downward): Throws if primitive depends on semantic", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "tokens-a",
      type: "design-system",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "theme-b",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };

    const parentVersion: RegistryVersion = {
      uid: "parent_ver_1",
      definitionUid: "parent_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h1",
      definition: { subtype: "token-set", tokenLevel: "primitive" },
      createdAt: new Date(),
    };
    const targetVersion: RegistryVersion = {
      uid: "target_ver_1",
      definitionUid: "target_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h2",
      definition: { subtype: "theme", tokenLevel: "semantic" }, // Rank 2 depends on Rank 3 -> Violates downward DAG!
      createdAt: new Date(),
    };

    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef, "parent_1": parentDef },
      versions: { "parent_ver_1": parentVersion, "target_ver_1": targetVersion }
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).rejects.toThrow(/DAG Violation: token-set \(primitive\) cannot depend on theme \(semantic\)/);
  });

  it("Rule 2 (DAG Downward): Allows semantic depending on primitive", async () => {
    const parentDef: RegistryDefinition = {
      uid: "parent_1",
      id: "theme-a",
      type: "design-system",
      currentVersionUid: "parent_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };
    const targetDef: RegistryDefinition = {
      uid: "target_1",
      id: "tokens-a",
      type: "design-system",
      currentVersionUid: "target_ver_1",
      status: RegistryStatus.Draft,
      environment: "development",
    };

    const parentVersion: RegistryVersion = {
      uid: "parent_ver_1",
      definitionUid: "parent_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h1",
      definition: { subtype: "theme", tokenLevel: "semantic" },
      createdAt: new Date(),
    };
    const targetVersion: RegistryVersion = {
      uid: "target_ver_1",
      definitionUid: "target_1",
      versionNumber: 1,
      status: "draft",
      payloadHash: "h2",
      definition: { subtype: "token-set", tokenLevel: "primitive" }, // Rank 3 depends on Rank 2 -> Valid downward DAG!
      createdAt: new Date(),
    };

    const deps: RegistryDependency[] = [
      {
        uid: "dep_1",
        definitionUid: "parent_1",
        dependsOnUid: "target_1",
        dependencyMode: "floating",
        dependencyType: "hard",
      }
    ];

    const repo = createMockRepo({
      definitions: { "target_1": targetDef, "parent_1": parentDef },
      versions: { "parent_ver_1": parentVersion, "target_ver_1": targetVersion }
    });
    const validator = new DependencyValidator(repo);

    await expect(validator.validate(parentDef, deps)).resolves.not.toThrow();
  });
});
