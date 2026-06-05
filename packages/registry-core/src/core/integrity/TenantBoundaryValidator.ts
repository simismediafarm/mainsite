import { RegistryDefinition, RegistryDependency } from "../../contracts";
import { RegistryRepository } from "../RegistryRepository";

export class TenantBoundaryValidator {
  constructor(private readonly repository: RegistryRepository) {}

  /**
   * Validates that dependencies do not cross strict tenant or environment boundaries.
   * Definitions can depend on global definitions (where tenantId/workspace is null).
   */
  async validate(definition: RegistryDefinition, dependencies: RegistryDependency[]): Promise<void> {
    for (const dep of dependencies) {
      const target = await this.repository.getDefinitionByUid(dep.dependsOnUid);
      if (!target) continue;

      // 1. Environment Isolation (Strict)
      if (definition.environment !== target.environment) {
        throw new Error(`Cross-environment dependency forbidden: ${definition.environment} -> ${target.environment}`);
      }

      // 2. Tenant Isolation
      // Target must either belong to the same tenant or be global
      if (target.tenantId && target.tenantId !== definition.tenantId) {
        throw new Error(`Cross-tenant dependency forbidden: ${definition.tenantId} -> ${target.tenantId}`);
      }

      // 3. Workspace Isolation
      // Target must either belong to the same workspace, or be global/tenant-level (workspace=null)
      if (target.workspace && target.workspace !== definition.workspace) {
        throw new Error(`Cross-workspace dependency forbidden: ${definition.workspace} -> ${target.workspace}`);
      }
    }
  }
}
