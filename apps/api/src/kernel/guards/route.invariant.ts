import { prisma } from '../../prisma';

let registeredRoutesCache: Set<string> = new Set();

/**
 * Loads registered routes from DB into memory.
 * If RouteRegistry is empty, it can auto-seed with standard system routes.
 */
export async function loadRouteRegistry(mountedRoutes: string[]) {
  try {
    let records = await prisma.routeRegistry.findMany();

    if (records.length === 0 && mountedRoutes.length > 0) {
      console.log('[SIK Route Guard] RouteRegistry table is empty. Auto-seeding mounted routes...');
      
      const seedData = mountedRoutes.map(path => ({
        path,
        target: 'system.auto_generated'
      }));

      const prevBypass = process.env.SIK_BYPASS;
      process.env.SIK_BYPASS = 'true';
      try {
        await prisma.routeRegistry.createMany({
          data: seedData,
          skipDuplicates: true
        });
      } finally {
        if (prevBypass === undefined) {
          delete process.env.SIK_BYPASS;
        } else {
          process.env.SIK_BYPASS = prevBypass;
        }
      }

      records = await prisma.routeRegistry.findMany();
    }

    registeredRoutesCache = new Set(records.map((r: any) => r.path));
    console.log(`[SIK Route Guard] Loaded ${registeredRoutesCache.size} routes into active validation cache.`);
  } catch (err: any) {
    console.warn(`[SIK Route Guard] Database not ready or schema missing. Skipping registry validation. Error:`, err.message);
  }
}

/**
 * Hono Middleware to block unregistered request paths.
 */
export const honoRouteInvariantMiddleware = async (c: any, next: any) => {
  const path = c.req.path;

  // We protect API endpoints accessible by the frontend
  const isFrontendAccessible = path.startsWith('/api/v2') || path.startsWith('/api/mvp') || path.startsWith('/api/kernel');

  if (isFrontendAccessible && registeredRoutesCache.size > 0) {
    let isRegistered = false;

    // Direct match check
    if (registeredRoutesCache.has(path)) {
      isRegistered = true;
    } else {
      // Wildcard prefix check (e.g. /api/mvp/post/:id matching /api/mvp/post/* or similar)
      for (const regPath of registeredRoutesCache) {
        // Convert route pattern: replace parameter syntax (like :id) with wildcard matching regex
        const patternRegex = new RegExp('^' + regPath.replace(/:[^\s/]+/g, '[^/]+').replace(/\*/g, '.*') + '$');
        if (patternRegex.test(path)) {
          isRegistered = true;
          break;
        }
      }
    }

    if (!isRegistered && process.env.NODE_ENV !== 'test') {
      return c.json({
        error: `[Route Invariant Violation] Unauthorized access: request path "${path}" is not registered in ROUTE_REGISTRY.`
      }, 403);
    }
  }

  await next();
};
