-- Migration 024: RT-RML Bandit State (PostgreSQL Durable State)
-- This table serves as the Source of Truth for the Real-Time Monetization Market (RT-RML) Bandit Engine.
-- Redis acts as the hot cache, while this table stores periodic checkpoints for durability.

CREATE TABLE IF NOT EXISTS bandit_reward_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_key TEXT NOT NULL,
  action_type TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  count INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique index to fast-lookup state by context + action
CREATE UNIQUE INDEX IF NOT EXISTS idx_bandit_states_context_action ON bandit_reward_states(context_key, action_type);

-- RLS for backend services only
ALTER TABLE bandit_reward_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access on bandit_reward_states"
ON bandit_reward_states
FOR ALL
USING (
  (auth.jwt() ->> 'role') = 'service_role' OR 
  (auth.uid() IS NOT NULL AND (auth.jwt() ->> 'role') IN ('admin', 'system'))
);
