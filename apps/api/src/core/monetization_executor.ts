import { prisma } from '../prisma';
import { eventBus } from './event_bus';

export interface MonetizationTarget {
  contentId: string;
  tags: string[];
}

export class MonetizationExecutor {
  static async execute(target: MonetizationTarget): Promise<boolean> {
    // Query active RevenueRules from DB, ordered by priority
    const rules = await prisma.revenueRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    if (rules.length === 0) return false;

    const appliedRules: Array<{ ruleId: string; action: unknown }> = [];

    for (const rule of rules) {
      const condition = rule.condition as any;
      // Evaluate tag-based conditions if present
      if (condition?.tags && Array.isArray(condition.tags)) {
        const matches = condition.tags.some((t: string) => target.tags.includes(t));
        if (!matches) continue;
      }
      appliedRules.push({ ruleId: rule.id, action: rule.action });
    }

    if (appliedRules.length > 0) {
      eventBus.emitEvent('MONETIZATION_APPLIED', {
        contentId: target.contentId,
        rules: appliedRules,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return false;
  }
}
