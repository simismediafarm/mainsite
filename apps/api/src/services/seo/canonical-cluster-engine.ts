import { ContentBlockV2 } from '../block_builder';
import { RedisStream } from '../rt-rml/queue/redis-stream';

export interface ClusterNode {
  id: string; // The primary content block ID acting as the cluster pillar
  topic: string;
  child_slugs: string[];
}

export class CanonicalClusterEngine {
  private static readonly CONTENT_UNIQUENESS_THRESHOLD = 0.8; // Minimum 80% uniqueness delta

  /**
   * Evaluates content blocks for keyword overlap and duplicate copy footprints.
   * Modifies block seo metadata to insert canonical tags.
   */
  static process(block: ContentBlockV2, existingBlocks: ContentBlockV2[]): ContentBlockV2 {
    const parentBlock = this.findClusterParent(block, existingBlocks);
    
    if (parentBlock && parentBlock.id !== block.id) {
      // Calculate content uniqueness similarity
      const uniqueness = this.calculateUniquenessDelta(block, parentBlock);
      
      if (uniqueness < this.CONTENT_UNIQUENESS_THRESHOLD) {
        // High similarity risk: force canonical link to point to the parent cluster pillar page
        block.metadata = {
          ...block.metadata,
          canonical_url: `/read/${parentBlock.slug}`,
          cluster_pillar_id: parentBlock.id,
          uniqueness_score: uniqueness,
          governance_notes: `SEO: Duplicated cluster content footprint (${(uniqueness * 100).toFixed(1)}% uniqueness)`
        };
        const violationMsg = `SEO: Low Uniqueness in Cluster (Score: ${uniqueness.toFixed(2)})`;
        block.governance.policy_violations.push(violationMsg);
        RedisStream.publish({ type: 'POLICY_VIOLATION', source: 'CanonicalClusterEngine', severity: 'MEDIUM', message: violationMsg, context: { blockId: block.id, parentId: parentBlock.id, uniqueness } }).catch(() => {});
      } else {
        // Unique enough, but links to parent cluster for semantic grouping
        block.metadata = {
          ...block.metadata,
          canonical_url: `/read/${block.slug}`, // Self-referencing canonical
          cluster_pillar_id: parentBlock.id,
          uniqueness_score: uniqueness
        };
      }
    } else {
      // Is either the cluster parent/pillar itself or has no similar siblings
      block.metadata = {
        ...block.metadata,
        canonical_url: `/read/${block.slug}`,
        cluster_pillar_id: block.id,
        uniqueness_score: 1.0
      };
    }

    return block;
  }

  /**
   * Finds the primary content pillar block for a given topic or keyword cluster.
   */
  private static findClusterParent(block: ContentBlockV2, existing: ContentBlockV2[]): ContentBlockV2 | null {
    // Sift out blocks sharing the exact focus keyword or category topic
    const topicSiblings = existing.filter(b => 
      b.id !== block.id &&
      (b.taxonomy.topic === block.taxonomy.topic || b.seo.focus_keyword === block.seo.focus_keyword)
    );

    if (topicSiblings.length === 0) return null;

    // The parent/pillar is defined as the sibling with the highest authority or older creation date
    return topicSiblings.reduce((pillar, sibling) => {
      const pillarScore = pillar.ranking.base_score || 0;
      const siblingScore = sibling.ranking.base_score || 0;
      return siblingScore > pillarScore ? sibling : pillar;
    }, topicSiblings[0]);
  }

  /**
   * Token-based Jaccard similarity distance to determine content text overlap.
   */
  private static calculateUniquenessDelta(blockA: ContentBlockV2, blockB: ContentBlockV2): number {
    const textA = blockA.blocks.map(b => b.content || '').join(' ').toLowerCase();
    const textB = blockB.blocks.map(b => b.content || '').join(' ').toLowerCase();

    const wordsA = new Set(textA.split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set(textB.split(/\s+/).filter(w => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 0.0; // Fail safe (thin pages get 0 uniqueness)

    let intersectionCount = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        intersectionCount++;
      }
    }

    const unionCount = wordsA.size + wordsB.size - intersectionCount;
    const similarity = intersectionCount / unionCount;

    // Uniqueness is the inverse of similarity
    return 1.0 - similarity;
  }
}
