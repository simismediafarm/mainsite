/**
 * Environment variable validation using Zod.
 * Throws at module load time on server if required vars are missing/invalid.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_KERNEL_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
});

function buildEnv() {
  const result = EnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_KERNEL_API_URL: process.env.NEXT_PUBLIC_KERNEL_API_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL,
  });

  if (!result.success) {
    const missing = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`[SIMIS] Invalid environment configuration:\n${missing}`);
  }

  const parsed = result.data;
  return {
    ...parsed,
    NEXT_PUBLIC_KERNEL_API_URL:
      parsed.NEXT_PUBLIC_KERNEL_API_URL ??
      (parsed.NEXT_PUBLIC_VERCEL_URL
        ? `https://${parsed.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:4000'),
  } as const;
}

export const env = buildEnv();
