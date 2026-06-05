import { CDNPropagationReceipt } from "./CDNPropagationReceipt";
import { EventBus } from "@simis/registry-core/src/core/EventBus";
import { RegistryRepository } from "@simis/registry-core/src/core/RegistryRepository";

export class EdgeConvergenceTracker {
  // Simple in-memory tracker for active receipts
  private activeReceipts = new Map<string, CDNPropagationReceipt>();

  constructor(
    private readonly eventBus: EventBus,
    private readonly registryRepo: RegistryRepository
  ) {
    this.setupListeners();
  }

  private setupListeners() {
    this.eventBus.subscribe("convergence_partial_failure", (event) => {
      const receipt = event.payload as CDNPropagationReceipt;
      this.activeReceipts.set(receipt.receiptId, receipt);
    });

    this.eventBus.subscribe("convergence_completed", async (event) => {
      const receipt = event.payload as CDNPropagationReceipt;
      this.activeReceipts.set(receipt.receiptId, receipt);
      // DB persistence as Audit Snapshot
      await this.registryRepo.saveCDNPropagationReceipt(receipt);
    });

    this.eventBus.subscribe("convergence_failed", async (event) => {
      const receipt = event.payload as CDNPropagationReceipt;
      this.activeReceipts.set(receipt.receiptId, receipt);
      // DB persistence as Audit Snapshot
      await this.registryRepo.saveCDNPropagationReceipt(receipt);
    });
  }

  /**
   * Tracks a receipt explicitly, though it also listens to the EventBus.
   */
  trackReceipt(receipt: CDNPropagationReceipt) {
    this.activeReceipts.set(receipt.receiptId, receipt);
  }

  /**
   * Calculates the global convergence score (0 to 1) across all active receipts.
   * If there are no receipts, convergence is 1 (100%).
   */
  getGlobalConvergenceScore(): number {
    if (this.activeReceipts.size === 0) return 1;

    let totalEdges = 0;
    let convergedEdges = 0;

    for (const receipt of this.activeReceipts.values()) {
      totalEdges += receipt.targetEdges.length;
      convergedEdges += receipt.successEdges.length;
    }

    if (totalEdges === 0) return 1;
    return convergedEdges / totalEdges;
  }

  getReceipt(receiptId: string): CDNPropagationReceipt | undefined {
    return this.activeReceipts.get(receiptId);
  }
}
