/**
 * rate_limit.ts — Custom Lightweight In-Memory Rate Limiter Middleware for Hono
 */

import { MiddlewareHandler } from 'hono';

interface RateRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateRecord>();

/**
 * Hono middleware to enforce rate limits per client IP
 */
export function rateLimit(limit = 60, windowMs = 60 * 1000): MiddlewareHandler {
  return async (c, next) => {
    // In production, extract real IP behind proxy
    const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    let record = ipStore.get(ip);
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    ipStore.set(ip, record);

    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - record.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > limit) {
      return c.json({ error: 'Rate limit exceeded. Too many requests.' }, 429);
    }

    await next();
  };
}
