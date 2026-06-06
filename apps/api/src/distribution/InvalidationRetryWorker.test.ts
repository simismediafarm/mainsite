import { describe, it, expect, vi } from "vitest";
import { InvalidationRetryWorker, MAX_RETRY_ATTEMPTS_PER_RECEIPT } from "./InvalidationRetryWorker";
import { EventBus } from "@simis/registry-core";
import { CdnDistributionService } from "./CdnDistributionService";
import { CDNPropagationReceipt } from "./CDNPropagationReceipt";

describe("InvalidationRetryWorker", () => {
  it("should fail immediately if convergence deadline has passed", async () => {
    const eventBus = new EventBus();
    const service = {} as CdnDistributionService;
    
    // We will spy on eventBus to see what it emits
    vi.spyOn(eventBus, "publish");

    new InvalidationRetryWorker(eventBus, service);

    const pastDeadline = new Date();
    pastDeadline.setMinutes(pastDeadline.getMinutes() - 10);

    const receipt: CDNPropagationReceipt = {
      receiptId: "r-1",
      themeUid: "t-1",
      invalidationTag: "tag-1",
      targetEdges: ["e1"],
      successEdges: [],
      failedEdges: ["e1"],
      status: "PARTIAL_FAILURE",
      retryCount: 0,
      convergenceDeadline: pastDeadline,
      convergenceEpoch: "epoch-1",
      receiptLockId: "lock-1",
      timestamp: new Date()
    };

    await eventBus.publish({
      eventUid: "e-1",
      correlationId: "c-1",
      actorId: "actor",
      environment: "production",
      type: "convergence_partial_failure",
      payload: receipt,
      timestamp: new Date()
    });

    // Worker should publish convergence_failed
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: "convergence_failed",
      payload: expect.objectContaining({
        status: "FAILED"
      })
    }));
  });

  it("should fail if max retry attempts exceeded", async () => {
    const eventBus = new EventBus();
    const service = {} as CdnDistributionService;
    
    vi.spyOn(eventBus, "publish");

    new InvalidationRetryWorker(eventBus, service);

    const futureDeadline = new Date();
    futureDeadline.setMinutes(futureDeadline.getMinutes() + 10);

    const receipt: CDNPropagationReceipt = {
      receiptId: "r-1",
      themeUid: "t-1",
      invalidationTag: "tag-1",
      targetEdges: ["e1"],
      successEdges: [],
      failedEdges: ["e1"],
      status: "PARTIAL_FAILURE",
      retryCount: MAX_RETRY_ATTEMPTS_PER_RECEIPT,
      convergenceDeadline: futureDeadline,
      convergenceEpoch: "epoch-1",
      receiptLockId: "lock-2",
      timestamp: new Date()
    };

    await eventBus.publish({
      eventUid: "e-1",
      correlationId: "c-1",
      actorId: "actor",
      environment: "production",
      type: "convergence_partial_failure",
      payload: receipt,
      timestamp: new Date()
    });

    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
      type: "convergence_failed",
      payload: expect.objectContaining({
        status: "FAILED"
      })
    }));
  });
});
