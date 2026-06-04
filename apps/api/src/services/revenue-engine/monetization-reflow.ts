import { ContentBlockV2 } from '../block_builder';
import { RevenueGovernorService } from '../monetization_dsl';
import { GeoWeightEngine } from './geo-weight-engine';

export interface ReflowContext {
  geo: string;
  device: "mobile" | "desktop";
  scroll_depth?: number; // 0 to 100 percentage
  dwell_time_seconds?: number;
}

export class MonetizationReflowEngine {
  /**
   * Evaluates user context and applies dynamic monetization reflow to the content feed.
   * Completely server-authoritative.
   */
  static reflow(feed: ContentBlockV2[], context: ReflowContext): ContentBlockV2[] {
    const geo = context.geo || 'US';
    const device = context.device || 'desktop';
    const scrollDepth = context.scroll_depth ?? 0;
    const dwellTime = context.dwell_time_seconds ?? 0;

    // 1. Calculate Geo Multipliers
    const geoWeight = GeoWeightEngine.getWeight(geo);

    // 2. Iterate through feed and assign layout overrides
    let reflowedFeed: ContentBlockV2[] = feed.map((block) => {
      // Initialize resolved slots if they don't exist
      const blockSlots: Record<string, string> = { ...block.resolved_slots };

      // Apply dynamic above-fold rule: HERO_AD is always active for desktop, device optimized
      if (device === 'desktop') {
        blockSlots['hero_ad_slot'] = 'gpt_banner_728x90';
      } else {
        blockSlots['hero_ad_slot'] = 'gpt_mobile_320x50';
      }

      // Ad/Affiliate suppression based on scroll depth (Anti-intrusion check)
      const shouldSuppressAds = scrollDepth < 30 && dwellTime < 10;
      
      // Inline placement decisions
      if (shouldSuppressAds) {
        // Suppress all inline advertisement slots
        delete blockSlots['inline_ad_1'];
        delete blockSlots['inline_ad_2'];
        delete blockSlots['sticky_mobile_cta'];
      } else {
        // High engagement: User is reading or scrolling down. Ingest monetization options
        if (dwellTime > 20 || scrollDepth > 40) {
          if (block.seo.search_intent === 'transactional' || block.seo.search_intent === 'commercial') {
            blockSlots['inline_affiliate_1'] = 'deal_card_cta';
            block.delivery.layout_variant = 'affiliate_heavy';
          } else {
            blockSlots['inline_ad_1'] = 'gpt_native_midfeed';
          }
        }
        
        // Sticky mobile bottom zone
        if (device === 'mobile' && scrollDepth > 50) {
          blockSlots['sticky_mobile_cta'] = 'mobile_thumb_cta';
        }
      }

      // Adjust ranking score dynamically depending on Geo value
      const adjustedRanking = {
        ...block.ranking,
        geo_multiplier: geoWeight,
        score: block.ranking.score * geoWeight
      };

      return {
        ...block,
        resolved_slots: blockSlots,
        ranking: adjustedRanking
      };
    });

    // 3. Enforce global revenue governor constraints
    reflowedFeed = RevenueGovernorService.enforceDensity(reflowedFeed);

    return reflowedFeed;
  }
}
