export class GeoWeightEngine {
  private static readonly GEO_MULTIPLIERS: Record<string, number> = {
    'US': 1.5,
    'GB': 1.3,
    'CA': 1.2,
    'SG': 1.2,
    'AU': 1.2,
    'DE': 1.1,
    'FR': 1.1,
    'JP': 1.1,
    'ID': 0.8,
    'IN': 0.7
  };

  /**
   * Returns the revenue weight multiplier for a given country code (ISO 3166-1 alpha-2).
   * Defaults to 1.0.
   */
  static getWeight(countryCode: string): number {
    if (!countryCode) return 1.0;
    const normalized = countryCode.trim().toUpperCase();
    return this.GEO_MULTIPLIERS[normalized] ?? 1.0;
  }
}
