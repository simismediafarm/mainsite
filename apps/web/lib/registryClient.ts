/**
 * registryClient.ts — Server-side registry fetcher for SIMIS Core Registries.
 * Uses NEXT_PUBLIC_KERNEL_API_URL (must be set in Vercel env vars).
 */

// Resolve at call time (not import time) so it works in both SSR and edge
function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_KERNEL_API_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  );
}

async function fetchRegistry(endpoint: string): Promise<any | null> {
  const base = getApiBase();
  if (!base) return null; // build-time: no API available, render defaults

  try {
    const response = await fetch(`${base}${endpoint}`, {
      next: { revalidate: 60 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export class RegistryClient {
  getNavigation() { return fetchRegistry('/api/v1/registry/navigation'); }
  getNavigationByKey(key: string) { return fetchRegistry(`/api/v1/registry/navigation/${key}`); }
  getTaxonomy() { return fetchRegistry('/api/v1/registry/taxonomy'); }
  getWidgets() { return fetchRegistry('/api/v1/registry/widgets'); }
  getWidgetByKey(key: string) { return fetchRegistry(`/api/v1/registry/widgets/${key}`); }
  getPages() { return fetchRegistry('/api/v1/registry/pages'); }
  getPageBySlug(slug: string) { return fetchRegistry(`/api/v1/registry/pages/${slug}`); }
  getRoutes() { return fetchRegistry('/api/v1/registry/routes'); }
  getRouteByPath(path: string) { return fetchRegistry(`/api/v1/registry/routes/${path}`); }
  getFeatures() { return fetchRegistry('/api/v1/registry/features'); }
}

export const registry = new RegistryClient();
