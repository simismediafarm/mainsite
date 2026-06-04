import { ContentBlockV2 } from './block_builder';

import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';

export class FeedStabilityLockEngine {
  static readonly LOCK_WINDOW_MS = 300 * 1000; // 300 seconds

  static async getLockedOrder(sessionId: string, currentHash: string): Promise<string[] | null> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('feed_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (data && new Date(data.expires_at).getTime() > Date.now()) {
      // Identity validation: if the feed hash has drifted, the lock is invalid
      if (data.feed_hash === currentHash) {
        return data.ordered_ids;
      }
    }
    return null;
  }

  static async lockOrder(sessionId: string, feedHash: string, orderIds: string[]): Promise<void> {
    const supabase = getSupabase();
    await supabase.from('feed_snapshots').upsert({
      session_id: sessionId,
      feed_hash: feedHash,
      ordered_ids: orderIds,
      expires_at: new Date(Date.now() + this.LOCK_WINDOW_MS).toISOString()
    });
  }
  
  static async unlock(sessionId: string): Promise<void> {
    const supabase = getSupabase();
    await supabase.from('feed_snapshots').delete().eq('session_id', sessionId);
  }
}

export class RankingStateReconciler {
  static validate(blocks: ContentBlockV2[]): ContentBlockV2[] {
    // Ensures backend authority: drops any blocks not properly structured or overrides frontend attempts to manipulate.
    return blocks.map(b => {
      // Re-apply fraud check boundaries
      if (b.governance.fraud_score > 80) {
        b.ranking.rpm_score = 0;
        b.ranking.affiliate_score = 0;
      }
      return b;
    });
  }
}

export class RankingArbitrationKernel {
  /**
   * Final Ranking Formula:
   * Context-free computation based on pure DB state.
   */
  static computeFinalScore(block: ContentBlockV2): number {
    if (block.execution_lock.is_pinned) {
      return 9999; // Pinned blocks always win
    }
    
    if (!block.governance.is_safe || block.governance.fraud_score > 90) {
      return -9999; // Penalize fraudulent blocks
    }

    const { engagement_score, seo_score, affiliate_score, rpm_score } = block.ranking;
    
    // geo_multiplier removed from base score computation. Base score must be context-free.
    let score = 
      (engagement_score * 0.30) + 
      (seo_score * 0.20) + 
      (affiliate_score * 0.25) + 
      (rpm_score * 0.15);
      
    // Apply delivery overrides
    if (block.delivery.layout_variant === "seo_boosted") {
      score += 5; 
    }
    
    return score;
  }

  static async arbitrate(blocks: ContentBlockV2[], sessionId: string): Promise<ContentBlockV2[]> {
    let reconciled = RankingStateReconciler.validate(blocks);
    
    // Compute a hash of the current candidate set to detect drift
    const contentIds = reconciled.map(b => b.id).sort().join(',');
    const hashInt = contentIds.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const feedHash = Math.abs(hashInt).toString(16);
    
    const lockedOrder = await FeedStabilityLockEngine.getLockedOrder(sessionId, feedHash);
    
    if (lockedOrder) {
      // Restore order based on lock
      const orderedBlocks: ContentBlockV2[] = [];
      const blocksMap = new Map(reconciled.map(b => [b.id, b]));
      
      for (const id of lockedOrder) {
        if (blocksMap.has(id)) {
          orderedBlocks.push(blocksMap.get(id)!);
          blocksMap.delete(id);
        }
      }
      
      // Append any new blocks not in the lock
      for (const block of blocksMap.values()) {
        block.ranking.base_score = this.computeFinalScore(block);
        orderedBlocks.push(block);
      }
      
      // Sort only the un-locked trailing elements if any
      const lockedLength = lockedOrder.length;
      const sortedTail = orderedBlocks.slice(lockedLength).sort((a, b) => b.ranking.base_score - a.ranking.base_score);
      
      return [...orderedBlocks.slice(0, lockedLength), ...sortedTail];
    }
    
    // No lock found or hash mismatch, perform full re-rank
    reconciled.forEach(block => {
      block.ranking.base_score = this.computeFinalScore(block);
    });
    
    reconciled.sort((a, b) => b.ranking.base_score - a.ranking.base_score);
    
    // Lock the new order
    await FeedStabilityLockEngine.lockOrder(sessionId, feedHash, reconciled.map(b => b.id));
    
    return reconciled;
  }
}
