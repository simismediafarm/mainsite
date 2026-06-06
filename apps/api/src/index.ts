import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { mvpRouter } from './routers/mvp';
import { registryRouter } from './routers/registry';
import { handle } from 'hono/vercel';
import { adminRouter } from './routers/admin/index';

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization', 'X-SIMIS-OPS-KEY'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Mount MVP Blog Platform routes
app.route('/api/mvp', mvpRouter);

// Mount SIMIS V2.2 Registries
app.route('/api/v1/registry', registryRouter);

import { cronRouter } from './routers/cron';
import { authMiddleware, adminAuthMiddleware } from './middleware/auth';
import kernelRouter from './routers/kernel';

// Protect Control Tower Admin API with Supabase Auth + RBAC Admin verification
app.use('/api/admin/*', authMiddleware);
app.use('/api/admin/*', adminAuthMiddleware);

// Protect Kernel API
app.use('/api/kernel/*', authMiddleware);

// Mount Control Tower Admin API (v3.1) — Command, Metrics, Trace
app.route('/api/admin', adminRouter);

// Mount Kernel API (v3.1)
app.route('/api/kernel', kernelRouter);

// Mount Cron triggers
app.route('/api/cron', cronRouter);

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', service: 'simis-mediafarm-api' }));

// Start Server / Export Handler
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
if (!process.env.VERCEL) {
  console.log(`[API] Starting Hono SIMIS MediaFarm API on port ${port}...`);
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
