import { SourceType, CreatePostDTO } from '@simis/shared';
import { db } from '../store/sqlite_db';
import { createHash } from 'crypto';

interface IngestionPayload {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  authorId?: string;
  sourceUrl?: string; // specific to ingestion
}

export class IngestionEngine {
  // Trust scores based on architecture JSON
  private static readonly TRUST_SCORES: Record<SourceType, number> = {
    manual: 80,
    webhook: 70,
    api: 60,
    rss: 50
  };

  /**
   * Main entry point for ingesting content from any external source.
   * All content MUST go to content_candidates first.
   */
  public static async ingest(source: SourceType, payload: IngestionPayload) {
    console.log(`[IngestionEngine] Ingesting content via ${source}`);
    
    // 1. Normalize Schema
    const normalized = this.normalize(payload);

    // 2. Deduplicate against existing candidates or posts
    const hash = this.generateHash(normalized.title, normalized.content);
    if (await this.isDuplicate(hash)) {
      console.log(`[IngestionEngine] Duplicate detected. Skipping ingestion. Hash: ${hash}`);
      return { success: false, reason: 'duplicate' };
    }

    // 3. Push to ContentCandidate Queue
    const candidate = await db.createContentCandidate({
      sourceType: source,
      sourceUrl: normalized.sourceUrl,
      title: normalized.title,
      rawContent: normalized.content,
      extractedTags: normalized.tags?.join(','),
      normalizedData: JSON.stringify({ authorId: normalized.authorId, excerpt: normalized.excerpt })
    });

    console.log(`[IngestionEngine] Successfully queued ContentCandidate ID: ${candidate.id}`);
    
    // For MVP testing, return the candidate
    return { success: true, candidate };
  }

  private static normalize(payload: IngestionPayload): IngestionPayload {
    // Basic normalization: strip excessive whitespace, sanitize tags
    return {
      title: payload.title.trim(),
      content: payload.content.trim(),
      excerpt: payload.excerpt?.trim(),
      authorId: payload.authorId?.trim(),
      tags: payload.tags?.map(t => t.toLowerCase().trim()),
      sourceUrl: payload.sourceUrl?.trim()
    };
  }

  private static generateHash(title: string, content: string): string {
    return createHash('sha256').update(`${title}||${content}`).digest('hex');
  }

  private static async isDuplicate(hash: string): Promise<boolean> {
    // For MVP, we iterate posts. In prod, we use a hash index/set.
    const allPosts = await db.getAllPosts();
    for (const p of allPosts) {
      const pHash = this.generateHash(p.title, p.content);
      if (pHash === hash) return true;
    }
    return false;
  }
}
