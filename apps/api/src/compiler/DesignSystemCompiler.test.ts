import { describe, it, expect } from "vitest";
import { DesignSystemCompiler } from "./DesignSystemCompiler";
import { CompilerInput } from "./CompilerContracts";
import { RegistryVersion, RegistryStatus } from "@simis/registry-core";
import { SemanticDepthViolationError, MissingPrimitiveTokenError } from "./CompilerErrors";

describe("DesignSystemCompiler - Unit Tests", () => {
  // Shared inputs for setup
  const tokenVersion: RegistryVersion = {
    uid: "ver_tokens_1",
    definitionUid: "tokens_def",
    versionNumber: 1,
    status: "published",
    payloadHash: "hash_tok",
    definition: {
      subtype: "token-set",
      tokenLevel: "primitive",
      tokens: {
        "colors.blue.500": "#2563eb",
        "colors.red.500": "#ef4444",
        "spacing.medium": "16px",
      },
    },
    createdAt: new Date(),
  };

  const themeVersion: RegistryVersion = {
    uid: "ver_theme_1",
    definitionUid: "theme_def",
    versionNumber: 1,
    status: "published",
    payloadHash: "hash_thm",
    definition: {
      subtype: "theme",
      tokenLevel: "semantic",
      semantics: {
        "button.primary.background": "colors.blue.500",
        "button.danger.background": "colors.red.500",
        "padding.body": "spacing.medium",
      },
    },
    createdAt: new Date(),
  };

  const componentStyleVersion: RegistryVersion = {
    uid: "ver_comp_1",
    definitionUid: "comp_def",
    versionNumber: 1,
    status: "published",
    payloadHash: "hash_cmp",
    definition: {
      subtype: "component-style",
      componentId: "button",
      variants: {
        primary: {
          background: "button.primary.background",
          padding: "padding.body",
        },
        danger: {
          background: "button.danger.background",
        },
      },
    },
    createdAt: new Date(),
  };

  const baseInput: CompilerInput = {
    sourceManifest: {
      themeVersionUid: "ver_theme_1",
      tokenVersionUids: ["ver_tokens_1"],
      motionVersionUids: [],
      iconVersionUids: [],
      componentStyleVersionUids: ["ver_comp_1"],
    },
    compilerVersion: "1.0.0",
    compilerHash: "sha256:mock_compiler_hash",
    dependencyFingerprint: "fingerprint_v1",
    compiledBy: "system-compiler",
    compiledAt: "2026-06-04T12:00:00Z",
  };

  it("1. compile primitive token set and 2. compile semantic theme and 3. compile component style", () => {
    const result = DesignSystemCompiler.compile(
      baseInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    // Verify Output format matches CompiledArtifactSchema
    expect(result.artifactPayload.subtype).toBe("compiled-artifact");
    expect(result.artifactPayload.cssVariables["--simis-colors-blue-500"]).toBe("#2563eb");
    expect(result.artifactPayload.cssVariables["--simis-button-primary-background"]).toBe("#2563eb");
    expect(result.artifactPayload.cssVariables["--simis-padding-body"]).toBe("16px");

    // Component style references are mapped to var(--simis-name)
    expect(result.artifactPayload.componentMappings.button.primary.background).toBe("var(--simis-button-primary-background)");
    expect(result.artifactPayload.componentMappings.button.primary.padding).toBe("var(--simis-padding-body)");

    // Provenance block is generated correctly
    expect(result.artifactPayload.provenance.compilerVersion).toBe("1.0.0");
    expect(result.artifactPayload.provenance.dependencyFingerprint).toBe("fingerprint_v1");
    expect(result.artifactPayload.provenance.sourceManifest.themeVersionUid).toBe("ver_theme_1");
  });

  it("4. compile bundle manifest", () => {
    // A bundle manifest compilation is simply compiling with a specified compiledFromBundleHash
    const bundleInput = {
      ...baseInput,
      compiledFromBundleHash: "bundle_manifest_hash_abc",
    };

    const result = DesignSystemCompiler.compile(
      bundleInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    expect(result.artifactPayload.provenance.compiledFromBundleHash).toBe("bundle_manifest_hash_abc");
    expect(result.definition.id).toBe("compiled-artifact-theme_def");
  });

  it("5. reject semantic chaining (semantic -> semantic -> primitive)", () => {
    const invalidThemeVersion: RegistryVersion = {
      uid: "ver_theme_invalid",
      definitionUid: "theme_def",
      versionNumber: 1,
      status: "published",
      payloadHash: "hash_thm",
      definition: {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {
          "button.primary.background": "colors.blue.500",
          "button.submit.background": "button.primary.background", // Chaining button.submit -> button.primary -> colors.blue.500
        },
      },
      createdAt: new Date(),
    };

    expect(() => {
      DesignSystemCompiler.compile(
        baseInput,
        [invalidThemeVersion, tokenVersion, componentStyleVersion],
        "development"
      );
    }).toThrow(SemanticDepthViolationError);
  });

  it("6. reject missing primitive token", () => {
    const invalidThemeVersion: RegistryVersion = {
      uid: "ver_theme_invalid",
      definitionUid: "theme_def",
      versionNumber: 1,
      status: "published",
      payloadHash: "hash_thm",
      definition: {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {
          "button.primary.background": "colors.nonexistent.500", // References undefined token
        },
      },
      createdAt: new Date(),
    };

    expect(() => {
      DesignSystemCompiler.compile(
        baseInput,
        [invalidThemeVersion, tokenVersion, componentStyleVersion],
        "development"
      );
    }).toThrow(MissingPrimitiveTokenError);
  });

  it("7. deterministic artifact generation", () => {
    const result1 = DesignSystemCompiler.compile(
      baseInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    const result2 = DesignSystemCompiler.compile(
      baseInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    // Deterministic UIDs & Payload hashes
    expect(result1.definition.uid).toBe(result2.definition.uid);
    expect(result1.version.uid).toBe(result2.version.uid);
    expect(result1.version.payloadHash).toBe(result2.version.payloadHash);
  });

  it("8. immutable artifact generation (does not mutate inputs)", () => {
    const themeSnapshot = JSON.stringify(themeVersion);
    const tokenSnapshot = JSON.stringify(tokenVersion);

    DesignSystemCompiler.compile(
      baseInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    // Verify source versions were not modified in memory
    expect(JSON.stringify(themeVersion)).toBe(themeSnapshot);
    expect(JSON.stringify(tokenVersion)).toBe(tokenSnapshot);
  });

  it("9. rollback recompilation", () => {
    // Rolling back is compiling an older version snapshot (e.g. ver_theme_old)
    const oldThemeVersion: RegistryVersion = {
      uid: "ver_theme_old",
      definitionUid: "theme_def",
      versionNumber: 1,
      status: "published",
      payloadHash: "hash_thm_old",
      definition: {
        subtype: "theme",
        tokenLevel: "semantic",
        semantics: {
          "button.primary.background": "colors.red.500", // button primary used to be red in old version
          "button.danger.background": "colors.red.500",
          "padding.body": "spacing.medium",
        },
      },
      createdAt: new Date(),
    };

    const rollbackInput: CompilerInput = {
      sourceManifest: {
        themeVersionUid: "ver_theme_old",
        tokenVersionUids: ["ver_tokens_1"],
        motionVersionUids: [],
        iconVersionUids: [],
        componentStyleVersionUids: ["ver_comp_1"],
      },
      compilerVersion: "1.0.0",
      compilerHash: "sha256:mock_compiler_hash",
      dependencyFingerprint: "fingerprint_old",
      compiledBy: "system-compiler",
      compiledAt: "2026-06-04T12:00:00Z",
    };

    const result = DesignSystemCompiler.compile(
      rollbackInput,
      [oldThemeVersion, tokenVersion, componentStyleVersion],
      "development"
    );

    // Assert that the compiled output CSS variable maps to red instead of blue
    expect(result.artifactPayload.cssVariables["--simis-button-primary-background"]).toBe("#ef4444");
    expect(result.artifactPayload.provenance.sourceManifest.themeVersionUid).toBe("ver_theme_old");
  });

  it("10. promotion recompilation", () => {
    // Promoting compiles the promotional state for production environment
    const result = DesignSystemCompiler.compile(
      baseInput,
      [themeVersion, tokenVersion, componentStyleVersion],
      "production"
    );

    expect(result.definition.environment).toBe("production");
    expect(result.version.status).toBe("published");
    expect(result.artifactPayload.provenance.sourceManifest.themeVersionUid).toBe("ver_theme_1");
  });
});
