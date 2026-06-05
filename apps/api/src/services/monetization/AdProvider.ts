import { AdSlotType, BidderType } from '../ad_auction_engine';

export interface AdContext {
  postId: string;
  slot: AdSlotType;
  trustScore: number;
}

export interface AdBid {
  bidderId: string;
  type: BidderType;
  bidValue: number; // in cents
  relevanceScore: number;
  latencyPenalty: number;
}

export interface AdProvider {
  requestAd(context: AdContext): Promise<AdBid | null>;
}
