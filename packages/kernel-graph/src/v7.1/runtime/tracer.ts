import { getSupabase } from '../../executor/kernelExecutor';
import { PipelineIntent, PipelineResult } from './execution_pipeline';

export class ExecutionTracer {
  public static async recordExecutionMetrics(intent: PipelineIntent, result: PipelineResult, durationMs: number) {
    const supabase = getSupabase();
    
    // In a real observability stack, this might send data to Datadog or Prometheus.
    // For now, we log to stdout for the CLI and optionally a metrics table.
    console.log(`[TRACER] Execution metrics for intent ${intent.intent_id}:`);
    console.log(`  - Syscall: ${intent.syscall_name}`);
    console.log(`  - Duration: ${durationMs}ms`);
    console.log(`  - Deterministic: ${intent.payload.__deterministic ? 'Yes' : 'No'}`);
    
    // We could insert into a `kernel_execution_metrics` table here if it existed.
  }
}
