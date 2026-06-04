/**
 * auth.ts — Supabase JWT Authentication Middleware for Hono API
 *
 * PRODUCTION HARDENING: All /kernel/* routes require a valid Supabase JWT.
 * Unauthenticated requests are rejected with 401.
 * Expired or malformed tokens are rejected with 403.
 */

import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[SIMIS API] FATAL: SUPABASE_URL or SUPABASE_ANON_KEY is not set. ' +
    'Auth middleware cannot start without valid credentials.'
  );
}

/**
 * Hono middleware that validates a Supabase Bearer JWT on every request.
 *
 * Usage:
 *   app.use('/kernel/*', authMiddleware);
 *   app.use('/research/*', authMiddleware);
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const opsKey = c.req.header('X-SIMIS-OPS-KEY');

  if (opsKey && process.env.SIMIS_OPS_KEY && opsKey === process.env.SIMIS_OPS_KEY) {
    // CLI or Bot with valid ops key bypasses JWT check
    return await next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  // Use the anon Supabase client to validate the user token
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return c.json({ error: 'Forbidden: invalid or expired session token' }, 403);
  }

  // Attach the authenticated user to context for downstream handlers
  c.set('user', data.user);

  await next();
}
