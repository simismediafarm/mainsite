import { createHash } from "crypto";

/**
 * Canonical representation of a Lean theorem instance used for deterministic hashing.
 * The goal is to remove all non‑semantic noise (whitespace, ordering of independent
 * premises, etc.) so that identical logical proofs always produce the same hash
 * regardless of formatting or tactic ordering.
 */
export interface LeanCanonicalProof {
  /** Human‑readable theorem signature (e.g. "DECT" or "PathSet_single") */
  theorem: string;
  /** Sorted array of premise statements (as strings) */
  premises: string[];
  /** Sorted array of proof obligations / lemmas used */
  obligations: string[];
  /** The conclusion statement */
  conclusion: string;
}

/**
 * Helper: strip all whitespace characters (space, tab, newline) from a string.
 * This normalizes cosmetic differences in Lean source fragments.
 */
function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, "");
}

/**
 * Helper: deep‑clone and sort an array of strings deterministically.
 */
function sortStrings(arr: string[]): string[] {
  return [...arr].map(normalizeWhitespace).sort();
}

/**
 * Convert a raw Lean proof representation (as obtained from a Lean‑generated JSON
 * or exported data structure) into a deterministic canonical form.
 *
 * The function assumes the raw proof has the following shape (any missing fields
 * are treated as empty):
 * ```json
 * {
 *   "theorem": "DECT",
 *   "premises": ["GDG \"fetch\"", "PathSet i c = 1"],
 *   "obligations": ["lemma1", "lemma2"],
 *   "conclusion": "True"
 * }
 * ```
 *
 * It normalizes whitespace, sorts premises & obligations, and returns the
 * LeanCanonicalProof object.
 */
export function canonicalizeLeanProof(rawProof: any): LeanCanonicalProof {
  const theorem = rawProof?.theorem ? normalizeWhitespace(String(rawProof.theorem)) : "";
  const premises = rawProof?.premises ? sortStrings(rawProof.premises) : [];
  const obligations = rawProof?.obligations ? sortStrings(rawProof.obligations) : [];
  const conclusion = rawProof?.conclusion ? normalizeWhitespace(String(rawProof.conclusion)) : "";

  return {
    theorem,
    premises,
    obligations,
    conclusion,
  };
}

/**
 * Stable JSON stringify that sorts object keys alphabetically.  This guarantees
 * that two objects with identical logical content produce identical string
 * representations, independent of property insertion order.
 */
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    // Arrays are already ordered (we have sorted them previously where needed)
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  // For plain objects, sort keys
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",") + "}";
}

/**
 * Compute a deterministic SHA‑256 hash of a LeanCanonicalProof.
 * The hash contract is:
 *   sha256(JSON.stringify(canonicalProof, sortedKeys))
 * where the JSON representation has its keys sorted alphabetically.
 */
export function leanProofHash(p: LeanCanonicalProof): string {
  const serialized = stableStringify(p);
  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Convenience wrapper that takes a raw Lean proof object, canonicalizes it, and
 * returns the hash.  This can be used directly by the Closure Bridge.
 */
export function hashLeanProof(rawProof: any): string {
  const canonical = canonicalizeLeanProof(rawProof);
  return leanProofHash(canonical);
}
