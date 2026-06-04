export interface KernelWriteIntent {
  id: string;
  source: 'crawler' | 'swarm' | 'reasoning' | 'deploy' | 'system';
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  target: string; // The table name
  payload: Record<string, any>;
  query_string: string; // The prepared SQL statement to run
  context: Record<string, any>;
  estimated_risk: number; // 0.0 to 1.00
  estimated_cost: number;
}

export interface KernelDecision {
  intent_id: string;
  status: 'ALLOW' | 'DENY' | 'DEFER';
  reason: string;
  safety_checks: string[];
  audit_hash: string;
}
