import { MonetizationExecutor, MonetizationTarget } from './monetization_executor';
import { RiskEngine } from './risk_engine';
import { prisma } from '../prisma';

export interface FeedPayload {
  sourceId: string;
  items: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    url: string;
  }>;
}

export class FeedCompiler {
  
  static async compile(payload: FeedPayload): Promise<{ processed: number, valid: number, rejected: number }> {
    console.log(`[FeedCompiler] Starting single-pass pipeline for source ${payload.sourceId}`);
    
    let processed = 0;
    let valid = 0;
    let rejected = 0;

    for (const item of payload.items) {
      processed++;
      
      // Step 1: Risk Assessment
      const riskEvaluation = await RiskEngine.evaluateContent(item.content, item.title);
      
      if (!riskEvaluation.isApproved) {
        console.warn(`[FeedCompiler] Item ${item.id} rejected due to risk flags: ${riskEvaluation.flags.join(', ')}`);
        rejected++;
        continue;
      }

      // Step 2: Content Transformation (e.g. AI-spinning or cleaning if needed)
      // Here we assume standard transformation logic if necessary
      
      // Step 3: Monetization Execution Bridge
      const monetizationTarget: MonetizationTarget = {
        contentId: item.id,
        tags: item.tags
      };
      
      await MonetizationExecutor.execute(monetizationTarget);

      // Step 4: Persist compiled item to DB
      await prisma.eventQueueLog.create({
        data: {
          id: `feed_${item.id}_${Date.now()}`,
          traceId: `feed_${payload.sourceId}`,
          eventType: 'FEED.COMPILED',
          payload: { sourceId: payload.sourceId, itemId: item.id, tags: item.tags, url: item.url },
          status: 'COMPLETED',
        }
      });
      valid++;
    }

    return { processed, valid, rejected };
  }
}
