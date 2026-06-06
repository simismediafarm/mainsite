import { checkEnvInvariant } from './guards/env.invariant';
import { checkDbInvariant } from './guards/db.invariant';
import { enforceQueueInvariant } from './guards/queue.invariant';
import { loadRouteRegistry } from './guards/route.invariant';
import { enableDriftMonitor } from './runtime/drift.monitor';

export interface BootstrapConfig {
  mountedRoutes?: string[];
  isWorker?: boolean;
}

/**
 * SIMIS System Invariant Kernel (SIK) Bootstrap Initializer.
 * Enforces architectural invariants at process startup.
 */
export async function bootstrapKernel(config: BootstrapConfig = {}) {
  console.log('🛡️ [SIK] Initializing SIMIS System Invariant Kernel...');

  // 1. Environment Invariant Validation (terminate_process on failure)
  checkEnvInvariant();
  console.log('✅ [SIK] Env Invariants Verified.');

  // 2. Database Invariant Validation (throw_error_and_block_startup on failure)
  checkDbInvariant();
  console.log('✅ [SIK] DB Invariants Verified.');

  // 3. Queue Registry Validation (throw_error_on_boot_or_dispatch on failure)
  enforceQueueInvariant();
  console.log('✅ [SIK] Queue Invariants Verified.');

  // 4. Route Registry Load (only for API)
  if (!config.isWorker && config.mountedRoutes) {
    await loadRouteRegistry(config.mountedRoutes);
    console.log('✅ [SIK] Route Registry Loaded.');
  }

  // 5. Attach Runtime Hooks & Enable Drift Monitor
  enableDriftMonitor();
  console.log('✅ [SIK] Runtime Drift Monitor Enabled.');
  console.log('🛡️ [SIK] System Invariant Kernel Bootstrapped Successfully.');
}
