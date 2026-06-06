import { CDNPropagationReceipt } from "./CDNPropagationReceipt";
import { EventBus } from "@simis/registry-core";
import { CdnDistributionService } from "./CdnDistributionService";

export const MAX_RETRY_ATTEMPTS_PER_RECEIPT = 5;

export class InvalidationRetryWorker {
  // Guard 1: Track the latest epoch per themeUid to prevent mix-state convergence (stale retries stepping on new promotions)
  private latestEpochPerTheme = new Map<string, string>();
  // Guard 2: Track active locks to ensure single-owner retry worker per receipt
  private activeLocks = new Set<string>();

  constructor(
    private readonly eventBus: EventBus,
    private readonly distributionService: CdnDistributionService
  ) {
    this.startListening();
  }

  private startListening() {
    this.eventBus.subscribe("convergence_partial_failure", async (event) => {
      const receipt = event.payload as CDNPropagationReceipt;
      // Background retry process without blocking the event loop
      this.scheduleRetry(receipt, event);
    });
  }

  private async scheduleRetry(receipt: CDNPropagationReceipt, originalEvent: any) {
    if (receipt.status !== "PARTIAL_FAILURE") return;

    // Constraint 1: Drift Protection - ignore if epoch is stale
    const latestEpoch = this.latestEpochPerTheme.get(receipt.themeUid);
    if (!latestEpoch || receipt.convergenceEpoch > latestEpoch) {
      this.latestEpochPerTheme.set(receipt.themeUid, receipt.convergenceEpoch);
    } else if (receipt.convergenceEpoch < latestEpoch) {
      console.log(`[InvalidationRetryWorker] Ignored stale receipt ${receipt.receiptId} due to newer epoch ${latestEpoch}`);
      return;
    }

    // Constraint 2: Single-owner lock protection
    if (this.activeLocks.has(receipt.receiptLockId)) {
      return;
    }
    this.activeLocks.add(receipt.receiptLockId);

    if (receipt.retryCount >= MAX_RETRY_ATTEMPTS_PER_RECEIPT) {
      receipt.status = "FAILED";
      this.activeLocks.delete(receipt.receiptLockId);
      await this.eventBus.publish({
        ...originalEvent,
        type: "convergence_failed",
        payload: receipt
      });
      return;
    }

    if (new Date() > new Date(receipt.convergenceDeadline)) {
      receipt.status = "FAILED";
      this.activeLocks.delete(receipt.receiptLockId);
      await this.eventBus.publish({
        ...originalEvent,
        type: "convergence_failed",
        payload: receipt
      });
      return;
    }

    // Exponential backoff calculation: 2^retryCount * 100ms for simulation speed.
    // In production, this might be 2^retryCount * 1000ms.
    const delayMs = Math.pow(2, receipt.retryCount) * 100;

    setTimeout(async () => {
      // Re-issue targeted purge request specifically for failed regions
      const newReceiptResult = await this.distributionService.invalidateByTag(
        receipt.themeUid,
        receipt.invalidationTag,
        receipt.failedEdges
      );

      // Update receipt state
      receipt.retryCount += 1;
      receipt.successEdges.push(...newReceiptResult.successEdges);
      receipt.failedEdges = newReceiptResult.failedEdges;

      this.activeLocks.delete(receipt.receiptLockId);

      if (receipt.failedEdges.length === 0) {
        receipt.status = "COMPLETE";
        await this.eventBus.publish({
          ...originalEvent,
          type: "convergence_completed",
          payload: receipt
        });
      } else {
        // Still partial failure. The next check will catch max retries/deadline.
        // We re-publish partial failure to keep the stream updated and trigger the next retry loop.
        await this.eventBus.publish({
          ...originalEvent,
          type: "convergence_partial_failure",
          payload: receipt
        });
      }
    }, delayMs);
  }
}
