import { ContentBlockV2, Block } from '../block_builder';

export class LinkGraphEngine {
  private static readonly MAX_LINKS_PER_ARTICLE = 18;
  private static readonly MIN_LINKS_PER_ARTICLE = 2;

  /**
   * Constructs the optimal internal linking nodes (hub-and-spoke cluster) for a set of articles.
   * Modifies the blocks array of the target article to inject relevant in-context links.
   */
  static optimizeLinks(article: ContentBlockV2, pool: ContentBlockV2[]): ContentBlockV2 {
    const topic = article.taxonomy.topic;
    const focusKeyword = article.seo.focus_keyword.toLowerCase();

    // 1. Sift eligible targets from the pool (prevent circular self-linking or over-linking)
    const targets = pool.filter(p => 
      p.id !== article.id &&
      p.status === 'published' &&
      p.taxonomy.topic === topic
    );

    if (targets.length === 0) return article;

    // 2. Compute similarity weights (Topic compatibility 0.4 + Shared Tags 0.4 + Intent alignment 0.2)
    const scoredTargets = targets.map(target => {
      const sharedTags = target.taxonomy.tags.filter(t => article.taxonomy.tags.includes(t));
      const tagScore = article.taxonomy.tags.length > 0 ? (sharedTags.length / article.taxonomy.tags.length) : 0.0;
      const intentScore = target.seo.search_intent === article.seo.search_intent ? 1.0 : 0.0;
      
      const linkScore = (0.4 * 1.0) + (0.4 * tagScore) + (0.2 * intentScore);
      return { target, linkScore };
    });

    // Sort by link relevance descending
    scoredTargets.sort((a, b) => b.linkScore - a.linkScore);

    // Limit absolute links inserted to prevent penalty
    const linksToInsert = scoredTargets.slice(0, this.MAX_LINKS_PER_ARTICLE);

    // 3. Inject internal links into the target article's paragraph blocks safely
    let linkCount = 0;
    const updatedBlocks = article.blocks.map(block => {
      if (block.type === 'paragraph' && typeof block.content === 'string' && linkCount < linksToInsert.length) {
        const item = linksToInsert[linkCount];
        const keywordPattern = new RegExp(`\\b(${item.target.seo.focus_keyword || 'read details'})\\b`, 'i');
        
        if (keywordPattern.test(block.content)) {
          // Optimize anchor text by wrapping the focus keyword
          block.content = block.content.replace(keywordPattern, `<a href="/read/${item.target.slug}" style="color:var(--primary);text-decoration:underline;">$1</a>`);
          linkCount++;
        }
      }
      return block;
    });

    // If no matching keywords were found, append a "Related Reading" cluster spoke block at the bottom
    if (linkCount < this.MIN_LINKS_PER_ARTICLE && linksToInsert.length > 0) {
      const itemsToLink = linksToInsert.slice(0, 3);
      const linksHtml = itemsToLink.map(i => `<li><a href="/read/${i.target.slug}" style="color:var(--primary);text-decoration:underline;">${i.target.title}</a></li>`).join('');
      
      updatedBlocks.push({
        type: 'paragraph',
        content: `<div class="related-readings" style="margin-top:20px;padding:15px;background:var(--background);border-left:4px solid var(--primary);"><strong>Related Readings:</strong><ul style="margin:5px 0 0 15px;padding:0;">${linksHtml}</ul></div>`
      });
    }

    article.blocks = updatedBlocks;
    article.metadata.internal_link_count = linksToInsert.length;
    article.metadata.link_optimization_applied = true;

    return article;
  }
}
