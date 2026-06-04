// packages/kernel-graph/src/v7.2.1/utils/hash.ts
import crypto from 'crypto';

/**
 * Generate a stable SHA‑256 hash for the supplied object.
 * The object is first stringified with stable ordering (keys sorted).
 */
export function stableExecutionHash(obj: any): string {
  const canonical = stableStringify(obj);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Deterministic JSON.stringify that sorts object keys recursively.
 */
function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}
