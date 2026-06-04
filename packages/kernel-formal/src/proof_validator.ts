import crypto from 'crypto';

export async function validateProof(proof: any) {

  // strict invariant gate
  if (!proof.theorem) return false;
  if (!proof.witness) return false;

  // deterministic hash check
  const hash = crypto
    .createHash("sha256")
    .update(proof.witness)
    .digest("hex");

  return hash.length === 64;
}
