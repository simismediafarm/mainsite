export interface CDNPropagationReceipt {
  receiptId: string;
  themeUid: string;
  invalidationTag: string;
  targetEdges: string[];     // e.g., ["us-east", "eu-west", "ap-southeast"]
  successEdges: string[];
  failedEdges: string[];
  status: "PENDING" | "COMPLETE" | "PARTIAL_FAILURE" | "FAILED";
  retryCount: number;
  convergenceDeadline: Date;
  convergenceEpoch: string; // Prevents stale retries interfering with new promotions
  receiptLockId: string;    // Ensures single-owner retry worker execution
  timestamp: Date;
}
