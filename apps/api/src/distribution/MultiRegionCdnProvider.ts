import { CdnProviderPort, CacheEntry } from "./CdnProviderPort";

export class MultiRegionCdnProvider implements CdnProviderPort {
  // We simulate multiple regions
  public regions: string[] = ["us-east", "eu-west", "ap-southeast"];
  
  // region -> key -> CacheEntry
  private cache: Map<string, Map<string, CacheEntry>> = new Map();
  // region -> tag -> keys
  private tagMap: Map<string, Map<string, Set<string>>> = new Map();

  // For programmatic fault injection
  // Map of region -> probability of failure (0 to 1)
  public failureInjectionRates: Map<string, number> = new Map();

  constructor() {
    for (const r of this.regions) {
      this.cache.set(r, new Map());
      this.tagMap.set(r, new Map());
    }
  }

  /**
   * Purges across all regions. We modify this interface slightly to return per-region status.
   * But since CdnProviderPort defines `purge` as void, we will throw a specific Error if some fail,
   * or better yet, we might want to update CdnProviderPort to return success/fail arrays.
   * Let's actually update CdnProviderPort if needed, or just throw.
   * Given Phase 8 requires returning a receipt, it's better if `purge` returns `{ successEdges, failedEdges }`.
   */
  async purgeWithReceipt(tag: string, targetEdges: string[] = this.regions): Promise<{ successEdges: string[], failedEdges: string[] }> {
    const successEdges: string[] = [];
    const failedEdges: string[] = [];

    for (const region of targetEdges) {
      const failureRate = this.failureInjectionRates.get(region) || 0;
      if (Math.random() < failureRate) {
        failedEdges.push(region);
        continue;
      }

      // Perform idempotent purge
      const regionTags = this.tagMap.get(region)!;
      const keys = regionTags.get(tag);
      if (keys) {
        const regionCache = this.cache.get(region)!;
        for (const key of keys) {
          regionCache.delete(key);
        }
        regionTags.delete(tag);
      }
      successEdges.push(region);
    }

    return { successEdges, failedEdges };
  }

  // Fallback to legacy interface
  async purge(tag: string): Promise<void> {
    await this.purgeWithReceipt(tag, this.regions);
  }

  async get(key: string, region: string = "us-east"): Promise<CacheEntry | null> {
    return this.cache.get(region)?.get(key) || null;
  }

  async set(key: string, entry: CacheEntry, tags: string[], region: string = "us-east"): Promise<void> {
    this.cache.get(region)?.set(key, entry);
    for (const tag of tags) {
      const rt = this.tagMap.get(region)!;
      if (!rt.has(tag)) rt.set(tag, new Set());
      rt.get(tag)!.add(key);
    }
  }

  clear() {
    for (const r of this.regions) {
      this.cache.get(r)?.clear();
      this.tagMap.get(r)?.clear();
    }
  }
}
