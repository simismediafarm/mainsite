export class FraudFilter {
  static readonly REWARD_ZERO = 0;
  static readonly PENALTY = -1;
  static readonly BLACKHOLE_SESSION = -999;

  static validateTelemetry(input: {
    clicksPerMinute: number;
    avgDwellMs: number;
    scrollEntropy: number;
    clicked: boolean;
  }): number {
    if (input.clicksPerMinute > 10) return this.BLACKHOLE_SESSION;
    if (input.avgDwellMs < 300) return this.REWARD_ZERO;
    if (input.scrollEntropy < 5 && input.clicked === true) return this.PENALTY;

    return 1; // Valid signal multiplier
  }

  static computePenalty(input: {
    clicksPerMinute: number;
    avgDwellMs: number;
  }): number {
    let penalty = 0;

    if (input.clicksPerMinute > 5) penalty += 0.4;
    if (input.avgDwellMs < 800) penalty += 0.3;

    return Math.min(penalty, 0.9);
  }
}
