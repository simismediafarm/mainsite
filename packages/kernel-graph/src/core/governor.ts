import { KernelWriteIntent } from './intent.js';

/**
 * Computes risk scores (0.0 to 1.00) based on target table action types and payloads
 */
export function computeRisk(intent: KernelWriteIntent): number {
  let risk = intent.estimated_risk || 0.05;

  // Destructive actions increase risk
  if (intent.action === 'DELETE') {
    risk += 0.40;
  }

  // Critical target tables carry high base risk
  const highRiskTables = ['organizations', 'org_members', 'organization_secrets', 'provider_secrets', 'site_secrets'];
  if (highRiskTables.includes(intent.target.toLowerCase())) {
    risk += 0.30;
  }

  // Ensure risk is clamped between 0.00 and 1.00
  return Math.min(1.00, Math.max(0.00, risk));
}

/**
 * Evaluates execution policies against risk parameters and budget allowances
 */
export function evaluatePolicy(intent: KernelWriteIntent, risk: number): 'ALLOW' | 'DENY' | 'DEFER' {
  // Hard blocker: any write with a risk rating >= 0.85 is denied automatically
  if (risk >= 0.85) {
    return 'DENY';
  }

  // Budget envelope enforcement: block if execution exceeds threshold limits
  if (intent.estimated_cost > 5.0000) {
    return 'DEFER'; // Requires manual override or budget raise
  }

  // Schema protections
  if (intent.target.toLowerCase() === 'schema_migrations') {
    return 'DENY'; // Migrations are strictly handled in setup pipelines
  }

  return 'ALLOW';
}
