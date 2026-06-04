import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { executeIntent } from '../runtime/execute';
import { replayIntent } from '../runtime/replay';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface SyscallEnvelope {
  intent_id: string;
  syscall_name: string;
  payload: any;
  organization_id: string;
  idempotency_key: string;
  priority: number;
}

export class SyscallRouter {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.supabase = createClient(url, key);
  }

  /**
   * EDGE ENTRYPOINT: Fast verification, JWT signature check, and DB-level idempotency lock
   */
  public async routeEdge(reqPayload: {
    syscall_name: string;
    payload: any;
    idempotency_key?: string;
    priority?: number;
    token: string; // Signed JWT token
  }): Promise<{ success: boolean; intent_id?: string; cachedResult?: any; reason?: string }> {
    try {
      // 1. Safe verification of JWT signature
      const orgId = this.verifyJWT(reqPayload.token);
      if (!orgId) {
        return { success: false, reason: 'Unauthorized: Invalid request signature' };
      }

      // 2. Generate Deterministic Idempotency Key
      const rawPayloadStr = JSON.stringify(reqPayload.payload);
      const idempotencyKey = reqPayload.idempotency_key || 
        crypto.createHash('sha256').update(`${reqPayload.syscall_name}:${rawPayloadStr}:${orgId}`).digest('hex');

      const intentId = crypto.randomUUID();

      // 3. Database transaction insertion with unique constraint protection
      const { data: newIntent, error: insertError } = await this.supabase
        .from('kernel_intent_registry')
        .insert({
          intent_id: intentId,
          organization_id: orgId,
          syscall_name: reqPayload.syscall_name,
          payload: reqPayload.payload,
          idempotency_key: idempotencyKey,
          priority: reqPayload.priority || 2,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        // Handled DB conflict on idempotency key constraint
        if (insertError.code === '23505') { 
          const { data: existing } = await this.supabase
            .from('kernel_intent_registry')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .single();

          if (existing) {
            return { 
              success: true, 
              intent_id: existing.intent_id, 
              cachedResult: { status: existing.status, cached: true } 
            };
          }
        }
        return { success: false, reason: `Execution registration failed: ${insertError.message}` };
      }

      // 4. Enqueue to KEBL Durable Database queue
      const { error: queueError } = await this.supabase
        .from('kernel_kebl_queue')
        .insert({
          intent_id: newIntent.intent_id,
          priority: newIntent.priority,
          status: 'queued'
        });

      if (queueError) {
        return { success: false, reason: `Failed to buffer queue event: ${queueError.message}` };
      }

      // 5. Asynchronously trigger worker execution (Non-blocking hot path signal)
      this.signalWorker(newIntent.intent_id);

      return { success: true, intent_id: newIntent.intent_id };
    } catch (err: any) {
      return { success: false, reason: err.message };
    }
  }

  /**
   * NODE DISPATCH ENGINE: Handles execution plans, retry mechanics, and ledger logging
   */
  public async executeNode(envelope: SyscallEnvelope): Promise<any> {
    const { intent_id, syscall_name, organization_id } = envelope;

    // Set local session context for target tenant
    await this.supabase.rpc('set_session_context', { org_id: organization_id });

    // 1. Initialize execution ledger
    const { data: ledgerEntry, error: ledgerError } = await this.supabase
      .from('kernel_execution_ledger')
      .insert({
        intent_id: intent_id,
        syscall_type: syscall_name,
        status: 'started',
        retry_count: 0
      })
      .select()
      .single();

    if (ledgerError) throw new Error(`Ledger entry creation failed: ${ledgerError.message}`);

    try {
      let result;
      if (syscall_name === 'intent.replay') {
        result = await replayIntent(envelope.payload.target_intent_id);
      } else {
        result = await executeIntent({
          intent_id,
          syscall_name: syscall_name as any,
          payload: envelope.payload,
          idempotency_key: envelope.idempotency_key,
          priority: envelope.priority,
          status: 'PENDING'
        });
      }

      // Compute unique state output execution hash
      const executionHash = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
      
      // 2. Finalize execution log and ledger status
      await this.supabase
        .from('kernel_execution_ledger')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
          execution_hash: executionHash
        })
        .eq('execution_id', ledgerEntry.execution_id);

      await this.supabase
        .from('kernel_intent_registry')
        .update({ status: 'completed' })
        .eq('intent_id', intent_id);

      return result;
    } catch (execErr: any) {
      await this.supabase
        .from('kernel_execution_ledger')
        .update({ status: 'failed', finished_at: new Date().toISOString() })
        .eq('execution_id', ledgerEntry.execution_id);

      await this.supabase
        .from('kernel_intent_registry')
        .update({ status: 'failed' })
        .eq('intent_id', intent_id);

      throw execErr;
    }
  }

  private verifyJWT(token: string): string | null {
    try {
      const publicKey = process.env.JWT_PUBLIC_KEY || 'default-jwt-development-secret-key-12345';
      const decoded = jwt.verify(token, publicKey) as any;
      return decoded.org_id || null;
    } catch (e) {
      console.error('[SYSCALL ROUTER] JWT signature validation failed:', e);
      return null;
    }
  }

  private signalWorker(intentId: string): void {
    // Hot path worker trigger simulation (in production, triggers an HTTP post to Fly worker or CF queue)
    setTimeout(async () => {
      try {
        const { data: queueItem } = await this.supabase
          .from('kernel_kebl_queue')
          .update({ status: 'processing' })
          .eq('intent_id', intentId)
          .eq('status', 'queued')
          .select()
          .single();

        if (queueItem) {
          const { data: intent } = await this.supabase
            .from('kernel_intent_registry')
            .select('*')
            .eq('intent_id', intentId)
            .single();

          if (intent) {
            await this.executeNode({
              intent_id: intent.intent_id,
              syscall_name: intent.syscall_name,
              payload: intent.payload,
              organization_id: intent.organization_id,
              idempotency_key: intent.idempotency_key,
              priority: intent.priority
            });

            await this.supabase
              .from('kernel_kebl_queue')
              .delete()
              .eq('intent_id', intentId);
          }
        }
      } catch (err) {
        console.error(`[KEBL WORKER] Failed executing task ${intentId}:`, err);
        await this.supabase
          .from('kernel_kebl_queue')
          .update({ status: 'dead' })
          .eq('intent_id', intentId);
      }
    }, 50);
  }
}
