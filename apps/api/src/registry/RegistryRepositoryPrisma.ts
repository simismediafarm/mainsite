// @ts-nocheck
import { RegistryRepository, RegistryDefinition, RegistryVersion, RegistryDependency, RegistryStatus, CreateRegistryParams, ResolveOptions, RegistryType } from "@simis/registry-core";
import { PrismaClient, Prisma } from "@simis/database";
import { RegistryMapper } from "./RegistryMapper";
import { v4 as uuidv4 } from "uuid";
import { ContentIntegrity } from "@simis/registry-core";

export class RegistryRepositoryPrisma implements RegistryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: any): Prisma.TransactionClient | PrismaClient {
    return tx || this.prisma;
  }

  async findById(uid: string): Promise<RegistryDefinition | null> {
    return this.getDefinitionByUid(uid);
  }

  async findByBusinessId(id: string, type: RegistryType, opts: ResolveOptions): Promise<RegistryDefinition | null> {
    return this.getDefinitionByTypeAndId(type, id, opts.environment, opts.tenantId, opts.workspace);
  }

  async create(params: CreateRegistryParams, tx?: any): Promise<{ definition: RegistryDefinition; version: RegistryVersion }> {
    const defUid = params.uid;
    const versionUid = uuidv4();
    
    const def: RegistryDefinition = {
      uid: defUid,
      id: params.id,
      type: params.type,
      currentVersionUid: versionUid,
      status: RegistryStatus.Draft,
      tenantId: params.tenantId,
      environment: params.environment,
      workspace: params.workspace
    };

    const payloadHash = ContentIntegrity.computePayloadHash(params.definition);
    
    const ver: RegistryVersion = {
      uid: versionUid,
      definitionUid: defUid,
      versionNumber: 1,
      definition: params.definition,
      status: RegistryStatus.Draft,
      payloadHash,
      createdAt: new Date()
    };

    await this.createDefinition(def, tx);
    await this.createVersion(ver, tx);

    return { definition: def, version: ver };
  }

  async update(uid: string, newDefinition: Record<string, any>, tx?: any): Promise<RegistryVersion> {
    const versions = await this.listVersions(uid, tx);
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

    await this.createVersion(ver, tx);
    await this.updateCurrentVersion(uid, versionUid, ver.versionNumber, tx);
    return ver;
  }

  async getVersion(versionUid: string): Promise<RegistryVersion | null> {
    const client = this.getClient();
    const v = await client.registryVersion.findUnique({ where: { uid: versionUid } });
    if (!v) return null;
    return RegistryMapper.toVersionContract(v);
  }

  async getDefinitionByUid(uid: string, tx?: any): Promise<RegistryDefinition | null> {
    const client = this.getClient(tx);
    const def = await client.registryDefinition.findUnique({ where: { uid } });
    if (!def) return null;
    return RegistryMapper.toDefinitionContract(def);
  }

  async getDefinitionByTypeAndId(type: string, id: string, env: string, tenantId?: string, workspace?: string, tx?: any): Promise<RegistryDefinition | null> {
    const client = this.getClient(tx);
    const def = await client.registryDefinition.findFirst({
      where: {
        type,
        id,
        environment: env,
        tenantId: tenantId || null,
        workspace: workspace || null,
      },
    });
    if (!def) return null;
    return RegistryMapper.toDefinitionContract(def);
  }

  async createDefinition(definition: RegistryDefinition, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryDefinition.create({
      data: {
        uid: definition.uid,
        id: definition.id,
        type: definition.type,
        currentVersionUid: definition.currentVersionUid,
        status: definition.status,
        environment: definition.environment,
        tenantId: definition.tenantId,
        workspace: definition.workspace,
      }
    });
  }

  async createVersion(version: RegistryVersion, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryVersion.create({
      data: {
        uid: version.uid,
        definitionUid: version.definitionUid,
        versionNumber: version.versionNumber,
        definition: version.definition,
        status: version.status,
        payloadHash: version.payloadHash,
        createdAt: version.createdAt,
      }
    });
  }

  async updateCurrentVersion(definitionUid: string, versionUid: string, versionNumber: number, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryDefinition.update({
      where: { uid: definitionUid },
      data: { 
        currentVersionUid: versionUid
      },
    });
  }

  async updateDefinitionStatus(defUid: string, status: RegistryStatus, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryDefinition.update({
      where: { uid: defUid },
      data: { status }
    });
  }

  async updateVersionStatus(versionUid: string, status: RegistryStatus, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryVersion.update({
      where: { uid: versionUid },
      data: { status }
    });
  }

  async createAuditLog(log: any, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryAuditLog.create({
      data: {
        uid: log.uid,
        definitionUid: log.definitionUid,
        action: log.action,
        performedBy: log.performedBy,
        changes: log.changes || {},
        performedAt: log.performedAt || new Date()
      }
    });
  }

  async acquireLock(resourceUid: string, owner: string, ttlMs: number): Promise<boolean> {
    const client = this.getClient();
    try {
      await client.registryLock.create({
        data: {
          resourceUid,
          lockType: "exclusive",
          strategy: "EXCLUSIVE",
          acquiredBy: owner,
          expiresAt: new Date(Date.now() + ttlMs)
        }
      });
      return true;
    } catch (e) {
      return false; // Unique constraint violation or other error => failed to lock
    }
  }

  async releaseLock(resourceUid: string, acquiredBy: string, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryLock.deleteMany({
      where: {
        resourceUid,
        acquiredBy
      }
    });
  }

  async renewLock(lockUid: string, additionalDurationMs: number, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    const existing = await client.registryLock.findUnique({ where: { uid: lockUid } });
    if (existing) {
      await client.registryLock.update({
        where: { uid: lockUid },
        data: { expiresAt: new Date(Date.now() + additionalDurationMs) }
      });
    }
  }

  async listDependencies(definitionUid: string, tx?: any): Promise<RegistryDependency[]> {
    const client = this.getClient(tx);
    const deps = await client.registryDependency.findMany({
      where: { definitionUid }
    });
    return deps.map(RegistryMapper.toDependencyContract);
  }

  async listVersions(definitionUid: string, tx?: any): Promise<RegistryVersion[]> {
    const client = this.getClient(tx);
    const versions = await client.registryVersion.findMany({
      where: { definitionUid },
      orderBy: { versionNumber: 'desc' }
    });
    return versions.map(RegistryMapper.toVersionContract);
  }

  async addDependency(ownerUid: string, dependsOnUid: string, type: string, mode: string, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    await client.registryDependency.create({
      data: {
        definitionUid: ownerUid,
        dependsOnUid,
        dependencyType: type,
        dependencyMode: mode,
      }
    });
  }

  async listDefinitions(type: string, environment: string, tenantId?: string, workspace?: string, tx?: any): Promise<RegistryDefinition[]> {
    const client = this.getClient(tx);
    const definitions = await client.registryDefinition.findMany({
      where: {
        type,
        environment,
        tenantId: tenantId || null,
        workspace: workspace || null,
      }
    });
    return definitions.map(RegistryMapper.toDefinitionContract);
  }

  // Phase 8: Audit Persistence for CDN Receipts
  async saveCDNPropagationReceipt(receipt: any, tx?: any): Promise<void> {
    const client = this.getClient(tx);
    // We store it purely as an audit trail snapshot.
    await client.registryAuditLog.create({
      data: {
        uid: uuidv4(),
        definitionUid: receipt.themeUid || "00000000-0000-0000-0000-000000000000",
        action: "CDN_PROPAGATION_RECEIPT",
        performedBy: "system",
        performedAt: new Date(),
        changes: receipt,
      }
    });
  }
}
