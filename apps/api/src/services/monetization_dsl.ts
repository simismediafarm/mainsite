import { ContentBlockV2 } from './block_builder';

export class RevenueGovernorService {
  static readonly MAX_AD_DENSITY = 0.3; // max 30% of blocks can be ads/affiliates

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
    // 1. Precompile DSL Rules for each block (usually done during ingestion, but safe here)
    let resolvedBlocks = blocks.map(b => MonetizationDSLInterpreter.precompile(b));
    
    // 2. Governor enforces global density constraints across the feed
    resolvedBlocks = RevenueGovernorService.enforceDensity(resolvedBlocks);
    
    return resolvedBlocks;
  }
}
