/**
 * posthog_client.ts — PostHog event stream client
 *
 * PRODUCTION HARDENING: POSTHOG_API_KEY is REQUIRED.
 * No mock key fallback — fail fast if env var is missing.
 */

import { PostHog } from 'posthog-node';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.POSTHOG_API_KEY;
const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

if (!apiKey) {
  throw new Error(
    '[SIMIS OPS] FATAL: POSTHOG_API_KEY is not set. ' +
    'Observability layer cannot start without a valid PostHog key. ' +
    'Set POSTHOG_API_KEY in your environment.'
  );
}

export const posthog = new PostHog(apiKey, { host });

// Graceful shutdown
process.on('exit', () => posthog.shutdown());
