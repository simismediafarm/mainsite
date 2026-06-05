export class NamespaceRegistry {
  /**
   * Enforces strict private tenant isolation.
   * Artifacts must follow the format: @<tenantId>/<artifactName>
   */
  public validateOwnership(tenantId: string, artifactName: string): boolean {
    const expectedPrefix = `@${tenantId}/`;
    if (!artifactName.startsWith(expectedPrefix)) {
      throw new Error(`Namespace Violation: Tenant ${tenantId} cannot publish or access artifact ${artifactName}. Strict private isolation is enforced.`);
    }
    return true;
  }

  public extractTenantId(artifactName: string): string {
    const match = artifactName.match(/^@([^\/]+)\//);
    if (!match) {
      throw new Error(`Invalid artifact name format: ${artifactName}. Must be @tenantId/artifactName`);
    }
    return match[1];
  }
}
