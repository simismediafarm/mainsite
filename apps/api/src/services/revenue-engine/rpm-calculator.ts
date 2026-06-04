import { ContentBlockV2 } from '../block_builder';
import { GeoWeightEngine } from './geo-weight-engine';

export interface RPMSimulationInput {
  ctr: number; // 0.0 to 1.0 click-through rate
  dwell_time_seconds: number;
  conversion_probability: number; // 0.0 to 1.0
  geo: string;
  intent_strength: number; // 0.0 to 1.0 (e.g. transactional intent score)
}

export class RPMCalculator {
  /**
   * Computes the RPM Score based on the production formula:
   * RPM_SCORE = (CTR * 0.25) + (DwellTimeNorm * 0.20) + (ConversionProb * 0.25) + (GeoMultiplier * 0.10) + (IntentStrength * 0.20)
   */
  static calculateScore(input: RPMSimulationInput): number {
    const ctr = Math.min(1.0, Math.max(0.0, input.ctr));
    
    // Normalize dwell time (cap at 120s for normalization, typical reading limit)
    const normDwell = Math.min(1.0, Math.max(0.0, input.dwell_time_seconds / 120.0));
    
    const convProb = Math.min(1.0, Math.max(0.0, input.conversion_probability));
    
    const geoMult = GeoWeightEngine.getWeight(input.geo);
    // Normalize geo weight to a 0.0-1.0 boundary for the formula (US/max = 1.5 -> maps to 1.0, others scaled accordingly)
    const normGeo = Math.min(1.0, geoMult / 1.5);
    
    const intentStr = Math.min(1.0, Math.max(0.0, input.intent_strength));

    const score = (ctr * 0.25) + (normDwell * 0.20) + (convProb * 0.25) + (normGeo * 0.10) + (intentStr * 0.20);
    return Number(score.toFixed(4));
  }

  /**
   * Evaluates a ContentBlockV2 to predict its RPM score using its recorded telemetry and metadata.
   */
  static evaluateBlock(block: ContentBlockV2, geo: string): number {
    // Map intent to numerical score
    let intentStrength = 0.2; // Informational default
    if (block.seo.search_intent === 'commercial') intentStrength = 0.7;
    else if (block.seo.search_intent === 'transactional') intentStrength = 1.0;

    // Retrieve historical telemetry values or fallback to default base rates
    const views = block.telemetry.views || 1;
    const clicks = block.telemetry.clicks || 0;
    const ctr = views > 0 ? clicks / views : 0.02;

    const conversionProbability = block.type === 'affiliate' ? 0.05 : 0.01;

    return this.calculateScore({
      ctr,
      dwell_time_seconds: block.telemetry.avg_dwell_time || 15,
      conversion_probability: conversionProbability,
      geo,
      intent_strength: intentStrength
    });
  }
}
