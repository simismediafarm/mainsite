import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryService } from './RegistryService';
import { 
  RegistryContext, 
  RegistryDefinition, 
  RegistryVersion, 
  RegistryDependency, 
  RegistryStatus, 
  RegistryEvent,
  TransactionBoundary,
  RegistryRepository,
  RegistryPermissionService,
  IntegrityEngine,
  CycleDetectedError,
  TenantBoundaryViolationError,
  PayloadIntegrityError,
  LockAcquisitionError,
  RegistryError
} from '@simis/registry-core';
import { v4 as uuidv4 } from 'uuid';

// Fakes
class FakeRegistryRepository implements RegistryRepository {
  public definitions: RegistryDefinition[] = [];
  public versions: RegistryVersion[] = [];
  public dependencies: RegistryDependency[] = [];
  public locks: Set<string> = new Set();
  public auditLogs: any[] = [];

  async getDefinitionByUid(uid: string): Promise<RegistryDefinition | null> {
    return this.definitions.find(d => d.uid === uid) || null;
  }
  async getDefinitionByTypeAndId(type: string, id: string, env: string, tenantId?: string, workspace?: string): Promise<RegistryDefinition | null> {
    return this.definitions.find(d => d.type === type && d.id === id && d.environment === env && d.tenantId === tenantId) || null;
  }
  async createDefinition(def: RegistryDefinition): Promise<void> {
    this.definitions.push({ ...def });
  }
  async createVersion(ver: RegistryVersion, tx?: any): Promise<void> {
    this.versions.push(ver);
  }
  async updateCurrentVersion(defUid: string, versionUid: string, versionNumber: number, tx?: any): Promise<void> {
    const def = this.definitions.find(d => d.uid === defUid);
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
    return this.dependencies.filter(d => d.definitionUid === defUid);
  }
  async listVersions(defUid: string): Promise<RegistryVersion[]> {
    return this.versions.filter(v => v.definitionUid === defUid).sort((a, b) => b.versionNumber - a.versionNumber);
  }
  async getVersion(verUid: string): Promise<RegistryVersion | null> {
    return this.versions.find(v => v.uid === verUid) || null;
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
  async saveCDNPropagationReceipt() {}
  async findByBusinessId() { return null; }
  async create() { return {} as any; }
  async update() { return {} as any; }
  async updateDefinitionStatus(uid: string, status: RegistryStatus, tx?: any): Promise<void> {
    const def = this.definitions.find(d => d.uid === uid);
    if (def) def.status = status;
  }
  async updateVersionStatus(uid: string, status: RegistryStatus, tx?: any): Promise<void> {
    const ver = this.versions.find(v => v.uid === uid);
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
    return op({}); // pass dummy tx
  }
}

class FakeEventBus {
  public events: RegistryEvent[] = [];
  async publish(event: RegistryEvent) {
    this.events.push(event);
  }
}

describe('RegistryService Business Logic Tests', () => {
  let repo: FakeRegistryRepository;
  let txBoundary: FakeTransactionBoundary;
  let eventBus: FakeEventBus;
  let permissionService: RegistryPermissionService;
  let integrityEngine: IntegrityEngine;
  let service: RegistryService;
  
  const ctx: RegistryContext = {
    actorId: 'user-1',
    environment: 'development',
    correlationId: 'req-1',
    tenantId: 'tenant-a'
  };

  beforeEach(() => {
    repo = new FakeRegistryRepository();
    txBoundary = new FakeTransactionBoundary();
    eventBus = new FakeEventBus();
    permissionService = new RegistryPermissionService();
    // Stub integrityEngine temporarily to isolate service logic unless testing it
    integrityEngine = {
      runPrePublishChecks: vi.fn().mockResolvedValue(undefined)
    } as unknown as IntegrityEngine;

    service = new RegistryService(repo, txBoundary, eventBus, integrityEngine, permissionService);
  });

  describe('Group A - Publish Workflow', () => {
    it('should successfully create draft, review, and publish', async () => {
      // 1. Create Draft
      const draft = await service.createDraft(ctx, 'component', 'hero-v1', { title: 'Hero' });
      expect(draft.status).toBe(RegistryStatus.Draft);
      expect(repo.definitions.length).toBe(1);
      expect(repo.versions.length).toBe(1);
      expect(eventBus.events.some(e => e.type === 'created')).toBe(true);

      // 2. Submit Review
      await service.submitReview(ctx, draft.uid);
      const afterReview = await repo.getDefinitionByUid(draft.uid);
      expect(afterReview?.status).toBe(RegistryStatus.Review);

      // 3. Publish
      await service.publish(ctx, draft.uid);
      const publishedDef = await repo.getDefinitionByUid(draft.uid);
      const publishedVer = repo.versions.find(v => v.uid === publishedDef?.currentVersionUid) as any;
      
      expect(publishedDef?.status).toBe(RegistryStatus.Published);
      expect(publishedVer?.status).toBe(RegistryStatus.Published);
      expect(publishedVer?.payloadHash).toBeDefined();
      expect(repo.auditLogs.some(l => l.action === 'publish')).toBe(true);
      expect(eventBus.events.some(e => e.type === 'published')).toBe(true);
      expect(repo.locks.size).toBe(0); // Lock released
    });
  });

  describe('Group B - Rollback Workflow', () => {
    it('should rollback by creating a new version pointing to the old payload', async () => {
      // Setup v1, v2
      const def = await service.createDraft(ctx, 'page', 'home', { v: 1 });
      await service.publish(ctx, def.uid);

      // Manually add v2
      const v2Uid = uuidv4();
      await repo.createVersion({ uid: v2Uid, definitionUid: def.uid, versionNumber: 2, definition: { v: 2 }, createdAt: new Date(), status: RegistryStatus.Published, payloadHash: 'hash2' });
      await repo.updateCurrentVersion(def.uid, v2Uid, 2);

      // Now rollback to v1
      await service.rollback(ctx, def.uid, 1);

      const updatedDef = await repo.getDefinitionByUid(def.uid);
      const newVersion = repo.versions.find(v => v.uid === updatedDef?.currentVersionUid);
      
      // Expected v3 created, payload == v1, v3 != v1
      expect(newVersion?.versionNumber).toBe(3);
      expect(newVersion?.definition).toEqual({ v: 1 });
      expect(newVersion?.uid).not.toBe(repo.versions[0].uid); // Not v1's uid
    });
  });

  describe('Group F - Locking', () => {
    it('should reject simultaneous publish requests', async () => {
      const draft = await service.createDraft(ctx, 'schema', 'user', { f: 'b' });
      await service.submitReview(ctx, draft.uid);

      // Simulate lock held by another process
      repo.locks.add(draft.uid);

      await expect(service.publish(ctx, draft.uid)).rejects.toThrow(LockAcquisitionError);
    });
  });

  // Group C, D, E require the real IntegrityEngine
  describe('Integrity Engine Integration (Groups C, D, E)', () => {
    beforeEach(() => {
      // Use real IntegrityEngine for these tests
      integrityEngine = new IntegrityEngine(repo as any);
      service = new RegistryService(repo, txBoundary, eventBus, integrityEngine, permissionService);
    });

    it('Group C - Hard dependency missing', async () => {
      const page = await service.createDraft(ctx, 'page', 'p1', {});
      await repo.addDependency(page.uid, 'non-existent-uid', 'hard', 'floating');

      await expect(service.publish(ctx, page.uid)).rejects.toThrow();
    });

    it('Group C - Cycle detection', async () => {
      const a = await service.createDraft(ctx, 'component', 'A', {});
      const b = await service.createDraft(ctx, 'component', 'B', {});
      const c = await service.createDraft(ctx, 'component', 'C', {});

      await repo.addDependency(a.uid, b.uid, 'hard', 'floating');
      await repo.addDependency(b.uid, c.uid, 'hard', 'floating');
      await repo.addDependency(c.uid, a.uid, 'hard', 'floating');

      // Mock listDependencies to return the full graph for the sake of the engine test
      const originalList = repo.listDependencies.bind(repo);
      repo.listDependencies = async () => repo.dependencies;

      await expect(service.publish(ctx, a.uid)).rejects.toThrow();

      // Restore
      repo.listDependencies = originalList;
    });

    it('Group D - Tenant Isolation', async () => {
      const tenantA = await service.createDraft(ctx, 'page', 'pa', {});
      
      const ctxB = { ...ctx, tenantId: 'tenant-b' };
      const tenantB = await service.createDraft(ctxB, 'component', 'cb', {});

      await repo.addDependency(tenantA.uid, tenantB.uid, 'hard', 'floating');

      await expect(service.publish(ctx, tenantA.uid)).rejects.toThrow(/Cross-tenant dependency forbidden/);
    });
  });
});
