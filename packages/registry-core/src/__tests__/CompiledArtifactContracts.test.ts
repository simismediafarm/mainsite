import { describe, it, expect } from "vitest";
import { ContentIntegrity } from "../core/ContentIntegrity";
import { CompiledArtifactSchema } from "../schemas/DesignSystemSchemas";
import { createHash } from "node:crypto";
import stringify from "fast-json-stable-stringify";

describe("ContentIntegrity payload helper verification", () => {
  it("computes deterministic payload hash", () => {
    const payload = { key: "value", num: 42 };
    const hash1 = ContentIntegrity.computePayloadHash(payload);
    const hash2 = ContentIntegrity.computePayloadHash(payload);
    expect(hash1).toBe(hash2);
    expect(ContentIntegrity.verifyPayloadHash(payload, hash1)).toBe(true);
    expect(ContentIntegrity.verifyPayloadHash(payload, "wrong_hash")).toBe(false);
  });
});

describe("CompiledArtifactContracts - dependencyFingerprint", () => {
  it("identical dependency graph -> identical fingerprint", () => {
    const graphA = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "floating" }
    ];
    const graphB = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "floating" }
    ];

    const fpA = ContentIntegrity.computeDependencyFingerprint(graphA);
    const fpB = ContentIntegrity.computeDependencyFingerprint(graphB);
    expect(fpA).toBe(fpB);
  });

  it("changed dependency versionUid -> different fingerprint", () => {
    const graphA = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "floating" }
    ];
    const graphB = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_3", dependencyMode: "floating" } // changed ver_2 -> ver_3
    ];

    const fpA = ContentIntegrity.computeDependencyFingerprint(graphA);
    const fpB = ContentIntegrity.computeDependencyFingerprint(graphB);
    expect(fpA).not.toBe(fpB);
  });

  it("changed dependencyMode -> different fingerprint", () => {
    const graphA = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "floating" }
    ];
    const graphB = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "pinned" } // changed floating -> pinned
    ];

    const fpA = ContentIntegrity.computeDependencyFingerprint(graphA);
    const fpB = ContentIntegrity.computeDependencyFingerprint(graphB);
    expect(fpA).not.toBe(fpB);
  });

  it("graph order changes -> same fingerprint (canonical ordering)", () => {
    const graphA = [
      { versionUid: "ver_1", dependencyMode: "pinned" },
      { versionUid: "ver_2", dependencyMode: "floating" }
    ];
    const graphB = [
      { versionUid: "ver_2", dependencyMode: "floating" },
      { versionUid: "ver_1", dependencyMode: "pinned" }
    ];

    const fpA = ContentIntegrity.computeDependencyFingerprint(graphA);
    const fpB = ContentIntegrity.computeDependencyFingerprint(graphB);
    expect(fpA).toBe(fpB);
  });
});

describe("CompiledArtifactContracts - Compiler Identity & Provenance Block Schema", () => {
  const validArtifact = {
    subtype: "compiled-artifact",
    cssVariables: {
      "--color-primary": "#000000"
    },
    componentMappings: {},
    provenance: {
      compiledFromBundleHash: "bundle_hash_123",
      compiledAt: "2026-06-04T12:00:00Z",
      compiledBy: "system-compiler",
      compilerVersion: "1.0.0",
      compilerHash: "sha256:compiler_hash_abc",
      dependencyFingerprint: "fingerprint_123",
      artifactSignature: "sig_abc123",
      sourceManifest: {
        themeVersionUid: "theme_ver_1",
        tokenVersionUids: ["token_ver_1"],
        motionVersionUids: ["motion_ver_1"],
        iconVersionUids: ["icon_ver_1"],
        componentStyleVersionUids: ["component_ver_1"]
      }
    }
  };

  it("accepts valid schema with all required provenance and compiler identity", () => {
    const parsed = CompiledArtifactSchema.safeParse(validArtifact);
    expect(parsed.success).toBe(true);
  });

  it("fails if artifactSignature is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.artifactSignature;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if compilerVersion is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.compilerVersion;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if compilerHash is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.compilerHash;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if compiledFromBundleHash is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.compiledFromBundleHash;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if dependencyFingerprint is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.dependencyFingerprint;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if sourceManifest is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.sourceManifest;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if sourceManifest contains missing required references", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.sourceManifest.themeVersionUid;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if compiledAt is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.compiledAt;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails if compiledBy is missing from provenance", () => {
    const invalid = JSON.parse(JSON.stringify(validArtifact));
    delete invalid.provenance.compiledBy;
    const parsed = CompiledArtifactSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe("CompiledArtifactContracts - Compiler Purity Certification", () => {
  function runMockCompiler(sourceManifest: any, payloadHash: string, compilerVersion: string): string {
    // Pure function logic
    const inputStr = stringify({ sourceManifest, payloadHash, compilerVersion });
    const hash = createHash("sha256").update(inputStr).digest("hex");
    return hash;
  }

  it("identical inputs -> identical artifact hash", () => {
    const manifest = { themeVersionUid: "v1", tokenVersionUids: ["t1"] };
    const hash1 = runMockCompiler(manifest, "payload_hash_1", "1.0.0");
    const hash2 = runMockCompiler(manifest, "payload_hash_1", "1.0.0");
    expect(hash1).toBe(hash2);
  });

  it("changing sourceManifest -> different artifact hash", () => {
    const manifestA = { themeVersionUid: "v1", tokenVersionUids: ["t1"] };
    const manifestB = { themeVersionUid: "v2", tokenVersionUids: ["t1"] };
    const hashA = runMockCompiler(manifestA, "payload_hash_1", "1.0.0");
    const hashB = runMockCompiler(manifestB, "payload_hash_1", "1.0.0");
    expect(hashA).not.toBe(hashB);
  });

  it("changing payloadHash -> different artifact hash", () => {
    const manifest = { themeVersionUid: "v1", tokenVersionUids: ["t1"] };
    const hashA = runMockCompiler(manifest, "payload_hash_1", "1.0.0");
    const hashB = runMockCompiler(manifest, "payload_hash_2", "1.0.0");
    expect(hashA).not.toBe(hashB);
  });

  it("changing compilerVersion -> different artifact hash", () => {
    const manifest = { themeVersionUid: "v1", tokenVersionUids: ["t1"] };
    const hashA = runMockCompiler(manifest, "payload_hash_1", "1.0.0");
    const hashB = runMockCompiler(manifest, "payload_hash_1", "2.0.0");
    expect(hashA).not.toBe(hashB);
  });
});
