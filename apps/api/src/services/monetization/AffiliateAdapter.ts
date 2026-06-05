import { AdProvider, AdContext, AdBid } from './AdProvider';

export class AffiliateAdapter implements AdProvider {
  public async requestAd(context: AdContext): Promise<AdBid | null> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 20)); // faster than GAM

    // Affiliate excels in native content
    if (context.slot !== 'inline_native') {
      return null; // They only bid on native inline slots
    }

    const bidValue = 4.0; // High CPA value modeled as eCPM equivalent

    return {
      bidderId: 'affiliate-network-1',
      type: 'affiliate_network',
      bidValue,
      relevanceScore: 0.9,
      latencyPenalty: 0.0
    };
  }
}
