export interface ArtifactCompatibilityPolicy {
  minimumSupportedVersion: number;
  maximumSupportedVersion: number;
}

export class SchemaMismatchError extends Error {
  constructor(public version: number, public policy: ArtifactCompatibilityPolicy) {
    super(`Unsupported artifact schema version: v${version}. Supported range: v${policy.minimumSupportedVersion} - v${policy.maximumSupportedVersion}`);
    this.name = "SchemaMismatchError";
  }
}

export class ArtifactValidator {
  constructor(private readonly policy: ArtifactCompatibilityPolicy) {}

  public validateSchemaVersion(version: number): void {
    if (version < this.policy.minimumSupportedVersion || version > this.policy.maximumSupportedVersion) {
      throw new SchemaMismatchError(version, this.policy);
    }
  }
}

export const COMPATIBILITY_POLICY: ArtifactCompatibilityPolicy = {
  minimumSupportedVersion: 1,
  maximumSupportedVersion: 1, // Will evolve to 2, 3 in future phases
};

export const defaultArtifactValidator = new ArtifactValidator(COMPATIBILITY_POLICY);
