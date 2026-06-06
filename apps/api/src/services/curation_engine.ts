import { db } from '../store/mvp_db';
import { CreatePostDTO } from '@simis/shared';

export class CurationEngine {
  /**
   * Processes the ContentCandidate queue.
   * Evaluates quality, dedups, enriches, and promotes to the Post table.
   */
  public static async processQueue() {
    console.log(`[CurationEngine] Starting candidate queue processing...`);
    
    const candidates = await db.getContentCandidates('queued');
    if (candidates.length === 0) {
      console.log(`[CurationEngine] No candidates to process.`);
      return { success: true, processedCount: 0 };
    }

    let processedCount = 0;

    for (const candidate of candidates) {
      try {
        console.log(`[CurationEngine] Processing candidate: ${candidate.id}`);
        
        // 1. Parse Normalized Data
        let normalizedData: any = {};
        if (candidate.normalizedData) {
          try {
            normalizedData = JSON.parse(candidate.normalizedData);
          } catch (e) {
            console.error(`[CurationEngine] Failed to parse normalizedData for candidate ${candidate.id}`);
          }
        }

        // 2. Evaluate Quality & Trust
        let trustScore = normalizedData.trustScore || 50;
        let status = 'draft';
        
        // Auto-approve high trust candidates (e.g., UGC)
        if (trustScore >= 80) {
          status = 'published';
        } else if (trustScore >= 60) {
          status = 'pending_review';
        } else {
          status = 'draft';
        }

        // 3. Promote to Post
        const dto: CreatePostDTO = {
          title: candidate.title,
          content: candidate.rawContent,
          excerpt: normalizedData.excerpt,
          authorId: normalizedData.authorId || `system-${candidate.sourceType}`,
          tags: candidate.extractedTags ? candidate.extractedTags.split(',') : [candidate.sourceType],
          sourceType: candidate.sourceType as any,
          status: status as any,
          trustScore: trustScore
        };

        const post = await db.createPost(dto);
        
        // 4. Mark Candidate as Published
        await db.updateContentCandidateStatus(candidate.id, 'published');
        console.log(`[CurationEngine] Promoted candidate to Post ID: ${post.id}`);
        
        processedCount++;
      } catch (err) {
        console.error(`[CurationEngine] Error processing candidate ${candidate.id}:`, err);
        await db.updateContentCandidateStatus(candidate.id, 'rejected');
      }
    }

    console.log(`[CurationEngine] Processing complete. Promoted: ${processedCount}`);
    return { success: true, processedCount };
  }
}
