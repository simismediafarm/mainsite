import { KernelIntent } from '../runtime/execute';
import { getSupabase } from '../../executor/kernelExecutor';

export enum FailureClassification {
  RETRYABLE = 'RETRYABLE',
  REJECTED = 'REJECTED',
  ESCALATE = 'ESCALATE',
  COMPENSATE = 'COMPENSATE'
}

export class DLQManager {
  public static async handleFailure(intent: KernelIntent, error: Error, classification: FailureClassification) {
    console.warn(`[DLQ] Handling failure for intent ${intent.intent_id}. Class: ${classification}`);
    
    // All failures must be persisted to the DLQ state
    const attempts = await this.persistToDLQ(intent, error, classification);

    if (classification === FailureClassification.RETRYABLE) {
      if (attempts < 3) {
        console.log(`[DLQ] Retrying intent ${intent.intent_id} (Attempt ${attempts + 1}/3)`);
        
        // Re-enqueue (delay omitted for simplicity)
        const { KernelScheduler } = await import('../scheduler/core.js');
        KernelScheduler.getInstance().enqueue(intent as any);
      } else {
        console.error(`[DLQ] Max retries exhausted for intent ${intent.intent_id}. Escalating.`);
        await this.escalate(intent, error);
      }
    } else if (classification === FailureClassification.COMPENSATE) {
      await this.triggerCompensation(intent);
    } else if (classification === FailureClassification.ESCALATE || classification === FailureClassification.REJECTED) {
      await this.escalate(intent, error);
    }
  }

  private static async persistToDLQ(intent: KernelIntent, error: Error, classification: string): Promise<number> {
    const supabase = getSupabase();
    
    // Check if it exists in DLQ
    const { data: existing } = await supabase
      .from('kernel_dead_letter_queue')
      .select('retry_count')
      .eq('intent_id', intent.intent_id)
      .maybeSingle();

    let newAttempts = 0;
    
    if (existing) {
      newAttempts = (existing.retry_count || 0) + 1;
      await supabase
        .from('kernel_dead_letter_queue')
        .update({
          classification,
          error_message: error.message,
          retry_count: newAttempts,
          updated_at: new Date().toISOString()
        })
        .eq('intent_id', intent.intent_id);
    } else {
      await supabase
        .from('kernel_dead_letter_queue')
        .insert({
          intent_id: intent.intent_id,
          classification,
          error_message: error.message,
          retry_count: 0
        });
    }

    console.log(`[DLQ] Persisted intent ${intent.intent_id} to DLQ (attempts: ${newAttempts}).`);
    return newAttempts;
  }

  private static async escalate(intent: KernelIntent, error: Error) {
    console.error(`[DLQ] ESCALATION REQUIRED for intent ${intent.intent_id}. Human operator or Governor intervention needed.`);
    const supabase = getSupabase();
    await supabase
      .from('kernel_intent_registry')
      .update({ status: 'DLQ' })
      .eq('intent_id', intent.intent_id);
  }

  private static async triggerCompensation(intent: KernelIntent) {
    console.warn(`[DLQ] Triggering compensation saga for intent ${intent.intent_id}.`);
    // Placeholder for actual compensation saga logic
  }
}

