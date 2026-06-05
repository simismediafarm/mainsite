export interface PublishRequest {
  uid: string;
  definitionUid: string;
  targetVersionUid: string;
  requestedBy: string;
  justification?: string;
  createdAt: Date;
}

export interface ReviewDecision {
  uid: string;
  requestUid: string; // Reference to the PublishRequest
  decision: "approved" | "rejected";
  reviewedBy: string;
  comments?: string;
  createdAt: Date;
}

export interface RollbackRequest {
  uid: string;
  definitionUid: string;
  targetHistoricVersionUid: string;
  requestedBy: string;
  reason: string;
  createdAt: Date;
}
