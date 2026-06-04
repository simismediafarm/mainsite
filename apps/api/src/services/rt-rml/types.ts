export type ActionType =
  | "AFFILIATE_SLOT"
  | "DISPLAY_AD"
  | "SPONSORED_CARD"
  | "CONTENT_ONLY";

export interface BanditAction {
  type: ActionType;
  position: "above_fold" | "inline" | "sidebar" | "sticky";
  payload_id?: string;
  market_score?: number; // Pruning threshold score
}

export interface ContextVector {
  geo: string;
  device: "mobile" | "desktop";
  category: string;
  user_intent_score?: number;
  session_depth?: number;
}

export interface RewardSignal {
  ctr: number;
  dwell_time: number;
  scroll_depth: number;
  conversion: boolean | number;
  rpm: number;
}

export interface BanditState {
  action: BanditAction;
  value: number;
  count: number;
}

export interface RTMMTelemetryEvent {
  session_id: string;
  content_id: string;

  engagement: {
    ctr: number;
    dwell_ms: number;
    scroll_pct: number;
    conversion: boolean;
  };

  context: {
    geo: string;
    device: "mobile" | "desktop";
    category: string;
  };
  
  revenue?: {
    usd: number;
  }
}
