export interface RegistryHealthReport {
  cycles: number;
  orphanDefinitions: number;
  invalidReferences: number;
  crossTenantViolations: number;
  versionInconsistencies: number;
  healthScore: number; // 0-100
}
