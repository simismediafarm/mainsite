import { RegistryDefinition, RegistryVersion, RegistryStatus } from "@simis/registry-core";
import { createHash } from "node:crypto";
import { CompilerInput } from "./CompilerContracts";

export class CompilerMapper {
  private static hashToUuid(hash: string): string {
    // Standard Postgres UUID format: 8-4-4-4-12 (32 hex chars)
    const cleaned = hash.replace(/[^a-f0-9]/gi, "").toLowerCase();
    if (cleaned.length < 32) {
      throw new Error("Hash is too short to convert to UUID");
    }
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20, 32)}`;
  }

  static createDeterministicVersionUid(dependencyFingerprint: string, compilerVersion: string, payloadHash: string): string {
    const rawHash = createHash("sha256")
      .update(dependencyFingerprint + compilerVersion + payloadHash)
      .digest("hex");
    return this.hashToUuid(rawHash);
  }

  static createConstantDefinitionUid(themeUid: string): string {
    const rawHash = createHash("sha256")
      .update(themeUid + "-compiled-artifact")
      .digest("hex");
    return this.hashToUuid(rawHash);
  }

  static toRegistryEntities(
    themeUid: string,
    themeId: string,
    artifactPayload: Record<string, any>,
    input: CompilerInput,
    environment: "development" | "staging" | "production",
    latestVersionNumber: number,
    tenantId?: string,
    workspace?: string
  ): { definition: RegistryDefinition; version: RegistryVersion } {
    const payloadHash = createHash("sha256")
      .update(JSON.stringify(artifactPayload))
      .digest("hex");

    const definitionUid = this.createConstantDefinitionUid(themeUid);
    const versionUid = this.createDeterministicVersionUid(input.dependencyFingerprint, input.compilerVersion, payloadHash);

    const definition: RegistryDefinition = {
      uid: definitionUid,
      id: `compiled-artifact-${themeId}`,
      type: "design-system" as const,
      currentVersionUid: versionUid,
      status: RegistryStatus.Published,
      environment,
      tenantId,
      workspace,
    };

    const version: RegistryVersion = {
      uid: versionUid,
      definitionUid: definitionUid,
      versionNumber: latestVersionNumber + 1,
      status: "published",
      payloadHash,
      definition: artifactPayload,
      createdAt: new Date(),
    };

    return { definition, version };
  }
}
