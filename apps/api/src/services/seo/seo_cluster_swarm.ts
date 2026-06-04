import { ContentBlockV2 } from '../block_builder';

export interface KeywordCluster {
  rootKeyword: string;
  intent: "informational" | "transactional" | "navigational";
  geo: string;
  difficulty: number;
  volume: number;
}

export interface SwarmArticleSuggestion {
  title: string;
  focusKeyword: string;
  intent: KeywordCluster["intent"];
  taxonomy: {
    category: string;
    topic: string;
    tags: string[];
  };
  suggestedBlocks: any[];
}

export class SEOClusterSwarm {
  private static readonly COSINE_SIMILARITY_THRESHOLD = 0.78;

  /**
   * Evaluates keyword clusters, identifies volume opportunities, and outputs structured page drafts.
   */
  static processCluster(cluster: KeywordCluster, existingPool: ContentBlockV2[]): SwarmArticleSuggestion[] {
    const suggestions: SwarmArticleSuggestion[] = [];

    // 1. Uniqueness Guard: prevent cannibalization by filtering keywords too close to existing articles
    const hasConflict = existingPool.some(p => {
      const titleLower = p.title.toLowerCase();
      const keywordLower = cluster.rootKeyword.toLowerCase();
      
      // Simple Jaccard similarity word intersection
      const wordsA = new Set(titleLower.split(/\s+/));
      const wordsB = new Set(keywordLower.split(/\s+/));
      let intersections = 0;
      for (const w of wordsA) {
        if (wordsB.has(w)) intersections++;
      }
      const similarity = intersections / (wordsA.size + wordsB.size - intersections);
      return similarity >= this.COSINE_SIMILARITY_THRESHOLD;
    });

    if (hasConflict) {
      // Skipped to avoid duplicate keyword cannibalization penalties
      return [];
    }

    // 2. Generate content spokes depending on Search Intent
    const root = cluster.rootKeyword;
    if (cluster.intent === 'transactional') {
      suggestions.push({
        title: `Best Deals on ${root}: Compare Prices & Reviews`,
        focusKeyword: root,
        intent: 'transactional',
        taxonomy: {
          category: 'Shopping',
          topic: root,
          tags: [root, 'deals', 'discounts']
        },
        suggestedBlocks: [
          { type: 'paragraph', content: `Looking for the absolute best price on ${root}? You've come to the right place. In this round-up, we compare top alternatives.` },
          { type: 'divider', content: '' },
          { type: 'paragraph', content: `Check out our price comparison grids below for active discounts on ${root}.` }
        ]
      });
    } else if (cluster.intent === 'informational') {
      // Create semantic clusters (Spokes)
      suggestions.push({
        title: `What is ${root}? The Ultimate Informational Guide`,
        focusKeyword: root,
        intent: 'informational',
        taxonomy: {
          category: 'Guides',
          topic: root,
          tags: [root, 'guide', 'tutorials']
        },
        suggestedBlocks: [
          { type: 'paragraph', content: `Here is everything you need to know about ${root}, its features, benefits, and implementation methods.` },
          { type: 'quote', content: { text: `Understanding the fundamentals of ${root} is critical before choosing a product strategy.`, author: 'SIMIS Editorial' } },
          { type: 'paragraph', content: `Let's break down the primary mechanisms driving this technology.` }
        ]
      });
      
      suggestions.push({
        title: `How to Optimize ${root} for Maximum Efficiency`,
        focusKeyword: `optimize ${root}`,
        intent: 'informational',
        taxonomy: {
          category: 'Optimization',
          topic: root,
          tags: [root, 'optimization', 'performance']
        },
        suggestedBlocks: [
          { type: 'paragraph', content: `Want to squeeze more performance out of your ${root}? Follow our detailed step-by-step checklist.` }
        ]
      });
    }

    return suggestions;
  }
}
