import { RegistryDefinition, RegistryVersion, RegistryDependency, RegistryStatus, RegistryType } from "@simis/registry-core";

export class RegistryMapper {
  static toDefinitionContract(prismaDef: any): RegistryDefinition {
    return {
      uid: prismaDef.uid,
      id: prismaDef.id,
      type: prismaDef.type as RegistryType,
      currentVersionUid: prismaDef.currentVersionUid,
      status: prismaDef.status as unknown as RegistryStatus,
      tenantId: prismaDef.tenantId || undefined,
      environment: prismaDef.environment as "development" | "staging" | "production",
      workspace: prismaDef.workspace || undefined,
    };
  }

  static toVersionContract(prismaVer: any): RegistryVersion {
    return {
      uid: prismaVer.uid,
      definitionUid: prismaVer.definitionUid,
      versionNumber: prismaVer.versionNumber,
      definition: typeof prismaVer.definition === 'string' ? JSON.parse(prismaVer.definition) : prismaVer.definition,
      status: prismaVer.status as RegistryVersion["status"],
      payloadHash: prismaVer.payloadHash,
      createdAt: prismaVer.createdAt,
    };
  }

  static toDependencyContract(prismaDep: any): RegistryDependency {
    return {
      uid: prismaDep.uid,
      definitionUid: prismaDep.definitionUid,
      dependsOnUid: prismaDep.dependsOnUid,
      dependencyMode: prismaDep.dependencyMode as any,
      dependencyType: prismaDep.dependencyType as any,
    };
  }
}
