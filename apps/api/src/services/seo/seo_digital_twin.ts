import { ContentBlockV2, Block } from '../block_builder';
import { GooglebotEmulator } from './googlebot_emulator';
import { SERPPredictor } from './serp_predictor';

export interface TwinSimulationReport {
  originalScore: number;
  simulatedScore: number;
  delta: number;
  discoverEligibilityDelta: number;
  recommendations: string[];
}

export class SEODigitalTwin {
  /**
   * Simulates the exact SEO/SERP delta impact of potential content edits before writing to database.
   */
  static simulateChanges(
    block: ContentBlockV2, 
    edits: {
      title?: string;
      additionalBlocks?: Block[];
      focusKeyword?: string;
      tags?: string[];
    }
  ): TwinSimulationReport {
    // 1. Run Baseline Simulation
    const baseCrawl = GooglebotEmulator.simulate(block);
    const baseSERP = SERPPredictor.predict(block, baseCrawl);

    // 2. Clone block and apply proposed edits
    const twinBlock: ContentBlockV2 = JSON.parse(JSON.stringify(block));
    
    if (edits.title) {
      twinBlock.title = edits.title;
    }
    if (edits.additionalBlocks) {
      twinBlock.blocks = [...twinBlock.blocks, ...edits.additionalBlocks];
    }
    if (edits.focusKeyword) {
      twinBlock.seo.focus_keyword = edits.focusKeyword;
    }
    if (edits.tags) {
      twinBlock.taxonomy.tags = [...new Set([...twinBlock.taxonomy.tags, ...edits.tags])];
    }

    // 3. Run Simulated Simulation
    const twinCrawl = GooglebotEmulator.simulate(twinBlock);
    const twinSERP = SERPPredictor.predict(twinBlock, twinCrawl);

    // 4. Calculate Delta and construct actionable advice
    const delta = Number((twinSERP.serpScore - baseSERP.serpScore).toFixed(4));
    const discoverDelta = Number((twinSERP.discoverEligibility - baseSERP.discoverEligibility).toFixed(4));
    const recommendations: string[] = [];

    if (delta > 0.05) {
      recommendations.push(`TWIN: Edits will yield a strong positive SERP impact (+${(delta * 100).toFixed(1)}%). Proceed with change.`);
    } else if (delta < -0.05) {
      recommendations.push(`TWIN WARNING: Edits will negatively affect search rankings (-${(Math.abs(delta) * 100).toFixed(1)}%). Revert keyword density or title changes.`);
    } else {
      recommendations.push('TWIN: Neutral organic visibility shifts. Check Discover triggers for CTR boosting.');
    }

    return {
      originalScore: baseSERP.serpScore,
      simulatedScore: twinSERP.serpScore,
      delta,
      discoverEligibilityDelta: discoverDelta,
      recommendations
    };
  }
}
