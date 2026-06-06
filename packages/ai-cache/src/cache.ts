import Redis from 'ioredis';
import { prisma } from '@simis/database';

// Basic cache structure for semantic caching + immutable snapshots
export class AICache {
  private redis: Redis;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      }
    });
  }

  /**
   * Retrieves a cached IntelligenceSnapshot based on the input hash
   */
  async getSnapshot(inputHash: string): Promise<any | null> {
    const cached = await this.redis.get(`simis:ai:snapshot:${inputHash}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Saves an immutable snapshot.
   * TTL is set to 30 days by default.
   */
  async saveSnapshot(inputHash: string, data: any, ttlDays: number = 30): Promise<void> {
    const ttlSeconds = 60 * 60 * 24 * ttlDays;
    await this.redis.set(
      `simis:ai:snapshot:${inputHash}`,
      JSON.stringify(data),
      'EX',
      ttlSeconds
    );
  }

  async checkSemanticCache(embedding: number[], similarityThreshold: number = 0.85): Promise<any | null> {
    try {
      // Prisma $queryRaw parameterization for vector is tricky.
      // We format the array to a string representation '[1,2,3]'
      const embeddingString = `[${embedding.join(',')}]`;
      
      const result = await prisma.$queryRaw`
        SELECT "inputHash", confidence,
               1 - (embedding <=> ${embeddingString}::vector) AS similarity
        FROM "analytics"."IntelligenceSnapshot"
        WHERE 1 - (embedding <=> ${embeddingString}::vector) > ${similarityThreshold}
        ORDER BY similarity DESC
        LIMIT 1
      `;
      if (Array.isArray(result) && result.length > 0) {
        const closestMatch = result[0];
        // Now fetch the actual output payload from Redis using the inputHash
        const payload = await this.getSnapshot(closestMatch.inputHash);
        if (payload) {
          return {
            ...payload,
            semantic_similarity: closestMatch.similarity,
            semantic_confidence: closestMatch.confidence
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('[AICache] checkSemanticCache failed:', err);
      return null;
    }
  }
}
