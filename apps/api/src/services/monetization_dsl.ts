import { ContentBlockV2 } from './block_builder';

export class RevenueGovernorService {
  static readonly MAX_AD_DENSITY = 0.3; // max 30% of blocks can be ads/affiliates
  static readonly MIN_READABILITY_SCORE = 0.7; // readability threshold

  static enforceDensity(blocks: ContentBlockV2[]): ContentBlockV2[] {
    const totalBlocks = blocks.length;
    const maxAds = Math.floor(totalBlocks * this.MAX_AD_DENSITY);
    
    let adCount = 0;
    
    return blocks.map(block => {
      // If it's a monetization block
      if (block.type === 'affiliate' || block.delivery.layout_variant === 'affiliate_heavy') {
        if (adCount >= maxAds) {
          // Downgrade layout or strip affiliate type if we exceeded density
          block.delivery.layout_variant = 'standard';
          if (block.type === 'affiliate') {
            block.type = 'article'; // Fallback
          }
        } else {
          adCount++;
        }
      }
      return block;
    });
  }

  static enforceReadability(block: ContentBlockV2): ContentBlockV2 {
    const paragraphs = block.blocks.filter(b => b.type === 'paragraph').length;
    const products = block.blocks.filter(b => b.type === 'product').length;
    
    const totalContentBlocks = paragraphs + products;
    const readabilityScore = totalContentBlocks > 0 ? (paragraphs / totalContentBlocks) : 1.0;

    if (readabilityScore < this.MIN_READABILITY_SCORE) {
      // Compromised readability: force standard layout variant and flag policy violation
      block.delivery.layout_variant = 'minimal';
      if (!block.governance.policy_violations.includes('RevenueGovernor: compromised readability')) {
        block.governance.policy_violations.push(`RevenueGovernor: compromised readability (${(readabilityScore * 100).toFixed(1)}% < 70%)`);
      }
    }

    return block;
  }
}

export class MonetizationDSLInterpreter {
  static evaluateCondition(when: string, block: ContentBlockV2, context: { geo: string, device: string }): boolean {
    try {
      if (when === "always") return true;
      if (when.includes("geo ==")) {
        const target = when.split("geo ==")[1].trim();
        return context.geo === target;
      }
      if (when.includes("intent ==")) {
        const target = when.split("intent ==")[1].trim();
        return block.seo.search_intent === target;
      }
      return false;
    } catch (err) {
      return false; // fail safe
    }
  }

  static precompile(block: ContentBlockV2): ContentBlockV2 {
    const rules = block.monetization.rules || [];
    block.resolved_slots = {};

    for (const rule of rules) {
      // Evaluate static context-free conditions
      let matches = false;
      if (rule.when === "always") matches = true;
      else if (rule.when.includes("intent ==")) {
        const target = rule.when.split("intent ==")[1].trim();
        if (block.seo.search_intent === target) matches = true;
      }
      
      // We skip geo rules for precompilation because we want DB state only
      // If we matched a static intent rule:
      if (matches) {
        if (rule.type === 'affiliate') {
          block.type = 'affiliate';
          block.delivery.layout_variant = 'affiliate_heavy';
          block.resolved_slots['primary'] = 'affiliate_link';
        } else if (rule.type === 'ad') {
          block.delivery.layout_variant = 'standard';
          block.resolved_slots['primary'] = 'gpt_ad_unit';
        }
        break; // Apply first matched rule only
      }
    }
    
    return block;
  }
}

export class MonetizationPlacementResolver {
  static resolve(blocks: ContentBlockV2[]): ContentBlockV2[] {
    // 1. Precompile DSL Rules for each block and enforce readability limits
    let resolvedBlocks = blocks.map(b => {
      const precompiled = MonetizationDSLInterpreter.precompile(b);
      return RevenueGovernorService.enforceReadability(precompiled);
    });
    
    // 2. Governor enforces global density constraints across the feed
    resolvedBlocks = RevenueGovernorService.enforceDensity(resolvedBlocks);
    
    return resolvedBlocks;
  }
}
