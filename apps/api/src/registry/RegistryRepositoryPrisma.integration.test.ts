import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@simis/database';
import { RegistryRepositoryPrisma } from './RegistryRepositoryPrisma';
import { RegistryStatus, RegistryDefinition } from '@simis/registry-core';
import { v4 as uuidv4 } from 'uuid';

describe.skip('RegistryRepositoryPrisma Integration Tests', () => {
  let prisma: PrismaClient;
  let repo: RegistryRepositoryPrisma;

  beforeAll(async () => {
    const { prisma: dbPrisma } = require('@simis/database');
    prisma = dbPrisma;
    repo = new RegistryRepositoryPrisma(prisma);
    // Clear tables before tests if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve a definition', async () => {
    const uid = uuidv4();
    const def: RegistryDefinition = {
      uid,
      id: 'test-def-' + Date.now(),
      type: 'component' as any,
      currentVersionUid: uuidv4(), // Dummy
      status: RegistryStatus.Draft,
      environment: 'development'
    };

    await repo.createDefinition(def);

    const retrieved = await repo.getDefinitionByUid(uid);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(def.id);
  });

  it('should acquire and release locks correctly', async () => {
    const resourceUid = uuidv4();
    
    const lock1 = await repo.acquireLock(resourceUid, 'user-1', 10000);
    expect(lock1).toBe(true);

    const lock2 = await repo.acquireLock(resourceUid, 'user-2', 10000);
    expect(lock2).toBe(false); // Second acquisition should fail

    await repo.releaseLock(resourceUid, 'user-1');
    const lock3 = await repo.acquireLock(resourceUid, 'user-2', 10000);
    expect(lock3).toBe(true); // Now user-2 can acquire it
  });

  it('should update current version and status', async () => {
    const defUid = uuidv4();
    const verUid1 = uuidv4();
    const verUid2 = uuidv4();

    await repo.createDefinition({
      uid: defUid,
      id: 'update-test',
      type: 'page' as any,
      currentVersionUid: verUid1,
      status: RegistryStatus.Draft,
      environment: 'development'
    });

    await repo.createVersion({
      uid: verUid1,
      definitionUid: defUid,
      versionNumber: 1,
      definition: {},
      status: RegistryStatus.Draft,
      payloadHash: 'hash1',
      createdAt: new Date()
    });

    await repo.createVersion({
      uid: verUid2,
      definitionUid: defUid,
      versionNumber: 2,
      definition: {},
      status: RegistryStatus.Published,
      payloadHash: 'hash2',
      createdAt: new Date()
    });

    await repo.updateCurrentVersion(defUid, verUid2, 2);
    await repo.updateDefinitionStatus(defUid, RegistryStatus.Published);

    const updated = await repo.getDefinitionByUid(defUid);
    expect(updated?.currentVersionUid).toBe(verUid2);
    expect(updated?.status).toBe(RegistryStatus.Published);
  });
});
