// packages/kernel-graph/src/v7.2.1/ecvm/gdg.ts
/**
 * Global Determinism Guard (GDG)
 *
 * All prohibited APIs are listed in `FORBIDDEN`. Any attempt to call one of them
 * from inside the ECVM sandbox will throw a `GdgViolation` error, causing the
 * current intent to abort (but the worker process stays alive).
 */
export const FORBIDDEN = [
  'Date.now',
  'Math.random',
  'fetch',
  'global.fetch',
  'pg.queryLive', // hypothetical live query helper
];

export class GdgViolation extends Error {
  constructor(public readonly apiName: string) {
    super(`GDG violation – prohibited API call: ${apiName}`);
    this.name = 'GdgViolation';
  }
}

/**
 * Guard wrapper – call with the full function name (e.g. "Date.now").
 * If the call is forbidden, throws `GdgViolation`.
 */
export const guard = (apiName: string): void => {
  if (FORBIDDEN.includes(apiName)) {
    throw new GdgViolation(apiName);
  }
};

/**
 * Helper to patch global objects inside the sandbox.
 * This is executed once when the ECVM sandbox is created.
 */
export function patchGlobals(): void {
  // Patch Date.now (HARD ERROR, NO FALLBACK)
  Date.now = function () {
    throw new GdgViolation('Date.now');
  };

  // Patch Math.random (HARD ERROR, NO FALLBACK)
  Math.random = function () {
    throw new GdgViolation('Math.random');
  };

  // Patch fetch (HARD ERROR, NO FALLBACK)
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).fetch = function () {
      throw new GdgViolation('fetch');
    };
  }
}
