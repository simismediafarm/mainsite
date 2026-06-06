import fs from 'fs';
import path from 'path';

/**
 * Critical Drift Exception class.
 */
export class CriticalDriftException extends Error {
  constructor(message: string) {
    super(`[Runtime Drift Invariant Violation] CRITICAL_DRIFT: ${message}`);
    this.name = 'CriticalDriftException';
  }
}

/**
 * Periodically checks system state for architectural drift.
 */
export function enableDriftMonitor() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  // Run initial checks
  runDriftChecks(isProduction);

  // Set periodic checker (every 10 minutes)
  const interval = setInterval(() => {
    try {
      runDriftChecks(isProduction);
    } catch (e: any) {
      console.error('CRITICAL: SIK Drift Monitor caught violation:', e.message);
      if (isProduction) {
        throw e;
      }
    }
  }, 10 * 60 * 1000);

  // Prevent blocking Node process from exiting if there are no other tasks
  if (interval.unref) {
    interval.unref();
  }
}

function runDriftChecks(isProduction: boolean) {
  // 1. Detect any SQLite files or packages in production path
  const devDbPath = path.join(process.cwd(), 'dev.db');
  if (fs.existsSync(devDbPath)) {
    // SQLite file exists - potential drift
    throw new CriticalDriftException('Local SQLite database file "dev.db" detected in workspace. SQLite is strictly forbidden in the production path.');
  }

  // Check if better-sqlite3 or sqlite3 package is loaded in require cache
  const loadedModules = Object.keys(require.cache);
  const sqliteModules = loadedModules.filter(m => m.includes('better-sqlite3') || m.includes('sqlite3'));
  if (sqliteModules.length > 0) {
    throw new CriticalDriftException(`Forbidden SQLite driver loaded in require cache: ${sqliteModules.join(', ')}`);
  }

  // 2. Validate unmounted v2Router or missing routes
  // (We check this by validating that v2 routes are present in RouteRegistry cache)
  const { prisma } = require('../../prisma');
  prisma.routeRegistry.findFirst({
    where: { path: { startsWith: '/api/v2' } }
  }).then((v2Route: any) => {
    if (!v2Route) {
      throw new CriticalDriftException('No mounted v2Router routes found in RouteRegistry. The SIMIS V2.0 Programmatic Media router is unmounted or unregistered.');
    }
  }).catch((err: any) => {
    if (err.name === 'CriticalDriftException') throw err;
  });
}
