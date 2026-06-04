import { ContentBlockV2 } from '../block_builder';

export class DiscoverOptimizer {
  /**
   * Refactors ContentBlockV2 layouts and headlines specifically to meet high Discover engagement targets.
   * Adjusts render priority and inserts rich-media layout hints.
   */
  static optimize(block: ContentBlockV2): ContentBlockV2 {
    const title = block.title;

    // 1. Optimize Title Hook (Ensure it starts with high engagement triggers if appropriate)
    const hooks = ['Why', 'How', 'Review:', 'Ultimate Guide:'];
    const hasHook = hooks.some(h => title.startsWith(h));
    if (!hasHook && block.seo.search_intent === 'informational') {
      block.title = `Why ${title.charAt(0).toLowerCase() + title.slice(1)}`;
    }

    // 2. High-Res Image Layout Injection (Discover priority renders)
    block.delivery.layout_variant = 'seo_boosted';
    block.delivery.render_priority = 10; // High priority queue

    // 3. Entity-enrich taxonomy tag list
    if (!block.taxonomy.tags.includes('trending')) {
      block.taxonomy.tags.push('trending');
    }
    if (!block.taxonomy.tags.includes(block.taxonomy.topic)) {
      block.taxonomy.tags.push(block.taxonomy.topic);
    }

    // 4. Force Discover metadata indicators
    block.metadata = {
      ...block.metadata,
      discover_optimized: true,
      discover_optimization_applied_at: new Date().toISOString()
    };

    return block;
  }
}
