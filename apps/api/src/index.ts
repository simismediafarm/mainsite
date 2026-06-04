import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import kernelRouter from './routers/kernel';
import researchRouter from './routers/research';
import v2Router from './routers/v2';
import adminRouter from './routers/admin';
import opsRouter from './routers/ops';
import publicRouter from './routers/public';
import { setupRealtimeBridge } from './services/realtime';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

// ── Global Middleware ────────────────────────────────────────────────────────
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// ── Public Routes (no auth) ──────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', service: 'simis-kernel-api' }));
app.route('/api/v2', v2Router);

// ── Protected Routes (require valid Supabase JWT or Service Key) ─────────────
app.use('/kernel/*', authMiddleware);
app.use('/research/*', authMiddleware);
app.use('/admin/*', authMiddleware);
app.use('/api/v2/ops/*', authMiddleware);

app.route('/kernel', kernelRouter);
app.route('/research', researchRouter);
app.route('/admin', adminRouter);
app.route('/api/v2/ops', opsRouter);
app.route('/api/v2/public', publicRouter);


import { handle } from 'hono/vercel';

// ── Start Server / Export Handler ───────────────────────────────────────────
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
if (!process.env.VERCEL) {
  console.log(`[API] Starting Hono server on port ${port}...`);
  setupRealtimeBridge();
  serve({
    fetch: app.fetch,
    port,
  });
}

// Export the Vercel handler for Serverless deployments
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export default handle(app);
