import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { mvpRouter } from './routers/mvp';
import { handle } from 'hono/vercel';

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Mount MVP Blog Platform routes
app.route('/api/mvp', mvpRouter);

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
