// packages/kernel-graph/src/v7.2.1/ecvm/boot.ts
/**
 * Kernel Bootstrap — ECVM Global Guard Initialization.
 *
 * MUST be imported and called ONCE at process startup, before any intent is processed.
 *
 * What this does:
 *   1. Patches global non-deterministic APIs (Date.now, Math.random, fetch)
 *      via GDG.patchGlobals() — any call to these throws GdgViolation.
 *   2. Marks the global guard as active so subsequent calls are idempotent.
 *   3. Registers an uncaught-exception handler that logs DECT context for
 *      post-mortem analysis.
 *
 * Usage (e.g. in your worker/server entrypoint):
 *
 *   import { kernelBoot } from '@simis/kernel-graph/v7.2.1/ecvm/boot';
 *   kernelBoot();
 *   // ... start processing intents
 */

import { initializeGlobalGuard } from './sandbox';

let _booted = false;

export function kernelBoot(): void {
  if (_booted) return;

  console.log('[KERNEL BOOT] Initializing ECVM global guard...');

  // Patch global non-deterministic APIs — after this point, any live call to
  // Date.now / Math.random / fetch inside the kernel process will throw GdgViolation.
  initializeGlobalGuard();

  // Uncaught exception handler — log DECT context for debugging.
  process.on('uncaughtException', (err) => {
    console.error('[KERNEL BOOT] Uncaught exception — possible DECT violation:', err.message);
    // In production you would also emit a DECT telemetry event here.
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[KERNEL BOOT] Unhandled rejection — possible DECT violation:', reason);
  });

  _booted = true;
  console.log('[KERNEL BOOT] ECVM global guard active. Non-deterministic APIs are blocked.');
}
