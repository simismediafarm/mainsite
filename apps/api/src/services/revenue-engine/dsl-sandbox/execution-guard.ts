import { MonetizationRule, DSLValidator } from './validator';
import { RevenueGovernorService } from '../../monetization_dsl';
import { ContentBlockV2 } from '../../block_builder';

export class ExecutionGuard {
  /**
   * Evaluates the safety of a list of rules compiled from the editor.
   * Runs AST checks, syntax validation, and checks against the global Governor.
   */
  static validateRuleSet(rules: MonetizationRule[]): { allowed: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Limit check on total rule rules
    if (rules.length > 10) {
      errors.push("Exceeded maximum number of active rules (Max: 10)");
    }

    // 2. Individual rule validations (AST sandbox validations)
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const validation = DSLValidator.validateConditionString(rule.when);
      if (!validation.valid) {
        errors.push(`Rule [${i}]: AST validation failed: ${validation.error}`);
      }

      // Action type check
      const allowedActions = ['affiliate', 'ad', 'sponsored_block'];
      if (!allowedActions.includes(rule.type)) {
        errors.push(`Rule [${i}]: Unsupported action type: "${rule.type}"`);
      }
    }

    return {
      allowed: errors.length === 0,
      errors
    };
  }

  /**
   * Intercepts and tests rule integration against a mock content block feed
   * to ensure no layout collapse or Governor violations happen.
   */
  static dryRunRules(rules: MonetizationRule[], mockFeed: ContentBlockV2[]): { success: boolean; adDensity: number; error?: string } {
    // Inject rules into mock feed
    const modifiedFeed = mockFeed.map(block => ({
      ...block,
      monetization: { rules }
    }));

    // Resolve placements
    const { MonetizationPlacementResolver } = require('../../monetization_dsl');
    const resolved = MonetizationPlacementResolver.resolve(modifiedFeed);

    // Calculate ad density post-resolution
    const totalBlocks = resolved.length;
    const adBlocks = resolved.filter((b: any) => b.type === 'affiliate' || b.delivery.layout_variant === 'affiliate_heavy').length;
    const density = totalBlocks > 0 ? adBlocks / totalBlocks : 0;

    if (density > RevenueGovernorService.MAX_AD_DENSITY) {
      return {
        success: false,
        adDensity: density,
        error: `Governor Violation: Bidding density of ${(density * 100).toFixed(1)}% exceeds limit of 30%`
      };
    }

    return {
      success: true,
      adDensity: density
    };
  }
}
