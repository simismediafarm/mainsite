import { RegistryDefinition, RegistryDependency } from "../../contracts";
import { DependencyValidator } from "./DependencyValidator";
import { CycleDetector } from "./CycleDetector";
import { OrphanDetector } from "./OrphanDetector";
import { TenantBoundaryValidator } from "./TenantBoundaryValidator";
import { VersionConsistencyValidator } from "./VersionConsistencyValidator";
import { RegistryHealthReport } from "./RegistryHealthReport";
import { RegistryRepository } from "../RegistryRepository";

export class IntegrityEngine {
  private dependencyValidator: DependencyValidator;
  private cycleDetector: CycleDetector;
  private orphanDetector: OrphanDetector;
  private tenantBoundaryValidator: TenantBoundaryValidator;
  private versionConsistencyValidator: VersionConsistencyValidator;

  constructor(repository: RegistryRepository) {
    this.dependencyValidator = new DependencyValidator(repository);
    this.cycleDetector = new CycleDetector();
    this.orphanDetector = new OrphanDetector();
    this.tenantBoundaryValidator = new TenantBoundaryValidator(repository);
    this.versionConsistencyValidator = new VersionConsistencyValidator(repository);
  }

  /**
   * Run all validations required before a definition can be published.
   * Throws an error if any strict constraint fails.
   */
  async runPrePublishChecks(definition: RegistryDefinition, dependencies: RegistryDependency[]): Promise<void> {
    // 1. Structural Checks
    await this.versionConsistencyValidator.validate(definition);
    
    // 2. Boundary Checks
    await this.tenantBoundaryValidator.validate(definition, dependencies);
    
    // 3. Graph Checks
    this.cycleDetector.detect(dependencies);
    await this.dependencyValidator.validate(definition, dependencies);
  }

  /**
   * Generates a health report for a set of definitions and their dependencies.
   * This is a diagnostic tool, not a strict guard like runPrePublishChecks.
   */
  async generateHealthReport(definitions: RegistryDefinition[], dependencies: RegistryDependency[]): Promise<RegistryHealthReport> {
    let cycles = 0;
    try {
      this.cycleDetector.detect(dependencies);
    } catch (e) {
      cycles = 1; // Simplified: indicates presence of cycle(s)
    }

    const orphans = this.orphanDetector.detect(definitions, dependencies);

    let invalidReferences = 0;
    let crossTenantViolations = 0;
    let versionInconsistencies = 0;

    for (const def of definitions) {
      try {
        await this.versionConsistencyValidator.validate(def);
      } catch {
        versionInconsistencies++;
      }

      const defDeps = dependencies.filter(d => d.definitionUid === def.uid);
      try {
        await this.tenantBoundaryValidator.validate(def, defDeps);
      } catch {
        crossTenantViolations++;
      }

      try {
        await this.dependencyValidator.validate(def, defDeps);
      } catch {
        invalidReferences++;
      }
    }

    const totalIssues = cycles + invalidReferences + crossTenantViolations + versionInconsistencies;
    // Arbitrary simple scoring formula
    const maxScore = 100;
    const healthScore = Math.max(0, maxScore - (totalIssues * 10) - (orphans.length * 2));

    return {
      cycles,
      orphanDefinitions: orphans.length,
      invalidReferences,
      crossTenantViolations,
      versionInconsistencies,
      healthScore
    };
  }
}
