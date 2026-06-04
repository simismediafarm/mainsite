export type KernelSyscallName =
  | "intent.submit"
  | "intent.execute"
  | "intent.rollback"
  | "intent.replay";

export type KernelPriority =
  | "CRITICAL"
  | "HIGH"
  | "NORMAL"
  | "BACKGROUND";

export type KernelInterruptType =
  | "INT_INGESTION_SPIKE"
  | "INT_FRAUD_DETECTED"
  | "INT_NODE_FAILURE"
  | "INT_BUDGET_EXHAUSTED";

export type KernelIntentStatus =
  | "PENDING"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "DLQ";

export interface KernelIntentEnvelope<TPayload = unknown> {
  intent_id: string;
  syscall: KernelSyscallName;
  payload: TPayload;

  idempotency_key: string;
  priority: KernelPriority;

  status: KernelIntentStatus;

  created_at: string;
  scheduled_at?: string;
  executed_at?: string;

  trace_hash?: string;
}

export interface KernelExecutionEvent {
  execution_id: string;
  intent_id: string;

  node: string;
  event_type: string;
  event_payload?: unknown;

  execution_hash: string;
  parent_execution_id?: string;
}

export interface KernelInterrupt {
  type: KernelInterruptType;
  reason?: string;
  timestamp: string;
}

export interface KernelReplayTrace {
  intent_id: string;
  live_trace_hash?: string;
  replay_trace_hash?: string;
  execution_match: boolean;
  system_valid: boolean;
}

export interface KernelDriftReport {
  missing_in_replay: any[];
  extra_in_replay: any[];
  drift_score: number;
}
