import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { replayIntent } from '@simis/kernel-graph/dist/v7.1/runtime/replay';
import { runExecutionPipeline, PipelineIntent } from '@simis/kernel-graph/dist/v7.1/runtime/execution_pipeline';
import { registerSSEClient } from '../services/realtime';
// @ts-ignore
import { streamBridge } from '@simis/kernel-graph/dist/v7.1/runtime/kernel_stream_bridge.js';

const kernelRouter = new Hono();

// GET /kernel/status -> System health & metrics
kernelRouter.get('/status', async (c) => {
  const supabase = getSupabase();
  const { count: intentsCount } = await supabase.from('kernel_intent_registry').select('*', { count: 'exact', head: true });
  const { count: poeCount } = await supabase.from('kernel_execution_certificates').select('*', { count: 'exact', head: true });
  const { count: violationCount } = await supabase.from('kernel_dect_violations').select('*', { count: 'exact', head: true });

  return c.json({
    status: 'HEALTHY',
    metrics: {
      total_intents: intentsCount || 0,
      total_poe: poeCount || 0,
      total_violations: violationCount || 0
    }
  });
});

// GET /kernel/intents -> List intents (paginated)
kernelRouter.get('/intents', async (c) => {
  const supabase = getSupabase();
  const limit = parseInt(c.req.query('limit') || '50');
  
  const { data, error } = await supabase
    .from('kernel_intent_registry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// POST /kernel/intent -> Submit new intent via pipeline
kernelRouter.post('/intent', async (c) => {
  try {
    const body = await c.req.json();
    const intentId = crypto.randomUUID();
    
    // Validate payload shape?
    const pipelineIntent: PipelineIntent = {
      intent_id: intentId,
      syscall_name: body.syscall_name || 'custom.intent',
      payload: body.payload || {},
      idempotency_key: body.idempotency_key || intentId,
      priority: body.priority || 2,
      epoch: body.epoch || 'epoch-0'
    };

    // Note: Usually intent gets written to registry first by syscall router, but for direct pipeline submission:
    const supabase = getSupabase();
    await supabase.from('kernel_intent_registry').insert({
      intent_id: intentId,
      syscall_name: pipelineIntent.syscall_name,
      payload: pipelineIntent.payload,
      idempotency_key: pipelineIntent.idempotency_key,
      priority: pipelineIntent.priority,
      status: 'PENDING'
    });

    const result = await runExecutionPipeline(pipelineIntent);
    
    await supabase.from('kernel_intent_registry').update({ status: 'COMPLETED' }).eq('intent_id', intentId);

    return c.json({ success: true, result });
  } catch (err: any) {
    console.error('Execution Failed:', err);
    return c.json({ error: err.message }, 500);
  }
});

// POST /kernel/replay/:id -> Trigger replay
kernelRouter.post('/replay/:id', async (c) => {
  try {
    const intentId = c.req.param('id');
    const result = await replayIntent(intentId);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /kernel/poe/:id -> PoE certificate
kernelRouter.get('/poe/:id', async (c) => {
  const intentId = c.req.param('id');
  const supabase = getSupabase();
  const { data, error } = await supabase.from('kernel_execution_certificates').select('*').eq('intent_id', intentId).single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

// GET /kernel/violations -> List DECT violations
kernelRouter.get('/violations', async (c) => {
  const supabase = getSupabase();
  const limit = parseInt(c.req.query('limit') || '50');
  const { data, error } = await supabase.from('kernel_dect_violations').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /kernel/epochs -> List scheduling epochs
kernelRouter.get('/epochs', async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('kernel_scheduling_epochs').select('*').order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /kernel/stream -> Global SSE
kernelRouter.get('/stream', (c) => {
  return streamSSE(c, async (stream) => {
    registerSSEClient(stream);
    stream.onAbort(() => {
      console.log('Global SSE connection aborted');
    });
    await stream.writeSSE({ data: JSON.stringify({ type: 'connected' }) });
    await new Promise(() => {});
  });
});

// GET /kernel/stream/:intentId -> Intent-specific live execution SSE
kernelRouter.get('/stream/:intentId', (c) => {
  const intentId = c.req.param('intentId');
  return streamSSE(c, async (stream) => {
    console.log(`[SSE] Client connected to live stream for intent ${intentId}`);
    
    const unsubscribe = streamBridge.subscribeToIntent(intentId, (event: any) => {
      stream.writeSSE({
        event: 'execution.step',
        data: JSON.stringify(event)
      }).catch((err: any) => {
        console.error(`[SSE] Error writing to stream ${intentId}:`, err);
        unsubscribe();
      });
    });

    stream.onAbort(() => {
      console.log(`[SSE] Client disconnected from live stream for intent ${intentId}`);
      unsubscribe();
    });

    await stream.writeSSE({ data: JSON.stringify({ type: 'connected', intent_id: intentId }) });
    
    // Keep connection alive
    await new Promise(() => {});
  });
});

export default kernelRouter;
