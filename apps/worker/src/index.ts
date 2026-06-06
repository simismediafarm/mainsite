import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { Receiver } from '@upstash/qstash';
import { SimisEventSchemaV4, SIMIS_QUEUE_NAMES } from '@simis/shared';
import { Queue } from 'bullmq';

// Boot up the internal workers
import './ai.worker';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

const eventQueue = new Queue(SIMIS_QUEUE_NAMES.AI_ENRICHMENT, { connection });

const app = new Hono();

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

app.get('/health', (c) => c.text('Worker is alive!'));

// 1. QStash Consume Endpoint (Render Execution Gate)
app.post('/qstash/consume', async (c) => {
  const signature = c.req.header('upstash-signature');
  
  if (!signature) {
    return c.json({ error: 'Missing Upstash signature' }, 401);
  }

  const rawBody = await c.req.text();
  
  // Verify signature (Render Worker Execution Lock)
  try {
    const isValid = await receiver.verify({
      signature,
      body: rawBody,
    });
    
    if (!isValid) {
      return c.json({ error: 'Invalid Upstash signature' }, 401);
    }
  } catch (error: any) {
    console.error("Signature verification failed", error);
    return c.json({ error: 'Verification error', details: error.message }, 401);
  }

  // Parse body as JSON
  let jsonBody;
  try {
    jsonBody = JSON.parse(rawBody);
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  // Enforce Event Schema V4
  const parseResult = SimisEventSchemaV4.safeParse(jsonBody);
  if (!parseResult.success) {
    console.error("Event Schema Validation Failed:", parseResult.error);
    return c.json({ error: 'Event schema mismatch', details: parseResult.error }, 400);
  }

  const event = parseResult.data;
  console.log(`[Worker] Received verified event: ${event.type} (Trace ID: ${event.trace_id})`);

  // ── PUSH TO BACKGROUND QUEUE (Avoid Render 100s Timeout) ──
  // Based on SIMIS V4 architecture, we route it to the AI_ENRICHMENT queue.
  await eventQueue.add('qstash-event', {
    eventType: event.type,
    payload: event.payload,
    traceId: event.trace_id
  }, {
    jobId: event.trace_id, // Prevent duplicate jobs if QStash retries
    removeOnComplete: 1000,
    removeOnFail: 500
  });

  return c.json({ success: true, status: 'enqueued', trace_id: event.trace_id });
});

// 2. Replay Endpoint (For Execution Replay System)
app.post('/internal/replay', async (c) => {
  // Usually this would require internal auth/JWT.
  return c.json({ status: 'Replay scheduled' });
});

const port = parseInt(process.env.PORT || '3001', 10);
console.log(`Worker is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
