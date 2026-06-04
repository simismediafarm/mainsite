import { ContentBlockV2 } from '../block_builder';

export interface AuthorityReport {
  topicalCoverage: number;
  entityDepth: number;
  clusterCompleteness: number;
  authorityScore: number;
}

export class AuthorityGraphEngine {
  /**
   * Computes the topical authority score of SIMIS's structured content clusters.
   * Higher depth indicates better topical coverage, helping rank higher on Google Search.
   */
  static evaluate(topic: string, pool: ContentBlockV2[]): AuthorityReport {
    // 1. Calculate Topical Coverage (Volume of unique articles in the same topic)
    const topicArticles = pool.filter(p => p.taxonomy.topic === topic && p.status === 'published');
    const topicalCoverage = Math.min(1.0, topicArticles.length / 10); // Optimal cluster contains at least 10 articles

    // 2. Entity Depth (How many unique entity tags are declared in this topic)
    const allTags = topicArticles.flatMap(a => a.taxonomy.tags);
    const uniqueEntities = new Set(allTags);
    const entityDepth = Math.min(1.0, uniqueEntities.size / 20); // Optimal unique entities in topic >= 20

    // 3. Cluster Completeness (Ratio of search intents covered: informational, transactional, commercial)
    const coveredIntents = new Set(topicArticles.map(a => a.seo.search_intent));
    const clusterCompleteness = coveredIntents.size / 4; // Out of 4 intent groups

    // Weighted overall topical authority score
    const authorityScore = Number(((topicalCoverage * 0.40) + (entityDepth * 0.40) + (clusterCompleteness * 0.20)).toFixed(4));

    return {
      topicalCoverage: Number(topicalCoverage.toFixed(2)),
      entityDepth: Number(entityDepth.toFixed(2)),
      clusterCompleteness: Number(clusterCompleteness.toFixed(2)),
      authorityScore
    };
  }
}
