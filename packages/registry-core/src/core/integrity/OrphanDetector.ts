import { RegistryDefinition, RegistryDependency } from "../../contracts";

export class OrphanDetector {
  /**
   * Identifies definitions that have no incoming dependencies.
   * Note: Top-level definitions like "pages" or "workflows" are expected to be orphans.
   */
  detect(definitions: RegistryDefinition[], dependencies: RegistryDependency[]): RegistryDefinition[] {
    const dependencyTargets = new Set(dependencies.map(d => d.dependsOnUid));
    
    // Pages, Workflows, Layouts, etc. might naturally be roots, 
    // but this detector identifies anything unreferenced.
    return definitions.filter(def => !dependencyTargets.has(def.uid));
  }
}
