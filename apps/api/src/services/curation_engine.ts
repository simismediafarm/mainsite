import { prisma } from '../prisma';
import { eventBus } from './event_bus';
import { CreatePostDTO } from '@simis/shared';

export class CurationEngine {
  /**
   * Processes the ContentCandidate queue.
   * Evaluates quality, dedups, enriches, and promotes to the Post table.
   */
  public static async processQueue() {
    console.log(`[CurationEngine] Starting candidate queue processing...`);
    
    const candidates = await prisma.contentCandidate.findMany({ where: { status: 'queued' }, orderBy: { createdAt: 'desc' } });
    if (candidates.length === 0) {
      console.log(`[CurationEngine] No candidates to process.`);
      return { success: true, processedCount: 0 };
    }

    let processedCount = 0;

    for (const candidate of candidates) {
      try {
        console.log(`[CurationEngine] Processing candidate: ${candidate.id}`);
        
        let normalizedData: any = {};
        if (candidate.normalizedData) {
          try {
            normalizedData = JSON.parse(candidate.normalizedData);
          } catch (e) {
            console.error(`[CurationEngine] Failed to parse normalizedData for candidate ${candidate.id}`);
          }
        }

        let trustScore = normalizedData.trustScore || 50;
        let status = 'draft';
        
        if (trustScore >= 80) {
          status = 'published';
        } else if (trustScore >= 60) {
          status = 'pending_review';
        } else {
          status = 'draft';
        }

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

        // Inline createPost
        let profile = await prisma.profile.findUnique({ where: { id: dto.authorId } });
        if (!profile) {
          profile = await prisma.profile.create({
            data: {
              id: dto.authorId,
              name: dto.authorId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
              role: 'contributor'
            }
          });
        }

        const excerpt = dto.excerpt || (dto.content.length > 160 ? dto.content.slice(0, 160) + '...' : dto.content);

        const post = await prisma.post.create({
          data: {
            title: dto.title,
            content: dto.content,
            excerpt,
            authorId: profile.id,
            status: dto.status || 'draft',
            trustScore: dto.trustScore ?? 80,
            tags: {
              connectOrCreate: dto.tags.map(t => ({
                where: { name: t.trim() },
                create: { name: t.trim() }
              }))
            }
          },
          include: { author: true, tags: true }
        });

        await prisma.eventQueueLog.create({
          data: {
            traceId: `trace_curation_${post.id}`,
            actor: 'system',
            source: 'curation_engine',
            eventType: 'CONTENT.DRAFT.CREATE',
            payload: post as any,
            status: 'COMPLETED'
          }
        });

        eventBus.emitEvent({ type: 'post_created', payload: post as any });

        await prisma.contentCandidate.update({ where: { id: candidate.id }, data: { status: 'published' } });
        console.log(`[CurationEngine] Promoted candidate to Post ID: ${post.id}`);
        
        processedCount++;
      } catch (err) {
        console.error(`[CurationEngine] Error processing candidate ${candidate.id}:`, err);
        await prisma.contentCandidate.update({ where: { id: candidate.id }, data: { status: 'rejected' } });
      }
    }

    console.log(`[CurationEngine] Processing complete. Promoted: ${processedCount}`);
    return { success: true, processedCount };
  }
}
