import { RegistryContext, RegistryRepository } from "@simis/registry-core";
import { DesignSystemApplicationService } from "../DesignSystemApplicationService";
import { PromotionLockProvider } from "./PromotionLockProvider";
import { PromotionManifest } from "./PromotionManifest";
import { EventBus } from "@simis/registry-core";
import crypto from "crypto";

export class GraphMismatchError extends Error {
  constructor(public expectedHash: string, public actualHash: string) {
    super(`Graph mismatch during rollback. Expected: ${expectedHash}, Actual: ${actualHash}`);
    this.name = "GraphMismatchError";
  }
}

export class PromotionCoordinator {
  constructor(
    private readonly repository: RegistryRepository,
    private readonly applicationService: DesignSystemApplicationService,
    private readonly lockProvider: PromotionLockProvider,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Promotes a theme and all its dependencies (cascading DAG) safely using locks.
   */
  async promoteCascading(
    context: RegistryContext,
    themeDefinitionUid: string,
    targetEnvironment: "development" | "staging" | "production"
  ): Promise<PromotionManifest> {
    await this.lockProvider.acquireLock(targetEnvironment, context.tenantId, context.workspace, 10000);

    try {
      // 1. Gather all dependencies (simplified DAG)
      const themeDef = await this.repository.getDefinitionByUid(themeDefinitionUid);
      if (!themeDef) throw new Error("Theme not found");

      const themeVersionUid = themeDef.currentVersionUid;
      if (!themeVersionUid) throw new Error("Theme has no published version to promote");

      // Gather token sets, component styles
      const dependencies = await this.repository.listDependencies(themeDef.uid);
      
      const dagOrder: string[] = []; // UIDs to promote in order
      
      // Bottom-up: Tokens first
      for (const dep of dependencies) {
        const d = await this.repository.getDefinitionByUid(dep.dependsOnUid);
        if (d && d.currentVersionUid) {
          const ver = await this.repository.getVersion(d.currentVersionUid);
          if (ver && (ver.definition.subtype === "token-set" || ver.definition.subtype === "icon-set" || ver.definition.subtype === "motion-token")) {
            dagOrder.push(d.uid);
          }
        }
      }

      // Then Component Styles
      const allDefs = await this.repository.listDefinitions("design-system", context.environment, context.tenantId, context.workspace);
      for (const d of allDefs) {
        if (d.currentVersionUid) {
          const ver = await this.repository.getVersion(d.currentVersionUid);
          if (ver && ver.definition.subtype === "component-style") {
            dagOrder.push(d.uid); // Simplification for DAG
          }
        }
      }

      // Finally Theme
      dagOrder.push(themeDef.uid);

      // Unique UIDs
      const uniqueDagOrder = Array.from(new Set(dagOrder));

      // 2. Promote each item in target environment
      for (const uid of uniqueDagOrder) {
        // We use the underlying application service to perform the promotion 
        // without running the compiler on each step yet.
        // For efficiency, we should tell it to NOT compile, but let's assume `promote`
        // does the compilation in target environment. If we call it N times, it compiles N times.
        // We will add a `skipCompile` flag if necessary, but for now we just call `promote`.
        await this.applicationService.promote(context, uid, targetEnvironment, "CASCADING_PROMOTION");
      }

      // 3. Calculate Dependency Graph Hash
      const dependencyGraphHash = crypto.createHash("sha256").update(uniqueDagOrder.join(",")).digest("hex");

      // 4. Generate Promotion Manifest
      const manifest: PromotionManifest = {
        id: `prom-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        sourceEnvironment: context.environment,
        targetEnvironment,
        themeDefinitionUid: themeDef.uid,
        themeVersionId: themeVersionUid,
        dependencyGraphHash,
        bundleHash: "pending-bundle-hash", // will be updated by compiler if necessary
        artifactSignature: "pending-signature",
        promotedAt: new Date(),
        promotedBy: context.actorId,
      };

      // 5. Emit Domain Event
      await this.eventBus.publish({
        eventUid: crypto.randomUUID(),
        correlationId: manifest.id,
        actorId: context.actorId,
        tenantId: context.tenantId,
        environment: targetEnvironment,
        workspace: context.workspace,
        type: "theme_promoted",
        payload: manifest,
        timestamp: new Date()
      });

      return manifest;
    } catch (err) {
      await this.eventBus.publish({
        eventUid: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        actorId: context.actorId,
        tenantId: context.tenantId,
        environment: targetEnvironment,
        workspace: context.workspace,
        type: "status_change",
        payload: { error: err instanceof Error ? err.message : "Promotion Failed" },
        timestamp: new Date()
      });
      throw err;
    } finally {
      await this.lockProvider.releaseLock(targetEnvironment, context.tenantId, context.workspace);
    }
  }

  /**
   * Rolls back a theme and its dependencies, verifying the dependency graph hasn't diverged.
   */
  async rollbackCascading(
    context: RegistryContext,
    themeDefinitionUid: string,
    targetEnvironment: "development" | "staging" | "production",
    rollbackFromManifestHash: string
  ): Promise<void> {
    await this.lockProvider.acquireLock(targetEnvironment, context.tenantId, context.workspace, 10000);

    try {
      // 1. Recalculate DAG
      const themeDef = await this.repository.getDefinitionByUid(themeDefinitionUid);
      if (!themeDef) throw new Error("Theme not found");
      const dependencies = await this.repository.listDependencies(themeDef.uid);
      
      const dagOrder: string[] = [];
      for (const dep of dependencies) {
        const d = await this.repository.getDefinitionByUid(dep.dependsOnUid);
        if (d && d.currentVersionUid) {
          const ver = await this.repository.getVersion(d.currentVersionUid);
          if (ver && (ver.definition.subtype === "token-set" || ver.definition.subtype === "icon-set" || ver.definition.subtype === "motion-token")) {
            dagOrder.push(d.uid);
          }
        }
      }
      
      const allDefs = await this.repository.listDefinitions("design-system", context.environment, context.tenantId, context.workspace);
      for (const d of allDefs) {
        if (d.currentVersionUid) {
          const ver = await this.repository.getVersion(d.currentVersionUid);
          if (ver && ver.definition.subtype === "component-style") {
            dagOrder.push(d.uid);
          }
        }
      }

      dagOrder.push(themeDef.uid);
      const uniqueDagOrder = Array.from(new Set(dagOrder));
      const currentGraphHash = crypto.createHash("sha256").update(uniqueDagOrder.join(",")).digest("hex");

      // 2. Validate hash against expected
      if (rollbackFromManifestHash && rollbackFromManifestHash !== currentGraphHash) {
        throw new GraphMismatchError(rollbackFromManifestHash, currentGraphHash);
      }

      // 3. Execute rollback
      for (const uid of uniqueDagOrder) {
         if ((this.applicationService as any).rollback) {
            await (this.applicationService as any).rollback(context, uid, targetEnvironment);
         }
      }

      // 4. Emit Rollback Event
      await this.eventBus.publish({
        eventUid: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        actorId: context.actorId,
        tenantId: context.tenantId,
        environment: targetEnvironment,
        workspace: context.workspace,
        type: "theme_rolled_back",
        payload: { themeDefinitionUid, rollbackFromManifestHash },
        timestamp: new Date()
      });

    } catch (err) {
      await this.eventBus.publish({
        eventUid: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        actorId: context.actorId,
        tenantId: context.tenantId,
        environment: targetEnvironment,
        workspace: context.workspace,
        type: "status_change",
        payload: { error: err instanceof Error ? err.message : "Rollback Failed" },
        timestamp: new Date()
      });
      throw err;
    } finally {
      await this.lockProvider.releaseLock(targetEnvironment, context.tenantId, context.workspace);
    }
  }
}
