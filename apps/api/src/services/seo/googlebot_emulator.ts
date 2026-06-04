import { ContentBlockV2 } from '../block_builder';

export interface CrawlSimulation {
  url: string;
  depth: number;
  internalLinkScore: number;
  freshnessScore: number;
  contentEntropy: number;
  structuredDataScore: number;
  canonicalConsistency: number;
}

export class GooglebotEmulator {
  private static readonly MAX_DEPTH = 4;

  /**
   * Simulates how Googlebot parses a ContentBlockV2 and checks crawling feasibility.
   */
  static simulate(block: ContentBlockV2, siteUrl: string = 'https://simis.media'): CrawlSimulation {
    const slug = block.slug;
    const url = `${siteUrl}/read/${slug}`;

    // 1. Crawl Depth Simulation (Determined by category and internal nesting heuristics)
    // Homepage (0) -> Category (1) -> Topic (2) -> Article (3) -> Related (4)
    let depth = 3; // Default for articles
    if (block.taxonomy.category === 'General') {
      depth = 4; // Deeper if categorized under standard generic groups
    }

    // 2. Internal Link Score (Checking anchor tags inside paragraphs)
    const textContent = block.blocks
      .filter(b => b.type === 'paragraph')
      .map(b => b.content || '')
      .join(' ');

    const linkPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
    const links: string[] = [];
    let match;
    while ((match = linkPattern.exec(textContent)) !== null) {
      links.push(match[1]);
    }

    const internalLinks = links.filter(l => l.startsWith('/') || l.includes(siteUrl));
    // Ideally we want 2-5 internal links for organic topical clusters
    const internalLinkScore = internalLinks.length >= 2 && internalLinks.length <= 15 ? 1.0 : (internalLinks.length > 15 ? 0.4 : 0.2);

    // 3. Freshness Score Decay Simulation (hours elapsed since creation/update)
    const lastUpdate = block.execution_lock.expires_at ? new Date(block.execution_lock.expires_at) : new Date();
    const ageInHours = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0.1, Math.exp(-0.005 * ageInHours)); // decay curve

    // 4. Content Entropy (Lexical diversity to prevent spam/stuffing)
    const words = textContent.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const contentEntropy = words.length > 0 ? Number((uniqueWords.size / words.length).toFixed(4)) : 0.0;

    // 5. Structured Data Score (Does it have focus keyword and valid schema markers?)
    const hasFocusKeyword = block.seo.focus_keyword && textContent.toLowerCase().includes(block.seo.focus_keyword.toLowerCase());
    const hasSchema = !!block.seo.schema_type;
    const structuredDataScore = hasFocusKeyword && hasSchema ? 1.0 : (hasSchema || hasFocusKeyword ? 0.7 : 0.3);

    // 6. Canonical Consistency (Check if canonical URL matches our expected path)
    const canonical = block.metadata.canonical_url || '';
    const canonicalConsistency = canonical === `/read/${slug}` || canonical === url ? 1.0 : 0.0;

    return {
      url,
      depth: Math.min(depth, this.MAX_DEPTH),
      internalLinkScore,
      freshnessScore,
      contentEntropy,
      structuredDataScore,
      canonicalConsistency
    };
  }
}
