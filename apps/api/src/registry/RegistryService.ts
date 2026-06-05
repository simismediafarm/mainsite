import { RegistryContext, RegistryDefinition, RegistryVersion, RegistryStatus, RegistryEvent, RegistryPermissionService, ContentIntegrity, IntegrityEngine, WorkflowViolationError, LockAcquisitionError, PayloadIntegrityError, RegistryError, RegistryRepository, TransactionBoundary } from "@simis/registry-core";
import { v4 as uuidv4 } from "uuid";

export class RegistryService {
  constructor(
    private repo: RegistryRepository,
    private transactionBoundary: TransactionBoundary,
    private eventBus: { publish: (event: RegistryEvent) => Promise<void> },
    private integrityEngine: IntegrityEngine,
    private permissionService: RegistryPermissionService
  ) {}

  private async executeTx<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    return this.transactionBoundary.execute(async (tx: any) => {
      return operation(tx);
    });
  }

  private createEvent(context: RegistryContext, type: RegistryEvent["type"], payload: any): RegistryEvent {
    return {
      eventUid: uuidv4(),
      correlationId: context.correlationId || uuidv4(),
      actorId: context.actorId,
      tenantId: context.tenantId,
      environment: context.environment,
      workspace: context.workspace,
      type,
      payload,
      timestamp: new Date()
    };
  }

  async createDraft(context: RegistryContext, type: string, id: string, payload: Record<string, any>): Promise<RegistryDefinition> {
    if (!this.permissionService.canCreate(context, type)) {
      throw new WorkflowViolationError("Permission denied: cannot create draft.");
    }

    return this.executeTx(async (tx) => {
      const defUid = uuidv4();
      const versionUid = uuidv4();
      const payloadHash = ContentIntegrity.computePayloadHash(payload);
      
      const def: RegistryDefinition = {
        uid: defUid,
        id,
        type: type as any,
        currentVersionUid: versionUid,
        status: RegistryStatus.Draft,
        tenantId: context.tenantId,
        environment: context.environment,
        workspace: context.workspace
      };

      const ver: RegistryVersion = {
        uid: versionUid,
        definitionUid: defUid,
        versionNumber: 1,
        definition: payload,
        status: RegistryStatus.Draft,
        payloadHash: payloadHash,
        createdAt: new Date()
      };

      await this.repo.createDefinition(def, tx);
      await this.repo.createVersion(ver, tx);
      await this.repo.createAuditLog({
        uid: uuidv4(),
        definitionUid: defUid,
        action: "create_draft",
        performedBy: context.actorId,
        changes: { payloadHash }
      }, tx);

      await this.eventBus.publish(this.createEvent(context, "created", { definitionUid: defUid, versionUid: versionUid, versionNumber: 1 }));

      return def;
    });
  }

  async submitReview(context: RegistryContext, definitionUid: string): Promise<void> {
    return this.executeTx(async (tx) => {
      const def = await this.repo.getDefinitionByUid(definitionUid);
      if (!def) throw new RegistryError("NOT_FOUND", "Definition not found");

      if (!this.permissionService.canReview(context, def)) {
        throw new WorkflowViolationError("Permission denied: cannot submit for review.");
      }

      if (def.status !== RegistryStatus.Draft) {
        throw new WorkflowViolationError(`Cannot submit review from status ${def.status}`);
      }

      await this.repo.updateDefinitionStatus(def.uid, RegistryStatus.Review, tx);
      await this.repo.updateVersionStatus(def.currentVersionUid, RegistryStatus.Review, tx);
      await this.eventBus.publish(this.createEvent(context, "status_change", { definitionUid: def.uid }));
    });
  }

  async publish(context: RegistryContext, definitionUid: string): Promise<void> {
    return this.executeTx(async (tx) => {
      const def = await this.repo.getDefinitionByUid(definitionUid);
      if (!def) throw new RegistryError("NOT_FOUND", "Definition not found");

      if (!this.permissionService.canPublish(context, def)) {
        throw new WorkflowViolationError("Permission denied: cannot publish.");
      }

      const lockAcquired = await this.repo.acquireLock(def.uid, context.actorId, 60000);
      if (!lockAcquired) {
        throw new LockAcquisitionError("Could not acquire lock for publishing");
      }

      try {
        const versions = await this.repo.listVersions(def.uid, tx);
        const latestVersion = versions.find((v: RegistryVersion) => v.uid === def.currentVersionUid);
        if (!latestVersion) throw new RegistryError("NOT_FOUND", "Latest version not found");

        const deps = await this.repo.listDependencies(def.uid, tx);
        await this.integrityEngine.runPrePublishChecks(def, deps);

        const computedHash = ContentIntegrity.computePayloadHash(latestVersion.definition);

        await this.repo.updateCurrentVersion(def.uid, def.currentVersionUid, latestVersion.versionNumber, tx);
        await this.repo.updateDefinitionStatus(def.uid, RegistryStatus.Published, tx);
        await this.repo.updateVersionStatus(def.currentVersionUid, RegistryStatus.Published, tx);

        await this.repo.createAuditLog({
          uid: uuidv4(),
          definitionUid: def.uid,
          action: "publish",
          performedBy: context.actorId
        }, tx);

        await this.eventBus.publish(this.createEvent(context, "published", { definitionUid: def.uid, versionUid: latestVersion.uid, versionNumber: latestVersion.versionNumber }));
      } finally {
        await this.repo.releaseLock(def.uid, context.actorId, tx);
      }
    });
  }

  async rollback(context: RegistryContext, definitionUid: string, targetVersionNumber: number): Promise<void> {
    return this.executeTx(async (tx) => {
      const def = await this.repo.getDefinitionByUid(definitionUid);
      if (!def) throw new RegistryError("NOT_FOUND", "Definition not found");

      if (!this.permissionService.canRollback(context, def)) {
        throw new WorkflowViolationError("Permission denied: cannot rollback.");
      }

      const versions = await this.repo.listVersions(def.uid, tx);
      const targetVersion = versions.find((v: RegistryVersion) => v.versionNumber === targetVersionNumber);
      if (!targetVersion) throw new RegistryError("NOT_FOUND", "Target version not found for rollback");
      
      const latestVersionNumber = versions[0]?.versionNumber || 0;

      const newVersionUid = uuidv4();
      const payloadHash = ContentIntegrity.computePayloadHash(targetVersion.definition);
      
      const rollbackVersion: RegistryVersion = {
        uid: newVersionUid,
        definitionUid: def.uid,
        versionNumber: latestVersionNumber + 1,
        definition: targetVersion.definition,
        status: RegistryStatus.Published,
        payloadHash: payloadHash,
        createdAt: new Date()
      };

      await this.repo.createVersion(rollbackVersion, tx);
      await this.repo.updateCurrentVersion(def.uid, newVersionUid, rollbackVersion.versionNumber, tx);
      await this.repo.updateDefinitionStatus(def.uid, RegistryStatus.Published, tx);

      await this.repo.createAuditLog({
        uid: uuidv4(),
        definitionUid: def.uid,
        action: "rollback",
        performedBy: context.actorId,
        changes: { fromVersion: def.currentVersionUid, toVersion: newVersionUid }
      }, tx);

      await this.eventBus.publish(this.createEvent(context, "rollback", { definitionUid: def.uid, versionUid: rollbackVersion.uid, versionNumber: rollbackVersion.versionNumber }));
    });
  }

  async promote(context: RegistryContext, definitionUid: string, targetEnvironment: "development" | "staging" | "production", strategy: "STRICT_REJECTION" | "CASCADING_PROMOTION"): Promise<void> {
    return this.executeTx(async (tx) => {
      const sourceDef = await this.repo.getDefinitionByUid(definitionUid);
      if (!sourceDef) throw new RegistryError("NOT_FOUND", "Source definition not found");

      if (!this.permissionService.canPromote(context, sourceDef)) {
        throw new WorkflowViolationError("Permission denied: cannot promote.");
      }
    });
  }
}
