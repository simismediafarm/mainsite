import { API_BASE } from './kernel-api';

/**
 * registryClient.ts
 * Utility to fetch configuration from SIMIS Core Registries.
 * Can be used in Next.js Server Components.
 */

async function fetchRegistry(endpoint: string, options: RequestInit = {}) {
  // We use ISR / Cache by default for registries as they don't change often
  const defaultOptions: RequestInit = { next: { revalidate: 60 } };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch registry ${endpoint}: ${response.status}`);
    return null;
  }

  return response.json();
}

export class RegistryClient {
  async getNavigation() {
    return fetchRegistry('/api/v1/registry/navigation');
  }

  async getNavigationByKey(key: string) {
    return fetchRegistry(`/api/v1/registry/navigation/${key}`);
  }

  async getTaxonomy() {
    return fetchRegistry('/api/v1/registry/taxonomy');
  }

  async getWidgets() {
    return fetchRegistry('/api/v1/registry/widgets');
  }

  async getWidgetByKey(key: string) {
    return fetchRegistry(`/api/v1/registry/widgets/${key}`);
  }

  async getPages() {
    return fetchRegistry('/api/v1/registry/pages');
  }

  async getPageBySlug(slug: string) {
    return fetchRegistry(`/api/v1/registry/pages/${slug}`);
  }

  async getRoutes() {
    return fetchRegistry('/api/v1/registry/routes');
  }

  async getRouteByPath(path: string) {
    return fetchRegistry(`/api/v1/registry/routes/${path}`);
  }

  async getFeatures() {
    return fetchRegistry('/api/v1/registry/features');
  }
}

export const registry = new RegistryClient();
