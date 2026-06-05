import crypto from "crypto";
import { RegistryVersion } from "@simis/registry-core";
import { CompilerInput, CompilerOutput, CompilerSourceManifest } from "./CompilerContracts";
import { CompilerMapper } from "./CompilerMapper";
import { SemanticDepthViolationError, MissingPrimitiveTokenError } from "./CompilerErrors";

export class DesignSystemCompiler {
  /**
   * Pure compilation engine that flattens tokens and maps component styles.
   */
  static compile(
    input: CompilerInput,
    resolvedVersions: RegistryVersion[],
    environment: "development" | "staging" | "production",
    latestArtifactVersionNumber: number = 0,
    tenantId?: string,
    workspace?: string
  ): CompilerOutput {
    // 1. Separate versions by subtype
    const themeVersion = resolvedVersions.find(v => v.definition.subtype === "theme");
    const tokenVersions = resolvedVersions.filter(v => v.definition.subtype === "token-set");
    const componentVersions = resolvedVersions.filter(v => v.definition.subtype === "component-style");

    if (!themeVersion) {
      throw new Error("Compilation failed: theme version is missing from inputs.");
    }

    const themePayload = themeVersion.definition;
    const semantics = themePayload.semantics || {};

    // Collect all primitive tokens in a flat map
    const primitives: Record<string, string | number> = {};
    for (const ver of tokenVersions) {
      const tokens = ver.definition.tokens || {};
      for (const [key, val] of Object.entries(tokens)) {
        primitives[key] = val as string | number;
      }
    }

    // 2. Resolve semantics -> primitives and detect semantic depth violations
    const cssVariables: Record<string, string> = {};

    for (const [semanticKey, targetKey] of Object.entries(semantics)) {
      if (typeof targetKey !== "string") continue;

      // Rule: Semantic -> Semantic -> Semantic is forbidden (Semantic Depth Violation)
      if (semantics[targetKey] !== undefined) {
        throw new SemanticDepthViolationError(
          `Semantic depth violation: theme key "${semanticKey}" cannot map to another theme key "${targetKey}". Direct semantic to primitive mapping only.`
        );
      }

      // Check if target is a primitive token
      const rawValue = primitives[targetKey];
      if (rawValue === undefined) {
        throw new MissingPrimitiveTokenError(
          `Missing primitive token: Theme key "${semanticKey}" references primitive token "${targetKey}" which is not defined in any token sets.`
        );
      }

      // Format CSS variable names, e.g. "button.primary.background" -> "--simis-button-primary-background"
      const cssVarName = `--simis-${semanticKey.replace(/\./g, "-")}`;
      cssVariables[cssVarName] = String(rawValue);
    }

    // Also inject raw primitives into css variables, e.g. "colors.blue.500" -> "--simis-colors-blue-500"
    for (const [primitiveKey, rawValue] of Object.entries(primitives)) {
      const cssVarName = `--simis-${primitiveKey.replace(/\./g, "-")}`;
      cssVariables[cssVarName] = String(rawValue);
    }

    // 3. Resolve component mappings
    const componentMappings: Record<string, any> = {};
    for (const cv of componentVersions) {
      const compPayload = cv.definition;
      const componentId = compPayload.componentId;
      const variants = compPayload.variants || {};

      const resolvedVariants: Record<string, any> = {};

      for (const [variantName, properties] of Object.entries(variants)) {
        const resolvedProps: Record<string, string> = {};
        for (const [propName, value] of Object.entries(properties as Record<string, string>)) {
          // If the value matches a semantic token, resolve it to var(--simis-name)
          if (semantics[value] !== undefined) {
            resolvedProps[propName] = `var(--simis-${value.replace(/\./g, "-")})`;
          } else if (primitives[value] !== undefined) {
            // If it maps directly to a primitive, map it to var(--simis-primitive)
            resolvedProps[propName] = `var(--simis-${value.replace(/\./g, "-")})`;
          } else {
            // If it is neither, throw error
            throw new MissingPrimitiveTokenError(
              `Component style "${componentId}" variant "${variantName}" references token "${value}" which is not defined.`
            );
          }
        }
        resolvedVariants[variantName] = resolvedProps;
      }

      componentMappings[componentId] = resolvedVariants;
    }

    // 4. Generate provenance block
    const provenance = {
      compiledFromBundleHash: input.compiledFromBundleHash || "n/a",
      compiledAt: input.compiledAt,
      compiledBy: input.compiledBy,
      compilerVersion: input.compilerVersion,
      compilerHash: input.compilerHash,
      dependencyFingerprint: input.dependencyFingerprint,
      artifactSignature: crypto
        .createHash("sha256")
        .update(
          `${input.compiledFromBundleHash || "n/a"}${input.dependencyFingerprint}${input.compilerHash}${input.compilerVersion}`
        )
        .digest("hex"),
      sourceManifest: input.sourceManifest,
    };

    const artifactPayload = {
      subtype: "compiled-artifact" as const,
      artifactSchemaVersion: 1,
      cssVariables,
      componentMappings,
      provenance,
    };

    // 5. Map to registry entities
    const themeUid = themeVersion.uid; // use theme's version uid or definition uid
    const { definition, version } = CompilerMapper.toRegistryEntities(
      themeVersion.definitionUid,
      themeVersion.definitionUid, // business ID relation
      artifactPayload,
      input,
      environment,
      latestArtifactVersionNumber,
      tenantId,
      workspace
    );

    return {
      definition,
      version,
      artifactPayload,
    };
  }
}
