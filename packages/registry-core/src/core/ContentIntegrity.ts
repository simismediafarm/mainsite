import { createHash } from 'node:crypto';
import stringify from 'fast-json-stable-stringify';

export class ContentIntegrity {
  /**
   * Computes a deterministic SHA-256 hash of the given JSON payload.
   */
  static computePayloadHash(payload: Record<string, any>): string {
    const stableString = stringify(payload);
    return createHash('sha256').update(stableString).digest('hex');
  }

  /**
   * Validates a payload against a known hash.
   */
  static verifyPayloadHash(payload: Record<string, any>, expectedHash: string): boolean {
    const actualHash = this.computePayloadHash(payload);
    return actualHash === expectedHash;
  }

  /**
   * Computes a bundle hash from an array of dependency representations (Version UID + dependencyMode)
   * for O(1) promotion verification.
   */
  static computeBundleHash(dependencies: Array<{ versionUid: string, dependencyMode: string }>): string {
    const stableString = stringify(
      dependencies.map(d => `${d.versionUid}:${d.dependencyMode}`).sort()
    );
    return createHash('sha256').update(stableString).digest('hex');
  }

  /**
   * Computes a dependency fingerprint for Compiled Artifacts to allow O(1) cache validation.
   */
  static computeDependencyFingerprint(dependencies: Array<{ versionUid: string, dependencyMode: string }>): string {
    const stableString = stringify(
      dependencies.map(d => `${d.versionUid}:${d.dependencyMode}`).sort()
    );
    return createHash('sha256').update(stableString).digest('hex');
  }
}
