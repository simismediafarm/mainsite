import { createClient } from '@supabase/supabase-js';
import { runExecutionPipeline, PipelineIntent } from './execution_pipeline';
import { stableExecutionHash } from '../../v7.2.1/utils/hash';

export async function replayIntent(intent_id: string): Promise<any> {
  console.log(`[REPLAY ENGINE] Constructing deterministic verification for intent ${intent_id}`);
  
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(url, key);

  // 1. Fetch historical registry record
  const { data: intentRecord, error: intentErr } = await supabase
    .from('kernel_intent_registry')
    .select('*')
    .eq('intent_id', intent_id)
    .single();

  if (intentErr || !intentRecord) {
    throw new Error(`[REPLAY ENGINE] Failed to fetch historical intent ${intent_id}: ${intentErr?.message}`);
  }

  // 2. Fetch completed PoE certificate
  const { data: certRecord, error: certErr } = await supabase
    .from('kernel_execution_certificates')
    .select('*')
    .eq('intent_id', intent_id)
    .single();

  if (certErr || !certRecord) {
    throw new Error(`[REPLAY ENGINE] PoE certificate not found for intent ${intent_id}`);
  }

  // 3. Inject deterministic validation flags & stable seeds
  const pipelineIntent: PipelineIntent = {
    intent_id: intentRecord.intent_id,
    syscall_name: intentRecord.syscall_name,
    payload: { 
      ...intentRecord.payload, 
      __deterministic: true,
      __seed: certRecord.ecvm_seed 
    },
    idempotency_key: intentRecord.idempotency_key,
    priority: intentRecord.priority,
    epoch: intentRecord.epoch,
    graph: intentRecord.payload?.graph
  };

  // 4. Run execution plan in replay mode
  const shadowResult = await runExecutionPipeline(pipelineIntent, {
    skipPersistence: true,
    ioMode: 'replay',
    ecvmSeedOverride: certRecord.ecvm_seed,
    externalLeanProofHash: certRecord.closure_proof
  });
  
  // 5. Compare canonical hashes
  if (shadowResult.poe.execution_hash !== certRecord.execution_hash) {
    throw new Error(
      `[REPLAY ENGINE] DRIFT ENFORCEMENT VIOLATION: Execution output changed. ` +
      `Historical hash: ${certRecord.execution_hash}, Replay shadow hash: ${shadowResult.poe.execution_hash}`
    );
  }

  console.log(`[REPLAY ENGINE] Determinism verified. No structural or logical drift detected.`);
  return { 
    status: 'REPLAY_SUCCESS', 
    intent_id, 
    historical_hash: certRecord.execution_hash, 
    shadow_hash: shadowResult.poe.execution_hash, 
    drift_score: 0.0 
  };
}
