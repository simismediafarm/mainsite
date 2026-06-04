export type ContextVector = {
  geo: string;
  device: "mobile" | "desktop";
  category: string;
  time_bucket?: string;
};

export type BanditAction = {
  type: "AFFILIATE_SLOT" | "DISPLAY_AD" | "CONTENT_ONLY" | "SPONSORED_CARD";
  position: "inline" | "sidebar" | "footer" | "above_fold";
  market_score?: number;
};

export type BanditState = {
  action: BanditAction;
  value: number;
  count: number;
};

export type RewardSignal = {
  ctr: number;
  dwell_time: number;
  scroll_depth: number;
  conversion: boolean;
  rpm: number;
};

export type TelemetryEvent = {
  session_id: string;
  content_id: string;
  context: ContextVector;
  action: BanditAction;
  reward: RewardSignal;
};
