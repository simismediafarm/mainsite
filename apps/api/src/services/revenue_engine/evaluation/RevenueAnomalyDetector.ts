import { RevenueResult } from './RevenueScorer';

export interface RevenueAnomaly {
  anomalyDetected: boolean;
  type: string;
  reason: string;
}

export class RevenueAnomalyDetector {
  public detect(result: RevenueResult): RevenueAnomaly | null {
    if (result.revenueScore < 0.1 && result.monetizationPotential > 0.8) {
      return {
        anomalyDetected: true,
        type: 'revenue_collapse',
        reason: 'High potential but near-zero final revenue score.'
      };
    }

    if (result.revenueScore > 0.8 && result.confidence < 0.4) {
      return {
        anomalyDetected: true,
        type: 'confidence_collapse',
        reason: 'High revenue score generated with weak supporting signals.'
      };
    }

    return null;
  }
}
