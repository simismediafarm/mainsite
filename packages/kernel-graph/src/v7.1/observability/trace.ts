export interface KernelTraceSpan {
  trace_id: string;
  span_id: string;

  intent_id: string;

  syscall: string;
  node: string;

  start_time: number;
  end_time?: number;

  status: "OK" | "ERROR" | "PREEMPTED";

  metadata?: Record<string, any>;
}
