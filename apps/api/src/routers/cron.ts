import { Hono } from 'hono';
import { QueueDispatcherService } from '../services/admin/queue-dispatcher';
import { SIMISCommand } from '@simis/shared';

export const cronRouter = new Hono();

// This endpoint is triggered by Vercel Cron
cronRouter.get('/rss', async (c) => {
  // Check authorization header or IP if needed (Vercel sets a specific header)
  // For security, Vercel cron jobs send an Authorization header with a Bearer token
  // that matches CRON_SECRET. But for now we just dispatch the job.
  
  const authHeader = c.req.header('Authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const command: Partial<SIMISCommand> = {
    source: 'ai',
    actor: 'system-cron',
    type: 'CRAWLER.TRIGGER',
    mode: 'execute',
    priority: 'standard',
    scope: { type: 'rss' }
  };
  
  await QueueDispatcherService.dispatch(command as any);
  
  return c.json({ status: 'ok', message: 'RSS Crawler Triggered' });
});

cronRouter.get('/metrics', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const command: Partial<SIMISCommand> = {
    source: 'ai',
    actor: 'system-cron',
    type: 'ATTENTION.RECALCULATE',
    mode: 'execute',
    priority: 'standard',
    scope: { target: 'all' }
  };
  
  await QueueDispatcherService.dispatch(command as any);
  
  return c.json({ status: 'ok', message: 'Metrics Recalculation Triggered' });
});
