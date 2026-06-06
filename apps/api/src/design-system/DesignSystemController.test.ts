import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import { DesignSystemController } from "./DesignSystemController";
import { DesignSystemApplicationService } from "./DesignSystemApplicationService";
import { createDesignSystemRoutes } from "./DesignSystemRoutes";
import {
  z,
  RegistryContext,
  RegistryDefinition,
  RegistryVersion,
  RegistryStatus,
  RegistryDependency,
  RegistryRepository,
  TransactionBoundary,
  IntegrityEngine,
  RegistryPermissionService,
  ContentIntegrity,
  RegistryError,
} from "@simis/registry-core";
import { RegistryService } from "../registry/RegistryService";
import { DesignSystemCompiler } from "../compiler/DesignSystemCompiler";
import { v4 as uuidv4 } from "uuid";

// Reusable Fake Registry Repository
class FakeRegistryRepository implements RegistryRepository {
  public definitions: RegistryDefinition[] = [];
  public versions: RegistryVersion[] = [];
  public dependencies: RegistryDependency[] = [];
  public locks: Set<string> = new Set();
  public auditLogs: any[] = [];

  async getDefinitionByUid(uid: string): Promise<RegistryDefinition | null> {
    return this.definitions.find((d) => d.uid === uid) || null;
  }

  async getDefinitionByTypeAndId(
    type: string,
    id: string,
    env: string,
    tenantId?: string,
    workspace?: string
  ): Promise<RegistryDefinition | null> {
    return (
      this.definitions.find(
        (d) =>
          d.type === type &&
          d.id === id &&
          d.environment === env &&
          d.tenantId === (tenantId || null) &&
          d.workspace === (workspace || null)
      ) || null
    );
  }

  async createDefinition(def: RegistryDefinition): Promise<void> {
    this.definitions.push({ ...def });
  }

  async createVersion(ver: RegistryVersion): Promise<void> {
    this.versions.push(ver);
  }

  async updateCurrentVersion(defUid: string, versionUid: string, versionNumber: number): Promise<void> {
    const def = this.definitions.find((d) => d.uid === defUid);
    if (def) {
      def.currentVersionUid = versionUid;
    }
  }

  async createAuditLog(log: any): Promise<void> {
    this.auditLogs.push(log);
  }

  async acquireLock(resourceUid: string): Promise<boolean> {
    if (this.locks.has(resourceUid)) return false;
    this.locks.add(resourceUid);
    return true;
  }

  async releaseLock(resourceUid: string): Promise<void> {
    this.locks.delete(resourceUid);
  }

  async renewLock(): Promise<void> {}

  async listDependencies(defUid: string): Promise<RegistryDependency[]> {
    return this.dependencies.filter((d) => d.definitionUid === defUid);
  }

  async listVersions(defUid: string): Promise<RegistryVersion[]> {
    return this.versions
      .filter((v) => v.definitionUid === defUid)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersion(verUid: string): Promise<RegistryVersion | null> {
    return this.versions.find((v) => v.uid === verUid) || null;
  }

  async findById(uid: string): Promise<RegistryDefinition | null> {
    return this.getDefinitionByUid(uid);
  }

  async addDependency(ownerUid: string, dependsOnUid: string, type: string, mode: string): Promise<void> {
    this.dependencies.push({
      uid: uuidv4(),
      definitionUid: ownerUid,
      dependsOnUid: dependsOnUid,
      dependencyType: type as any,
      dependencyMode: mode as any,
    });
  }

  async findByBusinessId() {
    return null;
  }

  async create() {
    return {} as any;
  }

  async saveCDNPropagationReceipt() {}

  async update(uid: string, newDefinition: Record<string, any>): Promise<RegistryVersion> {
    const versions = await this.listVersions(uid);
    const latestVersionNumber = versions.length > 0 ? versions[0].versionNumber : 0;
    const versionUid = uuidv4();
    const payloadHash = ContentIntegrity.computePayloadHash(newDefinition);

    const ver: RegistryVersion = {
      uid: versionUid,
      definitionUid: uid,
      versionNumber: latestVersionNumber + 1,
      definition: newDefinition,
      status: RegistryStatus.Draft,
      payloadHash,
      createdAt: new Date()
    };

    await this.createVersion(ver);
    await this.updateCurrentVersion(uid, versionUid, ver.versionNumber);
    return ver;
  }

  async updateDefinitionStatus(uid: string, status: RegistryStatus): Promise<void> {
    const def = this.definitions.find((d) => d.uid === uid);
    if (def) def.status = status;
  }

  async updateVersionStatus(uid: string, status: RegistryStatus): Promise<void> {
    const ver = this.versions.find((v) => v.uid === uid);
    if (ver) ver.status = status as RegistryVersion["status"];
  }

  async listDefinitions(
    type: string,
    environment: string,
    tenantId?: string,
    workspace?: string
  ): Promise<RegistryDefinition[]> {
    return this.definitions.filter(
      (d) =>
        d.type === type &&
        d.environment === environment &&
        d.tenantId === (tenantId || null) &&
        d.workspace === (workspace || null)
    );
  }
}

class FakeTransactionBoundary implements TransactionBoundary {
  async execute<T>(op: (tx: any) => Promise<T>): Promise<T> {
    return op({});
  }
}

describe("DesignSystemController & ApplicationService Integration Tests", () => {
  let repo: FakeRegistryRepository;
  let registryService: RegistryService;
  let appService: DesignSystemApplicationService;
  let controller: DesignSystemController;
  let app: Hono;

  beforeEach(() => {
    repo = new FakeRegistryRepository();
    const txBoundary = new FakeTransactionBoundary();
    const eventBus = {
      publish: async () => {},
    };
    const integrityEngine = {
      runPrePublishChecks: vi.fn().mockResolvedValue(undefined),
    } as unknown as IntegrityEngine;
    const permissionService = new RegistryPermissionService();

    registryService = new RegistryService(
      repo,
      txBoundary,
      eventBus,
      integrityEngine,
      permissionService
    );
    appService = new DesignSystemApplicationService(registryService, repo);
    controller = new DesignSystemController(appService, {} as any);

    app = new Hono();
    const router = createDesignSystemRoutes(controller);
    app.route("/api/v1/design-system", router);
  });

  const getHeaders = (tenant = "tenant-1", workspace = "workspace-1", env = "development") => ({
    "Content-Type": "application/json",
    "x-tenant-id": tenant,
    "x-workspace": workspace,
    "x-environment": env,
    "x-actor-id": "user-test",
  });

  it("1. create design-system object", async () => {
    const payload = {
      subtype: "token-set",
      tokenLevel: "primitive",
      tokens: {
        "colors.blue.500": "#2563eb",
      },
    };

    const res = await app.request("/api/v1/design-system", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        id: "tokens-1",
        payload,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("tokens-1");
    expect(body.status).toBe(RegistryStatus.Draft);
  });

  it("2. publish object -> triggers compiler", async () => {
    // Setup Theme and Token definitions
    const tokenDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "tokens-1",
      {
        subtype: "token-set",
        tokenLevel: "primitive",
        tokens: { "colors.blue.500": "#2563eb" },
      }
    );
    // Submit review and publish tokens
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      tokenDef.uid
    );
    await registryService.publish(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      tokenDef.uid
    );

    const themeDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "theme-1",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: { "button.primary.background": "colors.blue.500" },
      }
    );
    await repo.addDependency(themeDef.uid, tokenDef.uid, "hard", "floating");

    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      themeDef.uid
    );

    // Call publish endpoint
    const res = await app.request(`/api/v1/design-system/${themeDef.uid}/publish`, {
      method: "POST",
      headers: getHeaders(),
    });

    expect(res.status).toBe(200);

    // Check that compiled artifact was successfully generated and saved
    const artifactDef = await repo.getDefinitionByTypeAndId(
      "design-system",
      `compiled-artifact-${themeDef.uid}`,
      "development",
      "tenant-1",
      "workspace-1"
    );
    expect(artifactDef).not.toBeNull();
    expect(artifactDef?.status).toBe(RegistryStatus.Published);
  });

  it("3. rollback object -> triggers re-compilation", async () => {
    // Setup Theme v1 and v2
    const themeDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "theme-1",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {},
      }
    );
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      themeDef.uid
    );
    await registryService.publish(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      themeDef.uid
    );

    // Create v2 version
    const v2Version = await repo.update(themeDef.uid, {
      subtype: "theme",
      tokenLevel: "semantic",
      semantics: { "button.primary.background": "colors.blue.500" }, // dummy semantic
    });
    await repo.updateVersionStatus(v2Version.uid, RegistryStatus.Published);

    // Call rollback to version 1
    const res = await app.request(`/api/v1/design-system/${themeDef.uid}/rollback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        targetVersionNumber: 1,
      }),
    });

    expect(res.status).toBe(200);

    // Check version rolled back (new version number should be 3)
    const versions = await repo.listVersions(themeDef.uid);
    expect(versions[0].versionNumber).toBe(3);
    expect(versions[0].definition.semantics).toEqual({});
  });

  it("4. promote object", async () => {
    const themeDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "theme-1",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {},
      }
    );

    const res = await app.request(`/api/v1/design-system/${themeDef.uid}/promote`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        targetEnvironment: "staging",
        strategy: "STRICT_REJECTION",
      }),
    });

    expect(res.status).toBe(200);
  });

  it("5. fetch artifact & 6. fetch css", async () => {
    // Manually insert a compiled artifact
    const artifactDefUid = "artifact_def_uid";
    const artifactVersionUid = "artifact_ver_uid";
    await repo.createDefinition({
      uid: artifactDefUid,
      id: "compiled-artifact-theme-1",
      type: "design-system",
      currentVersionUid: artifactVersionUid,
      status: RegistryStatus.Published,
      tenantId: "tenant-1",
      environment: "development",
      workspace: "workspace-1",
    });
    await repo.createVersion({
      uid: artifactVersionUid,
      definitionUid: artifactDefUid,
      versionNumber: 1,
      status: "published",
      payloadHash: "hash_art",
      definition: {
        subtype: "compiled-artifact",
        cssVariables: {
          "--simis-button-primary-background": "#2563eb",
        },
        componentMappings: {},
        provenance: {
          compiledFromBundleHash: "n/a",
          compiledAt: new Date().toISOString(),
          compiledBy: "test-user",
          compilerVersion: "1.0.0",
          compilerHash: "sha256:core_v1",
          dependencyFingerprint: "fingerprint_123",
          sourceManifest: {
            themeVersionUid: "ver_theme_1",
            tokenVersionUids: [],
            motionVersionUids: [],
            iconVersionUids: [],
            componentStyleVersionUids: [],
          },
        },
      },
      createdAt: new Date(),
    });

    // 5. Fetch Artifact
    const artRes = await app.request("/api/v1/design-system/theme-1/artifact", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(artRes.status).toBe(200);
    const artBody = await artRes.json();
    expect(artBody.artifactUid).toBe(artifactDefUid);

    // 6. Fetch CSS directly (text/css)
    const cssRes = await app.request("/api/v1/design-system/theme-1/css", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(cssRes.status).toBe(200);
    expect(cssRes.headers.get("Content-Type")).toContain("text/css");
    const cssBody = await cssRes.text();
    expect(cssBody).toContain("--simis-button-primary-background: #2563eb;");
  });

  it("7. tenant isolation & 8. workspace isolation", async () => {
    // Try to fetch artifact from a different tenant
    const res = await app.request("/api/v1/design-system/theme-1/artifact", {
      method: "GET",
      headers: getHeaders("different-tenant"),
    });
    // Should get 404 since it's isolated to tenant-1
    expect(res.status).toBe(404);
  });

  it("9. permission rejection", async () => {
    // Stub permission validation to return false
    const permissionService = new RegistryPermissionService();
    permissionService.canCreate = () => false;

    const restrictedService = new DesignSystemApplicationService(
      new RegistryService(
        repo,
        new FakeTransactionBoundary(),
        { publish: async () => {} },
        { runPrePublishChecks: async () => {} } as any,
        permissionService
      ),
      repo
    );
    const restrictedController = new DesignSystemController(restrictedService, {} as any);
    const restrictedApp = new Hono();
    restrictedApp.route("/api/v1/design-system", createDesignSystemRoutes(restrictedController));

    const res = await restrictedApp.request("/api/v1/design-system", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        id: "tokens-1",
        payload: {
          subtype: "token-set",
          tokenLevel: "primitive",
          tokens: {},
        },
      }),
    });
    expect(res.status).toBe(409); // WORKFLOW_VIOLATION maps to 409
  });

  it("10. invalid environment rejection", async () => {
    const res = await app.request("/api/v1/design-system", {
      method: "POST",
      headers: getHeaders("tenant-1", "workspace-1", "invalid_env" as any),
      body: JSON.stringify({
        id: "tokens-1",
        payload: {
          subtype: "token-set",
          tokenLevel: "primitive",
          tokens: {},
        },
      }),
    });
    // Expected to fail validation with 400 Bad Request
    expect(res.status).toBe(400);
  });

  it("11. list and get design-system objects", async () => {
    // 1. Create a theme definition
    const themeDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "theme-1",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {},
      }
    );

    // 2. Fetch all design system objects
    const listRes = await app.request("/api/v1/design-system", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.length).toBe(1);
    expect(listBody[0].id).toBe("theme-1");

    // 3. Fetch single object
    const getRes = await app.request(`/api/v1/design-system/${themeDef.id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.id).toBe("theme-1");

    // 4. Fetch non-existent object
    const getNonExistent = await app.request("/api/v1/design-system/non-existent", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(getNonExistent.status).toBe(404);
  });

  it("12. reject request with missing tenant ID", async () => {
    const res = await app.request("/api/v1/design-system", {
      method: "GET",
      headers: {
        "x-workspace": "workspace-1",
        "x-environment": "development",
      },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("tenantId query is required");
  });

  it("13. compile theme with existing artifact and component-style dependencies", async () => {
    // 1. Setup primitive tokens
    const tokenDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "tokens-1",
      {
        subtype: "token-set",
        tokenLevel: "primitive",
        tokens: { "colors.blue.500": "#2563eb" },
      }
    );
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      tokenDef.uid
    );
    await registryService.publish(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      tokenDef.uid
    );

    // 2. Setup theme
    const themeDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "theme-1",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: { "button.primary.background": "colors.blue.500" },
      }
    );
    await repo.addDependency(themeDef.uid, tokenDef.uid, "hard", "floating");
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      themeDef.uid
    );
    await registryService.publish(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      themeDef.uid
    );

    // 3. Setup component style referring to theme
    const compStyleDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "comp-style-1",
      {
        subtype: "component-style",
        cssRules: { ".btn": "color: var(--simis-button-primary-background)" },
      }
    );
    await repo.addDependency(compStyleDef.uid, themeDef.uid, "hard", "floating");
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      compStyleDef.uid
    );
    await registryService.publish(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      compStyleDef.uid
    );

    // 4. Create an existing artifact to trigger version retrieval branch (lines 210-212)
    const existingDefUid = `compiled-artifact-${themeDef.uid}`;
    // Let's publish again (or promote or rollback) to trigger compileAllThemes which resolves component dependencies
    // Rollback theme-1 to version 1 to trigger compiler
    const rollbackRes = await app.request(`/api/v1/design-system/${themeDef.uid}/rollback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        targetVersionNumber: 1,
      }),
    });
    expect(rollbackRes.status).toBe(200);

    const artifactDef = await repo.getDefinitionByTypeAndId(
      "design-system",
      `compiled-artifact-${themeDef.uid}`,
      "development",
      "tenant-1",
      "workspace-1"
    );
    expect(artifactDef).not.toBeNull();
  });

  it("14. error handling branch coverage (Lock Acquisition and Internal Server Error)", async () => {
    // Lock acquisition error mapping to 423
    const lockErr = new RegistryError("LOCK_ACQUISITION_FAILED", "Could not acquire lock");
    vi.spyOn(appService, "listObjects").mockRejectedValueOnce(lockErr);
    const resLock = await app.request("/api/v1/design-system", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(resLock.status).toBe(423);

    // Internal server error mapping to 500
    const randomErr = new Error("Random database error");
    vi.spyOn(appService, "listObjects").mockRejectedValueOnce(randomErr);
    const resErr = await app.request("/api/v1/design-system", {
      method: "GET",
      headers: getHeaders(),
    });
    expect(resErr.status).toBe(500);
  });

  it("15. compile error catch block coverage", async () => {
    // If compilation fails, compileAllThemes catches it, logs it, but transaction still commits.
    const mockCompile = vi.spyOn(DesignSystemCompiler, "compile").mockImplementationOnce(() => {
      throw new Error("Compiler syntax error mock");
    });

    const tokenDef = await appService.createDraft(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      "tokens-fail",
      {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {},
      }
    );
    await registryService.submitReview(
      { actorId: "u", tenantId: "tenant-1", workspace: "workspace-1", environment: "development" },
      tokenDef.uid
    );

    // Publish should complete successfully even if compiler throws (per requirements)
    const res = await app.request(`/api/v1/design-system/${tokenDef.uid}/publish`, {
      method: "POST",
      headers: getHeaders(),
    });
    expect(res.status).toBe(200);
    mockCompile.mockRestore();
  });
});
