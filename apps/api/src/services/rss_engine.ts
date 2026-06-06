import { prisma } from '../prisma';
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { IngestionEngine } from './ingestion';

export class RSSEngine {
  /**
   * Pulls feeds from database configured RSS sources.
   * Pushes raw extracted articles into the ContentCandidate queue.
   */
  public static async aggregate() {
    console.log(`[RSSEngine] Starting RSS aggregation cycle...`);
    
    // Fetch registered active RSS sources
    const sources = await prisma.rssSource.findMany({
      where: { status: 'active' }
    });

    if (sources.length === 0) {
      console.log(`[RSSEngine] No active RSS sources found. Add some to RssSource table.`);
      return { success: true, ingestedCount: 0 };
    }

    const parser = new Parser();
    let ingestedCount = 0;

    for (const source of sources) {
      try {
        console.log(`[RSSEngine] Fetching RSS feed: ${source.url}`);
        const feed = await parser.parseURL(source.url);

        for (const item of feed.items) {
          if (!item.title || !item.link) continue;

          // Attempt to ingest via IngestionEngine to ensure deduplication and normalization
          const res = await IngestionEngine.ingest('rss', {
            title: item.title,
            content: item.content || item.contentSnippet || '',
            sourceUrl: item.link,
            authorId: undefined, // RSS authors are typically string names, mapped later if needed
            tags: item.categories
          });

          if (res.success) {
            ingestedCount++;
          }
        }
      } catch (err: any) {
        console.error(`[RSSEngine] Failed to parse RSS source ${source.url}:`, err.message);
      }
    }

    console.log(`[RSSEngine] Aggregation cycle complete. Ingested: ${ingestedCount}`);
    return { success: true, ingestedCount };
  }
}
