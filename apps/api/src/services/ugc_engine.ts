import { prisma } from '../prisma';

export interface UGCSubmissionPayload {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  authorId: string;
}

export class UGCEngine {
  /**
   * Submit new User Generated Content directly to the universal candidate queue.
   * UGC has higher initial trust and requires human/editorial review or curation.
   */
  public static async submit(payload: UGCSubmissionPayload) {
    console.log(`[UGCEngine] Processing UGC submission from author: ${payload.authorId}`);
    
    // Normalize and sanitize UGC payload
    const title = payload.title.trim();
    const content = payload.content.trim();
    
    if (!title || !content) {
      return { success: false, reason: 'invalid_payload' };
    }

    const candidate = await prisma.contentCandidate.create({
      data: {
        sourceType: 'editorial', // We classify UGC as editorial source tier
        title,
        rawContent: content,
        extractedTags: payload.tags?.join(','),
        normalizedData: JSON.stringify({
          authorId: payload.authorId,
          excerpt: payload.excerpt,
          trustScore: 85 // Higher baseline for UGC
        }),
        status: 'queued'
      }
    });

    console.log(`[UGCEngine] Successfully queued UGC Candidate ID: ${candidate.id}`);
    
    return { success: true, candidate };
  }
}
