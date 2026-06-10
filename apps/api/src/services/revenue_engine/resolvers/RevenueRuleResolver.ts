import { PrismaClient } from '@prisma/client';

export interface RevenueRuleCondition {
  field: string;
  comparison: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: number | string;
}

export interface RevenueRuleDefinition {
  operator: 'AND' | 'OR';
  conditions: RevenueRuleCondition[];
  action: {
    type: 'allow' | 'deny' | 'boost' | 'deboost' | 'multiplier' | 'segment';
    value: number | string;
  };
  priority: number;
}

export class RevenueRuleResolver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Resolves the active set of rules for an entity context.
   * If an active experiment is running, it returns the variant rules.
   */
  public async resolve(context: string, workspaceId?: string): Promise<{ ruleId: string, definition: RevenueRuleDefinition }[]> {
    const where: any = { isActive: true };
    if (workspaceId) where.workspaceId = workspaceId;

    const dbRules = await this.prisma.revenueRule.findMany({
      where,
      orderBy: { priority: 'desc' },
    });

    return dbRules.map(r => ({
      ruleId: r.id,
      definition: {
        ...(r.condition as any),
        action: r.action as RevenueRuleDefinition['action'],
        priority: r.priority,
      } as RevenueRuleDefinition,
    }));
  }
}
