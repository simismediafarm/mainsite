export interface CachedArtifact {
  cssVariables: Record<string, string>;
  componentMappings: Record<string, any>;
  provenance: {
    compiledFromBundleHash: string;
    compiledAt: string;
    compiledBy: string;
    compilerVersion: string;
    compilerHash: string;
    dependencyFingerprint: string;
    artifactSignature: string;
    sourceManifest: {
      themeVersionUid: string;
      tokenVersionUids: string[];
      motionVersionUids: string[];
      iconVersionUids: string[];
      componentStyleVersionUids: string[];
    };
  };
}

export interface CacheEntry {
  value: CachedArtifact;
  softExpiresAt: number;
  hardExpiresAt: number;
}

export class ArtifactCache {
  private static cache = new Map<string, CacheEntry>();
  // 2-level mapping to support resolution by themeId without fetching
  private static latestKeys = new Map<string, string>();
  
  // Promise coalescing map
  private static pendingFetches = new Map<string, Promise<CachedArtifact>>();

  // Telemetry metrics
  public static metrics = {
    artifact_cache_hit: 0,
    artifact_cache_miss: 0,
    artifact_cache_stale: 0,
    artifact_cache_refresh: 0,
    artifact_cache_rejected_signature: 0,
    artifact_cache_bundle_mismatch: 0,
  };

  private static BASE_SOFT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private static BASE_HARD_TTL_MS = 60 * 60 * 1000; // 60 minutes

  static resetMetrics() {
    this.metrics = {
      artifact_cache_hit: 0,
      artifact_cache_miss: 0,
      artifact_cache_stale: 0,
      artifact_cache_refresh: 0,
      artifact_cache_rejected_signature: 0,
      artifact_cache_bundle_mismatch: 0,
    };
  }

  static getJitteredTTL(baseTTL: number): number {
    const jitterPercent = 0.1; // 10%
    const jitter = baseTTL * jitterPercent;
    // random between -jitter and +jitter
    const randomJitter = (Math.random() * 2 - 1) * jitter;
    return baseTTL + randomJitter;
  }

  static generateKey(
    tenantId: string,
    workspace: string | undefined,
    environment: string,
    dependencyFingerprint: string,
    compilerVersion: string
  ): string {
    const ws = workspace || "default";
    return `${tenantId}:${ws}:${environment}:${dependencyFingerprint}:${compilerVersion}`;
  }

  static generateLatestPointerKey(
    tenantId: string,
    workspace: string | undefined,
    environment: string,
    themeId: string
  ): string {
    const ws = workspace || "default";
    return `latest:${tenantId}:${ws}:${environment}:${themeId}`;
  }

  static getLatestKey(pointerKey: string): string | null {
    return this.latestKeys.get(pointerKey) || null;
  }

  static setLatestKey(pointerKey: string, actualKey: string) {
    this.latestKeys.set(pointerKey, actualKey);
  }

  static get(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  static set(key: string, value: CachedArtifact): void {
    const softTTL = this.getJitteredTTL(this.BASE_SOFT_TTL_MS);
    const hardTTL = this.getJitteredTTL(this.BASE_HARD_TTL_MS);

    this.cache.set(key, {
      value,
      softExpiresAt: Date.now() + softTTL,
      hardExpiresAt: Date.now() + hardTTL,
    });
  }

  static clear(): void {
    this.cache.clear();
    this.latestKeys.clear();
    this.pendingFetches.clear();
  }

  static getPendingFetch(key: string): Promise<CachedArtifact> | undefined {
    return this.pendingFetches.get(key);
  }

  static setPendingFetch(key: string, promise: Promise<CachedArtifact>): void {
    this.pendingFetches.set(key, promise);
  }

  static clearPendingFetch(key: string): void {
    this.pendingFetches.delete(key);
  }
}
