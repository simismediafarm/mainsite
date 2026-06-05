import { ContentIntegrity } from "@simis/registry-core";

export class ArtifactSignatureVerifier {
  /**
   * Verifies that the fetched payload from CDN perfectly matches the injected artifact signature.
   * Prevents man-in-the-middle or stale cache corruption.
   *
   * @param payload The raw payload object from the CDN
   * @param signatureHeader The `x-artifact-signature` header provided by the CDN
   */
  static verify(payload: Record<string, any>, signatureHeader: string): boolean {
    if (!signatureHeader) return false;
    
    return ContentIntegrity.verifyPayloadHash(payload, signatureHeader);
  }
}
