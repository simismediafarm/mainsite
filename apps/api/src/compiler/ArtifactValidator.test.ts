import { describe, it, expect } from "vitest";
import { ArtifactValidator, SchemaMismatchError } from "./ArtifactValidator";

describe("Artifact Schema Validation Layer", () => {
  it("should validate an artifact version within supported bounds", () => {
    const validator = new ArtifactValidator({ minimumSupportedVersion: 1, maximumSupportedVersion: 2 });
    
    expect(() => validator.validateSchemaVersion(1)).not.toThrow();
    expect(() => validator.validateSchemaVersion(2)).not.toThrow();
  });

  it("should reject an artifact version that is too old", () => {
    const validator = new ArtifactValidator({ minimumSupportedVersion: 2, maximumSupportedVersion: 3 });
    
    expect(() => validator.validateSchemaVersion(1)).toThrow(SchemaMismatchError);
    try {
      validator.validateSchemaVersion(1);
    } catch (e) {
      expect((e as SchemaMismatchError).version).toBe(1);
      expect((e as SchemaMismatchError).policy.minimumSupportedVersion).toBe(2);
    }
  });

  it("should reject an artifact version from the future", () => {
    const validator = new ArtifactValidator({ minimumSupportedVersion: 1, maximumSupportedVersion: 1 });
    
    expect(() => validator.validateSchemaVersion(2)).toThrow(SchemaMismatchError);
  });
});
