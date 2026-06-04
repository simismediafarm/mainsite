CREATE TABLE IF NOT EXISTS public.system_causal_graph (
  node_id TEXT PRIMARY KEY,
  cause TEXT NOT NULL,
  effect TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_counterfactual_runs (
  simulation_id UUID PRIMARY KEY,
  intent_hash TEXT NOT NULL,
  expected_state JSONB NOT NULL,
  actual_state JSONB NOT NULL,
  drift_score FLOAT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.autonomous_repair_logs (
  repair_id UUID PRIMARY KEY,
  anomaly_trace_id TEXT NOT NULL,
  patch_intent JSONB NOT NULL,
  pre_drift FLOAT NOT NULL,
  post_drift FLOAT NOT NULL,
  status TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);
