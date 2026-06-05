import { CdnProviderPort } from "./CdnProviderPort";
import { CDNPropagationReceipt } from "./CDNPropagationReceipt";
import { randomUUID } from "node:crypto";

export class CdnDistributionService {
  constructor(private readonly provider: CdnProviderPort) {}

  /**
   * Invalidates cached artifacts globally using a cache tag.
   * @param themeUid The theme ID being invalidated
   * @param tag The tag representing the artifact or theme (e.g., 'theme-theme-x')
   * @param targetEdges The regions to purge (default to ['global'] if not specified)
   */
  async invalidateByTag(themeUid: string, tag: string, targetEdges: string[] = ["global"]): Promise<CDNPropagationReceipt> {
    let successEdges: string[] = [];
    let failedEdges: string[] = [];
    let status: CDNPropagationReceipt["status"] = "COMPLETE";

    try {
      if (this.provider.purgeWithReceipt) {
        const result = await this.provider.purgeWithReceipt(tag, targetEdges);
        successEdges = result.successEdges;
        failedEdges = result.failedEdges;
        if (failedEdges.length > 0) {
          status = "PARTIAL_FAILURE";
        }
      } else {
        await this.provider.purge(tag);
        successEdges = targetEdges;
      }
    } catch (error) {
      console.error(`[CdnDistributionService] Failed to purge tag ${tag}:`, error);
      failedEdges = targetEdges;
      status = "FAILED";
    }

    // Set deadline to 5 minutes from now for eventual consistency bounds
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + 5);

    const receiptId = `rcpt-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const receipt: CDNPropagationReceipt = {
      receiptId,
      themeUid,
      invalidationTag: tag,
      targetEdges,
      successEdges,
      failedEdges,
      status,
      retryCount: 0,
      convergenceDeadline: deadline,
      convergenceEpoch: Date.now().toString(),
      receiptLockId: `lock-${receiptId}`,
      timestamp: new Date()
    };

    return receipt;
  }
}
