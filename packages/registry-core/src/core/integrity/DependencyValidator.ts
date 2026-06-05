import { RegistryDefinition, RegistryDependency, RegistryStatus } from "../../contracts";
import { RegistryRepository } from "../RegistryRepository";
import { PromotionRejectedError } from "../RegistryErrors";

export class DependencyValidator {
  constructor(private readonly repository: RegistryRepository) {}

  /**
   * Validates that all 'hard' dependencies of a definition exist and are in a compatible status.
   * Throws an error if validation fails.
   */
  async validate(definition: RegistryDefinition, dependencies: RegistryDependency[]): Promise<void> {
    for (const dep of dependencies) {
      if (dep.dependencyType === "runtime") {
        if (definition.type === "design-system" || definition.type === "component") {
          const target = await this.repository.getDefinitionByUid(dep.dependsOnUid);
          if (target) {
            await this.validateDesignSystemDAG(definition, target, dep);
          }
        }
        continue; // Runtime dependencies are resolved lazily and not part of DAG validation
      }

      const target = await this.repository.getDefinitionByUid(dep.dependsOnUid);

      if (!target) {
        if (dep.dependencyType === "hard") {
          throw new Error(`Hard dependency ${dep.dependsOnUid} not found for ${definition.uid}`);
        }
        continue;
      }

      // If the parent is being published, all hard dependencies must also be published
      if (definition.status === RegistryStatus.Published && dep.dependencyType === "hard") {
        if (target.status !== RegistryStatus.Published) {
          throw new Error(`Cannot publish ${definition.uid}: Hard dependency ${target.uid} is not published`);
        }
      }

      // Design System DAG Validation
      if (definition.type === "design-system" || definition.type === "component") {
        await this.validateDesignSystemDAG(definition, target, dep);
      }
    }
  }

  private async validateDesignSystemDAG(sourceDef: RegistryDefinition, targetDef: RegistryDefinition, dep: RegistryDependency): Promise<void> {
    // We need to know the subtypes to enforce DAG direction
    const sourceVersion = await this.repository.getVersion(sourceDef.currentVersionUid!);
    const targetVersion = await this.repository.getVersion(dep.dependsOnVersionUid || targetDef.currentVersionUid!);

    if (!sourceVersion || !targetVersion) return; // Cannot validate without payloads

    const sourcePayload = sourceVersion.definition as any;
    const targetPayload = targetVersion.definition as any;

    const sourceSubtype = sourcePayload.subtype;
    const targetSubtype = targetPayload.subtype;

    // Rule 1: Bundle Runtime Exclusion
    if (targetSubtype === "bundle" && dep.dependencyType === "runtime") {
      throw new Error(`Bundle ${targetDef.uid} cannot be referenced as a runtime dependency by ${sourceDef.uid}`);
    }

    // Rule D: Compiled Artifact Exclusion
    if (targetSubtype === "compiled-artifact") {
      throw new Error(`Compiled Artifact ${targetDef.uid} cannot be referenced as a dependency by ${sourceDef.uid}. Artifacts are strictly for runtime consumption.`);
    }

    // Rule 2: Component -> Semantic Theme -> Primitive Token Downward Direction
    const rank = (subtype: string, tokenLevel?: string) => {
      if (subtype === "component-style") return 4;
      if (subtype === "theme" && tokenLevel === "semantic") return 3;
      if (subtype === "token-set" && tokenLevel === "primitive") return 2;
      if (subtype === "icon-set" || subtype === "motion-token") return 2;
      return 1;
    };

    const sourceRank = rank(sourceSubtype, sourcePayload.tokenLevel);
    const targetRank = rank(targetSubtype, targetPayload.tokenLevel);

    if (sourceRank > 1 && targetRank > 1) {
      if (sourceRank <= targetRank) {
         // E.g. primitive (2) cannot depend on semantic (3). Semantic (3) cannot depend on Semantic (3).
         throw new Error(`DAG Violation: ${sourceSubtype} (${sourcePayload.tokenLevel || ''}) cannot depend on ${targetSubtype} (${targetPayload.tokenLevel || ''}). Must be downward strictly.`);
      }
    }
  }

  /**
   * Rule E: Promotion Validator
   * Verifies that all pinned version UIDs in the graph exist in the target environment before allowing promotion.
   */
  async validatePromotion(sourceVersionUid: string, targetEnvironment: string): Promise<void> {
    const sourceVersion = await this.repository.getVersion(sourceVersionUid);
    if (!sourceVersion) return;

    const dependencies = await this.repository.listDependencies(sourceVersion.definitionUid);

    for (const dep of dependencies) {
      if (dep.dependencyMode === "pinned") {
        if (!dep.dependsOnVersionUid) {
          throw new PromotionRejectedError(`Cannot promote: Pinned dependency mode specified but dependsOnVersionUid is missing.`);
        }

        const targetVersion = await this.repository.getVersion(dep.dependsOnVersionUid);
        if (!targetVersion) {
          throw new PromotionRejectedError(`Cannot promote: Pinned dependency version ${dep.dependsOnVersionUid} is missing in ${targetEnvironment}`);
        }

        const targetDef = await this.repository.getDefinitionByUid(targetVersion.definitionUid);
        if (!targetDef || targetDef.environment !== targetEnvironment) {
          throw new PromotionRejectedError(`Cannot promote: Pinned dependency version ${dep.dependsOnVersionUid} belongs to environment ${targetDef?.environment || 'unknown'} instead of ${targetEnvironment}`);
        }
      }
    }
  }
}
