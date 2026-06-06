/**
 * kernel-api.ts — Frontend API client for SIMIS kernel
 *
 * PRODUCTION HARDENING: Auth header is now REQUIRED.
 * All requests to /kernel/* and /research/* include the Supabase Bearer token.
 */

import { createBrowserClient } from '@supabase/ssr';

export const API_BASE = process.env.NEXT_PUBLIC_KERNEL_API_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000');

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function fetchKernelApi(endpoint: string, options: RequestInit = {}) {
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('SIMIS: No active session — please sign in before accessing kernel API.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }

  return response.json();
}
