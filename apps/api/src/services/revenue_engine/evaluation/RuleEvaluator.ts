import { RevenueRuleDefinition, RevenueRuleCondition } from '../resolvers/RevenueRuleResolver';
import { RevenueSignal } from '../resolvers/RevenueSignalResolver';
import { RuleConflictResolver } from './RuleConflictResolver';

export interface EvaluatedAction {
  ruleId: string;
  type: string;
  value: number | string;
}

export class RuleEvaluator {
  private conflictResolver: RuleConflictResolver;

  constructor() {
    this.conflictResolver = new RuleConflictResolver();
  }

  public evaluate(rules: { ruleId: string, definition: RevenueRuleDefinition }[], signals: RevenueSignal): EvaluatedAction[] {
    const firedActions: EvaluatedAction[] = [];

    for (const rule of rules) {
      if (this.evaluateConditions(rule.definition.operator, rule.definition.conditions, signals)) {
        firedActions.push({
          ruleId: rule.ruleId,
          type: rule.definition.action.type,
          value: rule.definition.action.value
        });
      }
    }

    return this.conflictResolver.resolve(firedActions);
  }

  private evaluateConditions(operator: 'AND' | 'OR', conditions: RevenueRuleCondition[], signals: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const signalValue = signals[condition.field];
      if (signalValue === undefined) return false;

      let match = false;
      switch (condition.comparison) {
        case 'eq': match = signalValue === condition.value; break;
        case 'neq': match = signalValue !== condition.value; break;
        case 'gt': match = signalValue > condition.value; break;
        case 'gte': match = signalValue >= condition.value; break;
        case 'lt': match = signalValue < condition.value; break;
        case 'lte': match = signalValue <= condition.value; break;
      }

      if (operator === 'AND' && !match) return false;
      if (operator === 'OR' && match) return true;
    }

    return operator === 'AND';
  }
}
