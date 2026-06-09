/**
 * Environment variable validation.
 * Throws at module load time if required vars are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: optionalEnv('NEXT_PUBLIC_SUPABASE_URL', ''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
  NEXT_PUBLIC_KERNEL_API_URL: optionalEnv(
    'NEXT_PUBLIC_KERNEL_API_URL',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000'
  ),
} as const;
