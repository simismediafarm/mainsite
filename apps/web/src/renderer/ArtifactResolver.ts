import crypto from "crypto";
import { ArtifactCache, CachedArtifact } from "./ArtifactCache";
import { ArtifactLoader, LoaderContext } from "./ArtifactLoader";

export interface ResolverContext extends LoaderContext {
  activeBundleHash?: string;
}

export class ArtifactResolver {
  static async resolve(themeId: string, context: ResolverContext): Promise<CachedArtifact> {
    if (!themeId) {
      throw new Error("ArtifactResolver: themeId is required to resolve compiled artifact.");
    }

    const pointerKey = ArtifactCache.generateLatestPointerKey(
      context.tenantId,
      context.workspace,
      context.environment,
      themeId
    );

    const activeKey = ArtifactCache.getLatestKey(pointerKey);

    if (activeKey) {
      const entry = ArtifactCache.get(activeKey);
      if (entry) {
        const now = Date.now();
        if (now < entry.softExpiresAt) {
          ArtifactCache.metrics.artifact_cache_hit++;
          return entry.value; // Fresh hit
        }

        if (now < entry.hardExpiresAt) {
          ArtifactCache.metrics.artifact_cache_stale++;
          // SWR: Trigger refresh in background but serve stale immediately
          this.refreshBackground(themeId, context, pointerKey).catch((e) => {
             // Stale-if-error: swallow error and keep serving stale
             console.warn(`ArtifactResolver: Background refresh failed, continuing to serve stale. Error: ${e.message}`);
          });
          return entry.value;
        }

        // Hard expired: block and wait for fresh fetch
      }
    }

    // Cache Miss or Hard Expiration
    ArtifactCache.metrics.artifact_cache_miss++;
    
    // Check if there is already a pending fetch for this themeId (Promise Coalescing)
    // Note: We use pointerKey for coalescing because we don't know the actual compound key yet
    let pendingFetch = ArtifactCache.getPendingFetch(pointerKey);
    if (!pendingFetch) {
       ArtifactCache.metrics.artifact_cache_refresh++;
       pendingFetch = this.fetchAndValidate(themeId, context, pointerKey)
          .finally(() => {
             ArtifactCache.clearPendingFetch(pointerKey);
          });
       ArtifactCache.setPendingFetch(pointerKey, pendingFetch);
    }
    
    try {
      return await pendingFetch;
    } catch (err: any) {
      // Stale-if-error for Hard Expiry fallback
      if (activeKey) {
         const entry = ArtifactCache.get(activeKey);
         if (entry) {
            console.warn(`ArtifactResolver: Hard fetch failed, serving last known stale artifact. Error: ${err.message}`);
            return entry.value;
         }
      }
      throw err;
    }
  }

  private static async refreshBackground(themeId: string, context: ResolverContext, pointerKey: string) {
    let pendingFetch = ArtifactCache.getPendingFetch(pointerKey);
    if (!pendingFetch) {
       ArtifactCache.metrics.artifact_cache_refresh++;
       pendingFetch = this.fetchAndValidate(themeId, context, pointerKey)
          .finally(() => {
             ArtifactCache.clearPendingFetch(pointerKey);
          });
       ArtifactCache.setPendingFetch(pointerKey, pendingFetch);
    }
    await pendingFetch;
  }

  private static async fetchAndValidate(themeId: string, context: ResolverContext, pointerKey: string): Promise<CachedArtifact> {
    const artifact = await ArtifactLoader.load(themeId, context);

    if (!artifact) {
      throw new Error(
        `ArtifactResolver FAILED: Compiled artifact for theme "${themeId}" is missing or corrupted. Dynamic graph resolution is strictly forbidden.`
      );
    }

    if (context.activeBundleHash && context.activeBundleHash !== "n/a") {
      const artifactBundleHash = artifact.provenance?.compiledFromBundleHash;
      if (artifactBundleHash !== context.activeBundleHash) {
        ArtifactCache.metrics.artifact_cache_bundle_mismatch++;
        throw new Error(
          `ArtifactResolver FAILED: Resolved artifact bundle hash "${artifactBundleHash}" does not match active bundle hash "${context.activeBundleHash}".`
        );
      }
    }

    const expectedSignature = crypto
      .createHash("sha256")
      .update(
        `${artifact.provenance.compiledFromBundleHash || "n/a"}${artifact.provenance.dependencyFingerprint}${artifact.provenance.compilerHash}${artifact.provenance.compilerVersion}`
      )
      .digest("hex");

    if (artifact.provenance.artifactSignature !== expectedSignature) {
      ArtifactCache.metrics.artifact_cache_rejected_signature++;
      throw new Error(
        `ArtifactResolver FAILED: Tampered artifact detected (invalid signature). Expected ${expectedSignature}, got ${artifact.provenance.artifactSignature}.`
      );
    }

    const cacheKey = ArtifactCache.generateKey(
      context.tenantId,
      context.workspace,
      context.environment,
      artifact.provenance.dependencyFingerprint || "unknown",
      artifact.provenance.compilerVersion || "1.0.0"
    );

    ArtifactCache.set(cacheKey, artifact);
    ArtifactCache.setLatestKey(pointerKey, cacheKey);

    return artifact;
  }
}
