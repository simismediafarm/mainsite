import { RegistryDefinition, RegistryVersion, RegistryDependency, ResolveOptions, RegistryType, RegistryStatus } from "../contracts";

export interface CreateRegistryParams {
  uid: string;
  id: string;
  type: RegistryType;
  environment: "development" | "staging" | "production";
  tenantId?: string;
  workspace?: string;
  definition: Record<string, any>;
}

export interface RegistryRepository {
  // Original methods
  findById(uid: string): Promise<RegistryDefinition | null>;
  findByBusinessId(id: string, type: RegistryType, opts: ResolveOptions): Promise<RegistryDefinition | null>;
  create(params: CreateRegistryParams, tx?: any): Promise<{ definition: RegistryDefinition; version: RegistryVersion }>;
  update(uid: string, newDefinition: Record<string, any>, tx?: any): Promise<RegistryVersion>;
  getVersion(versionUid: string): Promise<RegistryVersion | null>;
  addDependency(ownerUid: string, dependsOnUid: string, type: string, mode: string, tx?: any): Promise<void>;
  renewLock(lockUid: string, additionalDurationMs: number): Promise<void>;

  // Methods added for RegistryService in apps/api
  getDefinitionByUid(uid: string): Promise<RegistryDefinition | null>;
  getDefinitionByTypeAndId(type: string, id: string, env: string, tenantId?: string, workspace?: string): Promise<RegistryDefinition | null>;
  createDefinition(def: RegistryDefinition, tx?: any): Promise<void>;
  createVersion(ver: RegistryVersion, tx?: any): Promise<void>;
  updateCurrentVersion(defUid: string, versionUid: string, versionNumber: number, tx?: any): Promise<void>;
  updateDefinitionStatus(defUid: string, status: RegistryStatus, tx?: any): Promise<void>;
  updateVersionStatus(versionUid: string, status: RegistryStatus, tx?: any): Promise<void>;
  
  acquireLock(resourceUid: string, owner: string, ttlMs: number): Promise<boolean>;
  releaseLock(resourceUid: string, acquiredBy: string, tx?: any): Promise<void>;
  
  listDependencies(defUid: string, tx?: any): Promise<RegistryDependency[]>;
  listVersions(defUid: string, tx?: any): Promise<RegistryVersion[]>;
  listDefinitions(type: string, environment: string, tenantId?: string, workspace?: string, tx?: any): Promise<RegistryDefinition[]>;
  createAuditLog(log: any, tx?: any): Promise<void>;
  
  // Phase 8: Audit Persistence for CDN Receipts
  saveCDNPropagationReceipt(receipt: any, tx?: any): Promise<void>;
}
