import { describe, it, expect } from "vitest";
import { DesignSystemCompiler } from "./DesignSystemCompiler";
import { RegistryVersion } from "@simis/registry-core";
import { CompilerInput } from "./CompilerContracts";

describe("Phase 5.5: Promotion/Rollback Stress Certification", () => {
  it("should maintain consistent artifact signatures across 100x rollback/promote loop", () => {
    
    // Setup base dependencies
    const tokenVersionV1 = {
      uid: "tv-1",
      definitionUid: "td-1",
      definition: {
        subtype: "token-set",
        tokens: { "color.primary": "red" }
      }
    } as unknown as RegistryVersion;
    
    const tokenVersionV2 = {
      uid: "tv-2",
      definitionUid: "td-1",
      definition: {
        subtype: "token-set",
        tokens: { "color.primary": "blue" }
      }
    } as unknown as RegistryVersion;

    const themeVersion = {
      uid: "thm-v-1",
      definitionUid: "thm-d-1",
      definition: {
        subtype: "theme",
        semantics: { "button.bg": "color.primary" }
      }
    } as unknown as RegistryVersion;
    
    const componentVersion = {
      uid: "comp-v-1",
      definitionUid: "comp-d-1",
      definition: {
        subtype: "component-style",
        componentId: "Button",
        variants: {
          primary: {
            backgroundColor: "button.bg"
          }
        }
      }
    } as unknown as RegistryVersion;

    const baseInputV1: CompilerInput = {
      compiledFromBundleHash: "bundle-hash-v1",
      compiledAt: "2026-06-05T00:00:00Z",
      compiledBy: "ci",
      compilerVersion: "1.0.0",
      compilerHash: "comp-hash",
      dependencyFingerprint: "fingerprint-v1",
      sourceManifest: {
        themeVersionUid: "thm-v-1",
        tokenVersionUids: ["tv-1"],
        componentStyleVersionUids: ["comp-v-1"],
        iconVersionUids: [],
        motionVersionUids: []
      }
    };
    
    const baseInputV2: CompilerInput = {
      compiledFromBundleHash: "bundle-hash-v2",
      compiledAt: "2026-06-05T01:00:00Z",
      compiledBy: "ci",
      compilerVersion: "1.0.0",
      compilerHash: "comp-hash",
      dependencyFingerprint: "fingerprint-v2",
      sourceManifest: {
        themeVersionUid: "thm-v-1",
        tokenVersionUids: ["tv-2"],
        componentStyleVersionUids: ["comp-v-1"],
        iconVersionUids: [],
        motionVersionUids: []
      }
    };

    // Initial compilations
    const outV1 = DesignSystemCompiler.compile(baseInputV1, [themeVersion, tokenVersionV1, componentVersion], "production");
    const outV2 = DesignSystemCompiler.compile(baseInputV2, [themeVersion, tokenVersionV2, componentVersion], "production");
    
    const sigV1 = outV1.artifactPayload.provenance.artifactSignature;
    const sigV2 = outV2.artifactPayload.provenance.artifactSignature;
    
    expect(sigV1).not.toBe(sigV2);
    expect(outV1.artifactPayload.cssVariables["--simis-button-bg"]).toBe("red");
    expect(outV2.artifactPayload.cssVariables["--simis-button-bg"]).toBe("blue");

    // 100x Loop
    for (let i = 0; i < 100; i++) {
      // Rollback to V1
      const loopV1 = DesignSystemCompiler.compile(baseInputV1, [themeVersion, tokenVersionV1, componentVersion], "production");
      expect(loopV1.artifactPayload.provenance.artifactSignature).toBe(sigV1);
      expect(loopV1.artifactPayload.provenance.dependencyFingerprint).toBe("fingerprint-v1");
      expect(loopV1.artifactPayload.cssVariables["--simis-button-bg"]).toBe("red");
      
      // Promote to V2
      const loopV2 = DesignSystemCompiler.compile(baseInputV2, [themeVersion, tokenVersionV2, componentVersion], "production");
      expect(loopV2.artifactPayload.provenance.artifactSignature).toBe(sigV2);
      expect(loopV2.artifactPayload.provenance.dependencyFingerprint).toBe("fingerprint-v2");
      expect(loopV2.artifactPayload.cssVariables["--simis-button-bg"]).toBe("blue");
    }
  });
});
