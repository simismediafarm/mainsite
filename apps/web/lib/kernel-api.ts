/**
 * kernel-api.ts — Frontend API client for SIMIS kernel
 * SSR-safe: no browser APIs called at module level.
 *
 * fetchKernelApi  — authenticated client-side calls (requires Supabase session)
 * fetchPublicApi  — unauthenticated server-side calls (public content: feed, posts)
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_KERNEL_API_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000');

function getSupabaseBrowser() {
  // Lazy import — only runs in browser, never during SSR/prerender
  const { createBrowserClient } = require('@supabase/ssr');
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Authenticated API call — requires an active Supabase session.
 * Use for all admin and protected endpoints.
 */
export async function fetchKernelApi(endpoint: string, options: RequestInit = {}) {
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('SIMIS: No active session — please sign in before accessing kernel API.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Public API call — no auth required.
 * Use for SSR data fetching (homepage feed, single post, tags).
 * Safe to call from Server Components and Route Handlers.
 */
export async function fetchPublicApi(endpoint: string, options: RequestInit = {}) {
  // Resolve the base URL for SSR context (process.env are available server-side)
  const base =
    process.env.NEXT_PUBLIC_KERNEL_API_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:4000');

  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }

  return response.json();
}
