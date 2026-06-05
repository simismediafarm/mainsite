import { Post } from '@simis/shared';
import { db } from '../store/sqlite_db';
import { RevenueEngine } from './revenue_engine';
import { GoogleAdManagerAdapter } from './monetization/GoogleAdManagerAdapter';
import { AffiliateAdapter } from './monetization/AffiliateAdapter';
import { AdProvider, AdContext, AdBid } from './monetization/AdProvider';

export type AdSlotType = 'top_banner' | 'inline_native' | 'mid_article' | 'footer_card';
export type BidderType = 'direct_advertiser' | 'affiliate_network' | 'programmatic_exchange' | 'house_ads';

export interface AuctionResult {
  slot: AdSlotType;
  winningBidder: BidderType;
  winningBidValue: number; // in cents
  score: number;
}

export class AdAuctionEngine {
  private static providers: AdProvider[] = [
    new GoogleAdManagerAdapter(),
    new AffiliateAdapter()
  ];

  /**
   * Run auction simulation for a single slot using real adapters
   */
  public static async runAuction(post: any, slot: AdSlotType): Promise<AuctionResult> {
    const trust = post.trustScore || 50;
    const normalizedTrust = trust / 100;
    
    // Simulate context boost based on slot type
    const contextBoosts: Record<AdSlotType, number> = {
      'top_banner': 0.5,
      'inline_native': 0.8, // Native is more engaging
      'mid_article': 0.3,
      'footer_card': 0.1
    };
    
    const contextBoost = contextBoosts[slot];

    let winningBid: AdBid | null = null;
    let highestScore = -Infinity;

    const context: AdContext = {
      postId: post.id,
      slot,
      trustScore: normalizedTrust
    };

    // Request bids in parallel from all providers
    const bids = await Promise.all(this.providers.map(p => p.requestAd(context)));

    for (const bid of bids) {
      if (!bid) continue;

      const score = (bid.bidValue * bid.relevanceScore * normalizedTrust) - bid.latencyPenalty + contextBoost;

      if (score > highestScore) {
        highestScore = score;
        winningBid = bid;
      }
    }

    // Default to house ads if somehow everything fails
    if (!winningBid) {
      winningBid = {
        bidderId: 'house-1',
        type: 'house_ads',
        bidValue: 0.5,
        relevanceScore: 1.0,
        latencyPenalty: 0.0
      };
      highestScore = 0;
    }

    return {
      slot,
      winningBidder: winningBid.type,
      winningBidValue: winningBid.bidValue,
      score: highestScore
    };
  }

  /**
   * Run auction for all allowed slots on a post, and update revenue
   */
  public static async executeAuctionsForPost(postId: string, allowedSlots: AdSlotType[]): Promise<AuctionResult[]> {
    const post = await db.getPost(postId);
    if (!post) return [];

    const results: AuctionResult[] = [];
    let totalRevenueDelta = 0;

    for (const slot of allowedSlots) {
      const result = await this.runAuction(post, slot);
      results.push(result);
      totalRevenueDelta += result.winningBidValue;
    }

    // Record the total generated impression revenue
    await RevenueEngine.recordImpression(postId, totalRevenueDelta);

    // Emit auction event
    db.emitEvent({
      type: 'ad_auction_executed',
      payload: { id: postId, results, totalRevenueDelta }
    });

    return results;
  }
}
