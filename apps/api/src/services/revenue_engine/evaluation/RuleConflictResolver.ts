import { EvaluatedAction } from './RuleEvaluator';

export class RuleConflictResolver {
  private readonly PRIORITY_ORDER = [
    'deny',
    'allow',
    'deboost',
    'boost',
    'multiplier',
    'segment'
  ];

  /**
   * Resolves conflicting actions deterministically.
   * Prioritizes 'deny' over everything. 
   * Aggregates multipliers.
   */
  public resolve(actions: EvaluatedAction[]): EvaluatedAction[] {
    if (actions.length === 0) return [];

    // 1. If any deny action fired, it supersedes all others
    const denyAction = actions.find(a => a.type === 'deny');
    if (denyAction) {
      return [denyAction];
    }

    // 2. Resolve multipliers (aggregate them)
    const multipliers = actions.filter(a => a.type === 'multiplier');
    let finalMultiplier = 1.0;
    for (const m of multipliers) {
      finalMultiplier *= Number(m.value);
    }

    const resolvedActions: EvaluatedAction[] = [];
    
    // Add allowable actions based on priority
    for (const priorityType of this.PRIORITY_ORDER) {
      if (priorityType === 'multiplier' && multipliers.length > 0) {
        resolvedActions.push({ ruleId: 'aggregated-multiplier', type: 'multiplier', value: finalMultiplier });
        continue;
      }

      const match = actions.find(a => a.type === priorityType);
      if (match) {
        resolvedActions.push(match);
      }
    }

    return resolvedActions;
  }
}
