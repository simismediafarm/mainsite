import { Hono } from 'hono';
import * as prismaRuntimeUtils from '@prisma/client-runtime-utils'; // Force Vercel NFT to bundle this Prisma dependency
console.log('[Prisma Runtime Load]', !!prismaRuntimeUtils); // Prevent tree-shaking

import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { mvpRouter } from './routers/mvp';
import { registryRouter } from './routers/registry';
import { handle } from 'hono/vercel';
import { adminRouter } from './routers/admin/index';
import v2Router from './routers/v2';
import { honoSikMiddleware } from './kernel/guards/event.invariant';
import { honoRouteInvariantMiddleware } from './kernel/guards/route.invariant';

type Variables = {
  traceId: string;
};

const app = new Hono<{ Variables: Variables }>();

import { prisma } from './prisma';
import crypto from 'crypto';

// SIK: Enforce Event Trace Context and Route Invariants on all requests
app.use('*', honoSikMiddleware);
app.use('*', honoRouteInvariantMiddleware);

// Global Middleware
app.use('*', async (c, next) => {
  const traceId = c.req.header('x-trace-id') || crypto.randomUUID();
  c.set('traceId', traceId);
  c.res.headers.set('X-Trace-Id', traceId);
  
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  
  console.log(`[${c.req.method}] ${c.req.url} - ${c.res.status} - ${ms}ms [trace:${traceId}]`);
});

app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization', 'X-SIMIS-OPS-KEY', 'X-Trace-Id'],
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

// Protect v2 Admin routes
app.use('/api/v2/admin/*', authMiddleware);
app.use('/api/v2/admin/*', adminAuthMiddleware);

// Protect Kernel API
app.use('/api/kernel/*', authMiddleware);

// Mount Control Tower Admin API (v3.1) — Command, Metrics, Trace
app.route('/api/admin', adminRouter);

// Mount SIMIS V2.0 Programmatic Media Platform (v2Router)
app.route('/api/v2', v2Router);

// Mount Kernel API (v3.1)
app.route('/api/kernel', kernelRouter);

// Mount Cron triggers
app.route('/api/cron', cronRouter);

// Health Check with DB ping
app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'ok', service: 'simis-mediafarm-api', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[HealthCheck] DB Connection Failed:', error);
    return c.json({ status: 'error', service: 'simis-mediafarm-api', db: 'disconnected' }, 503);
  }
});

// Start Server / Export Handler
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;

import { bootstrapKernel } from './kernel/bootstrap';

// SIK: Bootstrap System Invariant Kernel
const mountedPaths = app.routes.map(r => r.path);
bootstrapKernel({ mountedRoutes: mountedPaths }).catch((err) => {
  console.error('CRITICAL: SIK Bootstrap failed:', err);
  process.exit(1);
});

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
