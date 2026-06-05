import { describe, it, expect, vi } from "vitest";
import { EdgeConvergenceTracker } from "./EdgeConvergenceTracker";
import { EventBus } from "@simis/registry-core/src/core/EventBus";
import { CDNPropagationReceipt } from "./CDNPropagationReceipt";
import { RegistryRepository } from "@simis/registry-core/src/core/RegistryRepository";

describe("EdgeConvergenceTracker", () => {
  it("should initialize with 100% convergence score when empty", () => {
    const eventBus = new EventBus();
    const mockRepo = { saveCDNPropagationReceipt: vi.fn() } as unknown as RegistryRepository;
    const tracker = new EdgeConvergenceTracker(eventBus, mockRepo);
    expect(tracker.getGlobalConvergenceScore()).toBe(1);
  });

  it("should correctly compute global convergence score across multiple receipts", () => {
    const eventBus = new EventBus();
    const mockRepo = { saveCDNPropagationReceipt: vi.fn() } as unknown as RegistryRepository;
    const tracker = new EdgeConvergenceTracker(eventBus, mockRepo);

    const receipt1: CDNPropagationReceipt = {
      receiptId: "r-1",
      themeUid: "t-1",
      invalidationTag: "tag-1",
      targetEdges: ["e1", "e2", "e3"],
      successEdges: ["e1", "e2"],
      failedEdges: ["e3"],
      status: "PARTIAL_FAILURE",
      retryCount: 0,
      convergenceDeadline: new Date(),
      convergenceEpoch: "epoch-1",
      receiptLockId: "lock-1",
      timestamp: new Date()
    };

    const receipt2: CDNPropagationReceipt = {
      receiptId: "r-2",
      themeUid: "t-2",
      invalidationTag: "tag-2",
      targetEdges: ["e1", "e2"],
      successEdges: ["e1", "e2"],
      failedEdges: [],
      status: "COMPLETE",
      retryCount: 0,
      convergenceDeadline: new Date(),
      convergenceEpoch: "epoch-1",
      receiptLockId: "lock-2",
      timestamp: new Date()
    };

    tracker.trackReceipt(receipt1);
    tracker.trackReceipt(receipt2);

    // Total target = 3 + 2 = 5
    // Total success = 2 + 2 = 4
    // Score = 4/5 = 0.8
    expect(tracker.getGlobalConvergenceScore()).toBe(0.8);
  });

  it("should persist receipts to repo when convergence completes or fails", async () => {
    const eventBus = new EventBus();
    const mockRepo = { saveCDNPropagationReceipt: vi.fn().mockResolvedValue(undefined) } as unknown as RegistryRepository;
    new EdgeConvergenceTracker(eventBus, mockRepo);

    const receipt: CDNPropagationReceipt = {
      receiptId: "r-1",
      themeUid: "t-1",
      invalidationTag: "tag-1",
      targetEdges: ["e1"],
      successEdges: ["e1"],
      failedEdges: [],
      status: "COMPLETE",
      retryCount: 0,
      convergenceDeadline: new Date(),
      convergenceEpoch: "epoch-1",
      receiptLockId: "lock-3",
      timestamp: new Date()
    };

    await eventBus.publish({
      eventUid: "e-1",
      correlationId: "c-1",
      actorId: "actor",
      environment: "production",
      type: "convergence_completed",
      payload: receipt,
      timestamp: new Date()
    });

    expect(mockRepo.saveCDNPropagationReceipt).toHaveBeenCalledWith(receipt);
  });
});
