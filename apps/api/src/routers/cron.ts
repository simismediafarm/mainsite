import { Hono } from 'hono';
import { QueueDispatcherService } from '../services/admin/queue-dispatcher';
import { SIMISCommand } from '@simis/shared';
import { Receiver } from '@upstash/qstash';

export const cronRouter = new Hono();

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

// Middleware to verify QStash signature
const verifyQStash = async (c: any, next: any) => {
  const signature = c.req.header('upstash-signature');
  
  if (!signature) {
    return c.json({ error: 'Missing Upstash signature' }, 401);
  }

  // To verify we need the raw body if there is one. 
  // QStash GET/POST might have empty body for simple pings.
  const rawBody = await c.req.text();
  
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

  await next();
};

// Apply middleware to all routes in this router
cronRouter.use('*', verifyQStash);

// Upstash QStash Cron for RSS
cronRouter.post('/rss', async (c) => {
  const command: Partial<SIMISCommand> = {
    source: 'ai',
    actor: 'system-cron',
    type: 'CRAWLER.TRIGGER',
    mode: 'execute',
    priority: 'standard',
    scope: { type: 'rss' }
  };
  
  await QueueDispatcherService.dispatch(command as any);
  
  return c.json({ status: 'ok', message: 'RSS Crawler Triggered via QStash' });
});

// Upstash QStash Cron for Metrics
cronRouter.post('/metrics', async (c) => {
  const command: Partial<SIMISCommand> = {
    source: 'ai',
    actor: 'system-cron',
    type: 'ATTENTION.RECALCULATE',
    mode: 'execute',
    priority: 'standard',
    scope: { target: 'all' }
  };
  
  await QueueDispatcherService.dispatch(command as any);
  
  return c.json({ status: 'ok', message: 'Metrics Recalculation Triggered via QStash' });
});
