import { db } from '../store/sqlite_db';

export class APIEngine {
  /**
   * Processes an incoming webhook/API push payload.
   * Pushes raw extracted articles into the ContentCandidate queue.
   */
  public static async processWebhook(provider: string, payload: any) {
    console.log(`[APIEngine] Receiving webhook from provider: ${provider}`);
    
    // In a real scenario, this normalizes different provider payloads
    const title = payload.title || payload.headline || 'Untitled API Content';
    const content = payload.content || payload.body || payload.text;
    const url = payload.url || payload.source_url;

    if (!content) {
      return { success: false, reason: 'missing_content' };
    }

    const candidate = await db.createContentCandidate({
      sourceType: 'api',
      sourceUrl: url,
      title: title,
      rawContent: content,
      normalizedData: JSON.stringify({
        provider,
        trustScore: 60 // API has medium trust score
      })
    });

    console.log(`[APIEngine] Queued API Candidate ID: ${candidate.id}`);
    
    return { success: true, candidate };
  }
}
