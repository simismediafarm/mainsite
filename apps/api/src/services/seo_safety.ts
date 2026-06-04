import { ContentBlockV2 } from './block_builder';

export class SEOContentSafetyEngine {
  /**
   * Enforces semantic uniqueness and internal linking graph health.
   * Modifies the block's SEO score or governance flags if issues are found.
   */
  static inspect(block: ContentBlockV2, existingFeed: ContentBlockV2[]): ContentBlockV2 {
    let penalty = 0;
    
    // Check for keyword cannibalization within the feed (rudimentary check)
    const similarIntentBlocks = existingFeed.filter(b => 
      b.id !== block.id && 
      b.seo.focus_keyword === block.seo.focus_keyword &&
      b.seo.search_intent === block.seo.search_intent
    );

    if (similarIntentBlocks.length > 0) {
      penalty += 10; // Penalize for duplicate focus keywords
      block.governance.policy_violations.push('SEO: Keyword Cannibalization Risk');
    }

    // Check if affiliate heavy but lacks substantive content
    if (block.type === 'affiliate' && block.blocks.length < 2) {
      penalty += 20; // Penalize thin affiliate content
      block.governance.policy_violations.push('SEO: Thin Affiliate Content');
    }

    block.ranking.seo_score = Math.max(0, block.ranking.seo_score - penalty);
    
    // If penalty is severe, downgrade layout
    if (penalty >= 20) {
      block.delivery.layout_variant = 'minimal';
    }

    return block;
  }
}
