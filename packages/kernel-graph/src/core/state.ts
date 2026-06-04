import { KernelWriteIntent, KernelDecision } from './intent.js';

export interface KernelState {
  intent: KernelWriteIntent;
  risk: number;
  decision: 'ALLOW' | 'DENY' | 'DEFER';
  shadow_result?: {
    safe: boolean;
    diffScore: number;
  };
  execution_result?: {
    success: boolean;
    tx_id?: string;
  };
  audit_hash?: string;
}
