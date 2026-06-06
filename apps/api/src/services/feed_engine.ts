import { Post } from '@simis/shared';
import { prisma } from '../prisma';

export class FeedEngine {
  /**
   * Deterministic ranking function (v1.2)
   * Formula: score = (likes * 2) + views + trust_score * 3 + rpmReal * 4 + editorial_boost + recency_boost
   * @param posts The list of posts to rank
   */
  public static rankFeed(posts: any[]): any[] {
    const now = Date.now();
    const rankedPosts = posts.map(post => {
      // Calculate recency boost (exponential decay over 7 days)
      const ageMs = now - post.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 10 * Math.exp(-ageDays / 2)); // halflife of ~1.4 days

      // Calculate base score components
      const likesScore = (post.likes || 0) * 2;
      const viewsScore = (post.views || 0) * 1;
      const trustScoreBoost = (post.trustScore || 0) * 3;
      
      // V1.2 Revenue & Editorial Signals
      const rpmScore = (post.rpmReal || 0) * 4;
      const editorialBoost = post.status === 'featured' ? 50 : (post.editorialBoost || 0);

      const totalScore = likesScore + viewsScore + trustScoreBoost + rpmScore + editorialBoost + recencyBoost;

      return {
        post,
        score: totalScore
      };
    });

    // Sort descending by score
    rankedPosts.sort((a, b) => b.score - a.score);

    return rankedPosts.map(rp => rp.post);
  }

  public static async getRankedFeed(tag?: string, authorId?: string, query?: string): Promise<any[]> {
    let whereClause: any = {};
    if (tag) {
      whereClause.tags = { some: { name: tag } };
    }
    if (authorId) {
      whereClause.authorId = authorId;
    }
    if (query) {
      whereClause.title = { contains: query };
    }

    const rawPosts = await prisma.post.findMany({
      where: whereClause,
      include: { author: true, tags: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // 2. Filter to only published/featured/monetized/ranked posts
    const activePosts = rawPosts.filter((p: any) => ['published', 'featured', 'ranked', 'monetized'].includes(p.status));

    // 3. Rank them
    const ranked = this.rankFeed(activePosts);

    return ranked;
  }
}
