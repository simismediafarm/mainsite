import { Hono } from 'hono';
import * as prismaRuntimeUtils from '@prisma/client-runtime-utils'; // Force Vercel NFT to bundle this Prisma dependency
import { logger, childLogger } from './logger';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { handle } from '@hono/node-server/vercel';
import crypto from 'crypto';
import { prisma } from './prisma';
import { mvpRouter } from './routers/mvp';
import { registryRouter } from './routers/registry';
import { designSystemRouter } from './routers/design-system';
import { cronRouter } from './routers/cron';
import { adminRouter } from './routers/admin/index';
import v2Router from './routers/v2';
import opsRouter from './routers/ops';
import kernelRouter from './routers/kernel';
import { authMiddleware, adminAuthMiddleware } from './middleware/auth';
import { honoSikMiddleware } from './kernel/guards/event.invariant';
import { honoRouteInvariantMiddleware } from './kernel/guards/route.invariant';
import { bootstrapKernel } from './kernel/bootstrap';
import { startSentinelLoop } from './sentinel-loop';

logger.debug({ prismaLoaded: !!prismaRuntimeUtils }, '[Prisma Runtime Load]'); // Prevent tree-shaking

type Variables = { traceId: string };

const app = new Hono<{ Variables: Variables }>();

// SIK: Enforce Event Trace Context and Route Invariants on all requests
app.use('*', honoSikMiddleware);
app.use('*', honoRouteInvariantMiddleware);

// Global Middleware: trace ID + request logging
app.use('*', async (c, next) => {
  const traceId = c.req.header('x-trace-id') || crypto.randomUUID();
  c.set('traceId', traceId);
  c.res.headers.set('X-Trace-Id', traceId);
  const start = Date.now();
  await next();
  childLogger(traceId).info({ method: c.req.method, url: c.req.url, status: c.res.status, ms: Date.now() - start });
});

app.use('*', cors({
  origin: (origin) => {
    const allowed = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());
    if (!origin) return allowed[0];
    if (allowed.includes(origin)) return origin;
    if (origin.endsWith('.vercel.app')) return origin;
    return allowed[0];
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-SIMIS-OPS-KEY', 'X-Trace-Id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Auth guards
app.use('/api/admin/*', authMiddleware);
app.use('/api/admin/*', adminAuthMiddleware);
app.use('/api/v2/admin/*', authMiddleware);
app.use('/api/v2/admin/*', adminAuthMiddleware);
app.use('/api/kernel/*', authMiddleware);

// Routes
app.route('/api/mvp', mvpRouter);
app.route('/api/v1/registry', registryRouter);
app.route('/api/v1/design-system', designSystemRouter);
app.route('/api/admin', adminRouter);
app.route('/api/v2', v2Router);
app.route('/api/v2/ops', opsRouter);
app.route('/api/kernel', kernelRouter);
app.route('/api/cron', cronRouter);

// Health Check
app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'ok', service: 'simis-mediafarm-api', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, '[HealthCheck] DB Connection Failed');
    return c.json({ status: 'error', service: 'simis-mediafarm-api', db: 'disconnected' }, 503);
  }
});

// SIK Bootstrap
const mountedPaths = app.routes.map(r => r.path);
bootstrapKernel({ mountedRoutes: mountedPaths }).then(() => {
  startSentinelLoop();
}).catch((err) => {
  logger.fatal({ err }, 'CRITICAL: SIK Bootstrap failed');
  if (!process.env.VERCEL) process.exit(1);
});

if (!process.env.VERCEL) {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
  logger.info({ port }, '[API] Starting Hono SIMIS MediaFarm API');
  serve({ fetch: app.fetch, port });
}

// Vercel Serverless exports
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export default handle(app);
