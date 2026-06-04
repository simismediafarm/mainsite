export class SafeRLGuard {
  static frozen = false;
  static anomalyScore = 0;

  static evaluate(metrics: {
    rpmDrop: number;
    ctrSpike: number;
    fraudRate: number;
  }) {
    this.anomalyScore =
      metrics.rpmDrop * 0.4 +
      metrics.ctrSpike * 0.3 +
      metrics.fraudRate * 0.3;

    if (this.anomalyScore > 0.7) {
      this.freeze();
    }
  }

  static freeze() {
    this.frozen = true;
    console.log("[RT-RML] ⚠️ SYSTEM FROZEN — fallback to deterministic kernel");
  }

  static isActive() {
    return !this.frozen;
  }
}
