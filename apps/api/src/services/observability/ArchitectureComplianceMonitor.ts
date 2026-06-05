import { PrismaClient } from '@prisma/client';

export class ArchitectureComplianceMonitor {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Validates cross-engine rule compliance dynamically.
   * Ranking -> Integrity (Allowed)
   * Ranking -> Revenue (Allowed)
   * Integrity -> Revenue (Allowed)
   * Revenue -> Ranking/Integrity (Forbidden)
   */
  public async monitorDependencies(): Promise<{ compliant: boolean, violations: string[] }> {
    const deps = await this.prisma.pipelineDependency.findMany({ where: { isActive: true } });

    const violations: string[] = [];

    for (const dep of deps) {
      if (dep.sourceEngine === 'revenue' && (dep.targetEngine === 'ranking' || dep.targetEngine === 'integrity')) {
        violations.push(`Violation: Revenue Engine cannot be an upstream dependency for ${dep.targetEngine}`);
      }
      if (dep.sourceEngine === 'integrity' && dep.targetEngine === 'ranking') {
        violations.push('Violation: Integrity Engine cannot be an upstream dependency for Ranking Engine');
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }
}
