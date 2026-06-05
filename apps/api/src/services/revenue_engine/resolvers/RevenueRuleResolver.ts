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
    // In reality, this queries the DB for active RevenueRules by context and checks for active RevenueExperiments.
    // For now, we mock the DB fetch as an example of the DSL contract.
    const rules: RevenueRuleDefinition[] = [
      {
        operator: 'AND',
        conditions: [
          { field: 'integrityScore', comparison: 'gte', value: 0.7 },
          { field: 'rankingScore', comparison: 'gte', value: 0.6 }
        ],
        action: { type: 'multiplier', value: 1.2 },
        priority: 10
      },
      {
        operator: 'AND',
        conditions: [
          { field: 'integrityScore', comparison: 'lt', value: 0.4 }
        ],
        action: { type: 'deny', value: 0 },
        priority: 100
      }
    ];

    return rules.map((r, i) => ({ ruleId: `rule-${i}`, definition: r }));
  }
}
