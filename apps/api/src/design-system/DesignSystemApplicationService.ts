import {
  RegistryContext,
  RegistryDefinition,
  RegistryVersion,
  RegistryStatus,
  RegistryRepository,
  ContentIntegrity,
} from "@simis/registry-core";
import { RegistryService } from "../registry/RegistryService";
import { DesignSystemCompiler } from "../compiler/DesignSystemCompiler";
import { CompilerInput } from "../compiler/CompilerContracts";
import { CompilerMapper } from "../compiler/CompilerMapper";
import { defaultArtifactValidator } from "../compiler/ArtifactValidator";

export class DesignSystemApplicationService {
  constructor(
    private readonly registryService: RegistryService,
    private readonly repository: RegistryRepository
  ) {}

  async createDraft(context: RegistryContext, id: string, payload: any): Promise<RegistryDefinition> {
    return this.registryService.createDraft(context, "design-system", id, payload);
  }

  async listObjects(context: RegistryContext): Promise<RegistryDefinition[]> {
    return this.repository.listDefinitions(
      "design-system",
      context.environment,
      context.tenantId,
      context.workspace
    );
  }

  async getObject(context: RegistryContext, id: string): Promise<RegistryDefinition | null> {
    return this.repository.getDefinitionByTypeAndId(
      "design-system",
      id,
      context.environment,
      context.tenantId,
      context.workspace
    );
  }

  async publish(context: RegistryContext, uid: string): Promise<void> {
    // 1. Transaction Boundaries: standard registry publish
    await this.registryService.publish(context, uid);

    // 2. Pure Compiler Execution: runs ONLY AFTER registry transaction commits
    await this.compileAllThemes(context);
  }

  async rollback(context: RegistryContext, uid: string, targetVersionNumber: number): Promise<void> {
    // 1. Transaction Boundaries: standard registry rollback
    await this.registryService.rollback(context, uid, targetVersionNumber);

    // 2. Pure Compiler Execution: runs ONLY AFTER registry transaction commits
    await this.compileAllThemes(context);
  }

  async promote(
    context: RegistryContext,
    uid: string,
    targetEnvironment: "development" | "staging" | "production",
    strategy: "STRICT_REJECTION" | "CASCADING_PROMOTION"
  ): Promise<void> {
    // 1. Transaction Boundaries: promote object
    await this.registryService.promote(context, uid, targetEnvironment, strategy);

    // 2. Pure Compiler Execution: runs in target environment ONLY AFTER promote transaction commits
    const targetContext = { ...context, environment: targetEnvironment };
    await this.compileAllThemes(targetContext);
  }

  async getArtifact(context: RegistryContext, themeId: string): Promise<RegistryVersion | null> {
    // Business ID of the compiled-artifact is derived from the themeId
    const artifactDef = await this.repository.getDefinitionByTypeAndId(
      "design-system",
      `compiled-artifact-${themeId}`,
      context.environment,
      context.tenantId,
      context.workspace
    );

    if (!artifactDef || !artifactDef.currentVersionUid) {
      return null;
    }

    const version = await this.repository.getVersion(artifactDef.currentVersionUid);
    if (version && version.definition.artifactSchemaVersion) {
      defaultArtifactValidator.validateSchemaVersion(version.definition.artifactSchemaVersion);
    }
    return version;
  }

  async getCss(context: RegistryContext, themeId: string): Promise<string | null> {
    const artifact = await this.getArtifact(context, themeId);
    if (!artifact) return null;

    const cssVariables = artifact.definition.cssVariables || {};
    let cssText = ":root {\n";
    for (const [key, value] of Object.entries(cssVariables)) {
      cssText += `  ${key}: ${value};\n`;
    }
    cssText += "}\n";
    return cssText;
  }

  /**
   * Internal helper to scan environment, compile any themes and save artifacts.
   */
  private async compileAllThemes(context: RegistryContext): Promise<void> {
    // 1. List all design-system definitions in current scope
    const allDefs = await this.repository.listDefinitions(
      "design-system",
      context.environment,
      context.tenantId,
      context.workspace
    );

    // 2. Filter down to Themes
    for (const def of allDefs) {
      if (!def.currentVersionUid) continue;

      const ver = await this.repository.getVersion(def.currentVersionUid);
      if (!ver || ver.definition.subtype !== "theme") continue;

      try {
        await this.compileTheme(context, def, ver);
      } catch (err) {
        console.error(`Post-transaction compilation failed for theme "${def.id}":`, err);
        // Note: Compiler failure must NOT corrupt or revert registry state (commits are final).
      }
    }
  }

  private async compileTheme(context: RegistryContext, themeDef: RegistryDefinition, themeVersion: RegistryVersion): Promise<void> {
    // Gather dependencies of the theme
    const dependencies = await this.repository.listDependencies(themeDef.uid);
    const resolvedVersions: RegistryVersion[] = [themeVersion];

    const dependencyReps: Array<{ versionUid: string; dependencyMode: string }> = [];

    // Resolve all theme dependencies
    for (const dep of dependencies) {
      const targetDef = await this.repository.getDefinitionByUid(dep.dependsOnUid);
      if (!targetDef) continue;

      const targetVersionUid = dep.dependsOnVersionUid || targetDef.currentVersionUid;
      if (!targetVersionUid) continue;

      const targetVersion = await this.repository.getVersion(targetVersionUid);
      if (targetVersion) {
        resolvedVersions.push(targetVersion);
        dependencyReps.push({
          versionUid: targetVersionUid,
          dependencyMode: dep.dependencyMode,
        });
      }
    }

    // Resolve all component-styles that depend on this theme
    const allDefs = await this.repository.listDefinitions(
      "design-system",
      context.environment,
      context.tenantId,
      context.workspace
    );

    for (const d of allDefs) {
      if (!d.currentVersionUid) continue;
      const ver = await this.repository.getVersion(d.currentVersionUid);
      if (ver && ver.definition.subtype === "component-style") {
        // Fetch component dependencies
        const compDeps = await this.repository.listDependencies(d.uid);
        const referencesTheme = compDeps.some(cd => cd.dependsOnUid === themeDef.uid);
        if (referencesTheme) {
          resolvedVersions.push(ver);
          dependencyReps.push({
            versionUid: ver.uid,
            dependencyMode: "floating", // Component reference
          });
        }
      }
    }

    // Compute fingerprint
    const dependencyFingerprint = ContentIntegrity.computeDependencyFingerprint(dependencyReps);

    const input: CompilerInput = {
      sourceManifest: {
        themeVersionUid: themeVersion.uid,
        tokenVersionUids: resolvedVersions.filter(v => v.definition.subtype === "token-set").map(v => v.uid),
        motionVersionUids: resolvedVersions.filter(v => v.definition.subtype === "motion-token").map(v => v.uid),
        iconVersionUids: resolvedVersions.filter(v => v.definition.subtype === "icon-set").map(v => v.uid),
        componentStyleVersionUids: resolvedVersions.filter(v => v.definition.subtype === "component-style").map(v => v.uid),
      },
      compilerVersion: "1.0.0",
      compilerHash: "sha256:core_v1",
      dependencyFingerprint,
      compiledBy: context.actorId,
      compiledAt: new Date().toISOString(),
    };

    // Determine latest version of compiled artifact (if exists)
    let latestArtifactVersionNumber = 0;
    const existingArtifactDef = await this.repository.getDefinitionByTypeAndId(
      "design-system",
      `compiled-artifact-${themeDef.uid}`,
      context.environment,
      context.tenantId,
      context.workspace
    );

    if (existingArtifactDef) {
      const artifactVersions = await this.repository.listVersions(existingArtifactDef.uid);
      latestArtifactVersionNumber = artifactVersions[0]?.versionNumber || 0;
    }

    // Call Compiler
    const compiled = DesignSystemCompiler.compile(
      input,
      resolvedVersions,
      context.environment,
      latestArtifactVersionNumber,
      context.tenantId,
      context.workspace
    );

    // Save Compiled Artifact Definition (if missing)
    const artifactDefExists = await this.repository.getDefinitionByUid(compiled.definition.uid);
    if (!artifactDefExists) {
      await this.repository.createDefinition(compiled.definition);
    }

    // Save Compiled Artifact Version (if missing)
    const artifactVerExists = await this.repository.getVersion(compiled.version.uid);
    if (!artifactVerExists) {
      await this.repository.createVersion(compiled.version);
      await this.repository.updateCurrentVersion(compiled.definition.uid, compiled.version.uid, compiled.version.versionNumber);
    }
  }
}
