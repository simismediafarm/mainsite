import { SourceType, CreatePostDTO } from '@simis/shared';
import { prisma } from '../prisma';
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
    if (await this.isDuplicate(normalized.title, normalized.sourceUrl)) {
      console.log(`[IngestionEngine] Duplicate detected. Skipping ingestion: ${normalized.title}`);
      return { success: false, reason: 'duplicate' };
    }

    // 3. Push to ContentCandidate Queue
    const candidate = await prisma.contentCandidate.create({
      data: {
        sourceType: source,
        sourceUrl: normalized.sourceUrl,
        title: normalized.title,
        rawContent: normalized.content,
        extractedTags: normalized.tags?.join(','),
        normalizedData: JSON.stringify({ authorId: normalized.authorId, excerpt: normalized.excerpt }),
        status: 'queued'
      }
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

  private static async isDuplicate(title: string, sourceUrl?: string): Promise<boolean> {
    // 1. Check ContentCandidates
    if (sourceUrl) {
      const existingCandidateUrl = await prisma.contentCandidate.findFirst({ where: { sourceUrl } });
      if (existingCandidateUrl) return true;
    }
    const existingCandidateTitle = await prisma.contentCandidate.findFirst({ where: { title } });
    if (existingCandidateTitle) return true;

    // 2. Check Posts
    const existingPost = await prisma.post.findFirst({ where: { title } });
    if (existingPost) return true;

    return false;
  }
}
