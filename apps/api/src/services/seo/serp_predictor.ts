import { ContentBlockV2 } from '../block_builder';
import { CrawlSimulation } from './googlebot_emulator';

export class SERPPredictor {
  /**
   * Forecasts the SERP ranking capability of a ContentBlockV2.
   * Runs the exact approved formula:
   * SERP_SCORE = (E_E_A_T * 0.25) + (ContentDepth * 0.20) + (InternalLinkGraph * 0.15) + (CTR_Estimate * 0.15) + (BacklinkAuthority * 0.15) + (Freshness * 0.10)
   */
  static predict(block: ContentBlockV2, crawl: CrawlSimulation): { serpScore: number; eeat: number; depth: number; discoverEligibility: number } {
    // 1. E-E-A-T Score (Experience, Expertise, Authoritativeness, Trustworthiness)
    // Influenced by author details, references/citation block types, schemas, and HTTPS links.
    const authorPresent = !!block.metadata.author_name;
    const hasCitations = block.blocks.some(b => b.type === 'quote' || (b.type === 'paragraph' && String(b.content).includes('href="http')));
    const eeat = (authorPresent ? 0.6 : 0.2) + (hasCitations ? 0.4 : 0.1);

    // 2. Content Depth Score
    const textContent = block.blocks.map(b => b.content || '').join(' ');
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 2).length;
    let depth = 0.5;
    if (wordCount >= 1500) {
      depth = 1.0;
    } else if (wordCount >= 600) {
      depth = 0.8;
    } else if (wordCount < 300) {
      depth = 0.15; // Thin content penalty
    }

    // 3. Internal Link Graph Flow (Score extracted from simulator link weights)
    const linkGraph = crawl.internalLinkScore;

    // 4. CTR Estimate based on Search Intent and keyword alignment
    const intent = block.seo.search_intent;
    let ctrEstimate = 0.5;
    if (intent === 'transactional') {
      ctrEstimate = 0.85; // High buying click intent
    } else if (intent === 'commercial') {
      ctrEstimate = 0.70;
    } else if (intent === 'informational') {
      ctrEstimate = 0.45; // Broad search, lower individual page CTR
    }

    // GSC Calibration Adjustment (If past calibration metadata is available)
    if (block.metadata.gsc_ctr_avg) {
      ctrEstimate = (ctrEstimate + Number(block.metadata.gsc_ctr_avg)) / 2;
    }

    // 5. Backlink Authority (Derived from metadata or default organic floor score)
    const backlinkAuthority = Number(block.metadata.backlink_domain_authority || 0.4);

    // 6. Freshness (from simulator freshness decay)
    const freshness = crawl.freshnessScore;

    // Apply the exact formula
    const serpScore = 
      (eeat * 0.25) +
      (depth * 0.20) +
      (linkGraph * 0.15) +
      (ctrEstimate * 0.15) +
      (backlinkAuthority * 0.15) +
      (freshness * 0.10);

    // Discover Eligibility (image-rich requirements, high eeat, freshness boost)
    const hasHighResImage = block.blocks.some(b => b.type === 'image' && (b.content?.url || '').includes('http'));
    const discoverEligibility = (hasHighResImage ? 0.4 : 0.0) + (freshness * 0.3) + (eeat * 0.3);

    return {
      serpScore: Number(serpScore.toFixed(4)),
      eeat: Number(eeat.toFixed(2)),
      depth: Number(depth.toFixed(2)),
      discoverEligibility: Number(discoverEligibility.toFixed(4))
    };
  }
}
